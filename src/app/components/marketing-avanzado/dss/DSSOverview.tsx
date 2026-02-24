const PRINCIPLES = [
  { icon: '⊟', label: 'Edición versionada', desc: 'Cada spotlight es una SpotlightEdition con versión, changelog, parent_id y estado. Se puede clonar, editar y publicar sin perder historia.' },
  { icon: '⚙', label: 'Configurable, no hardcodeado', desc: 'Beneficios, overrides de probabilidades y hints de comportamiento son datos en DB. Cero cambios de código para nueva edición.' },
  { icon: '⬡', label: 'Influye en AE y BO', desc: 'ISpotlightPort es el contrato único. AE consume ActivationOverride (multiplicadores de peso). BO consume BehaviorHint (hints de categoría y urgencia).' },
  { icon: '◈', label: 'Landing dinámica', desc: 'LandingConfig en DB define hero, secciones, tema y SEO. La UI renderiza sin deploy. Soporte para N secciones en orden configurable.' },
  { icon: '⟳', label: 'Soporte de ediciones futuras', desc: 'Estado "scheduled": publicado antes de start_at. El SpotlightScheduler activa/desactiva automáticamente por cron.' },
  { icon: '⊕', label: 'Aislado de los módulos core', desc: 'AE y BO no dependen del DSS. Consumen ISpotlightPort (retorna null si no hay spotlight activo). El sistema puede desactivarse sin impacto.' },
]

const STATUSES = [
  { s: 'draft',       color: '#484F58', desc: 'En construcción, solo visible en admin' },
  { s: 'review',      color: '#F59E0B', desc: 'Esperando aprobación antes de publicar' },
  { s: 'scheduled',   color: '#3B82F6', desc: 'Publicada, esperando start_at' },
  { s: 'active',      color: '#10B981', desc: 'Spotlight live, influye en AE y BO' },
  { s: 'ending_soon', color: '#EF4444', desc: 'Últimas 24 horas — urgencia máxima' },
  { s: 'ended',       color: '#30363D', desc: 'Finalizó, sin efecto en el sistema' },
  { s: 'archived',    color: '#484F58', desc: 'Guardada para referencia y clonado' },
]

const FLOW_STEPS = [
  { label: 'Admin crea SpotlightEdition', icon: '⊞', color: '#6366F1', sub: 'Panel · versión 1' },
  { label: 'Configura depto, fechas, beneficios', icon: '⚙', color: '#F59E0B', sub: 'LandingConfig + ActivationOverride[] + BehaviorHint[]' },
  { label: 'Publica → estado "scheduled"', icon: '→', color: '#3B82F6', sub: 'SpotlightScheduler la activará en start_at' },
  { label: 'SpotlightScheduler activa', icon: '⟳', color: '#10B981', sub: 'Cron cada minuto → status = active' },
  { label: 'AE consulta ISpotlightPort', icon: '⬡', color: '#EF4444', sub: 'Multiplica pesos de rewards del departamento' },
  { label: 'BO consulta ISpotlightPort', icon: '◈', color: '#8B5CF6', sub: 'Inyecta category hint + urgency bump en decisión' },
  { label: 'Landing dinámica se renderiza', icon: '⊟', color: '#F59E0B', sub: 'LandingBuilder lee config de DB → UI sin deploy' },
  { label: 'Cron desactiva en end_at', icon: '⊕', color: '#484F58', sub: 'status = ended · AE y BO vuelven a modo normal' },
]

