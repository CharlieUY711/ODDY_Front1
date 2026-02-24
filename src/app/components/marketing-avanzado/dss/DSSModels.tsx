import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_SPOTLIGHT_EDITION = `// ── SpotlightEdition: agregado principal ─────────────────
// domain/models/SpotlightEdition.ts

type SpotlightStatus =
  | 'draft'         // en construcción, solo visible en admin
  | 'review'        // esperando aprobación antes de publicar
  | 'scheduled'     // publicada, esperando start_at
  | 'active'        // live → influye en AE y BO
  | 'ending_soon'   // últimas 24 horas — se puede subir urgency
  | 'ended'         // finalizó → sin efecto en AE/BO
  | 'archived'      // guardada para referencia y clonado futuro

interface SpotlightEdition {
  // ── Identidad ───────────────────────────────────────────
  id:              string          // UUID
  version:         number          // monotónicamente creciente por slug
  slug:            string          // "electronics-week-2026-w07"

  // ── Departamento protagonista ───────────────────────────
  department_id:   string          // category_id del sistema de catálogo
  department_name: string          // "Electrónica"
  title:           string          // "Semana de Electrónica"
  tagline:         string          // "Los mejores gadgets al mejor precio"

  // ── Calendario ──────────────────────────────────────────
  status:    SpotlightStatus
  start_at:  Date
  end_at:    Date
  
  // ── Configuración de influencia ─────────────────────────
  benefits:              SpotlightBenefit[]        // qué beneficios comunica
  activation_overrides:  ActivationOverride[]      // cómo modifica el AE
  behavior_hints:        BehaviorHint[]            // cómo modifica el BO

  // ── Landing dinámica ────────────────────────────────────
  landing_config:  LandingConfig

  // ── Versionado ──────────────────────────────────────────
  parent_id:    string | null   // UUID de la versión anterior (para fork)
  changelog:    string          // "Actualizé hero banner + nuevo beneficio"
  published_at: Date | null
  published_by: string | null   // user_id del operador
  approved_by:  string | null   // user_id del aprobador (workflow review)

  created_at:   Date
  updated_at:   Date
}`

const CODE_BENEFIT = `// ── SpotlightBenefit: beneficios visibles al usuario ──────
// domain/models/SpotlightBenefit.ts

type BenefitType =
  | 'reward_boost'       // multiplica todos los rewards del depto
  | 'free_shipping'      // envío gratis en compras del spotlight
  | 'early_access'       // acceso anticipado a productos del depto
  | 'exclusive_product'  // producto disponible SOLO durante el spotlight
  | 'double_points'      // duplica puntos en programa de loyalty
  | 'price_lock'         // precio fijo durante N días configurables
  | 'bundle_deal'        // combo especial del departamento
  | 'extended_returns'   // devoluciones extendidas a X días
  | 'custom'             // descripción libre para casos especiales

type BenefitScope =
  | 'department_only'       // solo en el departamento protagonista
  | 'site_wide'             // en todo el sitio durante el spotlight
  | 'specific_categories'   // en category_ids especificadas en scope_ids

interface SpotlightBenefit {
  id:              string
  type:            BenefitType
  label:           string          // texto para el usuario: "3x rewards en Electrónica"
  description:     string          // detalle: "Todos los premios tienen el triple de peso"
  scope:           BenefitScope
  scope_ids:       string[]        // si scope = 'specific_categories'
  conditions:      EligibilityRule[]  // misma estructura que AE
  display_order:   number
  icon:            string | null   // emoji o nombre de icono
  highlight:       boolean         // si va en hero o sección principal

  // Valor semántico del beneficio (depende del type)
  value: {
    multiplier?: number            // para 'reward_boost' o 'double_points'
    days?:       number            // para 'price_lock' o 'extended_returns'
    product_id?: string            // para 'exclusive_product'
    bundle_ids?: string[]          // para 'bundle_deal'
    custom?:     string            // para 'custom'
  }
}`

