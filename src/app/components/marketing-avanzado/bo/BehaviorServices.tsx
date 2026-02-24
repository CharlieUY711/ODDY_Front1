import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_ANALYZER = `// ── BehaviorAnalyzer ──────────────────────────────────────
// domain/services/BehaviorAnalyzer.ts
// Procesa eventos crudos y construye el UserBehaviorProfile.

class BehaviorAnalyzer {

  analyze(userId: string, events: UserEvent[], allCategories: string[]): UserBehaviorProfile {

    // ── 1. Filtrar por ventana de tiempo configurable ─────
    const windowDays = this.config.data_window_days  // default: 180
    const cutoff = subDays(new Date(), windowDays)
    const recent = events.filter(e => e.occurred_at >= cutoff)

    // ── 2. Agrupar eventos por categoría ──────────────────
    const byCategory = groupBy(recent, 'category_id')

    // ── 3. Construir afinidades por categoría ─────────────
    const affinities: CategoryAffinity[] = Object.entries(byCategory)
      .filter(([catId]) => catId !== null)
      .map(([category_id, catEvents]) => {

        const purchases   = catEvents.filter(e => e.type === 'purchase')
        const views       = catEvents.filter(e => e.type === 'product_view')
        const cartAdds    = catEvents.filter(e => e.type === 'cart_add')
        const totalSpent  = purchases.reduce(
          (sum, e) => add(sum, e.amount ?? money(0)),
          money(0)
        )

        return {
          category_id,
          purchase_count:   purchases.length,
          view_count:       views.length,
          cart_add_count:   cartAdds.length,
          total_spent:      totalSpent,
          last_purchased_at: maxDate(purchases.map(e => e.occurred_at)) ?? null,
          last_viewed_at:   maxDate(views.map(e => e.occurred_at)) ?? null,
          affinity_score:   0,  // se calcula en ScoreCalculator
        }
      })
      .filter(a => a.purchase_count > 0 || a.view_count >= 3)

    // ── 4. Calcular affinity scores ───────────────────────
    const scoredAffinities = this.scoreCalculator.scoreAffinities(affinities)

    // ── 5. Clasificar categorías ──────────────────────────
    const exploredCategoryIds = new Set(affinities.map(a => a.category_id))
    const unexplored = allCategories.filter(id => !exploredCategoryIds.has(id))
    const avoided    = affinities
      .filter(a => a.view_count >= 3 && a.purchase_count === 0)
      .map(a => a.category_id)

    // ── 6. Métricas de compra ─────────────────────────────
    const allPurchases = recent.filter(e => e.type === 'purchase')
    const avgTicket    = this.computeAvgTicket(allPurchases)
    const frequency    = this.computeFrequency(allPurchases)
    const lastPurchase = maxDate(allPurchases.map(e => e.occurred_at))
    const daysSince    = lastPurchase
      ? differenceInDays(new Date(), lastPurchase)
      : -1

    // ── 7. Computar scores globales ───────────────────────
    const explorationScore = this.scoreCalculator.computeExplorationScore({
      top_categories: scoredAffinities.slice(0, 5),
      unexplored_count: unexplored.length,
      avoided_count: avoided.length,
      total_categories: allCategories.length,
    })

    const churnRiskScore = this.scoreCalculator.computeChurnRiskScore({
      days_since_last_purchase: daysSince,
      purchase_frequency: frequency,
      avg_ticket_trend: this.computeTicketTrend(allPurchases),
      engagement_events: recent.filter(e =>
        ['wishlist_add', 'review_write', 'product_view'].includes(e.type)
      ).length,
    })

    const engagementScore = this.scoreCalculator.computeEngagementScore(recent)

    return {
      user_id: userId,
      top_categories:          scoredAffinities.sort((a, b) => b.affinity_score - a.affinity_score),
      unexplored_categories:   unexplored,
      avoided_categories:      avoided,
      purchase_frequency:      frequency,
      avg_ticket:              avgTicket,
      avg_ticket_trend:        this.computeTicketTrend(allPurchases),
      total_orders_lifetime:   events.filter(e => e.type === 'purchase').length,
      days_since_last_purchase: daysSince,
      exploration_score:       explorationScore,
      churn_risk_score:        churnRiskScore,
      engagement_score:        engagementScore,
      segment:                 this.classifySegment(churnRiskScore, explorationScore, daysSince, allPurchases.length),
      computed_at:             new Date(),
      data_window_days:        windowDays,
      event_count:             recent.length,
    }
  }

  private classifySegment(
    churnRisk: number, exploration: number,
    daysSince: number, totalOrders: number
  ): BehaviorSegment {
    if (totalOrders < 2)       return 'new_user'
    if (daysSince > 120)       return 'churned'
    if (churnRisk >= 60)       return 'at_risk'
    if (exploration >= 70)     return 'active_explorer'
    return 'loyal_focused'
  }
}`

