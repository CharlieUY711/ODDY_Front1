import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_RULES_JSON = `// ── Reglas de ejemplo (almacenadas en DB como JSON) ────────
// Modificables sin deploy. Se cachean 5 min en Redis.
// Orden de prioridad: 1 = más alta → evalúa primero.

[
  {
    "id":          "rule-churn-critical",
    "name":        "Churn crítico → crédito urgente",
    "priority":    1,
    "enabled":     true,
    "campaign_ids": null,           // aplica a TODAS las campañas
    "segment_filter": null,         // aplica a TODOS los segmentos
    "conditions": [
      { "field": "churn_risk_score", "operator": "gte", "value": 70 }
    ],
    "conditions_op": "AND",
    "action": {
      "recommended_category": "top_purchased",
      "reward_bias_type":     "credit",
      "urgency_level":        "critical",
      "confidence_boost":     0.25
    }
  },

  {
    "id":          "rule-new-user-discount",
    "name":        "Usuario nuevo → descuento de bienvenida",
    "priority":    2,
    "enabled":     true,
    "segment_filter": ["new_user"],
    "conditions": [
      { "field": "total_orders_lifetime", "operator": "lte", "value": 1 }
    ],
    "conditions_op": "AND",
    "action": {
      "recommended_category": "trending",
      "reward_bias_type":     "percentage",
      "urgency_level":        "medium",
      "confidence_boost":     0.15
    }
  },

  {
    "id":          "rule-explorer-product",
    "name":        "Explorador activo → producto nuevo",
    "priority":    3,
    "enabled":     true,
    "conditions": [
      { "field": "exploration_score",  "operator": "gte", "value": 70 },
      { "field": "churn_risk_score",   "operator": "lt",  "value": 40 }
    ],
    "conditions_op": "AND",
    "action": {
      "recommended_category": "unexplored_adjacent",
      "reward_bias_type":     "product",
      "urgency_level":        "low",
      "confidence_boost":     0.10
    }
  },

  {
    "id":          "rule-vip-access",
    "name":        "VIP + ticket creciente → acceso premium",
    "priority":    4,
    "enabled":     true,
    "segment_filter": ["vip"],
    "conditions": [
      { "field": "avg_ticket_trend",   "operator": "eq",  "value": "rising" },
      { "field": "engagement_score",   "operator": "gte", "value": 60 }
    ],
    "conditions_op": "AND",
    "action": {
      "recommended_category": "top_purchased",
      "reward_bias_type":     "access",
      "urgency_level":        "low",
      "confidence_boost":     0.20
    }
  },

  {
    "id":          "rule-at-risk-moderate",
    "name":        "En riesgo moderado → nudge de categoría evitada",
    "priority":    5,
    "enabled":     true,
    "conditions": [
      { "field": "churn_risk_score",   "operator": "between", "value": [40, 69] },
      { "field": "days_since_last_purchase", "operator": "between", "value": [14, 59] }
    ],
    "conditions_op": "AND",
    "action": {
      "recommended_category": "avoided_nudge",
      "reward_bias_type":     "percentage",
      "urgency_level":        "high",
      "confidence_boost":     0.10
    }
  }
]`