const CODE_ACTIVATION_OVERRIDE = `// ── ActivationOverride: influye en el Activation Engine ──
// domain/models/ActivationOverride.ts
// Modifica los probability_weight de los rewards en tiempo real.
// El AE los aplica ANTES de la selección probabilística.

interface ActivationOverride {
  id:          string
  name:        string            // descripción interna para el admin

  // Scope: a qué campañas y rewards aplica
  campaign_id: string | '*'      // '*' = aplica a todas las campañas activas
  reward_type: RewardType | '*'  // '*' = aplica a todos los tipos de reward

  // Modificación principal
  weight_multiplier: number      // ej: 3.0 → triple de probabilidad
                                 // 0.5 → mitad de probabilidad
                                 // 1.0 → sin cambio

  // Modificaciones opcionales
  urgency_override:      UrgencyLevel | null  // null = no modifica
  force_category_match:  boolean              // true = reward.category debe ser el departamento

  // Condición para aplicar el override (null = siempre aplica)
  condition: ActivationOverrideCondition | null
}

interface ActivationOverrideCondition {
  // Filtros sobre el perfil del usuario (si BO está integrado)
  segment_filter:    BehaviorSegment[] | null
  min_churn_risk:    number | null      // solo para usuarios en riesgo
  max_exploration:   number | null      // solo para usuarios no exploradores
  
  // Filtros sobre la campaña
  mechanic_filter:   MechanicType[] | null  // solo para ciertos mecánicas

  // Horario (ej: boost más alto en las últimas 24h)
  hours_remaining_lte: number | null    // si quedan <= N horas del spotlight
}

// ── Ejemplo: "3x en todos los rewards de crédito del depto" ──
// {
//   campaign_id:       '*',
//   reward_type:       'credit',
//   weight_multiplier: 3.0,
//   urgency_override:  'high',
//   force_category_match: true,
//   condition: {
//     segment_filter:  ['loyal_focused', 'vip'],
//     min_churn_risk:  null,
//     hours_remaining_lte: 24  // solo en las últimas 24h
//   }
// }`

const CODE_BEHAVIOR_HINT = `// ── BehaviorHint: influye en el Behavior Orchestrator ────
// domain/models/BehaviorHint.ts
// Los hints modifican la ActivationDecision del BO
// DESPUÉS de que el RuleEngine evalúa sus propias reglas.

type BehaviorHintType =
  | 'force_category'       // recomienda el departamento del spotlight
  | 'urgency_bump'         // sube urgency en 1 nivel (low→medium, medium→high)
  | 'reward_bias_override' // fuerza el reward_bias_type
  | 'exploration_boost'    // suma N puntos al exploration_score (soft)
  | 'churn_risk_nudge'     // suma N puntos al churn_risk_score (para activar reglas)
  | 'segment_override'     // trata al usuario como si fuera de otro segmento

type HintStrength =
  | 'soft'     // sugerencia: solo aplica si confidence del BO < 0.7
  | 'strong'   // aplica siempre, pero no sobreescribe decisiones de churn crítico
  | 'override' // siempre aplica, sobreescribe cualquier decisión del BO

interface BehaviorHint {
  id:       string
  type:     BehaviorHintType
  strength: HintStrength
  value:    string | number    // depende del type:
                               // 'force_category'  → category_id
                               // 'urgency_bump'    → 1 (número de niveles)
                               // 'reward_bias'     → RewardType
                               // 'exploration_boost' → N puntos (ej: 20)
                               // 'churn_risk_nudge'  → N puntos (ej: 15)
  condition: { segment: BehaviorSegment[] } | null
  display_priority: number  // menor = se aplica antes
}

// ── Ejemplo de hints para "Semana de Electrónica" ─────────
// [
//   {
//     type:     'force_category',
//     strength: 'strong',
//     value:    'electronics',
//     condition: null   // aplica a todos
//   },
//   {
//     type:     'urgency_bump',
//     strength: 'soft',
//     value:    1,
//     condition: { segment: ['loyal_focused', 'vip'] }
//   },
//   {
//     type:     'reward_bias_override',
//     strength: 'strong',
//     value:    'product',  // en Electrónica, premios de producto convierten más
//     condition: { segment: ['active_explorer', 'new_user'] }
//   }
// ]`