const CODE_SCORE_CALCULATOR = `// ── ScoreCalculator ───────────────────────────────────────
// domain/services/ScoreCalculator.ts
// Fórmulas configurables. No hardcodeadas: vienen de ScoreConfig.

class ScoreCalculator {

  // ── Exploration Score: qué tan abierto a categorías nuevas ──
  computeExplorationScore(input: ExplorationInput): number {
    // Base 50
    let score = 50

    // Concentración: muchas compras en pocas categorías → menos explorador
    const topCatCount = input.top_categories.length
    if (topCatCount >= 4) score -= 15
    else if (topCatCount >= 2) score -= 5

    // Categorías inexploradas disponibles → potencial de exploración
    const unexploredRatio = input.unexplored_count / Math.max(input.total_categories, 1)
    if (unexploredRatio > 0.7) score += 20  // muchas por descubrir → explorador
    if (unexploredRatio < 0.2) score -= 10  // ya exploró casi todo

    // Categorías evitadas → activamente rechaza ciertas áreas
    if (input.avoided_count > 3) score -= 10

    return clamp(score, 0, 100)
  }

  // ── Churn Risk Score: probabilidad de abandono ──────────────
  computeChurnRiskScore(input: ChurnInput): number {
    let score = 0

    // Recencia: factor más importante
    const { days_since_last_purchase: d } = input
    if (d === -1)     score += 40  // nunca compró
    else if (d > 120) score += 70  // muy inactivo
    else if (d > 60)  score += 50
    else if (d > 30)  score += 30
    else if (d > 14)  score += 15

    // Frecuencia cayendo → señal de abandono
    if (input.purchase_frequency === 'lapsed')     score += 25
    else if (input.purchase_frequency === 'occasional') score += 10

    // Ticket cayendo → menor compromiso
    if (input.avg_ticket_trend === 'falling')  score += 15
    if (input.avg_ticket_trend === 'rising')   score -= 10

    // Engagement reciente → mitigante de churn
    if (input.engagement_events > 10) score -= 20
    else if (input.engagement_events > 5) score -= 10

    return clamp(score, 0, 100)
  }

  // ── Engagement Score: actividad general ─────────────────────
  computeEngagementScore(events: UserEvent[]): number {
    const weights = {
      purchase:       10,
      wishlist_add:   5,
      cart_add:       4,
      review_write:   6,
      product_view:   1,
      category_browse: 1,
      search:         2,
      cart_abandon:   -2,  // señal negativa
    }

    const raw = events.reduce((sum, e) => sum + (weights[e.type] ?? 0), 0)
    // Normalizar: 100 puntos corresponde a ~15 compras o equivalente
    return clamp(Math.round(raw / 1.5), 0, 100)
  }

  // ── Affinity Score por categoría ────────────────────────────
  scoreAffinities(affinities: CategoryAffinity[]): CategoryAffinity[] {
    return affinities.map(a => ({
      ...a,
      affinity_score: this.computeAffinityScore(a),
    }))
  }

  private computeAffinityScore(a: CategoryAffinity): number {
    // Peso de compras (70%) + recencia (20%) + ratio cart/view (10%)
    const purchaseScore = Math.min(a.purchase_count * 10, 70)
    const recencyScore  = a.last_purchased_at
      ? Math.max(0, 20 - differenceInDays(new Date(), a.last_purchased_at) / 5)
      : 0
    const cartRatio     = a.view_count > 0
      ? Math.round((a.cart_add_count / a.view_count) * 10)
      : 0
    return clamp(purchaseScore + recencyScore + cartRatio, 0, 100)
  }
}`

