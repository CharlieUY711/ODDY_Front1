import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_USER_EVENT = `// ── UserEvent: materia prima del análisis ────────────────
// domain/models/UserEvent.ts
// Todos los eventos observables del usuario en el e-commerce.

type UserEventType =
  | 'purchase'           // compra confirmada
  | 'cart_add'           // agregó al carrito
  | 'cart_abandon'       // abandonó el carrito
  | 'product_view'       // vista de producto (> 5 segundos)
  | 'category_browse'    // navegó una categoría
  | 'search'             // realizó una búsqueda
  | 'wishlist_add'       // agregó a lista de deseos
  | 'review_write'       // escribió una reseña

interface UserEvent {
  id:           string          // UUID v7
  user_id:      string
  type:         UserEventType
  category_id:  string | null   // null en 'search', 'review_write'
  product_id:   string | null
  order_id:     string | null   // solo en 'purchase'
  amount:       Money | null    // solo en 'purchase' (valor del ítem)
  metadata:     Record<string, unknown>  // datos extra (query, rating, etc.)
  occurred_at:  Date
  session_id:   string
  source:       'web' | 'app' | 'api'
}

// Eventos indexados en DB por (user_id, occurred_at) para queries eficientes.
// Retención configurable: ej. últimos 180 días o últimos 500 eventos.`

const CODE_CATEGORY_AFFINITY = `// ── CategoryAffinity: afinidad por categoría ─────────────
// domain/models/CategoryAffinity.ts

type FrequencyBand =
  | 'daily'       // compra todos los días
  | 'weekly'      // 4+ compras por mes
  | 'biweekly'    // 2-3 compras por mes
  | 'monthly'     // 1 compra por mes
  | 'occasional'  // < 1 compra por mes
  | 'lapsed'      // sin compras en > 90 días

interface CategoryAffinity {
  category_id:        string
  purchase_count:     number        // total de compras en esta categoría
  view_count:         number        // vistas de producto
  cart_add_count:     number        // veces que agregó al carrito
  total_spent:        Money         // gasto acumulado
  last_purchased_at:  Date | null
  last_viewed_at:     Date | null
  affinity_score:     number        // 0-100 (calculado por ScoreCalculator)
  // Fórmula: f(purchase_count, recency, spend, cart_add_ratio)
}`

const CODE_BEHAVIOR_PROFILE = `// ── UserBehaviorProfile: perfil dinámico del usuario ─────
// domain/models/UserBehaviorProfile.ts

interface UserBehaviorProfile {
  user_id:                string
  
  // ── Categorías ──────────────────────────────────────────
  top_categories:         CategoryAffinity[]    // ordenadas por affinity_score DESC
  unexplored_categories:  string[]              // existe en catálogo, nunca visitada
  avoided_categories:     string[]              // visitó pero nunca compró (> 3 vistas)

  // ── Frecuencia y valor ──────────────────────────────────
  purchase_frequency:     FrequencyBand
  avg_ticket:             Money                 // promedio de los últimos 30 días
  avg_ticket_trend:       'rising' | 'stable' | 'falling'
  total_orders_lifetime:  number
  days_since_last_purchase: number              // -1 si nunca compró

  // ── Scores (0-100) ──────────────────────────────────────
  exploration_score:      number   // qué tan abierto a categorías nuevas
  churn_risk_score:       number   // probabilidad de abandono
  engagement_score:       number   // actividad general (vistas, wishlists, etc.)

  // ── Segmento dinámico ───────────────────────────────────
  segment:                BehaviorSegment

  // ── Metadata del cómputo ────────────────────────────────
  computed_at:            Date
  data_window_days:       number   // cuántos días de historial se usaron
  event_count:            number   // eventos procesados para este perfil
}

type BehaviorSegment =
  | 'new_user'          // < 2 compras
  | 'active_explorer'   // exploration_score >= 70
  | 'loyal_focused'     // purchase_frequency weekly+ y exploration_score < 40
  | 'at_risk'           // churn_risk_score >= 60
  | 'churned'           // days_since_last_purchase > 120
  | 'vip'               // avg_ticket > umbral configurable
  | 'opportunistic'     // solo compra en descuentos (metadata pattern)`

