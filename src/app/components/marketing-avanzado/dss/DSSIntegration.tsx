import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_SPOTLIGHT_PORT = `// ── ISpotlightPort: contrato único para AE y BO ──────────
// shared/ports/ISpotlightPort.ts
// Si no hay spotlight activo → retorna null.
// AE y BO no saben si hay o no un spotlight hasta que consultan.

interface ISpotlightPort {
  // Principal: devuelve la edición activa (status = 'active' o 'ending_soon')
  getActive(): Promise<SpotlightEdition | null>

  // AE: overrides filtrados por campaña y condición de perfil
  getActivationOverrides(
    campaignId:  string,
    userProfile: Partial<UserBehaviorProfile> | null  // null si BO no está integrado
  ): Promise<ActivationOverride[]>

  // BO: hints filtrados por segmento del usuario
  getBehaviorHints(
    userId:  string,
    profile: UserBehaviorProfile
  ): Promise<BehaviorHint[]>

  // Landing: config completa para renderizar
  getLandingConfig(slug: string): Promise<LandingConfig | null>
}

// ── SpotlightPortAdapter (implementación infra) ───────────
// infrastructure/adapters/SpotlightPortAdapter.ts
class SpotlightPortAdapter implements ISpotlightPort {

  async getActive(): Promise<SpotlightEdition | null> {
    // Cache-first: TTL 60s (no necesita refresh frecuente)
    const cached = await this.cache.get('spotlight:active')
    if (cached !== null) return JSON.parse(cached)

    const active = await this.repo.findByStatus(['active', 'ending_soon'])
    await this.cache.set('spotlight:active', JSON.stringify(active), { ttl: 60 })
    return active
  }

  async getActivationOverrides(
    campaignId: string,
    userProfile: Partial<UserBehaviorProfile> | null
  ): Promise<ActivationOverride[]> {
    const spotlight = await this.getActive()
    if (!spotlight) return []

    return spotlight.activation_overrides.filter(o => {
      // Scope: campaign
      if (o.campaign_id !== '*' && o.campaign_id !== campaignId) return false
      // Condition: profile-based
      if (o.condition && userProfile) {
        const { segment_filter, min_churn_risk, hours_remaining_lte } = o.condition
        if (segment_filter && !segment_filter.includes(userProfile.segment!)) return false
        if (min_churn_risk && (userProfile.churn_risk_score ?? 0) < min_churn_risk) return false
        if (hours_remaining_lte) {
          const hoursLeft = differenceInHours(spotlight.end_at, new Date())
          if (hoursLeft > hours_remaining_lte) return false
        }
      }
      return true
    })
  }

  async getBehaviorHints(
    userId:  string,
    profile: UserBehaviorProfile
  ): Promise<BehaviorHint[]> {
    const spotlight = await this.getActive()
    if (!spotlight) return []

    return spotlight.behavior_hints
      .filter(h => !h.condition || h.condition.segment.includes(profile.segment))
      .sort((a, b) => a.display_priority - b.display_priority)
  }
}`

