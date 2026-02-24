import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const STEPS = [
  {
    num: '00',
    title: 'Cache check (perfil)',
    color: '#6366F1',
    layer: 'Infrastructure',
    desc: 'Busca UserBehaviorProfile en Redis (TTL 30 min). Si existe y no expiró, lo usa directamente. Latencia < 2ms.',
    why: 'Recalcular el perfil desde eventos es costoso (query + cómputo). 30 min de cache es suficiente para decisiones de activación.',
  },
  {
    num: '01',
    title: 'Ingest + compute profile',
    color: '#F59E0B',
    layer: 'Domain',
    desc: 'Si no hay cache: carga UserEvent[] del repositorio (ventana configurable, ej. 180 días). BehaviorAnalyzer construye el perfil con afinidades y scores.',
    why: 'El perfil es el insumo central. Sin eventos recientes o con perfil vacío, se usa el fallback.',
  },
  {
    num: '02',
    title: 'Load BehaviorRules',
    color: '#10B981',
    layer: 'Infrastructure',
    desc: 'Carga reglas activas desde DB, filtradas por campaign_id y segment. Ordenadas por prioridad ASC. Se cachean por 5 min.',
    why: 'Las reglas son configurables. Un cambio en DB se refleja en máximo 5 min sin deploy.',
  },
  {
    num: '03',
    title: 'RuleEngine evaluate',
    color: '#3B82F6',
    layer: 'Domain',
    desc: 'Evalúa condiciones de cada regla contra el perfil (dot-notation, operadores tipados). Retorna al primer match. Fallback si ninguna aplica.',
    why: 'Orden determinístico: mismos inputs → mismo resultado. Facilita debugging y auditoría.',
  },
  {
    num: '04',
    title: 'ML override (opcional)',
    color: '#8B5CF6',
    layer: 'Application',
    desc: 'Si IMLModelPort.isAvailable() === true, llama al modelo. Si confidence >= threshold, la predicción ML reemplaza la decisión de reglas.',
    why: 'ML como mejora progresiva. Las reglas son el fallback confiable mientras el modelo aprende.',
  },
  {
    num: '05',
    title: 'Resolve category strategy',
    color: '#10B981',
    layer: 'Domain',
    desc: 'Convierte la estrategia abstracta ("unexplored_random", "top_purchased") a un category_id concreto usando el perfil y el grafo de categorías.',
    why: 'El dominio trabaja con estrategias; la infra resuelve IDs. Separación limpia.',
  },
  {
    num: '06',
    title: 'Build ActivationDecision',
    color: '#F59E0B',
    layer: 'Application',
    desc: 'Construye el objeto de salida con todos los campos: recommended_category, reward_bias_type, urgency_level, confidence, rationale y profile_snapshot.',
    why: 'El rationale en lenguaje natural permite auditar, explicar y usar como training data de ML.',
  },
  {
    num: '07',
    title: 'Log decision',
    color: '#EF4444',
    layer: 'Infrastructure',
    desc: 'Persiste la decisión completa (inputs + outputs + features) en tabla decision_logs. Emite DecisionMadeEvent al event bus.',
    why: 'El log completo es el dataset de entrenamiento del futuro modelo ML. Cada decisión = un ejemplo.',
  },
  {
    num: '08',
    title: 'Return + cache result',
    color: '#6366F1',
    layer: 'Application',
    desc: 'Cachea la ActivationDecision (TTL 5 min, clave user_id+campaign_id). Retorna al Activation Engine o al caller.',
    why: 'Múltiples calls del Activation Engine para el mismo usuario/campaña obtienen la misma decisión sin re-computar.',
  },
]