const CODE_LANDING = `// ── LandingConfig: landing dinámica sin deploy ────────────
// domain/models/LandingConfig.ts

type LandingSectionType =
  | 'product_grid'        // grilla de productos del departamento
  | 'benefit_highlights'  // tarjetas de los SpotlightBenefit
  | 'countdown_timer'     // cuenta regresiva al end_at
  | 'hero_banner'         // banner secundario (debajo del hero principal)
  | 'featured_review'     // reseña destacada de un producto del depto
  | 'category_explorer'   // explorador de subcategorías del depto
  | 'activation_cta'      // botón que dispara una activación del AE
  | 'cross_sell'          // cross-sell hacia otra campaña o depto
  | 'video_embed'         // video del departamento (autoplay muted)
  | 'custom_html'         // bloque HTML/JSX custom (para edge cases)

interface LandingSection {
  id:        string
  type:      LandingSectionType
  order:     number          // UI permite reordenar con drag & drop
  visible:   boolean
  title:     string | null   // título del bloque (null = sin título)
  config:    Record<string, unknown>  // schema depende del type
  // Ejemplos de config:
  // product_grid:   { limit: 12, sort_by: 'best_seller', cols: 4 }
  // countdown_timer: { label: '¡Oferta termina en!', end_at: ISO_DATE }
  // activation_cta: { campaign_id: UUID, cta_label: '¡Girá la ruleta!' }
  // cross_sell:     { target_department_id: UUID, label: 'También te puede interesar' }
}

interface LandingTheme {
  primary_color:    string   // "#FF6B35" — color de fondo del hero
  accent_color:     string   // "#FFC857" — botones, highlights
  background_color: string
  text_color:       string
  font_family:      string | null  // null = hereda del sitio
}

interface LandingConfig {
  hero: {
    title:          string
    subtitle:       string
    cta_label:      string
    cta_url:        string
    media_type:     'image' | 'video' | 'gif'
    media_url:      string
    overlay_color:  string   // rgba para oscurecer el hero: "rgba(0,0,0,0.4)"
    text_align:     'left' | 'center' | 'right'
    show_countdown: boolean
  }
  sections:            LandingSection[]
  theme:               LandingTheme
  seo: {
    title:             string
    meta_description:  string
    og_image_url:      string
    canonical_url:     string
  }
  social_sharing:      boolean
  countdown_global:    boolean   // si se muestra cuenta regresiva en el header del sitio
}`

const CODE_VERSIONING = `// ── SpotlightVersioning: versionado y fork ───────────────
// domain/models/SpotlightVersioning.ts

// Cada edición tiene historial completo.
// "Edición futura" = nueva edición con start_at en el futuro.
// "Fork" = clonar una edición pasada como base de la nueva.

interface SpotlightVersionRecord {
  edition_id:   string
  slug:         string
  version:      number
  status:       SpotlightStatus
  department:   string
  start_at:     Date
  end_at:       Date
  parent_id:    string | null
  changelog:    string
  published_at: Date | null
  published_by: string | null
}

// DB Table: spotlight_versions
// Una fila por SpotlightEdition.
// Permite ver TODO el historial de un slug.
// Permite clonar: fork_from_version(slug, version) → nueva edición draft

// Ejemplo de historial para "electronics-week":
// │ version │ status   │ start_at   │ changelog
// │    1    │ archived │ 2025-10-07 │ Primera edición
// │    2    │ archived │ 2025-11-04 │ Nuevo hero + beneficio envío gratis
// │    3    │ ended    │ 2026-01-14 │ Fork de v2 + 4x rewards para VIP
// │    4    │ scheduled│ 2026-04-07 │ Fork de v3 + nueva landing theme`