const CODE_BEHAVIOR_RULE = `// ── BehaviorRule: decisión configurable sin código ───────
// domain/models/BehaviorRule.ts
// Reglas almacenadas en DB. Cambiar comportamiento sin deploy.

type RuleOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'between'

interface RuleCondition {
  field:    string           // campo del UserBehaviorProfile (dot-notation)
  operator: RuleOperator
  value:    unknown          // número, string, array o rango [min, max]
}

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

type CategoryStrategy =
  | 'top_purchased'          // recomendar su categoría más comprada
  | 'unexplored_random'      // categoría aleatoria nunca visitada
  | 'unexplored_adjacent'    // categoría similar a las compradas (graph)
  | 'avoided_nudge'          // categoría que visitó pero nunca compró
  | 'trending'               // categoría trending de la plataforma
  | string                   // category_id explícito

interface BehaviorRule {
  id:              string
  name:            string
  description:     string
  priority:        number          // orden de evaluación (menor = mayor prioridad)
  enabled:         boolean
  campaign_ids:    string[] | null // null = aplica a todas las campañas
  segment_filter:  BehaviorSegment[] | null  // null = todos los segmentos

  conditions:      RuleCondition[] // evaluadas en AND (todas deben cumplirse)
  conditions_op:   'AND' | 'OR'   // cómo combinar conditions

  action: {
    recommended_category: CategoryStrategy
    reward_bias_type:     RewardType       // del Activation Engine
    urgency_level:        UrgencyLevel
    confidence_boost:     number           // 0-1, suma a la confidence base
  }
}

// Ejemplo de regla en JSON (se almacena en tabla behavior_rules):
// {
//   "id": "rule-churn-critical",
//   "priority": 1,
//   "conditions": [
//     { "field": "churn_risk_score", "operator": "gte", "value": 70 }
//   ],
//   "action": {
//     "recommended_category": "top_purchased",
//     "reward_bias_type":     "credit",
//     "urgency_level":        "critical",
//     "confidence_boost":     0.2
//   }
// }`

const CODE_ACTIVATION_DECISION = `// ── ActivationDecision: salida del orquestador ───────────
// domain/models/ActivationDecision.ts
// Este es el contrato de salida. El Activation Engine lo consume.

interface ActivationDecision {
  // ── Identificadores ─────────────────────────────────────
  id:                   string        // UUID de esta decisión (para trazabilidad)
  user_id:              string
  campaign_id:          string

  // ── Recomendación principal ──────────────────────────────
  recommended_category: string        // category_id resuelto (nunca estrategia abstracta)
  reward_bias_type:     RewardType    // tipo de premio a priorizar
  urgency_level:        UrgencyLevel

  // ── Metadata de la decisión ──────────────────────────────
  confidence:           number        // 0-1. < 0.5 = incierta, > 0.8 = alta confianza
  decision_source:      'rules' | 'ml' | 'fallback'
  applied_rule_id:      string | null // regla que disparó la decisión
  rationale:            string[]      // razones en lenguaje natural (para logging + ML)

  // Ejemplo de rationale:
  // [
  //   "churn_risk_score=85 supera umbral crítico (70)",
  //   "top_category=electronics con affinity_score=92",
  //   "days_since_last_purchase=45 → crédito como incentivo de retorno",
  // ]

  // ── Perfil snapshot (para ML training) ───────────────────
  profile_snapshot: {
    exploration_score:        number
    churn_risk_score:         number
    engagement_score:         number
    segment:                  BehaviorSegment
    days_since_last_purchase: number
    avg_ticket_trend:         string
  }

  computed_at:          Date
  expires_at:           Date   // decisión válida por X minutos (configurable)
}`