const CODE_AE_INTEGRATION = `// ── Integración con el Activation Engine ─────────────────
// domain/services/ProbabilisticResolver.ts  (modificado)
// El spotlight multiplica los pesos ANTES de la selección aleatoria.

class ProbabilisticResolver {

  async resolve(
    rewards:    Reward[],
    campaignId: string,
    userId:     string,
    userProfile: Partial<UserBehaviorProfile> | null
  ): Promise<Reward> {

    // ── 1. Obtener overrides del spotlight activo ─────────
    const overrides = await this.spotlightPort.getActivationOverrides(
      campaignId,
      userProfile
    )

    // ── 2. Aplicar multiplicadores de peso ────────────────
    const boostedRewards = rewards.map(reward => {
      const applicable = overrides.filter(o =>
        (o.reward_type === '*' || o.reward_type === reward.type) &&
        (!o.force_category_match || reward.metadata?.category_id === this.getSpotlightDeptId())
      )

      if (applicable.length === 0) return reward

      // Múltiples overrides → se multiplican en cadena
      const totalMultiplier = applicable.reduce(
        (acc, o) => acc * o.weight_multiplier,
        1
      )

      return {
        ...reward,
        probability_weight: Math.round(reward.probability_weight * totalMultiplier)
      }
    })

    // ── 3. Loguear si hubo modificación (auditoría) ───────
    const wasModified = boostedRewards.some(
      (r, i) => r.probability_weight !== rewards[i].probability_weight
    )
    if (wasModified) {
      await this.auditLog.record({
        event:    'spotlight_weight_applied',
        campaign: campaignId,
        user_id:  userId,
        before:   rewards.map(r => ({ id: r.id, weight: r.probability_weight })),
        after:    boostedRewards.map(r => ({ id: r.id, weight: r.probability_weight })),
      })
    }

    // ── 4. Selección probabilística con pesos modificados ─
    return this.weightedRandom(boostedRewards)  // crypto.randomInt
  }

  // ── Urgency override ──────────────────────────────────
  // Llamado por RequestActivationUseCase
  async applyUrgencyOverride(
    decision: ActivationDecision,
    overrides: ActivationOverride[]
  ): ActivationDecision {
    const urgencyOverride = overrides.find(o => o.urgency_override !== null)
    if (!urgencyOverride) return decision

    return {
      ...decision,
      urgency_level: urgencyOverride.urgency_override!,
      rationale: [
        ...decision.rationale,
        \`Spotlight urgency override aplicado: \${urgencyOverride.urgency_override}\`,
      ]
    }
  }
}

// ── Visualización del efecto (ejemplo) ───────────────────
// ANTES del spotlight (campaña "Ruleta Electrónica"):
// reward     │ type       │ peso_original
// Crédito $200 │ credit   │ 15
// Descuento 10%│ percentage│ 35
// Producto TV  │ product  │ 8
// Sin premio   │ none     │ 42
//
// Spotlight "Semana Electrónica" → override: credit × 3.0, product × 2.5
//
// DESPUÉS del spotlight:
// reward      │ type       │ peso_modificado │ prob%
// Crédito $200 │ credit   │ 45 (×3)         │ 33.8%
// Descuento 10%│ percentage│ 35              │ 26.3%
// Producto TV  │ product  │ 20 (×2.5)       │ 15.0%
// Sin premio   │ none     │ 42              │ 31.6% (actualiza automático)`

const CODE_BO_INTEGRATION = `// ── Integración con el Behavior Orchestrator ─────────────
// application/use-cases/DecideActivationStrategy.ts  (modificado)
// Los hints del spotlight se aplican DESPUÉS del RuleEngine.

class DecideActivationStrategy {

  async execute(request: DecisionRequest): Promise<ActivationDecision> {
    // ... pasos 00-06 del flujo normal (ver sección Flujo del BO) ...

    // ── Paso 04b: Spotlight hints (NUEVO) ─────────────────
    const hints = await this.spotlightPort.getBehaviorHints(
      request.user_id,
      profile
    )

    if (hints.length > 0) {
      finalDecision = this.applySpotlightHints(finalDecision, hints, profile)
    }

    // ... pasos 07-08 normales (log + cache) ...

    return decision
  }

  private applySpotlightHints(
    decision: Partial<ActivationDecision>,
    hints:    BehaviorHint[],
    profile:  UserBehaviorProfile
  ): Partial<ActivationDecision> {
    let result = { ...decision }

    for (const hint of hints) {
      const shouldApply = this.shouldApplyHint(hint, decision)
      if (!shouldApply) continue

      switch (hint.type) {

        case 'force_category':
          result.recommended_category = hint.value as string
          result.rationale = [
            ...(result.rationale ?? []),
            \`Spotlight hint: categoría forzada a "\${hint.value}" (strength=\${hint.strength})\`
          ]
          break

        case 'urgency_bump':
          result.urgency_level = bumpUrgency(result.urgency_level!, hint.value as number)
          result.rationale = [
            ...(result.rationale ?? []),
            \`Spotlight hint: urgency elevada \${hint.value} nivel(es) → \${result.urgency_level}\`
          ]
          break

        case 'reward_bias_override':
          result.reward_bias_type = hint.value as RewardType
          result.rationale = [
            ...(result.rationale ?? []),
            \`Spotlight hint: reward_bias forzado a "\${hint.value}"\`
          ]
          break

        case 'exploration_boost':
          // No modifica la decisión directamente,
          // pero registra el boost para que el RuleEngine lo note en futuros calls
          result.rationale = [
            ...(result.rationale ?? []),
            \`Spotlight hint: exploration_score boosteado +\${hint.value} (efectivo en próxima decisión)\`
          ]
          break
      }
    }

    return result
  }

  private shouldApplyHint(
    hint:     BehaviorHint,
    decision: Partial<ActivationDecision>
  ): boolean {
    switch (hint.strength) {
      case 'override':
        return true   // siempre aplica

      case 'strong':
        // Aplica siempre, excepto si es churn crítico
        // (la regla de churn crítico tiene más autoridad que el spotlight)
        return decision.applied_rule_id !== 'rule-churn-critical'

      case 'soft':
        // Solo aplica si la confianza de la decisión es baja
        return (decision.confidence ?? 1) < 0.7

      default:
        return false
    }
  }
}

// ── Función helper ────────────────────────────────────────
function bumpUrgency(current: UrgencyLevel, levels: number): UrgencyLevel {
  const order: UrgencyLevel[] = ['low', 'medium', 'high', 'critical']
  const idx = order.indexOf(current)
  return order[Math.min(idx + levels, order.length - 1)]
}

// ── Efecto del hint "force_category" + "urgency_bump" ────
// Usuario: loyal_focused, electronics exploration_score=20
// BO sin spotlight: recommended_category="clothing", urgency="low"
//
// Spotlight "Semana Electrónica" activo:
//   hint force_category(electronics, strength=strong) → aplica
//   hint urgency_bump(1, strength=soft, confidence=0.65) → aplica
//
// BO con spotlight: recommended_category="electronics", urgency="medium"`

