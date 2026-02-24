import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const SECTION_TYPES = [
  { type: 'product_grid',       icon: '⊞', color: '#6366F1', desc: 'Grilla de productos del departamento', config: 'limit, sort_by, cols' },
  { type: 'benefit_highlights', icon: '⬡', color: '#10B981', desc: 'Tarjetas de SpotlightBenefit[]', config: 'layout: grid|cards|banner' },
  { type: 'countdown_timer',    icon: '⟳', color: '#EF4444', desc: 'Cuenta regresiva al end_at del spotlight', config: 'label, style: compact|large' },
  { type: 'activation_cta',     icon: '◈', color: '#F59E0B', desc: 'Botón que dispara activación del AE', config: 'campaign_id, cta_label, style' },
  { type: 'category_explorer',  icon: '⊟', color: '#3B82F6', desc: 'Subcategorías del departamento', config: 'depth: 1|2, layout, max_items' },
  { type: 'video_embed',        icon: '▶', color: '#8B5CF6', desc: 'Video del depto (autoplay muted)', config: 'url, aspect_ratio, autoplay' },
  { type: 'cross_sell',         icon: '→', color: '#EC4899', desc: 'Cross-sell hacia otro depto', config: 'target_dept_id, label, layout' },
  { type: 'custom_html',        icon: '{ }', color: '#484F58', desc: 'Bloque custom para edge cases', config: 'html: string, class_names' },
]

const CODE_LANDING_BUILDER = `// ── LandingBuilder: construye la landing sin deploy ───────
// application/use-cases/LandingBuilder.ts

class LandingBuilder {

  async build(slug: string): Promise<LandingData> {
    // ── 1. Obtener la edición activa para el slug ─────────
    const edition = await this.repo.findActiveBySlug(slug)
    if (!edition) throw new NotFoundError(\`No hay spotlight activo para: \${slug}\`)

    const config = edition.landing_config

    // ── 2. Resolver secciones (ordenadas, solo visibles) ──
    const sections = config.sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order)
      .map(s => this.resolveSection(s, edition))

    // ── 3. Construir la respuesta completa ────────────────
    return {
      edition_id:   edition.id,
      slug:         edition.slug,
      title:        edition.title,
      tagline:      edition.tagline,
      department_id: edition.department_id,
      status:       edition.status,
      start_at:     edition.start_at,
      end_at:       edition.end_at,

      hero: {
        ...config.hero,
        // Si countdown habilitado, calcular tiempo restante
        countdown_seconds: config.hero.show_countdown
          ? differenceInSeconds(edition.end_at, new Date())
          : null,
      },

      sections: await Promise.all(sections),
      benefits: edition.benefits.filter(b => b.highlight),
      theme:    config.theme,
      seo:      config.seo,
    }
  }

  private async resolveSection(
    section: LandingSection,
    edition: SpotlightEdition
  ): Promise<ResolvedSection> {
    switch (section.type) {
      case 'product_grid':
        return {
          ...section,
          data: await this.catalogPort.getProducts({
            category_id: edition.department_id,
            limit:        section.config.limit ?? 12,
            sort_by:      section.config.sort_by ?? 'best_seller',
          })
        }
      case 'benefit_highlights':
        return {
          ...section,
          data: edition.benefits.sort((a, b) => a.display_order - b.display_order)
        }
      case 'countdown_timer':
        return {
          ...section,
          data: { seconds_remaining: differenceInSeconds(edition.end_at, new Date()) }
        }
      case 'activation_cta':
        return {
          ...section,
          data: {
            campaign_id: section.config.campaign_id,
            cta_label:   section.config.cta_label,
          }
        }
      default:
        return { ...section, data: section.config }
    }
  }
}`

