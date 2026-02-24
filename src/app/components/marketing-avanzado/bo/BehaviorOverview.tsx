const PRINCIPLES = [
  { icon: '⬡', label: 'Solo decisiones', desc: 'Provee recomendaciones al Activation Engine. No ejecuta premios. Nunca modifica el carrito.' },
  { icon: '◈', label: 'DDD estricto', desc: 'Domain → Application → Infrastructure. Cero acoplamiento con el Activation Engine.' },
  { icon: '⚙', label: 'Reglas configurables', desc: 'Ninguna lógica hardcodeada. Todas las decisiones vienen de BehaviorRule cargadas desde DB.' },
  { icon: '⚛', label: 'ML-ready', desc: 'IMLModelPort diseñado como port. Cuando haya modelo, se conecta sin tocar el dominio.' },
  { icon: '⟳', label: 'Perfil dinámico', desc: 'UserBehaviorProfile se recomputa en background cada 30 min. Cache-first para latencia.' },
  { icon: '⊕', label: 'Decision logging', desc: 'Cada decisión se loguea con features completas. Sirve como training data para ML.' },
]

const INTEGRATION = [
  { from: 'E-commerce events', arrow: '→', to: 'Behavior Orchestrator', note: 'UserEvent: compra, visita, abandono', color: '#8B5CF6' },
  { from: 'Behavior Orchestrator', arrow: '→', to: 'Activation Engine', note: 'ActivationDecision: category + reward_bias + urgency', color: '#F59E0B' },
  { from: 'Activation Engine', arrow: '→', to: 'Cart', note: 'Aplica beneficio según decisión del orchestrator', color: '#10B981' },
]

const LAYERS = [
  {
    name: 'Domain',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    items: ['UserBehaviorProfile', 'CategoryAffinity', 'ActivationDecision', 'BehaviorRule', 'UserEvent'],
    rule: 'Cero dependencias externas. Pura lógica de comportamiento.',
  },
  {
    name: 'Application',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    items: ['DecideActivationStrategy', 'RefreshBehaviorProfile', 'IngestUserEvent'],
    rule: 'Orquesta dominio. Expone IMLModelPort para futuro.',
  },
  {
    name: 'Infrastructure',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.2)',
    items: ['UserEventRepository', 'ProfileCache', 'MLModelAdapter', 'ProfileRefreshJob', 'BehaviorController'],
    rule: 'Implementa ports. Adapta a PostgreSQL, Redis y futuros modelos ML.',
  },
]

export function BehaviorOverview() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⚛ Behavior Orchestrator · Architecture Spec v1.0
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1 }}>
          Behavior Orchestrator
        </h1>
        <p style={{ fontSize: 14, color: '#8B949E', lineHeight: 1.75, maxWidth: 580 }}>
          Módulo independiente que analiza comportamiento del usuario y genera una
          <strong style={{ color: '#E6EDF3' }}> estrategia de activación</strong>: qué categoría impulsar,
          qué tipo de reward priorizar y qué nivel de urgencia aplicar.
          Solo provee decisiones — el Activation Engine las ejecuta.
        </p>

        {/* Input / Output pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', fontSize: 11, fontFamily: 'monospace', color: '#C4B5FD' }}>
            INPUT: user_id + campaign_id
          </div>
          <span style={{ color: '#F59E0B', fontSize: 18 }}>→</span>
          <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, fontFamily: 'monospace', color: '#FCD34D' }}>
            OUTPUT: recommended_category + reward_bias_type + urgency_level
          </div>
        </div>
      </div>

      {/* Integration diagram */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Integración con el ecosistema</SectionTitle>
        <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INTEGRATION.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '8px 16px', borderRadius: 8, background: row.color + '15', border: `1px solid ${row.color}33`, minWidth: 160, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color, fontFamily: 'monospace' }}>{row.from}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ color: row.color, fontSize: 16 }}>{row.arrow}</span>
                  <span style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textAlign: 'center', maxWidth: 160 }}>{row.note}</span>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: 8, background: row.color + '15', border: `1px solid ${row.color}33`, minWidth: 160, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color, fontFamily: 'monospace' }}>{row.to}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Decoupling callout */}
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#A5B4FC', fontFamily: 'monospace' }}>
            ◈ Acoplamiento: Behavior Orchestrator NO importa ningún tipo del Activation Engine.
            Solo retorna primitivos (string, number). Comunicación via IActivationEnginePort si necesita datos de campaña.
          </div>
        </div>
      </div>

      {/* Principles */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Principios de diseño</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PRINCIPLES.map(p => (
            <div key={p.label} style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ color: '#F59E0B', fontSize: 13 }}>{p.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3' }}>{p.label}</span>
              </div>
              <p style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DDD Layers */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Capas del módulo (DDD)</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYERS.map((layer, i) => (
            <div key={layer.name} style={{ background: layer.bg, border: `1px solid ${layer.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: layer.color + '20', border: `1px solid ${layer.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: layer.color, fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: layer.color }}>{layer.name}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {layer.items.map(item => (
                    <span key={item} style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 7px', background: '#0D1117', border: '1px solid #30363D', borderRadius: 5, color: '#8B949E' }}>{item}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: layer.color + 'bb', fontStyle: 'italic' }}>↳ {layer.rule}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision output */}
      <div>
        <SectionTitle>¿Qué retorna decideActivationStrategy?</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            {
              field: 'recommended_category',
              type: 'string',
              color: '#10B981',
              desc: 'Categoría a impulsar en la campaña.',
              examples: ['"electronics"', '"unexplored:sports"', '"top:clothing"'],
            },
            {
              field: 'reward_bias_type',
              type: 'RewardType',
              color: '#6366F1',
              desc: 'Tipo de reward que mejor convierte para este perfil.',
              examples: ['"credit"', '"percentage"', '"product"', '"access"'],
            },
            {
              field: 'urgency_level',
              type: 'UrgencyLevel',
              color: '#EF4444',
              desc: 'Intensidad del mensaje de activación.',
              examples: ['"low"', '"medium"', '"high"', '"critical"'],
            },
          ].map(f => (
            <div key={f.field} style={{ background: '#161B22', border: `1px solid ${f.color}33`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: f.color, marginBottom: 3 }}>{f.field}</div>
              <div style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', marginBottom: 8 }}>{f.type}</div>
              <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.5, marginBottom: 8 }}>{f.desc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {f.examples.map(e => (
                  <span key={e} style={{ fontSize: 10, fontFamily: 'monospace', color: '#484F58' }}>{e}</span>
                ))}
              </div>
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
