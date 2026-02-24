import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_CAMPAIGNS = `-- ── campaigns ─────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(255) NOT NULL,
  mechanic                 VARCHAR(50)  NOT NULL
    CHECK (mechanic IN ('wheel','scratch_card','coupon','direct','ab_test')),
  status                   VARCHAR(20)  NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','ended')),

  start_at                 TIMESTAMPTZ  NOT NULL,
  end_at                   TIMESTAMPTZ  NOT NULL,

  -- Money: guardado como entero en centavos + moneda ISO 4217
  budget_limit_amount      BIGINT       NOT NULL CHECK (budget_limit_amount > 0),
  budget_limit_currency    CHAR(3)      NOT NULL DEFAULT 'UYU',
  daily_limit_amount       BIGINT       NOT NULL CHECK (daily_limit_amount > 0),
  daily_limit_currency     CHAR(3)      NOT NULL DEFAULT 'UYU',
  budget_consumed_amount   BIGINT       NOT NULL DEFAULT 0
    CHECK (budget_consumed_amount >= 0),

  eligibility_rules        JSONB        NOT NULL DEFAULT '[]',
  ab_variant               VARCHAR(50),
  metadata                 JSONB        NOT NULL DEFAULT '{}',

  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_campaigns_dates    CHECK (end_at > start_at),
  CONSTRAINT chk_campaigns_consumed CHECK (budget_consumed_amount <= budget_limit_amount)
);

CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_active  ON campaigns (start_at, end_at)
  WHERE status = 'active';                        -- índice parcial: solo activas
CREATE INDEX idx_campaigns_eligibility ON campaigns
  USING gin (eligibility_rules);                  -- búsqueda dentro del JSONB

-- Trigger: actualiza updated_at automáticamente
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

const CODE_REWARDS = `-- ── rewards ───────────────────────────────────────────────────────
CREATE TABLE rewards (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id              UUID        NOT NULL
    REFERENCES campaigns(id) ON DELETE CASCADE,

  type                     VARCHAR(20) NOT NULL
    CHECK (type IN ('percentage','credit','product','access')),
  value                    TEXT        NOT NULL,       -- depende del type:
                                                        -- percentage → '15' (15%)
                                                        -- credit     → '500' (centavos)
                                                        -- product    → 'SKU-001'
                                                        -- access     → 'premium_30d'

  probability_weight       INTEGER     NOT NULL CHECK (probability_weight > 0),

  stock_limit              INTEGER     CHECK (stock_limit > 0),  -- NULL = ilimitado
  stock_consumed           INTEGER     NOT NULL DEFAULT 0
    CHECK (stock_consumed >= 0),

  cost_estimate_amount     BIGINT      NOT NULL DEFAULT 0,
  cost_estimate_currency   CHAR(3)     NOT NULL DEFAULT 'UYU',

  expiration_hours         INTEGER     NOT NULL DEFAULT 48
    CHECK (expiration_hours BETWEEN 1 AND 8760),       -- máx 1 año

  metadata                 JSONB       NOT NULL DEFAULT '{}',

  CONSTRAINT chk_rewards_stock CHECK (
    stock_limit IS NULL OR stock_consumed <= stock_limit
  ),
  CONSTRAINT chk_rewards_cost CHECK (cost_estimate_amount >= 0)
);

CREATE INDEX idx_rewards_campaign  ON rewards (campaign_id);
-- Índice parcial: solo premios con stock disponible (el más consultado)
CREATE INDEX idx_rewards_available ON rewards (campaign_id)
  WHERE stock_limit IS NULL OR stock_consumed < stock_limit;`

const CODE_ACTIVATIONS = `-- ── activations ───────────────────────────────────────────────────
-- Tabla particionada por rango mensual de created_at.
-- Permite: DROP de particiones viejas, índices menores, queries más rápidas.

