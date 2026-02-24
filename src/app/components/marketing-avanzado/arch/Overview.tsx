const LAYERS = [
  {
    name: 'Domain',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    desc: 'Entidades, Value Objects, Repos interfaces, Domain Events',
    items: ['Campaign', 'Reward', 'Activation', 'BenefitToken', 'Money', 'EligibilityRule'],
    rule: 'Cero dependencias externas. Solo lógica de negocio pura.',
  },
  {
    name: 'Application',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    desc: 'Use Cases, DTOs, Ports (interfaces hacia infra)',
    items: ['RequestActivation', 'ApplyBenefit', 'ExpireBenefit', 'ICartPort', 'ICachePort', 'IEventBusPort'],
    rule: 'Orquesta el dominio. Depende solo de Domain.',
  },
  {
    name: 'Infrastructure',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    desc: 'Repos concretos, HTTP, Redis, Jobs, Cart Adapter',
    items: ['ActivationController', 'PostgresRepos', 'RedisCache', 'CartAdapter', 'ExpirationJob'],
    rule: 'Implementa los Ports del dominio. Conoce frameworks.',
  },
]

const PRINCIPLES = [
  { icon: '◈', label: 'DDD', desc: 'Dominio como núcleo. Infra como detalle.' },
  { icon: '⬡', label: 'Hexagonal', desc: 'Ports & Adapters para desacoplamiento total.' },
  { icon: '⚛', label: 'Idempotente', desc: '1 activación por usuario/campaña, siempre.' },
  { icon: '⊕', label: 'Crypto-random', desc: 'Sin Math.random(). Solo crypto.randomInt.' },
  { icon: '⟳', label: 'Event-driven', desc: 'Eventos de dominio para desacoplamiento.' },
  { icon: '⟢', label: 'Mechanic-agnostic', desc: 'Ruleta, scratch, cupón: misma arquitectura.' },
]

export function Overview() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6366F1', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ◈ Architecture Spec · v1.0
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1 }}>
          Activation Engine
        </h1>
        <p style={{ fontSize: 14, color: '#8B949E', lineHeight: 1.7, maxWidth: 580 }}>
          Módulo desacoplado de activación de beneficios para e-commerce. Resuelve premios
          con probabilidad segura en backend, aplica automáticamente al carrito y provee
          control financiero, antifraude y auditoría completa. Agnóstico a la mecánica UI.
        </p>
      </div>

      {/* Principles */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle>Principios de diseño</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PRINCIPLES.map(p => (
            <div key={p.label} style={{
              background: '#161B22', border: '1px solid #30363D',
              borderRadius: 10, padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ color: '#6366F1', fontSize: 14 }}>{p.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3' }}>{p.label}</span>
              </div>
              <p style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DDD Layers */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle>Capas de arquitectura (DDD)</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYERS.map((layer, i) => (
            <div key={layer.name} style={{
              background: layer.bg, border: `1px solid ${layer.border}`,
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 16, alignItems: 'flex-start'
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: layer.color + '22', border: `1px solid ${layer.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: layer.color, fontWeight: 800
                }}>
                  {i + 1}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: layer.color }}>{layer.name}</span>
                  <span style={{ fontSize: 11, color: '#8B949E' }}>{layer.desc}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {layer.items.map(item => (
                    <span key={item} style={{
                      fontSize: 10, fontFamily: 'monospace', padding: '2px 7px',
                      background: '#0D1117', border: '1px solid #30363D',
                      borderRadius: 5, color: '#8B949E'
                    }}>{item}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: layer.color + 'bb', fontStyle: 'italic' }}>
                  ↳ {layer.rule}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8, fontSize: 11, color: '#A5B4FC', fontFamily: 'monospace'
        }}>
          Regla de dependencias: Domain ← Application ← Infrastructure. Nunca al revés.
        </div>
      </div>

      {/* Flow summary */}
      <div>
        <SectionTitle>Flujo de activación (resumen)</SectionTitle>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { step: 'Rate limit', color: '#EF4444' },
            { step: 'Idempotency', color: '#F59E0B' },
            { step: 'Eligibility', color: '#10B981' },
            { step: 'Lock', color: '#6366F1' },
            { step: 'Resolve', color: '#3B82F6' },
            { step: 'Reserve', color: '#10B981' },
            { step: 'Persist', color: '#8B5CF6' },
            { step: 'Sign', color: '#F59E0B' },
            { step: 'Emit', color: '#3B82F6' },
          ].map((s, i, arr) => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                background: '#161B22', border: `1px solid ${s.color}44`,
                borderRadius: 8, padding: '6px 12px',
                fontSize: 11, color: s.color, fontWeight: 600, fontFamily: 'monospace'
              }}>
                {s.step}
              </div>
              {i < arr.length - 1 && (
                <span style={{ color: '#484F58', fontSize: 12, margin: '0 2px' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8
    }}>
      <div style={{ width: 16, height: 1, background: '#30363D' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: '#30363D' }} />
    </div>
  )
}