const CODE_USE_CASE = `// ── DecideActivationStrategy (Use Case) ──────────────────
// application/use-cases/DecideActivationStrategy.ts
// Orquestador principal del Behavior Orchestrator.

class DecideActivationStrategy {

  constructor(
    private readonly analyzer:        BehaviorAnalyzer,
    private readonly ruleEngine:      RuleEngine,
    private readonly mlPort:          IMLModelPort,
    private readonly eventRepo:       IUserEventRepository,
    private readonly profileRepo:     IBehaviorProfileRepository,
    private readonly ruleRepo:        IBehaviorRuleRepository,
    private readonly categoryPort:    ICategoryPort,
    private readonly cache:           ICachePort,
    private readonly logger:          DecisionLogger,
    private readonly eventBus:        IEventBusPort,
    private readonly config:          OrchestratorConfig,
  ) {}

  async execute(request: DecisionRequest): Promise<ActivationDecision> {

    // ── 00. Cache check ───────────────────────────────────
    const cacheKey = \`decision:\${request.user_id}:\${request.campaign_id}\`
    const cached = await this.cache.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // ── 01. Obtener o computar perfil ─────────────────────
    const profileCacheKey = \`profile:\${request.user_id}\`
    let profile = await this.cache.get(profileCacheKey)
      .then(raw => raw ? JSON.parse(raw) as UserBehaviorProfile : null)

    if (!profile) {
      const events       = await this.eventRepo.findRecent(request.user_id, this.config.data_window_days)
      const allCategories = await this.categoryPort.listAllIds()
      profile = this.analyzer.analyze(request.user_id, events, allCategories)
      await this.cache.set(profileCacheKey, JSON.stringify(profile), { ttl: 1800 }) // 30 min
    }

    // ── 02. Cargar reglas aplicables ──────────────────────
    const rulesCacheKey = \`rules:\${request.campaign_id}:\${profile.segment}\`
    const rules = await this.cache.get(rulesCacheKey)
      .then(raw => raw ? JSON.parse(raw) as BehaviorRule[] : null)
      ?? await (async () => {
        const loaded = await this.ruleRepo.findApplicable(request.campaign_id, profile.segment)
        await this.cache.set(rulesCacheKey, JSON.stringify(loaded), { ttl: 300 }) // 5 min
        return loaded
      })()

    const campaign: CampaignContext = { id: request.campaign_id, metadata: request.campaign_metadata }

    // ── 03. RuleEngine evalúa reglas ──────────────────────
    const ruleDecision = this.ruleEngine.evaluate(profile, campaign, rules)

    // ── 04. ML override (si disponible y confiable) ───────
    let finalDecision = ruleDecision

    if (this.mlPort.isAvailable()) {
      const mlPrediction = await this.mlPort.predict(profile, campaign)
      if (mlPrediction && mlPrediction.confidence >= this.config.ml_confidence_threshold) {
        finalDecision = {
          recommended_category: mlPrediction.recommended_category,
          reward_bias_type:     mlPrediction.reward_bias_type,
          urgency_level:        mlPrediction.urgency_level,
          confidence:           mlPrediction.confidence,
          decision_source:      'ml',
          applied_rule_id:      null,
          rationale:            [
            \`ML model v\${this.mlPort.modelVersion()} con confidence=\${mlPrediction.confidence.toFixed(2)}\`,
            ...Object.entries(mlPrediction.feature_importances)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([k, v]) => \`Feature \${k}: importancia \${v.toFixed(3)}\`),
          ],
        }
      }
    }

    // ── 05-06. Build ActivationDecision completo ──────────
    const decision: ActivationDecision = {
      id:                   uuidv7(),
      user_id:              request.user_id,
      campaign_id:          request.campaign_id,
      ...finalDecision,
      profile_snapshot: {
        exploration_score:        profile.exploration_score,
        churn_risk_score:         profile.churn_risk_score,
        engagement_score:         profile.engagement_score,
        segment:                  profile.segment,
        days_since_last_purchase: profile.days_since_last_purchase,
        avg_ticket_trend:         profile.avg_ticket_trend,
      },
      computed_at: new Date(),
      expires_at:  addMinutes(new Date(), this.config.decision_ttl_minutes),
    }

    // ── 07. Log decision ──────────────────────────────────
    await this.logger.logDecision(decision)
    await this.eventBus.publish(new DecisionMadeEvent({ decision }))

    // ── 08. Cache + return ────────────────────────────────
    await this.cache.set(cacheKey, JSON.stringify(decision), { ttl: this.config.decision_ttl_minutes * 60 })

    return decision
  }
}

// ── DecisionRequest (DTO de entrada) ──────────────────────
interface DecisionRequest {
  user_id:           string
  campaign_id:       string
  campaign_metadata: Record<string, unknown>
}`

