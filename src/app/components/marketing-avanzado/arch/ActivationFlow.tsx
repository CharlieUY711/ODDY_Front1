import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const STEPS = [
  {
    num: '00',
    title: 'Rate Limit',
    color: '#EF4444',
    layer: 'Infrastructure',
    desc: 'Sliding window de 5 req/min por IP y campaña. Redis INCR atómico con TTL de 60s. Responde 429 con Retry-After.',
    risk: 'Sin esto: un atacante puede forzar bruta hasta encontrar la activación ganadora.',
  },
  {
    num: '01',
    title: 'Idempotency Check',
    color: '#F97316',
    layer: 'Application',
    desc: 'Calcula HMAC(userId + campaignId) → busca en cache. Si existe resultado previo, lo retorna directamente sin reejecutar.',
    risk: 'Sin esto: doble click del usuario o retry de red genera dos activaciones.',
  },
  {
    num: '02',
    title: 'Eligibility',
    color: '#EAB308',
    layer: 'Domain',
    desc: 'Valida: campaña activa, fechas, presupuesto total, límite diario, 1 por usuario, y reglas dinámicas del negocio.',
    risk: 'Sin esto: usuarios inelegibles o campaña vencida podrían activar.',
  },
  {
    num: '03',
    title: 'Distributed Lock',
    color: '#10B981',
    layer: 'Infrastructure',
    desc: 'Redlock (o similar) con TTL 5s sobre user+campaign. Previene race conditions en servidores concurrentes.',
    risk: 'Sin esto: dos requests simultáneos del mismo usuario generan dos activaciones.',
  },
  {
    num: '04',
    title: 'Double-check inside lock',
    color: '#10B981',
    layer: 'Application',
    desc: 'Dentro del lock, repetir la verificación de "ya activó". La primera ya pasó, pero entre el check y el lock pudo ocurrir otra.',
    risk: 'Patrón check-then-act. El lock es inútil sin este re-check.',
  },
  {
    num: '05',
    title: 'Resolve Reward',
    color: '#3B82F6',
    layer: 'Domain',
    desc: 'Aplica reglas dinámicas (A/B, hora, usuario), filtra por stock+presupuesto, sortea con crypto.randomInt ponderado.',
    risk: 'Sin crypto.randomInt: Math.random() es predecible si se conoce la semilla.',
  },
  {
    num: '06',
    title: 'Reserve Stock & Budget',
    color: '#6366F1',
    layer: 'Infrastructure',
    desc: 'UPDATE atómico en DB: stock_consumed += 1, budget_consumed += cost_estimate. Una sola query con WHERE para evitar sobrepaso.',
    risk: 'Sin atomicidad: dos usuarios ganan el último stock disponible.',
  },
  {
    num: '07',
    title: 'Persist Activation',
    color: '#8B5CF6',
    layer: 'Infrastructure',
    desc: 'INSERT con idempotency_key UNIQUE. Si hay conflicto de key → retorna el registro existente (garantía de exactamente-una-vez).',
    risk: 'La constraint UNIQUE en DB es el último recurso de idempotencia.',
  },
  {
    num: '08',
    title: 'Sign Token',
    color: '#EC4899',
    layer: 'Domain',
    desc: 'HMAC-SHA256 del payload. Solo si hay premio. El token contiene todo lo necesario para aplicar el beneficio sin consultar DB.',
    risk: 'Sin firma: cualquiera podría falsificar un token de beneficio.',
  },
  {
    num: '09',
    title: 'Emit Event + Audit',
    color: '#F59E0B',
    layer: 'Application',
    desc: 'Publica RewardResolvedEvent al event bus. Otros módulos (analytics, notifications) reaccionan sin acoplamiento directo.',
    risk: 'El log de auditoría es append-only. Nunca se modifica, nunca se borra.',
  },
]

