import { CodeBlock } from '../CodeBlock'

const CODE_MONEY = `// ── Value Object: Money (inmutable, en centavos) ──────────
interface Money {
  readonly amount:   number    // en centavos → $10.50 = 1050
  readonly currency: string    // ISO 4217  →  'UYU' | 'USD'
}

function money(amount: number, currency = 'UYU'): Money {
  if (amount < 0) throw new DomainError('Money cannot be negative')
  return Object.freeze({ amount, currency })
}

function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amount + b.amount, a.currency)
}

function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  if (b.amount > a.amount) throw new DomainError('Insufficient funds')
  return money(a.amount - b.amount, a.currency)
}

function isAffordable(cost: Money, budget: Money): boolean {
  assertSameCurrency(cost, budget)
  return cost.amount <= budget.amount
}`

const CODE_CAMPAIGN = `// ── Entidad: Campaign ─────────────────────────────────────
type MechanicType =
  | 'wheel'           // ruleta → UI independiente
  | 'scratch_card'    // raspadita
  | 'coupon'          // cupón simple
  | 'direct'          // aplicación directa sin interacción
  | 'ab_test'         // A/B testing con variantes

type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended'

interface EligibilityRule {
  field:    string              // 'user.tier' | 'order.count' | 'user.country'
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in'
  value:    unknown             // tipado dinámico en runtime
}

interface Campaign {
  id:                 string           // UUID v7 (ordenable por tiempo)
  name:               string
  mechanic:           MechanicType     // extensible via MechanicRegistry
  status:             CampaignStatus
  start_at:           Date
  end_at:             Date
  budget_limit:       Money            // presupuesto total máximo
  daily_limit:        Money            // cap diario
  budget_consumed:    Money            // rastreado en tiempo real (atómico)
  eligibility_rules:  EligibilityRule[] // evaluadas en orden, AND implícito
  rewards:            Reward[]
  ab_variant?:        string           // para enrutar a experimento
  metadata:           Record<string, unknown>
  created_at:         Date
  updated_at:         Date
}`

const CODE_REWARD = `// ── Entidad: Reward ───────────────────────────────────────
type RewardType =
  | 'percentage'   // descuento % sobre total del carrito
  | 'credit'       // crédito en UYU para próxima compra
  | 'product'      // producto gratis (SKU)
  | 'access'       // acceso a sección/servicio premium

interface Reward {
  id:                 string
  campaign_id:        string
  type:               RewardType
  value:              number | string   // % | UYU | SKU | access_key
  probability_weight: number            // ej: 10 → 10/(suma total de pesos)
                                        // NO es un porcentaje directo
  stock_limit:        number | null     // null = ilimitado
  stock_consumed:     number            // contador atómico en DB
  cost_estimate:      Money             // para rastrear presupuesto consumido
  expiration_hours:   number            // vigencia del token (ej: 48 hrs)
  metadata:           Record<string, unknown>
}

// Ejemplo de tabla de pesos:
// Premio A: weight=50  → 50/110 = 45.5%
// Premio B: weight=35  → 35/110 = 31.8%
// Premio C: weight=20  → 20/110 = 18.2%
// Sin premio: weight=5 → 5/110  =  4.5%  ← "mejor suerte"`

const CODE_ACTIVATION = `// ── Entidad: Activation ──────────────────────────────────
type ActivationStatus =
  | 'pending'     // creada pero aún no resuelta (raro, casi inmediato)
  | 'resolved'    // premio asignado, token emitido, esperando uso
  | 'applied'     // token presentado, beneficio aplicado al carrito
  | 'converted'   // orden confirmada → beneficio consumido definitivamente
  | 'expired'     // venció sin usarse → stock y presupuesto liberados

interface AuditEntry {
  timestamp: Date
  event:     string                    // 'ACTIVATION_RESOLVED' | 'BENEFIT_APPLIED' | etc.
  actor:     string                    // user_id o 'system'
  metadata:  Record<string, unknown>   // datos adicionales del evento
}

interface Activation {
  id:               string             // UUID v7
  user_id:          string
  campaign_id:      string
  reward_id:        string | null      // null = sin premio ("mejor suerte")
  status:           ActivationStatus
  idempotency_key:  string             // HMAC(user_id + campaign_id, IDEM_SECRET)
  token:            string | null      // token firmado (null si sin premio)
  token_hash:       string | null      // SHA-256 del token → para revocación rápida
  order_id:         string | null      // se asigna cuando se aplica al carrito
  resolved_at:      Date | null
  expires_at:       Date               // = resolved_at + reward.expiration_hours
  applied_at:       Date | null
  converted_at:     Date | null        // cuando la orden es confirmada
  ip_address:       string             // para auditoría y detección de fraude
  user_agent:       string
  audit_log:        AuditEntry[]       // historial inmutable de eventos
}`

