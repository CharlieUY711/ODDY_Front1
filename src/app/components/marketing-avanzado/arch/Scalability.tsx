import { CodeBlock } from '../CodeBlock'

const CODE_MECHANIC_REGISTRY = `// ── MechanicRegistry: agregar mecánicas sin tocar el core ─
// domain/mechanics/MechanicRegistry.ts

interface MechanicHandler {
  // Retorna datos extra para que la UI sepa cómo animar
  buildUIPayload(activation: ActivationResult): unknown
  // Validaciones específicas de la mecánica (opcional)
  validate?(campaign: Campaign): void
}

const registry = new Map<MechanicType, MechanicHandler>()

// Mecánicas existentes
registry.set('wheel',        new WheelMechanicHandler())
registry.set('scratch_card', new ScratchCardHandler())
registry.set('coupon',       new CouponHandler())
registry.set('direct',       new DirectHandler())

// Agregar en el futuro sin tocar RequestActivation:
registry.set('slot_machine', new SlotMachineHandler())
registry.set('mystery_box',  new MysteryBoxHandler())

// En RequestActivation, al final:
const mechanic = registry.get(campaign.mechanic)
result.ui_payload = mechanic?.buildUIPayload(result) ?? null`

const CODE_DYNAMIC_RULES = `// ── Reglas dinámicas de probabilidad ─────────────────────
// domain/services/DynamicRuleEngine.ts
// Modifica los pesos ANTES de sortear, sin cambiar la estructura de Reward

interface DynamicRule {
  condition: (ctx: ResolutionContext) => boolean
  apply:     (rewards: Reward[]) => Reward[]  // transforma los pesos
}

class DynamicRuleEngine {
  private rules: DynamicRule[] = []

  apply(rewards: Reward[], ctx: ResolutionContext): Reward[] {
    let result = [...rewards]
    for (const rule of this.rules) {
      if (rule.condition(ctx)) {
        result = rule.apply(result)
      }
    }
    return result
  }
}

// Ejemplos de reglas configurables:
const rules: DynamicRule[] = [

  // Primera compra: doblar peso del premio premium
  {
    condition: ctx => ctx.user.order_count === 0,
    apply: rewards => rewards.map(r =>
      r.metadata.tier === 'premium'
        ? { ...r, probability_weight: r.probability_weight * 2 }
        : r
    ),
  },

  // Flash hour 12:00-13:00: triplicar todo
  {
    condition: ctx => {
      const h = new Date(ctx.timestamp).getHours()
      return h === 12
    },
    apply: rewards => rewards.map(r =>
      ({ ...r, probability_weight: r.probability_weight * 3 })
    ),
  },

  // Variante A/B: mostrar solo premios del cohort
  {
    condition: ctx => ctx.ab_variant !== undefined,
    apply: (rewards) => rewards.filter(r =>
      !r.metadata.ab_variant || r.metadata.ab_variant === ctx.ab_variant
    ),
  },
]`

const CODE_AB_TESTING = `// ── A/B Testing ──────────────────────────────────────────
// Enrutar usuarios a variantes sin cambiar el motor

// 1. La Campaign tiene un ab_variant opcional
interface Campaign {
  // ...
  ab_variant?: string     // 'control' | 'variant_a' | 'variant_b'
}

// 2. El ABRouter asigna usuarios a variantes (sticky)
class ABRouter {
  async getVariant(userId: string, campaignId: string): Promise<string> {
    // Determinístico: mismo usuario → siempre mismo cohort
    const hash = parseInt(
      hmacSha256(\`\${userId}:\${campaignId}\`, AB_SECRET).slice(0, 8),
      16
    )
    const bucket = hash % 100  // 0-99

    if (bucket < 50) return 'control'     // 50%
    if (bucket < 80) return 'variant_a'   // 30%
    return 'variant_b'                    // 20%
  }
}

// 3. En RequestActivation, antes de resolver:
const variant = await abRouter.getVariant(request.user_id, request.campaign_id)
request.ab_variant = variant
// → DynamicRuleEngine filtrará premios por variante
// → El campo ab_variant se guarda en la Activation
// → Analytics puede comparar conversion rate por variante`

const CODE_EVENT_BUS = `// ── Event Bus: extensión sin acoplamiento ────────────────
// application/ports/IEventBusPort.ts

interface IEventBusPort {
  publish<T extends DomainEvent>(event: T): Promise<void>
}

// Eventos publicados por el motor:
// ┌─────────────────────────────────────────────────────┐
// │ RewardResolvedEvent   → Analytics, Notificaciones   │
// │ BenefitAppliedEvent   → Contabilidad, BI            │
// │ BenefitConvertedEvent → CRM, Fidelización           │
// │ BenefitExpiredEvent   → Reengagement, Remarketing   │
// └─────────────────────────────────────────────────────┘

// Suscriptores desacoplados (no modifican el motor):
eventBus.subscribe('RewardResolved', async (event) => {
  await notificationService.sendPushNotification(event.user_id, {
    title:  '🎉 ¡Ganaste un premio!',
    body:   'Usá tu beneficio antes de que expire.',
    action: \`/activate/\${event.activation_id}\`,
  })
})

eventBus.subscribe('BenefitExpired', async (event) => {
  await reengagementService.sendReminder(event.user_id, {
    template: 'benefit_expired',
    data:     { campaign_id: event.campaign_id },
  })
})`