const CODE_ADMIN_PANEL = `// ── AdminSpotlightService: operaciones del panel ─────────
// application/use-cases/AdminSpotlightService.ts

class AdminSpotlightService {

  // ── Crear nueva edición (draft) ───────────────────────
  async createEdition(input: CreateEditionInput): Promise<SpotlightEdition> {
    const edition: SpotlightEdition = {
      id:          uuidv7(),
      version:     1,
      slug:        this.generateSlug(input.department_id, input.start_at),
      status:      'draft',
      parent_id:   null,
      changelog:   'Edición inicial',
      published_at: null,
      published_by: null,
      approved_by:  null,
      ...input,
      created_at:  new Date(),
      updated_at:  new Date(),
    }
    await this.repo.save(edition)
    return edition
  }

  // ── Fork: clonar una edición existente ────────────────
  // Permite editar una semana futura basándose en una pasada.
  async forkEdition(sourceId: string, newDates: { start_at: Date; end_at: Date }): Promise<SpotlightEdition> {
    const source = await this.repo.findById(sourceId)
    const latestVersion = await this.repo.getLatestVersion(source.slug)

    const forked: SpotlightEdition = {
      ...source,
      id:          uuidv7(),
      version:     latestVersion + 1,
      status:      'draft',
      start_at:    newDates.start_at,
      end_at:      newDates.end_at,
      parent_id:   source.id,
      changelog:   \`Fork de v\${source.version}. Ajustar beneficios y landing antes de publicar.\`,
      published_at: null,
      published_by: null,
      approved_by:  null,
      created_at:  new Date(),
      updated_at:  new Date(),
    }
    await this.repo.save(forked)
    return forked
  }

  // ── Publicar (→ scheduled o activo) ──────────────────
  async publish(id: string, publishedBy: string): Promise<SpotlightEdition> {
    const edition = await this.repo.findById(id)

    this.validateBeforePublish(edition)  // lanza error si faltan campos requeridos

    const newStatus = edition.start_at <= new Date() ? 'active' : 'scheduled'
    const updated = {
      ...edition,
      status:       newStatus,
      published_at: new Date(),
      published_by: publishedBy,
      updated_at:   new Date(),
    }
    await this.repo.save(updated)
    await this.cache.del('spotlight:active')  // invalidar cache
    await this.eventBus.publish(new SpotlightPublishedEvent({ edition: updated }))
    return updated
  }

  // ── Aprobar (workflow review) ─────────────────────────
  async approve(id: string, approvedBy: string): Promise<SpotlightEdition> {
    const edition = await this.repo.findById(id)
    if (edition.status !== 'review') throw new Error('Solo se pueden aprobar ediciones en status review')
    return this.publish(id, approvedBy)
  }

  // ── Preview (sin publicar) ────────────────────────────
  async previewLanding(id: string): Promise<LandingData> {
    const edition = await this.repo.findById(id)
    // Construye la landing con la edición en cualquier estado (para preview)
    return this.landingBuilder.buildFromEdition(edition)
  }

  // ── Historial de versiones ────────────────────────────
  async getVersionHistory(slug: string): Promise<SpotlightVersionRecord[]> {
    return this.repo.findAllVersionsBySlug(slug)
  }

  private validateBeforePublish(edition: SpotlightEdition): void {
    if (!edition.landing_config.hero.media_url) throw new ValidationError('hero.media_url requerido')
    if (!edition.landing_config.hero.title)     throw new ValidationError('hero.title requerido')
    if (edition.benefits.length === 0)           throw new ValidationError('Al menos 1 benefit requerido')
    if (edition.end_at <= edition.start_at)      throw new ValidationError('end_at debe ser posterior a start_at')
  }
}`

const CODE_DB_SCHEMA = `-- ── DB Schema del DSS ────────────────────────────────────

CREATE TABLE spotlight_editions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version              INTEGER     NOT NULL CHECK (version > 0),
  slug                 VARCHAR(100) NOT NULL,
  department_id        UUID        NOT NULL,
  department_name      VARCHAR(100) NOT NULL,
  title                VARCHAR(200) NOT NULL,
  tagline              VARCHAR(300),
  status               VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','scheduled','active','ending_soon','ended','archived')),
  start_at             TIMESTAMPTZ NOT NULL,
  end_at               TIMESTAMPTZ NOT NULL,

  -- Value objects como JSONB (sin migraciones para agregar campos)
  benefits             JSONB       NOT NULL DEFAULT '[]',
  activation_overrides JSONB       NOT NULL DEFAULT '[]',
  behavior_hints       JSONB       NOT NULL DEFAULT '[]',
  landing_config       JSONB       NOT NULL DEFAULT '{}',

  -- Versionado
  parent_id            UUID        REFERENCES spotlight_editions(id),
  changelog            TEXT        NOT NULL DEFAULT '',
  published_at         TIMESTAMPTZ,
  published_by         UUID,
  approved_by          UUID,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dss_dates    CHECK (end_at > start_at),
  CONSTRAINT uq_dss_slug_ver  UNIQUE (slug, version)
);

-- Búsqueda eficiente del spotlight activo (la query más frecuente)
CREATE INDEX idx_spotlight_active ON spotlight_editions (status)
  WHERE status IN ('active', 'ending_soon');

CREATE INDEX idx_spotlight_slug    ON spotlight_editions (slug, version DESC);
CREATE INDEX idx_spotlight_dept    ON spotlight_editions (department_id);
CREATE INDEX idx_spotlight_schedule ON spotlight_editions (start_at, end_at)
  WHERE status = 'scheduled';

-- GIN para búsqueda dentro de los JSONB
CREATE INDEX idx_spotlight_benefits_gin  ON spotlight_editions USING gin (benefits);
CREATE INDEX idx_spotlight_overrides_gin ON spotlight_editions USING gin (activation_overrides);

-- Vista para el admin panel
CREATE VIEW spotlight_admin_summary AS
SELECT
  slug,
  MAX(version)               AS latest_version,
  COUNT(*)                   AS total_editions,
  MAX(CASE WHEN status IN ('active','ending_soon') THEN 1 END) = 1
                             AS has_active,
  MAX(CASE WHEN status = 'scheduled' THEN 1 END) = 1
                             AS has_scheduled,
  MAX(end_at)                AS last_end_at
FROM spotlight_editions
GROUP BY slug;`

const TABS = [
  { id: 'sections', label: 'Secciones de Landing' },
  { id: 'builder',  label: 'LandingBuilder' },
  { id: 'admin',    label: 'Admin Service' },
  { id: 'schema',   label: 'DB Schema' },
]