const CODE_RULE_ENGINE = `// ── RuleEngine ────────────────────────────────────────────
// domain/services/RuleEngine.ts
// Evalúa reglas configurables en orden de prioridad.
// Sin lógica hardcodeada: todo viene de BehaviorRule[].

class RuleEngine {

  evaluate(
    profile:    UserBehaviorProfile,
    campaign:   CampaignContext,
    rules:      BehaviorRule[],
  ): Partial<ActivationDecision> {

    // ── 1. Filtrar reglas aplicables ──────────────────────
    const applicable = rules
      .filter(r => r.enabled)
      .filter(r => !r.campaign_ids || r.campaign_ids.includes(campaign.id))
      .filter(r => !r.segment_filter || r.segment_filter.includes(profile.segment))
      .sort((a, b) => a.priority - b.priority)  // menor número = mayor prioridad

    // ── 2. Evaluar condiciones ────────────────────────────
    for (const rule of applicable) {
      const matches = this.evaluateConditions(rule.conditions, rule.conditions_op, profile)

      if (matches) {
        const category = this.resolveCategory(rule.action.recommended_category, profile)

        return {
          recommended_category: category,
          reward_bias_type:     rule.action.reward_bias_type,
          urgency_level:        rule.action.urgency_level,
          confidence:           0.65 + rule.action.confidence_boost,
          decision_source:      'rules',
          applied_rule_id:      rule.id,
          rationale:            this.buildRationale(rule, profile),
        }
      }
    }

    // ── 3. Fallback: si ninguna regla aplica ──────────────
    return this.buildFallback(profile)
  }

  private evaluateConditions(
    conditions: RuleCondition[],
    op: 'AND' | 'OR',
    profile: UserBehaviorProfile
  ): boolean {
    const results = conditions.map(c => this.evaluateCondition(c, profile))
    return op === 'AND'
      ? results.every(Boolean)
      : results.some(Boolean)
  }

  private evaluateCondition(c: RuleCondition, profile: UserBehaviorProfile): boolean {
    const value = get(profile, c.field)  // dot-notation getter
    switch (c.operator) {
      case 'eq':      return value === c.value
      case 'gt':      return (value as number) >  (c.value as number)
      case 'lt':      return (value as number) <  (c.value as number)
      case 'gte':     return (value as number) >= (c.value as number)
      case 'lte':     return (value as number) <= (c.value as number)
      case 'in':      return (c.value as unknown[]).includes(value)
      case 'not_in':  return !(c.value as unknown[]).includes(value)
      case 'between': {
        const [min, max] = c.value as [number, number]
        return (value as number) >= min && (value as number) <= max
      }
      default: return false
    }
  }

  // Resuelve estrategias abstractas a category_id concreto
  private resolveCategory(strategy: CategoryStrategy, profile: UserBehaviorProfile): string {
    switch (strategy) {
      case 'top_purchased':
        return profile.top_categories[0]?.category_id ?? 'general'
      case 'unexplored_random':
        return sample(profile.unexplored_categories) ?? 'general'
      case 'unexplored_adjacent':
        return this.graphService.findAdjacent(profile.top_categories[0]?.category_id) ?? 'general'
      case 'avoided_nudge':
        return sample(profile.avoided_categories) ?? 'general'
      case 'trending':
        return this.trendingService.getTopCategory()
      default:
        return strategy  // category_id explícito
    }
  }

  private buildFallback(profile: UserBehaviorProfile): Partial<ActivationDecision> {
    return {
      recommended_category: profile.top_categories[0]?.category_id ?? 'general',
      reward_bias_type:     'percentage',
      urgency_level:        'low',
      confidence:           0.3,
      decision_source:      'fallback',
      applied_rule_id:      null,
      rationale:            ['Ninguna regla configurada aplica al perfil actual. Usando fallback.'],
    }
  }
}`

const CODE_ML_PORT = `// ── IMLModelPort ──────────────────────────────────────────
// application/ports/IMLModelPort.ts
// Port diseñado para conectar un modelo de ML en el futuro.
// Stub activo por defecto → retorna null hasta que haya modelo.

interface MLPrediction {
  recommended_category: string
  reward_bias_type:     RewardType
  urgency_level:        UrgencyLevel
  confidence:           number   // 0-1. Si < threshold → se descarta
  feature_importances:  Record<string, number>  // para explicabilidad
}

interface IMLModelPort {
  predict(profile: UserBehaviorProfile, campaign: CampaignContext): Promise<MLPrediction | null>
  isAvailable(): boolean
  modelVersion(): string
}

// ── MLModelAdapter (stub) ────────────────────────────────
// infrastructure/ml/MLModelAdapter.ts
class MLModelAdapter implements IMLModelPort {

  isAvailable(): boolean {
    // Retorna false hasta que haya modelo desplegado
    return process.env.ML_MODEL_ENDPOINT !== undefined
  }

  modelVersion(): string {
    return process.env.ML_MODEL_VERSION ?? 'none'
  }

  async predict(
    profile: UserBehaviorProfile,
    campaign: CampaignContext
  ): Promise<MLPrediction | null> {

    if (!this.isAvailable()) return null   // sin modelo → reglas toman el control

    // Cuando haya modelo, llamar al endpoint:
    const response = await fetch(process.env.ML_MODEL_ENDPOINT!, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        // Features del perfil (las mismas que se loguean en DecisionLogger)
        exploration_score:        profile.exploration_score,
        churn_risk_score:         profile.churn_risk_score,
        engagement_score:         profile.engagement_score,
        days_since_last_purchase: profile.days_since_last_purchase,
        top_category:             profile.top_categories[0]?.category_id,
        segment:                  profile.segment,
        avg_ticket_trend:         profile.avg_ticket_trend,
      }),
    })

    const prediction = await response.json()
    return prediction.confidence >= this.config.ml_confidence_threshold
      ? prediction
      : null  // confianza baja → fallback a reglas
  }
}`