CREATE TABLE activations (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL,
  campaign_id       UUID        NOT NULL REFERENCES campaigns(id),
  reward_id         UUID        REFERENCES rewards(id),   -- NULL = sin premio

  status            VARCHAR(20) NOT NULL DEFAULT 'resolved'
    CHECK (status IN ('pending','resolved','applied','expired','converted')),

  idempotency_key   CHAR(64)    NOT NULL,   -- HMAC hex → longitud fija 64 chars
  token             TEXT,                   -- base64url del BenefitToken firmado
  token_hash        CHAR(64),              -- SHA-256 del token para revocación

  order_id          UUID,
  resolved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  applied_at        TIMESTAMPTZ,
  converted_at      TIMESTAMPTZ,

  ip_address        INET        NOT NULL,
  user_agent        TEXT        NOT NULL DEFAULT '',
  audit_log         JSONB       NOT NULL DEFAULT '[]',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()

) PARTITION BY RANGE (created_at);

-- ── Crear partición por mes (via cron o migración automática) ──────
CREATE TABLE activations_2026_01
  PARTITION OF activations
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE activations_2026_02
  PARTITION OF activations
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Partición catch-all para fechas futuras (siempre tener una)
CREATE TABLE activations_future
  PARTITION OF activations
  FOR VALUES FROM ('2030-01-01') TO ('2099-01-01');

-- ── Primary key incluye created_at (requerido por particionado) ────
ALTER TABLE activations
  ADD CONSTRAINT pk_activations PRIMARY KEY (id, created_at);

-- ── Índices críticos ──────────────────────────────────────────────
-- Garantía de 1 activación por usuario/campaña (el más importante)
CREATE UNIQUE INDEX idx_activations_user_campaign
  ON activations (user_id, campaign_id);

-- Idempotencia: lookup rápido por HMAC key
CREATE UNIQUE INDEX idx_activations_idempotency
  ON activations (idempotency_key);

-- ExpirationJob: solo resueltas no expiradas, ordenadas por vencimiento
CREATE INDEX idx_activations_expiry
  ON activations (expires_at, status)
  WHERE status = 'resolved';

-- Lookup por order_id (para onOrderConfirmed)
CREATE INDEX idx_activations_order
  ON activations (order_id)
  WHERE order_id IS NOT NULL;

-- Lookup por token_hash (para revocación)
CREATE INDEX idx_activations_token_hash
  ON activations (token_hash)
  WHERE token_hash IS NOT NULL;`

const CODE_AUDIT = `-- ── audit_logs ────────────────────────────────────────────────────
-- Tabla append-only e inmutable.
-- NO tiene FK hacia activations para evitar cascadas accidentales.
-- En producción: REVOKE UPDATE, DELETE, TRUNCATE en este role.

CREATE TABLE audit_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  event       VARCHAR(60)  NOT NULL,
  actor       VARCHAR(255) NOT NULL,        -- user_id | 'system'
  metadata    JSONB        NOT NULL DEFAULT '{}',
  integrity   CHAR(64)     NOT NULL,        -- SHA-256 del contenido (hex)
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Partición por mes (igual que activations)
CREATE TABLE audit_logs_2026_01
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Índices para consultas de auditoría y compliance
CREATE INDEX idx_audit_event     ON audit_logs (event, timestamp DESC);
CREATE INDEX idx_audit_actor     ON audit_logs (actor, timestamp DESC);
CREATE INDEX idx_audit_metadata  ON audit_logs USING gin (metadata);

-- Política de permisos (ejecutar como superuser al crear el schema)
-- Solo INSERT. Nunca UPDATE/DELETE desde la aplicación.
REVOKE UPDATE, DELETE, TRUNCATE
  ON audit_logs
  FROM activation_engine_role;

GRANT INSERT, SELECT
  ON audit_logs
  TO activation_engine_role;`

const CODE_ATOMIC = `-- ── Operaciones atómicas críticas ────────────────────────────────
-- Estas queries son el corazón del control financiero y de stock.
-- Si retornan 0 filas → la condición falló → rollback en el caso de uso.

-- [1] Reservar stock (sin sobrepasar el límite)
UPDATE rewards
SET    stock_consumed = stock_consumed + 1
WHERE  id = $1
  AND  (stock_limit IS NULL OR stock_consumed < stock_limit)
RETURNING stock_consumed, stock_limit;
-- 0 rows → sin stock disponible