const MODELS = [
  { id: 'event',     label: 'UserEvent',           color: '#8B5CF6', badge: 'Raw Data',   note: 'Materia prima del análisis' },
  { id: 'affinity',  label: 'CategoryAffinity',    color: '#10B981', badge: 'Value Object', note: 'Afinidad calculada por categoría' },
  { id: 'profile',   label: 'UserBehaviorProfile', color: '#F59E0B', badge: 'Aggregate',  note: 'Perfil dinámico completo con scores' },
  { id: 'rule',      label: 'BehaviorRule',        color: '#6366F1', badge: 'Config',     note: 'Regla configurable en DB, sin deploy' },
  { id: 'decision',  label: 'ActivationDecision',  color: '#EF4444', badge: 'Output',     note: 'Salida del módulo hacia el motor' },
]

export function BehaviorModels() {
  const [active, setActive] = useState('event')

  const renderCode = () => {
    switch (active) {
      case 'event':    return <CodeBlock code={CODE_USER_EVENT}          title="domain/models/UserEvent.ts"            badge="Raw Data"    badgeColor="#8B5CF6" />
      case 'affinity': return <CodeBlock code={CODE_CATEGORY_AFFINITY}   title="domain/models/CategoryAffinity.ts"     badge="Value Object" badgeColor="#10B981" />
      case 'profile':  return <CodeBlock code={CODE_BEHAVIOR_PROFILE}    title="domain/models/UserBehaviorProfile.ts"  badge="Aggregate"   badgeColor="#F59E0B" />
      case 'rule':     return <CodeBlock code={CODE_BEHAVIOR_RULE}       title="domain/models/BehaviorRule.ts"         badge="Config"      badgeColor="#6366F1" />
      case 'decision': return <CodeBlock code={CODE_ACTIVATION_DECISION} title="domain/models/ActivationDecision.ts"  badge="Output DTO"  badgeColor="#EF4444" />
    }
  }

  const activeModel = MODELS.find(m => m.id === active)!

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⬡ Domain Models
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Modelos del Behavior Orchestrator</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          5 modelos que cubren el ciclo completo: evento crudo → afinidad → perfil → regla → decisión.
        </p>
      </div>

      {/* Data pipeline */}
      <div style={{ marginBottom: 20, padding: '14px 16px', background: '#0D1117', border: '1px solid #21262D', borderRadius: 10 }}>
        <div style={{ fontSize: 9, color: '#484F58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'monospace' }}>Pipeline de datos</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'UserEvent[]', color: '#8B5CF6' },
            { label: '→', color: '#30363D', plain: true },
            { label: 'BehaviorAnalyzer', color: '#F59E0B' },
            { label: '→', color: '#30363D', plain: true },
            { label: 'CategoryAffinity[]', color: '#10B981' },
            { label: '→', color: '#30363D', plain: true },
            { label: 'UserBehaviorProfile', color: '#F59E0B' },
            { label: '→', color: '#30363D', plain: true },
            { label: 'RuleEngine(BehaviorRule[])', color: '#6366F1' },
            { label: '→', color: '#30363D', plain: true },
            { label: 'ActivationDecision', color: '#EF4444' },
          ].map((s, i) => (
            s.plain
              ? <span key={i} style={{ color: '#30363D', fontSize: 14 }}>{s.label}</span>
              : <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', background: s.color + '18', border: `1px solid ${s.color}33`, borderRadius: 5, color: s.color }}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
              fontFamily: 'monospace',
              background: active === m.id ? m.color + '20' : '#161B22',
              border: `1px solid ${active === m.id ? m.color + '60' : '#30363D'}`,
              color: active === m.id ? m.color : '#8B949E',
              fontWeight: active === m.id ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 6, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #21262D', fontSize: 11, color: '#484F58' }}>
        ↳ {activeModel.note}
      </div>

      {renderCode()}
    </div>
  )
}