const CODE_FOLDER = `behavior-orchestrator/
├── domain/
│   ├── models/
│   │   ├── UserEvent.ts              ← materia prima: todos los eventos observables
│   │   ├── CategoryAffinity.ts       ← afinidad por categoría (purchase, view, cart)
│   │   ├── UserBehaviorProfile.ts    ← perfil dinámico con scores y segmento
│   │   ├── BehaviorRule.ts           ← regla configurable con conditions + action
│   │   └── ActivationDecision.ts     ← salida: category + bias + urgency
│   ├── services/
│   │   ├── BehaviorAnalyzer.ts       ← eventos → UserBehaviorProfile
│   │   ├── ScoreCalculator.ts        ← fórmulas exploration, churn, engagement, affinity
│   │   └── RuleEngine.ts             ← evalúa BehaviorRule[] contra el perfil
│   ├── repositories/
│   │   ├── IUserEventRepository.ts   ← findRecent(userId, days): UserEvent[]
│   │   ├── IBehaviorProfileRepository.ts
│   │   └── IBehaviorRuleRepository.ts ← findApplicable(campaignId, segment)
│   └── events/
│       ├── ProfileUpdated.ts
│       └── DecisionMade.ts
│
├── application/
│   ├── use-cases/
│   │   ├── DecideActivationStrategy.ts  ← ⭐ orquestador principal (9 pasos)
│   │   ├── RefreshBehaviorProfile.ts    ← recalcula perfil bajo demanda
│   │   └── IngestUserEvent.ts           ← persiste evento + invalida cache
│   ├── dto/
│   │   ├── DecisionRequest.ts
│   │   └── DecisionResponse.ts         ← alias de ActivationDecision
│   └── ports/
│       ├── IMLModelPort.ts             ← ⭐ port para modelo ML futuro
│       ├── ICategoryPort.ts            ← listAllIds(), findAdjacent(id)
│       └── IUserDataPort.ts            ← getContext(userId) para reglas externas
│
├── infrastructure/
│   ├── persistence/
│   │   ├── UserEventRepository.ts      ← PostgreSQL particionado por user_id
│   │   ├── BehaviorProfileRepository.ts
│   │   ├── BehaviorRuleRepository.ts   ← con cache de 5 min
│   │   └── DecisionLogRepository.ts    ← append-only, base del ML dataset
│   ├── cache/
│   │   └── RedisCache.ts               ← profiles (30min), rules (5min), decisions (5min)
│   ├── ml/
│   │   └── MLModelAdapter.ts           ← stub → fetch() cuando haya endpoint
│   ├── http/
│   │   ├── BehaviorController.ts       ← POST /decide, GET /profile/:userId
│   │   └── middleware/
│   │       └── Auth.ts
│   └── jobs/
│       └── ProfileRefreshJob.ts        ← cron cada hora: perfiles de usuarios activos
│
└── shared/
    ├── scoring/
    │   └── ScoreNormalizer.ts          ← clamp(value, 0, 100)
    ├── graph/
    │   └── CategoryGraphService.ts     ← para unexplored_adjacent strategy
    └── logger/
        └── DecisionLogger.ts           ← log con features → ML training dataset`

const CODE_DB_SCHEMA = `-- ── Tablas del Behavior Orchestrator ─────────────────────

-- Eventos del usuario (particionada por user_id o por fecha)
CREATE TABLE user_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  type          VARCHAR(30) NOT NULL,
  category_id   UUID,
  product_id    UUID,
  order_id      UUID,
  amount_cents  BIGINT,
  amount_currency CHAR(3)   DEFAULT 'UYU',
  metadata      JSONB       NOT NULL DEFAULT '{}',
  session_id    UUID        NOT NULL,
  source        VARCHAR(10) NOT NULL DEFAULT 'web',
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY HASH (user_id);  -- distribución uniforme por usuario

-- Índice para queries de análisis
CREATE INDEX idx_user_events_user_date
  ON user_events (user_id, occurred_at DESC);

CREATE INDEX idx_user_events_category
  ON user_events (user_id, category_id)
  WHERE category_id IS NOT NULL;

-- Reglas de comportamiento (configurables sin deploy)
CREATE TABLE behavior_rules (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  description    TEXT,
  priority       INTEGER     NOT NULL CHECK (priority > 0),
  enabled        BOOLEAN     NOT NULL DEFAULT true,
  campaign_ids   UUID[],     -- NULL = todas las campañas
  segment_filter VARCHAR(30)[],
  conditions     JSONB       NOT NULL,
  conditions_op  CHAR(3)     NOT NULL DEFAULT 'AND',
  action         JSONB       NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_priority ON behavior_rules (priority) WHERE enabled = true;

-- Log de decisiones (training dataset del ML)
CREATE TABLE decision_logs (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL,
  campaign_id               UUID        NOT NULL,
  -- Features (inputs)
  exploration_score         SMALLINT    NOT NULL,
  churn_risk_score          SMALLINT    NOT NULL,
  engagement_score          SMALLINT    NOT NULL,
  segment                   VARCHAR(30) NOT NULL,
  days_since_last_purchase  SMALLINT    NOT NULL,
  avg_ticket_amount         BIGINT      NOT NULL,
  top_category_id           UUID,
  unexplored_count          SMALLINT    NOT NULL,
  -- Decision (labels)
  recommended_category      TEXT        NOT NULL,
  reward_bias_type          VARCHAR(20) NOT NULL,
  urgency_level             VARCHAR(10) NOT NULL,
  confidence                NUMERIC(4,3) NOT NULL,
  decision_source           VARCHAR(10) NOT NULL,
  applied_rule_id           UUID,
  rationale                 TEXT[]      NOT NULL DEFAULT '{}',
  ml_model_version          VARCHAR(20),
  -- Outcome (se actualiza en conversión)
  converted                 BOOLEAN,
  conversion_order_id       UUID,
  conversion_reward_type    VARCHAR(20),
  computed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para análisis y entrenamiento ML
CREATE INDEX idx_decision_logs_user     ON decision_logs (user_id, computed_at DESC);
CREATE INDEX idx_decision_logs_campaign ON decision_logs (campaign_id, computed_at DESC);
CREATE INDEX idx_decision_logs_outcome  ON decision_logs (converted, reward_bias_type)
  WHERE converted IS NOT NULL;`