const CODE_TOKEN = `// ── Value Object: BenefitToken (payload del JWT firmado) ─
interface BenefitToken {
  jti:          string        // JWT ID = activation.id (no reutilizable)
  sub:          string        // user_id (subject)
  campaign_id:  string
  reward_id:    string
  reward_type:  RewardType
  value:        number | string
  iat:          number        // issued at (Unix timestamp)
  exp:          number        // expires at (Unix timestamp)
  sig:          string        // HMAC-SHA256(jti+sub+reward_id+exp, SECRET)
}

// El token se serializa como Base64URL(JSON.stringify(payload))
// NO usa JWT estándar para evitar dependencias de librerías externas
// La firma cubre los campos críticos: quién, qué, cuándo vence`

export function DomainModels() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#10B981', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⬡ Domain Models
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Modelos de dominio</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Interfaces TypeScript del núcleo del dominio. Sin dependencias de framework.
          Representan el lenguaje ubicuo del negocio.
        </p>
      </div>

      <ModelSection title="Money" subtitle="Value Object · shared/money/Money.ts" color="#8B5CF6">
        <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
          Tipo inmutable para valores monetarios. Siempre en centavos para evitar
          errores de punto flotante. Operaciones seguras con validación de moneda.
        </p>
        <CodeBlock code={CODE_MONEY} title="shared/money/Money.ts" badge="Value Object" badgeColor="#8B5CF6" />
      </ModelSection>

      <ModelSection title="Campaign" subtitle="Entidad raíz de una campaña de activación" color="#6366F1">
        <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
          Contiene la configuración completa de una campaña. El campo <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>mechanic</code> es
          extensible: agregar una mecánica nueva no requiere cambiar los modelos, solo registrar
          una nueva entrada en el <strong style={{ color: '#E6EDF3' }}>MechanicRegistry</strong>.
        </p>
        <CodeBlock code={CODE_CAMPAIGN} title="domain/models/Campaign.ts" badge="Entity" badgeColor="#6366F1" />
      </ModelSection>

      <ModelSection title="Reward" subtitle="Premio con peso probabilístico y control de stock" color="#10B981">
        <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
          El <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>probability_weight</code> es
          relativo, no absoluto. El resolver calcula la probabilidad real en base
          a la suma de todos los pesos activos (excluyendo sin stock o sin presupuesto).
        </p>
        <CodeBlock code={CODE_REWARD} title="domain/models/Reward.ts" badge="Entity" badgeColor="#10B981" />
      </ModelSection>

      <ModelSection title="Activation" subtitle="Registro de una activación de usuario" color="#3B82F6">
        <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
          Una activación tiene ciclo de vida completo: resolved → applied → converted.
          El <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>audit_log</code> es
          append-only e inmutable. La <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>idempotency_key</code> garantiza
          exactamente 1 activación por usuario/campaña.
        </p>
        <CodeBlock code={CODE_ACTIVATION} title="domain/models/Activation.ts" badge="Aggregate Root" badgeColor="#3B82F6" />
      </ModelSection>

      <ModelSection title="BenefitToken" subtitle="Payload del token firmado HMAC-SHA256" color="#F59E0B">
        <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
          El token no usa JWT estándar a propósito: evita dependencias, facilita
          revocación selectiva en Redis y permite verificación rápida sin consultar DB.
        </p>
        <CodeBlock code={CODE_TOKEN} title="domain/models/BenefitToken.ts" badge="Value Object" badgeColor="#F59E0B" />
      </ModelSection>
    </div>
  )
}

function ModelSection({ title, subtitle, color, children }: {
  title: string
  subtitle: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #21262D' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 11, color: '#484F58', fontFamily: 'monospace' }}>{subtitle}</span>
      </div>
      {children}
    </div>
  )
}