const MODELS = [
  { id: 'edition',   label: 'SpotlightEdition',    color: '#38BDF8', badge: 'Aggregate', note: 'Entidad principal con estado, calendario y configuración' },
  { id: 'benefit',   label: 'SpotlightBenefit',    color: '#10B981', badge: 'Entity',    note: 'Beneficio visible al usuario con scope y condiciones' },
  { id: 'override',  label: 'ActivationOverride',  color: '#6366F1', badge: 'Value Obj', note: 'Modificador de probabilidades del AE con condición opcional' },
  { id: 'hint',      label: 'BehaviorHint',        color: '#F59E0B', badge: 'Value Obj', note: 'Hint para el BO: category, urgency, reward_bias, segment' },
  { id: 'landing',   label: 'LandingConfig',       color: '#8B5CF6', badge: 'Value Obj', note: 'Config completa de la landing: hero, secciones, tema, SEO' },
  { id: 'version',   label: 'SpotlightVersioning', color: '#EF4444', badge: 'Record',    note: 'Historial de versiones, fork, changelog y aprobadores' },
]

export function DSSModels() {
  const [active, setActive] = useState('edition')

  const renderCode = () => {
    switch (active) {
      case 'edition':  return <CodeBlock code={CODE_SPOTLIGHT_EDITION} title="domain/models/SpotlightEdition.ts"    badge="Aggregate"  badgeColor="#38BDF8" />
      case 'benefit':  return <CodeBlock code={CODE_BENEFIT}           title="domain/models/SpotlightBenefit.ts"    badge="Entity"     badgeColor="#10B981" />
      case 'override': return <CodeBlock code={CODE_ACTIVATION_OVERRIDE} title="domain/models/ActivationOverride.ts" badge="Value Obj" badgeColor="#6366F1" />
      case 'hint':     return <CodeBlock code={CODE_BEHAVIOR_HINT}     title="domain/models/BehaviorHint.ts"        badge="Value Obj"  badgeColor="#F59E0B" />
      case 'landing':  return <CodeBlock code={CODE_LANDING}           title="domain/models/LandingConfig.ts"       badge="Value Obj"  badgeColor="#8B5CF6" />
      case 'version':  return <CodeBlock code={CODE_VERSIONING}        title="domain/models/SpotlightVersioning.ts" badge="Record"     badgeColor="#EF4444" />
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⬡ Domain Models
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Modelos del Department Spotlight System</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          6 modelos. El agregado raíz es <code style={{ fontFamily: 'monospace', fontSize: 12 }}>SpotlightEdition</code>.
          Los modelos de influencia (<code style={{ fontFamily: 'monospace', fontSize: 12 }}>ActivationOverride</code> y <code style={{ fontFamily: 'monospace', fontSize: 12 }}>BehaviorHint</code>) son value objects que se almacenan como JSONB dentro de la edición.
        </p>
      </div>

      {/* Model relationship */}
      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#0D1117', border: '1px solid #21262D', borderRadius: 10 }}>
        <div style={{ fontSize: 9, color: '#484F58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace' }}>SpotlightEdition contiene →</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {[
            { label: 'SpotlightBenefit[]', color: '#10B981' },
            { label: '+', color: '#30363D', plain: true },
            { label: 'ActivationOverride[]', color: '#6366F1' },
            { label: '+', color: '#30363D', plain: true },
            { label: 'BehaviorHint[]', color: '#F59E0B' },
            { label: '+', color: '#30363D', plain: true },
            { label: 'LandingConfig', color: '#8B5CF6' },
            { label: '+', color: '#30363D', plain: true },
            { label: 'VersionRecord', color: '#EF4444' },
          ].map((item, i) =>
            item.plain
              ? <span key={i} style={{ color: '#30363D', fontSize: 14 }}>{item.label}</span>
              : <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', background: item.color + '18', border: `1px solid ${item.color}33`, borderRadius: 5, color: item.color }}>{item.label}</span>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: '#484F58', fontFamily: 'monospace' }}>
          Todos almacenados como JSONB en PostgreSQL → flexibles, versionables, sin migraciones para agregar campos.
        </div>
      </div>

      {/* Model selector */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
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

      <div style={{ marginBottom: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #21262D', fontSize: 11, color: '#484F58' }}>
        ↳ {MODELS.find(m => m.id === active)?.note}
      </div>

      {renderCode()}
    </div>
  )
}