// Mini admin panel demo
function AdminDemo() {
  const [editions] = useState([
    { slug: 'electronics-week-2026-w07', version: 3, status: 'active',    dept: 'Electrónica', start: '03 Feb', end: '09 Feb' },
    { slug: 'sports-week-2026-w08',      version: 1, status: 'scheduled', dept: 'Deporte',     start: '10 Feb', end: '16 Feb' },
    { slug: 'fashion-week-2026-w09',     version: 1, status: 'draft',     dept: 'Moda',        start: '17 Feb', end: '23 Feb' },
    { slug: 'electronics-week-2025-w42', version: 2, status: 'archived',  dept: 'Electrónica', start: '15 Oct', end: '21 Oct' },
  ])

  const statusColor: Record<string, string> = {
    active: '#10B981', scheduled: '#3B82F6', draft: '#484F58',
    archived: '#30363D', ended: '#30363D', ending_soon: '#EF4444',
  }

  return (
    <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3' }}>Panel de Spotlight — Ediciones</span>
        <button style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: '#7DD3FC', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
          + Nueva edición
        </button>
      </div>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 90px 80px 80px 80px', padding: '6px 14px', borderBottom: '1px solid #21262D' }}>
        {['Slug / Departamento', 'Versión', 'Estado', 'Inicio', 'Fin', 'Acciones'].map(h => (
          <span key={h} style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
        ))}
      </div>
      {editions.map(e => (
        <div key={e.slug + e.version} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 90px 80px 80px 80px', padding: '8px 14px', borderBottom: '1px solid #161B22', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#E6EDF3', fontFamily: 'monospace' }}>{e.slug}</div>
            <div style={{ fontSize: 10, color: '#484F58', marginTop: 1 }}>{e.dept}</div>
          </div>
          <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>v{e.version}</span>
          <span style={{
            fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
            padding: '2px 7px', borderRadius: 12, display: 'inline-flex',
            background: statusColor[e.status] + '22',
            border: `1px solid ${statusColor[e.status]}55`,
            color: statusColor[e.status],
          }}>{e.status}</span>
          <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>{e.start}</span>
          <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>{e.end}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {e.status === 'draft' && (
              <button style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7', cursor: 'pointer' }}>Publicar</button>
            )}
            <button style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7DD3FC', cursor: 'pointer' }}>Fork</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DSSLandingAdmin() {
  const [tab, setTab] = useState('sections')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊟ Landing & Admin
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Landing dinámica + Panel de admin</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          <code style={{ fontFamily: 'monospace', fontSize: 12 }}>LandingBuilder</code> construye la página desde
          <code style={{ fontFamily: 'monospace', fontSize: 12 }}> LandingConfig</code> en DB.
          El admin panel maneja el ciclo completo: draft → review → scheduled → active → ended → archived.
        </p>
      </div>

      {/* Admin panel demo */}
      <div style={{ marginBottom: 20 }}>
        <Divider>Panel de administración (wireframe funcional)</Divider>
        <AdminDemo />
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', fontSize: 10, color: '#7DD3FC', fontFamily: 'monospace' }}>
          ◈ Fork: clona una edición pasada como base de la nueva. Mantiene parent_id para trazabilidad.
          Preview: renderiza la landing sin publicar. Publish: valida campos requeridos antes de programar.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #21262D', marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 14px', fontSize: 12, cursor: 'pointer',
            background: 'none', border: 'none',
            color: tab === t.id ? '#E6EDF3' : '#8B949E',
            fontWeight: tab === t.id ? 600 : 400,
            borderBottom: tab === t.id ? '2px solid #38BDF8' : '2px solid transparent',
            transition: 'all 0.15s', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'sections' && (
        <div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 12 }}>
            8 tipos de sección. Cada una tiene su propio schema de
            <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}> config</code>.
            El admin puede reordenar con drag & drop (campo <code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>order</code>)
            y mostrar/ocultar (<code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>visible</code>).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {SECTION_TYPES.map(s => (
              <div key={s.type} style={{ background: '#161B22', border: `1px solid ${s.color}22`, borderRadius: 9, padding: '10px 13px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: s.color + '22', border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: s.color, fontWeight: 700, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: s.color, marginBottom: 2 }}>{s.type}</div>
                  <div style={{ fontSize: 11, color: '#C9D1D9', lineHeight: 1.4, marginBottom: 4 }}>{s.desc}</div>
                  <div style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace' }}>config: {'{' + s.config + '}'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'builder'  && <CodeBlock code={CODE_LANDING_BUILDER} title="application/use-cases/LandingBuilder.ts"        badge="Use Case" badgeColor="#8B5CF6" />}
      {tab === 'admin'    && <CodeBlock code={CODE_ADMIN_PANEL}      title="application/use-cases/AdminSpotlightService.ts"  badge="Use Case" badgeColor="#38BDF8" />}
      {tab === 'schema'   && <CodeBlock code={CODE_DB_SCHEMA}        title="PostgreSQL Schema del DSS"                       badge="SQL"      badgeColor="#3B82F6" />}
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