const CODE_SCHEDULER = `// ── SpotlightScheduler: activa/desactiva automáticamente ─
// infrastructure/jobs/SpotlightScheduler.ts
// Cron job que corre cada minuto.
// Invalida el cache de spotlight cuando cambia el estado.

class SpotlightScheduler {

  @Cron('* * * * *')  // cada minuto
  async tick(): Promise<void> {
    const now = new Date()

    // ── 1. Activar ediciones programadas ─────────────────
    const toActivate = await this.repo.findByStatus(['scheduled'])
      .then(editions => editions.filter(e => e.start_at <= now))

    for (const edition of toActivate) {
      await this.repo.updateStatus(edition.id, 'active')
      await this.invalidateCache(edition)
      await this.eventBus.publish(new SpotlightActivatedEvent({ edition }))
      this.logger.info(\`Spotlight "\${edition.slug}" v\${edition.version} activado\`)
    }

    // ── 2. Marcar "ending_soon" (últimas 24h) ─────────────
    const toEndingSoon = await this.repo.findByStatus(['active'])
      .then(editions => editions.filter(e =>
        differenceInHours(e.end_at, now) <= 24 &&
        e.status !== 'ending_soon'
      ))

    for (const edition of toEndingSoon) {
      await this.repo.updateStatus(edition.id, 'ending_soon')
      await this.invalidateCache(edition)
      await this.eventBus.publish(new SpotlightEndingSoonEvent({ edition, hours_left: 24 }))
    }

    // ── 3. Desactivar ediciones terminadas ────────────────
    const toEnd = await this.repo.findByStatus(['active', 'ending_soon'])
      .then(editions => editions.filter(e => e.end_at <= now))

    for (const edition of toEnd) {
      await this.repo.updateStatus(edition.id, 'ended')
      await this.invalidateCache(edition)
      await this.eventBus.publish(new SpotlightEndedEvent({ edition }))
      this.logger.info(\`Spotlight "\${edition.slug}" v\${edition.version} finalizado\`)
    }
  }

  private async invalidateCache(edition: SpotlightEdition): Promise<void> {
    // Invalida el cache de ISpotlightPort
    await this.cache.del('spotlight:active')
    // Los caches de AE y BO se refrescan solos en el próximo request
  }
}`