const SCALE_METRICS = [
  { label: 'Activaciones/seg', value: '~2K', note: 'Con Redis como cache de idempotencia y rate limit', color: '#10B981' },
  { label: 'Latencia p99', value: '<50ms', note: 'Sin DB en path crítico (cache-first)', color: '#3B82F6' },
  { label: 'Escalabilidad', value: 'Horizontal', note: 'Stateless + Redis distribuido → N réplicas', color: '#6366F1' },
  { label: 'Consistencia', value: 'Strong', note: 'UNIQUE DB + Redlock garantizan exactamente-una-vez', color: '#F59E0B' },
]

export function Scalability() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#8B5CF6', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⟢ Escalabilidad
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Escalabilidad & Extensión</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          El motor está preparado para nuevas mecánicas, reglas dinámicas, A/B testing
          y escala horizontal sin modificar el core del dominio.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
        {SCALE_METRICS.map(m => (
          <div key={m.label} style={{
            background: '#161B22', border: `1px solid ${m.color}33`,
            borderRadius: 10, padding: '12px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'monospace', lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: '#E6EDF3', marginTop: 4, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: '#484F58', lineHeight: 1.4 }}>{m.note}</div>
          </div>
        ))}
      </div>

      {/* Separator */}
      <SectionDivider>Mecánicas extensibles (Registry Pattern)</SectionDivider>
      <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
        Agregar una mecánica nueva (slot machine, mystery box, etc.) no requiere
        modificar <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>RequestActivation</code>.
        Solo registrar un nuevo <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 4px', borderRadius: 4 }}>MechanicHandler</code>.
      </p>
      <CodeBlock code={CODE_MECHANIC_REGISTRY} badge="Open/Closed" badgeColor="#8B5CF6" />

      <SectionDivider>Probabilidades dinámicas (Rule Engine)</SectionDivider>
      <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
        Los pesos base se modifican en runtime según contexto: primer compra, hora pico,
        historial. Sin tocar los modelos de dominio ni la DB.
      </p>
      <CodeBlock code={CODE_DYNAMIC_RULES} badge="Strategy Pattern" badgeColor="#10B981" />

      <SectionDivider>A/B Testing (hash determinístico)</SectionDivider>
      <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
        Sticky assignment: el mismo usuario siempre cae en el mismo cohort,
        garantizando consistencia en la experiencia. HMAC-based para distribución uniforme.
      </p>
      <CodeBlock code={CODE_AB_TESTING} badge="A/B Testing" badgeColor="#3B82F6" />

      <SectionDivider>Event Bus (desacoplamiento total)</SectionDivider>
      <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 8 }}>
        El motor publica eventos de dominio. Analytics, notificaciones, CRM y remarketing
        se suscriben sin que el motor los conozca. Agregar un nuevo suscriptor = 0 cambios al motor.
      </p>
      <CodeBlock code={CODE_EVENT_BUS} badge="Event-Driven" badgeColor="#F59E0B" />

      {/* Roadmap */}
      <div style={{ marginTop: 16 }}>
        <SectionDivider>Extensiones futuras sugeridas</SectionDivider>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { title: 'Campaign Templates', desc: 'YAML/JSON para configurar campañas sin código. Admin UI para no-devs.', color: '#6366F1' },
            { title: 'Cooldown por usuario', desc: 'X horas entre activaciones del mismo usuario en diferentes campañas.', color: '#10B981' },
            { title: 'Budget Alerts', desc: 'Webhooks cuando el presupuesto llega al 80% o 95%.', color: '#F59E0B' },
            { title: 'Analytics Module', desc: 'Conversion funnel por mecánica, variante A/B y tipo de premio.', color: '#3B82F6' },
            { title: 'Geo-targeting', desc: 'EligibilityRule con campo user.country para campañas por región.', color: '#EC4899' },
            { title: 'Chaining', desc: 'Premio A desbloquea Campaña B. Gamification multi-etapa.', color: '#8B5CF6' },
          ].map(item => (
            <div key={item.title} style={{
              background: '#161B22', border: `1px solid ${item.color}22`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#8B949E', marginBottom: 12, marginTop: 24,
      display: 'flex', alignItems: 'center', gap: 8
    }}>
      <div style={{ width: 16, height: 1, background: '#30363D' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: '#30363D' }} />
    </div>
  )
}