-- [2] Reservar presupuesto (sin sobrepasar el límite)
UPDATE campaigns
SET    budget_consumed_amount = budget_consumed_amount + $2,
       updated_at = NOW()
WHERE  id = $1
  AND  budget_consumed_amount + $2 <= budget_limit_amount
RETURNING budget_consumed_amount, budget_limit_amount;
-- 0 rows → presupuesto agotado

-- [3] Liberar stock (ExpirationJob)
UPDATE rewards
SET    stock_consumed = GREATEST(stock_consumed - 1, 0)
WHERE  id = $1
RETURNING stock_consumed;

-- [4] Suma de costo diario (para daily_limit check)
SELECT COALESCE(SUM(r.cost_estimate_amount), 0)::BIGINT AS daily_total
FROM   activations a
JOIN   rewards r ON r.id = a.reward_id
WHERE  a.campaign_id = $1
  AND  a.created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Montevideo')
  AND  a.status NOT IN ('expired');   -- no contar activaciones expiradas`

const CODE_MIGRATIONS = `-- ── Utilidades del schema ─────────────────────────────────────────

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Vista para métricas de campaña en tiempo real
CREATE OR REPLACE VIEW campaign_metrics AS
SELECT
  c.id,
  c.name,
  c.status,
  c.budget_limit_amount,
  c.budget_consumed_amount,
  ROUND(c.budget_consumed_amount::numeric / c.budget_limit_amount * 100, 2)
    AS budget_pct,
  COUNT(a.id)                               AS total_activations,
  COUNT(a.id) FILTER (WHERE a.reward_id IS NOT NULL)
                                            AS activations_with_reward,
  COUNT(a.id) FILTER (WHERE a.status = 'converted')
                                            AS conversions,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'converted')::numeric
    / NULLIF(COUNT(a.id) FILTER (WHERE a.reward_id IS NOT NULL), 0) * 100
  , 2)                                      AS conversion_pct