export function DSSOverview() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊟ Department Spotlight System · v1.0
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1 }}>
          Department Spotlight System
        </h1>
        <p style={{ fontSize: 14, color: '#8B949E', lineHeight: 1.75, maxWidth: 600 }}>
          Módulo que convierte un departamento en el <strong style={{ color: '#E6EDF3' }}>protagonista semanal</strong> del sitio.
          Define qué categoría se impulsa, amplifica sus rewards en el Activation Engine,
          inyecta hints en el Behavior Orchestrator y construye una landing dinámica —
          todo configurable desde panel, sin deploy.
        </p>

        {/* Key badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Versionado',             color: '#6366F1' },
            { label: 'Configurable sin deploy', color: '#10B981' },
            { label: 'Influye en AE',          color: '#38BDF8' },
            { label: 'Influye en BO',          color: '#F59E0B' },
            { label: 'Landing dinámica',       color: '#8B5CF6' },
            { label: 'Scheduleable',           color: '#EF4444' },
          ].map(b => (
            <span key={b.label} style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
              padding: '3px 10px', borderRadius: 20,
              background: b.color + '18', border: `1px solid ${b.color}44`, color: b.color,
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Integration diagram */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Diagrama de integración</SectionTitle>
        <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            {/* Admin panel */}
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace', marginBottom: 3 }}>Admin Panel</div>
              <div style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 700 }}>SpotlightEdition</div>
              <div style={{ fontSize: 9, color: '#484F58', marginTop: 3 }}>versioned · configurable</div>
            </div>
            <div style={{ textAlign: 'center', color: '#30363D', fontSize: 20 }}>↓</div>
            {/* SpotlightScheduler */}
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace', marginBottom: 3 }}>Infrastructure</div>
              <div style={{ fontSize: 12, color: '#6EE7B7', fontWeight: 700 }}>SpotlightScheduler</div>
              <div style={{ fontSize: 9, color: '#484F58', marginTop: 3 }}>cron · auto activate/end</div>
            </div>
            <div style={{ textAlign: 'center', color: '#30363D', fontSize: 20 }}>↓</div>
            {/* ISpotlightPort */}
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace', marginBottom: 3 }}>Port (contrato)</div>
              <div style={{ fontSize: 12, color: '#FCD34D', fontWeight: 700 }}>ISpotlightPort</div>
              <div style={{ fontSize: 9, color: '#484F58', marginTop: 3 }}>getActive() → null | SpotlightEdition</div>
            </div>
          </div>

          {/* Consumers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Activation Engine', sublabel: 'ProbabilisticResolver', detail: 'ActivationOverride[] → weight_multiplier × reward.probability_weight', color: '#38BDF8' },
              { label: 'Behavior Orchestrator', sublabel: 'DecideActivationStrategy', detail: 'BehaviorHint[] → force_category, urgency_bump, reward_bias', color: '#F59E0B' },
              { label: 'Landing Builder', sublabel: 'LandingBuilder.build()', detail: 'LandingConfig → hero + sections + theme sin deploy', color: '#8B5CF6' },
            ].map(c => (
              <div key={c.label} style={{ background: '#161B22', border: `1px solid ${c.color}33`, borderRadius: 9, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', marginBottom: 6 }}>{c.sublabel}</div>
                <div style={{ fontSize: 10, color: '#8B949E', lineHeight: 1.4 }}>{c.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 10, color: '#A5B4FC', fontFamily: 'monospace' }}>
            ◈ AE y BO no importan nada del DSS. Solo consumen ISpotlightPort. Si getActive() retorna null → comportamiento normal sin spotlight.
          </div>
        </div>
      </div>

      {/* Flow steps */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Ciclo de vida de un spotlight</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {FLOW_STEPS.map((step, i) => (
            <div key={i} style={{ background: '#161B22', border: `1px solid ${step.color}22`, borderRadius: 10, padding: '10px 12px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: step.color + '22', border: `1px solid ${step.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: step.color, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 10, color: step.color }}>{step.icon}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#E6EDF3', marginBottom: 4, lineHeight: 1.3 }}>{step.label}</div>
              <div style={{ fontSize: 9, color: '#484F58', lineHeight: 1.4 }}>{step.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status lifecycle */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Estados de SpotlightEdition</SectionTitle>
        <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map((s, i) => (
              <div key={s.s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '5px 12px', borderRadius: 7, background: s.color + '22', border: `1px solid ${s.color}55`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: s.color }}>{s.s}</div>
                  <div style={{ fontSize: 9, color: '#484F58', marginTop: 2, maxWidth: 100 }}>{s.desc}</div>
                </div>
                {i < STATUSES.length - 1 && <span style={{ color: '#30363D', fontSize: 12 }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Principles */}
      <div>
        <SectionTitle>Principios de diseño</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PRINCIPLES.map(p => (
            <div key={p.label} style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ color: '#38BDF8', fontSize: 13 }}>{p.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3' }}>{p.label}</span>
              </div>
              <p style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 16, height: 1, background: '#30363D' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: '#30363D' }} />
    </div>
  )
}