const SERVICES = [
  { id: 'analyzer',   label: 'BehaviorAnalyzer',  color: '#F59E0B', badge: 'Domain',  note: 'Convierte eventos crudos en UserBehaviorProfile' },
  { id: 'scorer',     label: 'ScoreCalculator',   color: '#10B981', badge: 'Domain',  note: 'Fórmulas de exploration, churn_risk y engagement' },
  { id: 'rules',      label: 'RuleEngine',        color: '#6366F1', badge: 'Domain',  note: 'Evalúa BehaviorRule[] en orden de prioridad' },
  { id: 'ml',         label: 'IMLModelPort',      color: '#8B5CF6', badge: 'Port',    note: 'Stub hasta tener modelo. Zero cambios al dominio' },
]

export function BehaviorServices() {
  const [active, setActive] = useState('analyzer')

  const renderCode = () => {
    switch (active) {
      case 'analyzer': return <CodeBlock code={CODE_ANALYZER}       title="domain/services/BehaviorAnalyzer.ts"  badge="Domain Service" badgeColor="#F59E0B" />
      case 'scorer':   return <CodeBlock code={CODE_SCORE_CALCULATOR} title="domain/services/ScoreCalculator.ts" badge="Domain Service" badgeColor="#10B981" />
      case 'rules':    return <CodeBlock code={CODE_RULE_ENGINE}     title="domain/services/RuleEngine.ts"        badge="Domain Service" badgeColor="#6366F1" />
      case 'ml':       return <CodeBlock code={CODE_ML_PORT}         title="ports/IMLModelPort.ts + MLModelAdapter" badge="Port / Stub"  badgeColor="#8B5CF6" />
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⚙ Servicios
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Servicios del Behavior Orchestrator</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Cuatro servicios del dominio con responsabilidades únicas.
          Las fórmulas de scoring son configurables, no hardcodeadas.
        </p>
      </div>

      {/* Service selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {SERVICES.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontFamily: 'monospace',
              background: active === s.id ? s.color + '20' : '#161B22',
              border: `1px solid ${active === s.id ? s.color + '60' : '#30363D'}`,
              color: active === s.id ? s.color : '#8B949E',
              fontWeight: active === s.id ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #21262D', fontSize: 11, color: '#484F58' }}>
        ↳ {SERVICES.find(s => s.id === active)?.note}
      </div>

      {renderCode()}

      {/* Score reference */}
      <div style={{ marginTop: 20 }}>
        <Divider>Referencia de scores (0-100)</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            {
              name: 'exploration_score', color: '#10B981',
              bands: [
                { range: '80-100', label: 'Explorer activo', note: 'Categorías nuevas, alto potencial' },
                { range: '50-79',  label: 'Moderado',         note: 'Equilibrio entre conocido y nuevo' },
                { range: '20-49',  label: 'Focused buyer',    note: 'Compra siempre en las mismas' },
                { range: '0-19',   label: 'Ultra especializado', note: 'Una sola categoría' },
              ],
            },
            {
              name: 'churn_risk_score', color: '#EF4444',
              bands: [
                { range: '70-100', label: 'Crítico', note: 'Activar con urgencia máxima + crédito' },
                { range: '50-69',  label: 'Alto',    note: 'Incentivo de retorno urgente' },
                { range: '25-49',  label: 'Medio',   note: 'Monitorear, personalizar' },
                { range: '0-24',   label: 'Bajo',    note: 'Usuario activo y saludable' },
              ],
            },
            {
              name: 'engagement_score', color: '#6366F1',
              bands: [
                { range: '80-100', label: 'Muy activo',  note: 'Wishlist, reviews, compras frecuentes' },
                { range: '50-79',  label: 'Activo',      note: 'Navega y compra regularmente' },
                { range: '20-49',  label: 'Pasivo',      note: 'Visitas esporádicas' },
                { range: '0-19',   label: 'Inactivo',    note: 'Casi sin actividad reciente' },
              ],
            },
          ].map(score => (
            <div key={score.name} style={{ background: '#161B22', border: `1px solid ${score.color}22`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: score.color, marginBottom: 10 }}>{score.name}</div>
              {score.bands.map(b => (
                <div key={b.range} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: score.color, minWidth: 48, flexShrink: 0 }}>{b.range}</span>
                  <div>
                    <div style={{ fontSize: 10, color: '#E6EDF3', lineHeight: 1.2 }}>{b.label}</div>
                    <div style={{ fontSize: 9, color: '#484F58', lineHeight: 1.3 }}>{b.note}</div>
                  </div>
                </div>
              ))}
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