FROM  campaigns c
LEFT JOIN activations a ON a.campaign_id = c.id
GROUP BY c.id;`

const TABLES = [
  { id: 'campaigns',   label: 'campaigns',   color: '#6366F1', note: '+ trigger updated_at + índices parciales' },
  { id: 'rewards',     label: 'rewards',     color: '#10B981', note: 'índice parcial por stock disponible' },
  { id: 'activations', label: 'activations', color: '#3B82F6', note: 'particionada por mes + 5 índices críticos' },
  { id: 'audit',       label: 'audit_logs',  color: '#EF4444', note: 'append-only · REVOKE UPDATE/DELETE' },
  { id: 'atomic',      label: 'Ops. atómicas', color: '#F59E0B', note: 'queries de reserva de stock y presupuesto' },
  { id: 'utils',       label: 'Utilidades',  color: '#8B5CF6', note: 'función updated_at · vista campaign_metrics' },
]

const ER_RELATIONS = [
  { from: 'campaigns',   to: 'rewards',     label: '1 → N',   note: 'ON DELETE CASCADE' },
  { from: 'campaigns',   to: 'activations', label: '1 → N',   note: 'FK + partición mensual' },
  { from: 'rewards',     to: 'activations', label: '1 → N',   note: 'NULL = sin premio' },
  { from: 'activations', to: 'audit_logs',  label: 'lógica',  note: 'Sin FK → inmutabilidad' },
]

export function DBSchema() {
  const [activeTable, setActiveTable] = useState('campaigns')

  const renderCode = () => {
    switch (activeTable) {
      case 'campaigns':   return <CodeBlock code={CODE_CAMPAIGNS}  title="campaigns"              badge="Table"   badgeColor="#6366F1" />
      case 'rewards':     return <CodeBlock code={CODE_REWARDS}    title="rewards"                badge="Table"   badgeColor="#10B981" />
      case 'activations': return <CodeBlock code={CODE_ACTIVATIONS} title="activations (partitioned)" badge="Table" badgeColor="#3B82F6" />
      case 'audit':       return <CodeBlock code={CODE_AUDIT}      title="audit_logs (append-only)" badge="Table" badgeColor="#EF4444" />
      case 'atomic':      return <CodeBlock code={CODE_ATOMIC}     title="Queries atómicas críticas" badge="SQL"  badgeColor="#F59E0B" />
      case 'utils':       return <CodeBlock code={CODE_MIGRATIONS} title="Utilidades y vistas"    badge="SQL"     badgeColor="#8B5CF6" />
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊞ DB Schema
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Schema PostgreSQL</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          4 tablas, 9 índices, operaciones atómicas y particionado mensual.
          Diseñado para consistencia fuerte y escala vertical + horizontal.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {['PostgreSQL 16+', 'Particionado por RANGE', 'JSONB para metadata', 'Índices parciales'].map(b => (
            <span key={b} style={{
              fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
              color: '#93C5FD',
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* ER Diagram (simple) */}
      <div style={{ marginBottom: 20 }}>
        <Divider>Relaciones entre tablas</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {ER_RELATIONS.map(r => (
            <div key={r.from + r.to} style={{
              background: '#161B22', border: '1px solid #21262D',
              borderRadius: 8, padding: '9px 12px',
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              <code style={{ fontSize: 11, color: '#A5B4FC', fontFamily: 'monospace' }}>{r.from}</code>
              <span style={{ fontSize: 10, color: '#F59E0B', fontFamily: 'monospace' }}>{r.label}</span>
              <code style={{ fontSize: 11, color: '#A5B4FC', fontFamily: 'monospace' }}>{r.to}</code>
              <span style={{ fontSize: 10, color: '#484F58', marginLeft: 'auto' }}>{r.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table selector */}
      <Divider>DDL por tabla</Divider>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABLES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTable(t.id)}
            style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontFamily: 'monospace',
              background: activeTable === t.id ? t.color + '22' : '#161B22',
              border: `1px solid ${activeTable === t.id ? t.color + '66' : '#30363D'}`,
              color: activeTable === t.id ? t.color : '#8B949E',
              fontWeight: activeTable === t.id ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selected table note */}
      {activeTable && (
        <div style={{
          marginBottom: 8, padding: '6px 12px', borderRadius: 6,
          background: 'rgba(255,255,255,0.02)', border: '1px solid #21262D',
          fontSize: 11, color: '#484F58', fontFamily: 'monospace',
        }}>
          ↳ {TABLES.find(t => t.id === activeTable)?.note}
        </div>
      )}

      {renderCode()}

      {/* Design decisions */}
      <div style={{ marginTop: 20 }}>
        <Divider>Decisiones de diseño</Divider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              title: 'Money como BIGINT',
              desc: 'Evita errores de punto flotante. $10.50 UYU = 1050 centavos. Nunca FLOAT o NUMERIC sin escala fija.',
              color: '#10B981',
            },
            {
              title: 'Particionado mensual',
              desc: 'Permite DROP de particiones viejas sin VACUUM global. Queries al ExpirationJob tocan solo 1-2 particiones.',
              color: '#3B82F6',
            },
            {
              title: 'Índices parciales',
              desc: 'idx_rewards_available solo indexa premios con stock. idx_activations_expiry solo las no expiradas. Más pequeños = más rápidos.',
              color: '#6366F1',
            },
            {
              title: 'audit_logs sin FK',
              desc: 'FK hacia activations permitiría un DELETE en cascada accidental. La integridad se mantiene via hash SHA-256 por fila.',
              color: '#EF4444',
            },
            {
              title: 'JSONB para reglas',
              desc: 'eligibility_rules y audit_log en JSONB. Indexado con GIN. Permite agregar campos sin migraciones.',
              color: '#F59E0B',
            },
            {
              title: 'UPDATE atómico',
              desc: 'Toda reserva de stock o presupuesto es un único UPDATE con condición. Si retorna 0 filas, la condición falló. Sin SELECT previo.',
              color: '#8B5CF6',
            },
          ].map(d => (
            <div key={d.title} style={{
              background: '#161B22', border: `1px solid ${d.color}22`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.title}</div>
              <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ width: 16, height: 1, background: '#30363D' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: '#30363D' }} />
    </div>
  )
}