const CODE_USE_CASE = `// ── RequestActivation (Use Case) ──────────────────────────
// application/use-cases/RequestActivation.ts
// Orquestador principal. 10 pasos. Siempre dentro de un lock.

class RequestActivation {

  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly resolver:           ProbabilisticResolver,
    private readonly tokenService:       TokenService,
    private readonly campaignRepo:       ICampaignRepository,
    private readonly activationRepo:     IActivationRepository,
    private readonly rewardRepo:         IRewardRepository,
    private readonly cache:              ICachePort,
    private readonly eventBus:           IEventBusPort,
    private readonly logger:             AuditLogger,
  ) {}

  async execute(request: ActivationRequest): Promise<ActivationResult> {

    // ── 00. Rate Limit ────────────────────────────────────
    const rateKey = \`rate:\${request.ip}:\${request.campaign_id}\`
    const hits = await this.cache.incr(rateKey, { ttl: 60 })
    if (hits > 5) throw new TooManyRequestsError()

    // ── 01. Idempotency ───────────────────────────────────
    const idempKey = hmacSha256(\`\${request.user_id}:\${request.campaign_id}\`, IDEM_SECRET)
    const cached = await this.cache.get(\`idem:\${idempKey}\`)
    if (cached) return JSON.parse(cached)

    // ── 02. Eligibility ───────────────────────────────────
    const eligibility = await this.eligibilityService.check(
      request.user_id, request.campaign_id, request
    )
    if (!eligibility.eligible)
      throw new IneligibleError(eligibility.reason)

    // ── 03. Distributed Lock ──────────────────────────────
    const lockKey = \`lock:activation:\${request.user_id}:\${request.campaign_id}\`
    const lock = await this.cache.acquireLock(lockKey, { ttl: 5000 })
    if (!lock) throw new ConcurrentActivationError()

    try {
      // ── 04. Double-check inside lock ───────────────────
      const doubleCheck = await this.activationRepo
        .findByUserAndCampaign(request.user_id, request.campaign_id)
      if (doubleCheck) {
        const result = this.buildResult(doubleCheck)
        await this.cache.set(\`idem:\${idempKey}\`, JSON.stringify(result), { ttl: 86400 })
        return result
      }

      // ── 05. Resolve Reward ────────────────────────────
      const campaign = await this.campaignRepo.findWithRewards(request.campaign_id)
      const enrichedRewards = this.resolver.applyDynamicRules(campaign.rewards, {
        user_id:    request.user_id,
        ab_variant: campaign.ab_variant,
        timestamp:  new Date(),
      })
      const resolved = this.resolver.resolve(enrichedRewards, eligibility.remainingBudget!)

      // ── 06. Reserve Stock & Budget (atomic) ──────────
      if (resolved) {
        await this.rewardRepo.atomicIncrementStock(resolved.id)
        await this.campaignRepo.atomicAddCost(campaign.id, resolved.cost_estimate)
      }

      // ── 07. Persist Activation ────────────────────────
      const expiresAt = resolved
        ? addHours(new Date(), resolved.expiration_hours)
        : addHours(new Date(), 24)

      const activation = await this.activationRepo.create({
        user_id:          request.user_id,
        campaign_id:      request.campaign_id,
        reward_id:        resolved?.id ?? null,
        status:           'resolved',
        idempotency_key:  idempKey,
        expires_at:       expiresAt,
        ip_address:       request.ip,
        user_agent:       request.user_agent,
        audit_log: [{
          timestamp: new Date(),
          event:     'ACTIVATION_RESOLVED',
          actor:     request.user_id,
          metadata:  { reward_id: resolved?.id ?? null, mechanic: campaign.mechanic },
        }],
      })

      // ── 08. Sign Token ────────────────────────────────
      let token: string | null = null
      if (resolved) {
        token = this.tokenService.sign(activation, resolved)
        await this.activationRepo.updateToken(activation.id, token)
      }

      // ── 09. Emit Event + Audit ────────────────────────
      await this.eventBus.publish(new RewardResolvedEvent({
        activation_id:    activation.id,
        user_id:          request.user_id,
        reward_id:        resolved?.id ?? null,
        campaign_mechanic: campaign.mechanic,
      }))
      await this.logger.audit('ACTIVATION_COMPLETED', request.user_id, {
        activation_id: activation.id,
        has_reward:    resolved !== null,
      })

      // ── Build & cache result ──────────────────────────
      const result: ActivationResult = {
        activation_id: activation.id,
        has_reward:    resolved !== null,
        reward_type:   resolved?.type ?? null,
        token,
        expires_at:    expiresAt,
        mechanic:      campaign.mechanic,   // UI usa esto para animar la mecánica
      }
      await this.cache.set(\`idem:\${idempKey}\`, JSON.stringify(result), { ttl: 86400 })

      return result

    } finally {
      // Siempre liberar el lock, incluso si hay error
      await this.cache.releaseLock(lockKey, lock)
    }
  }
}`

export function ActivationFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⟳ Activation Flow
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Flujo de activación</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          10 pasos ordenados del caso de uso principal. Click en cada paso para ver el riesgo que mitiga.
        </p>
      </div>

      {/* Visual timeline */}
      <div style={{ marginBottom: 20 }}>
        {STEPS.map((step, i) => (
          <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 2 }}>
            {/* Left: connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
              <div
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: activeStep === i ? step.color : step.color + '22',
                  border: `1px solid ${step.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                  color: activeStep === i ? '#fff' : step.color,
                  cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 1, flex: 1, background: '#21262D', minHeight: 4, marginTop: 2 }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ flex: 1, paddingBottom: 6 }}>
              <div
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6, marginLeft: -8,
                  background: activeStep === i ? step.color + '11' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: activeStep === i ? 700 : 500, color: activeStep === i ? step.color : '#E6EDF3' }}>
                  {step.title}
                </span>
                <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: step.color + '88', fontFamily: 'monospace' }}>
                  {step.layer}
                </span>
                <span style={{ fontSize: 10, color: '#484F58', marginLeft: 'auto' }}>
                  {activeStep === i ? '▲' : '▾'}
                </span>
              </div>

              {activeStep === i && (
                <div style={{
                  margin: '6px 0 6px 8px', padding: '10px 12px',
                  background: '#161B22', border: `1px solid ${step.color}33`,
                  borderRadius: 8,
                }}>
                  <p style={{ fontSize: 12, color: '#C9D1D9', lineHeight: 1.6, margin: '0 0 8px' }}>
                    {step.desc}
                  </p>
                  <div style={{
                    padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 11, color: '#FCA5A5', lineHeight: 1.5,
                  }}>
                    <strong style={{ color: '#EF4444' }}>⚠ Riesgo:</strong> {step.risk}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full pseudocode */}
      <div style={{ marginTop: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <div style={{ width: 16, height: 1, background: '#30363D' }} />
          Pseudocódigo completo
          <div style={{ flex: 1, height: 1, background: '#30363D' }} />
        </div>
        <CodeBlock
          code={CODE_USE_CASE}
          title="application/use-cases/RequestActivation.ts"
          badge="Use Case"
          badgeColor="#F59E0B"
        />
      </div>
    </div>
  )
}