const TABS = [
  { id: 'folder', label: 'Carpetas' },
  { id: 'rules',  label: 'Reglas JSON' },
  { id: 'schema', label: 'DB Schema' },
]

export function BehaviorStructure() {
  const [tab, setTab] = useState('folder')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊞ Estructura & Reglas
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Carpetas · Reglas · DB</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Estructura de carpetas DDD, reglas de ejemplo en JSON configurables desde DB,
          y schema PostgreSQL para eventos, reglas y decision logs.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #21262D', marginBottom: 16, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 16px', fontSize: 12, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t.id ? '#E6EDF3' : '#8B949E',
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid #F59E0B' : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'folder' && (
        <div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 10 }}>
            Estructura DDD estricta. Los archivos marcados con ⭐ son los más críticos.
            El módulo es completamente independiente del Activation Engine.
          </p>
          <CodeBlock code={CODE_FOLDER} badge="DDD" badgeColor="#F59E0B" />

          {/* Key files */}
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { file: 'DecideActivationStrategy.ts', note: 'Orquestador. 9 pasos. Cache-first. ML override.', color: '#F59E0B' },
              { file: 'RuleEngine.ts',               note: 'Evalúa condiciones con dot-notation. Sin lógica hardcodeada.', color: '#6366F1' },
              { file: 'BehaviorAnalyzer.ts',         note: 'Convierte UserEvent[] en UserBehaviorProfile con scores.', color: '#10B981' },
              { file: 'IMLModelPort.ts',             note: 'Port para ML. Stub activo. Zero cambios al dominio cuando llegue el modelo.', color: '#8B5CF6' },
            ].map(f => (
              <div key={f.file} style={{ background: '#161B22', border: `1px solid ${f.color}33`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: f.color, marginBottom: 4 }}>{f.file}</div>
                <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.4 }}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 10 }}>
            5 reglas de ejemplo. Cambian sin deploy. TTL en cache: 5 min.
            El campo <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>conditions_op</code> permite
            combinar condiciones en AND u OR.
          </p>

          {/* Rule decision matrix */}
          <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 90px', padding: '7px 14px', borderBottom: '1px solid #21262D' }}>
              {['Condición', 'Prio', 'reward_bias', 'urgency'].map(h => (
                <span key={h} style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {[
              { cond: 'churn_risk_score ≥ 70',                    prio: 1, bias: 'credit',     urgency: 'critical', color: '#EF4444' },
              { cond: 'total_orders ≤ 1  (new_user)',             prio: 2, bias: 'percentage', urgency: 'medium',   color: '#F59E0B' },
              { cond: 'exploration ≥ 70 AND churn < 40',          prio: 3, bias: 'product',    urgency: 'low',      color: '#10B981' },
              { cond: 'VIP + ticket rising + engagement ≥ 60',    prio: 4, bias: 'access',     urgency: 'low',      color: '#8B5CF6' },
              { cond: 'churn 40-69 AND días 14-59',               prio: 5, bias: 'percentage', urgency: 'high',     color: '#3B82F6' },
            ].map(row => (
              <div key={row.prio} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 90px', padding: '6px 14px', borderBottom: '1px solid #161B22', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>{row.cond}</span>
                <span style={{ fontSize: 10, color: row.color, fontFamily: 'monospace' }}>#{row.prio}</span>
                <span style={{ fontSize: 10, color: row.color, fontFamily: 'monospace' }}>{row.bias}</span>
                <span style={{ fontSize: 10, color: row.color, fontFamily: 'monospace' }}>{row.urgency}</span>
              </div>
            ))}
          </div>

          <CodeBlock code={CODE_RULES_JSON} title="behavior_rules (JSON en DB)" badge="Config" badgeColor="#F59E0B" />
        </div>
      )}

      {tab === 'schema' && (
        <div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 10 }}>
            3 tablas. <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>user_events</code> particionada
            por HASH de user_id. <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>decision_logs</code> append-only,
            columnas de features + labels + outcome para ML training.
          </p>
          <CodeBlock code={CODE_DB_SCHEMA} title="PostgreSQL Schema" badge="SQL" badgeColor="#38BDF8" />
        </div>
      )}
    </div>
  )
}