const CODE_LOGGER = `// ── DecisionLogger ────────────────────────────────────────
// shared/logger/DecisionLogger.ts
// Loguea TODAS las decisiones con features completas.
// Este log ES el futuro training dataset del modelo ML.

interface DecisionLogEntry {
  id:                   string   // = decision.id
  user_id:              string
  campaign_id:          string
  // ── Features (inputs del modelo) ─────────────────────
  exploration_score:    number
  churn_risk_score:     number
  engagement_score:     number
  segment:              string
  days_since_last_purchase: number
  avg_ticket_amount:    number
  top_category_id:      string
  unexplored_count:     number
  // ── Decision (labels del modelo) ─────────────────────
  recommended_category: string
  reward_bias_type:     string
  urgency_level:        string
  confidence:           number
  decision_source:      string
  applied_rule_id:      string | null
  rationale:            string[]
  // ── Outcome (se actualiza cuando hay conversión) ──────
  converted:            boolean | null  // null = aún no sabemos
  conversion_reward_type: string | null
  conversion_order_id:  string | null
  // ── Metadata ─────────────────────────────────────────
  ml_model_version:     string | null
  computed_at:          Date
}

class DecisionLogger {
  async logDecision(decision: ActivationDecision): Promise<void> {
    await this.repo.insert({ ...this.toLogEntry(decision), converted: null })
  }

  // Llamado cuando el Activation Engine confirma conversión
  async markConverted(decisionId: string, orderId: string, rewardType: string): Promise<void> {
    await this.repo.update(decisionId, {
      converted:              true,
      conversion_order_id:    orderId,
      conversion_reward_type: rewardType,
    })
  }
}`

export function BehaviorFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⟳ Flujo de decisión
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>decideActivationStrategy()</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          9 pasos del caso de uso principal. Click en cada paso para ver el razonamiento de diseño.
        </p>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 28 }}>
        {STEPS.map((step, i) => (
          <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 2 }}>
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
            <div style={{ flex: 1, paddingBottom: 6 }}>
              <div
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6, marginLeft: -8,
                  background: activeStep === i ? step.color + '10' : 'transparent',
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
                <div style={{ margin: '6px 0 6px 8px', padding: '10px 12px', background: '#161B22', border: `1px solid ${step.color}33`, borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#C9D1D9', lineHeight: 1.6, margin: '0 0 8px' }}>{step.desc}</p>
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#A5B4FC', lineHeight: 1.5 }}>
                    <strong style={{ color: '#6366F1' }}>◈ Por qué:</strong> {step.why}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full pseudocode */}
      <Divider>Pseudocódigo completo del caso de uso</Divider>
      <CodeBlock code={CODE_USE_CASE} title="application/use-cases/DecideActivationStrategy.ts" badge="Use Case" badgeColor="#F59E0B" />

      <div style={{ marginTop: 20 }}>
        <Divider>Decision Logger (training dataset del ML)</Divider>
        <CodeBlock code={CODE_LOGGER} title="shared/logger/DecisionLogger.ts" badge="Infra + ML Prep" badgeColor="#8B5CF6" />
      </div>

      {/* Integration callout */}
      <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>Cómo consume el Activation Engine esta decisión</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { step: '1. RequestActivation llama', detail: 'await behaviorOrchestrator.decideActivationStrategy(userId, campaignId)' },
            { step: '2. Recibe ActivationDecision', detail: 'recommended_category, reward_bias_type, urgency_level' },
            { step: '3. Filtra rewards', detail: 'rewards.filter(r => r.type === decision.reward_bias_type)' },
            { step: '4. Pasa al resolver', detail: 'ProbabilisticResolver.resolve(filteredRewards, budget)' },
            { step: '5. El resultado', detail: 'Premio elegido con sesgo hacia reward_bias_type sin exponer pesos al cliente' },
          ].map(row => (
            <div key={row.step} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: '#FCD34D', fontFamily: 'monospace', minWidth: 190, flexShrink: 0 }}>{row.step}</span>
              <code style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>{row.detail}</code>
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
