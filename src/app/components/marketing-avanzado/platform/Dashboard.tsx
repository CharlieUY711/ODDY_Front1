import { useState } from 'react'

const METRICS = [
  { label: 'Spotlights activos',  value: '2',      sub: 'Electrónica + Deporte', color: '#38BDF8', icon: '⊟' },
  { label: 'Campañas AE',         value: '7',      sub: '3 activas · 4 draft',   color: '#6366F1', icon: '◈' },
  { label: 'Perfiles BO',         value: '12.4K',  sub: 'Actualizados hoy',       color: '#F59E0B', icon: '⚛' },
  { label: 'Conversiones semana', value: '3.8%',   sub: '+0.4% vs semana pasada', color: '#10B981', icon: '⟳' },
]

const ACTIVITY = [
  { when: 'hace 2 min',   text: 'Spotlight "Electrónica Week" activado',          module: 'DSS', color: '#38BDF8' },
  { when: 'hace 18 min',  text: 'Regla BO "churn_critical" modificada',           module: 'BO',  color: '#F59E0B' },
  { when: 'hace 1 h',     text: 'Campaña "Ruleta Flash" lanzada en AE',           module: 'AE',  color: '#6366F1' },
  { when: 'hace 3 h',     text: 'Fork de Spotlight "Sports Week v2" creado',      module: 'DSS', color: '#38BDF8' },
  { when: 'hace 6 h',     text: 'Score de abandono recalibrado (+12pts umbral)',  module: 'BO',  color: '#F59E0B' },
  { when: 'ayer',         text: 'Budget campaña "Scratch Card Enero" agotado',    module: 'AE',  color: '#6366F1' },
]

const QUICK_LINKS = [
  { label: 'Activation Engine',        sublabel: '7 campañas · simulador de pesos',     color: '#6366F1', id: 'ae',  target: 'overview' },
  { label: 'Behavior Orchestrator',    sublabel: '12.4K perfiles · 5 reglas activas',   color: '#F59E0B', id: 'bo',  target: 'bo-overview' },
  { label: 'Dept Spotlight System',    sublabel: '2 spotlights live · 1 programado',    color: '#38BDF8', id: 'dss', target: 'dss-overview' },
]

export function Dashboard({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [, setHovered] = useState<string | null>(null)

  return (
    <div style={{ padding: '32px 40px 64px', maxWidth: 900, width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#484F58', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 10 }}>
          Charlie Marketplace Builder · v1.5 · Platform Dashboard
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.15 }}>
          Bienvenido de vuelta,{' '}
          <span style={{ color: '#7C3AED' }}>Charlie</span>
        </h1>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Tu plataforma de marketplace multidepartamental · Todos los motores de marketing activos
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {METRICS.map(m => (
          <div key={m.label} style={{ background: '#161B22', border: `1px solid ${m.color}22`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: m.color }}>{m.icon}</span>
              <span style={{ fontSize: 9, color: '#484F58', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color, fontFamily: 'monospace', lineHeight: 1, marginBottom: 4 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: '#484F58' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links to Marketing modules */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Módulos de Marketing</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {QUICK_LINKS.map(q => (
            <button
              key={q.id}
              onMouseEnter={() => setHovered(q.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNavigate(q.target)}
              style={{
                background: q.color + '0e', border: `1px solid ${q.color}30`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = q.color + '18'
                e.currentTarget.style.borderColor = q.color + '55'
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = q.color + '0e'
                e.currentTarget.style.borderColor = q.color + '30'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: q.color, marginBottom: 4 }}>{q.label}</div>
              <div style={{ fontSize: 10, color: '#8B949E', lineHeight: 1.4 }}>{q.sublabel}</div>
              <div style={{ fontSize: 10, color: q.color, marginTop: 8, opacity: 0.7 }}>Abrir módulo →</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Activity */}
        <div>
          <SectionLabel>Actividad reciente</SectionLabel>
          <div style={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 12, overflow: 'hidden' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', borderBottom: i < ACTIVITY.length - 1 ? '1px solid #0D1117' : 'none', alignItems: 'flex-start' }}>
                <div style={{ marginTop: 1, padding: '1px 6px', borderRadius: 4, background: a.color + '18', border: `1px solid ${a.color}33`, fontSize: 8, fontFamily: 'monospace', color: a.color, flexShrink: 0 }}>
                  {a.module}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#C9D1D9', lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 9, color: '#484F58', marginTop: 2 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div>
          <SectionLabel>Estado del sistema</SectionLabel>
          <div style={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Activation Engine',     status: 'Operativo',  color: '#10B981', uptime: '99.98%' },
              { label: 'Behavior Orchestrator', status: 'Operativo',  color: '#10B981', uptime: '99.95%' },
              { label: 'Spotlight System',      status: 'Operativo',  color: '#10B981', uptime: '100%' },
              { label: 'Decision Logger',       status: 'Operativo',  color: '#10B981', uptime: '99.99%' },
              { label: 'Profile Cache (Redis)', status: 'Degradado',  color: '#F59E0B', uptime: '97.2%' },
              { label: 'ML Model Port',         status: 'Stub activo',color: '#484F58', uptime: 'n/a' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#8B949E', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: s.color, fontFamily: 'monospace' }}>{s.status}</span>
                <span style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', minWidth: 40, textAlign: 'right' }}>{s.uptime}</span>
              </div>
            ))}
          </div>

          {/* Version info */}
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#0D1117', border: '1px solid #21262D', borderRadius: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Platform', value: 'v1.5.0' },
                { label: 'AE Core', value: 'v2.3.1' },
                { label: 'BO Core', value: 'v1.2.0' },
                { label: 'DSS Core', value: 'v1.0.4' },
              ].map(v => (
                <div key={v.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace' }}>{v.label}</span>
                  <span style={{ fontSize: 9, color: '#8B949E', fontFamily: 'monospace' }}>{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#484F58', marginBottom: 8, fontFamily: 'monospace' }}>
      {children}
    </div>
  )
}