const TABS = [
  { id: 'port',      label: 'ISpotlightPort' },
  { id: 'ae',        label: 'AE Integration' },
  { id: 'bo',        label: 'BO Integration' },
  { id: 'scheduler', label: 'Scheduler' },
]

export function DSSIntegration() {
  const [tab, setTab] = useState('port')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⟳ Integración
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Integración con AE y BO</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'monospace', fontSize: 12 }}>ISpotlightPort</code> es el contrato único. AE aplica multiplicadores de peso; BO inyecta hints de categoría, urgencia y reward_bias.
          Un <code style={{ fontFamily: 'monospace', fontSize: 12 }}>SpotlightScheduler</code> activa y finaliza ediciones automáticamente.
        </p>
      </div>

      {/* Integration matrix */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #21262D', display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10 }}>
            {['', 'Activation Engine', 'Behavior Orchestrator'].map(h => (
              <span key={h} style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>
          {[
            { label: 'Qué consume', ae: 'ActivationOverride[]', bo: 'BehaviorHint[]' },
            { label: 'Cuándo aplica', ae: 'Antes de la selección probabilística', bo: 'Después del RuleEngine, antes de loguear' },
            { label: 'Qué modifica', ae: 'probability_weight de cada Reward', bo: 'recommended_category, urgency_level, reward_bias_type' },
            { label: 'Si null', ae: 'Comportamiento normal sin spotlight', bo: 'Decisión del BO sin modificación' },
            { label: 'Auditoría', ae: 'Loguea before/after de pesos', bo: 'Añade hint al rationale[]' },
          ].map(row => (
            <div key={row.label} style={{ padding: '8px 14px', borderBottom: '1px solid #161B22', display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, alignItems: 'start' }}>
              <span style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace' }}>{row.label}</span>
              <span style={{ fontSize: 10, color: '#38BDF8' }}>{row.ae}</span>
              <span style={{ fontSize: 10, color: '#F59E0B' }}>{row.bo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #21262D', marginBottom: 14, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 16px', fontSize: 12, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t.id ? '#E6EDF3' : '#8B949E',
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid #38BDF8' : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'port'      && <CodeBlock code={CODE_SPOTLIGHT_PORT} title="shared/ports/ISpotlightPort.ts"          badge="Port"      badgeColor="#38BDF8" />}
      {tab === 'ae'        && <CodeBlock code={CODE_AE_INTEGRATION} title="domain/services/ProbabilisticResolver.ts" badge="AE"        badgeColor="#6366F1" />}
      {tab === 'bo'        && <CodeBlock code={CODE_BO_INTEGRATION} title="application/use-cases/DecideActivationStrategy.ts" badge="BO" badgeColor="#F59E0B" />}
      {tab === 'scheduler' && <CodeBlock code={CODE_SCHEDULER}      title="infrastructure/jobs/SpotlightScheduler.ts" badge="Cron"     badgeColor="#10B981" />}

      {/* Side effects */}
      <div style={{ marginTop: 20 }}>
        <Divider>Efectos colaterales y eventos de dominio</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { event: 'SpotlightActivatedEvent',   when: 'Cron activa una edición scheduled',     subs: 'Notifica canal de marketing, invalida cache', color: '#10B981' },
            { event: 'SpotlightEndingSoonEvent',   when: '24 horas antes del end_at',            subs: 'Eleva urgency en overrides, envía push notification', color: '#F59E0B' },
            { event: 'SpotlightEndedEvent',        when: 'Cron finaliza una edición activa',      subs: 'Invalida cache, genera reporte de performance', color: '#EF4444' },
            { event: 'SpotlightPublishedEvent',    when: 'Admin publica/aprueba una edición',    subs: 'SpotlightScheduler la detecta en próximo tick', color: '#6366F1' },
          ].map(e => (
            <div key={e.event} style={{ background: '#161B22', border: `1px solid ${e.color}33`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: e.color, marginBottom: 4 }}>{e.event}</div>
              <div style={{ fontSize: 10, color: '#484F58', marginBottom: 4 }}>Disparado: {e.when}</div>
              <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.4 }}>Subs: {e.subs}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 16, height: 1, background: '#30363D' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: '#30363D' }} />
    </div>
  )
}
