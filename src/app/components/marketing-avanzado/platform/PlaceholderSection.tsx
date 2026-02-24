interface PlaceholderSectionProps {
  id:       string
  label:    string
  icon:     string
  color:    string
  desc:     string
}

const STUB_DATA: Record<string, { items: string[]; stat: string; statLabel: string }> = {
  catalog:    { items: ['Agregar productos al catálogo', 'Gestionar categorías', 'Configurar variantes', 'Importar inventario', 'Reglas de precios'], stat: '1.248', statLabel: 'productos activos' },
  orders:     { items: ['Ver órdenes pendientes', 'Gestionar fulfillment', 'Configurar devoluciones', 'Notas de crédito', 'Integraciones de envío'], stat: '34', statLabel: 'órdenes hoy' },
  customers:  { items: ['Segmentación de usuarios', 'Historial de compras', 'Métricas de retención', 'Exportar lista', 'Fusionar duplicados'], stat: '4.7K', statLabel: 'clientes activos' },
  analytics:  { items: ['Dashboard de ventas', 'Funnel de conversión', 'Retención por cohorte', 'Revenue attribution', 'Exportar reportes'], stat: '$284K', statLabel: 'MRR estimado' },
  settings:   { items: ['Configuración de tienda', 'Dominio personalizado', 'Integraciones', 'Roles y permisos', 'API keys'], stat: '3', statLabel: 'integraciones activas' },
  deploy:     { items: ['Publicar cambios', 'Preview environment', 'Historial de deploys', 'Rollback', 'Monitoreo post-deploy'], stat: '99.9%', statLabel: 'uptime últimos 30 días' },
}

export function PlaceholderSection({ id, label, icon, color, desc }: PlaceholderSectionProps) {
  const data = STUB_DATA[id] ?? { items: [], stat: '—', statLabel: 'sin datos' }

  return (
    <div style={{ padding: '32px 40px 64px', maxWidth: 780 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Charlie Marketplace Builder · v1.5
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.01em' }}>{label}</h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>{desc}</p>
      </div>

      {/* Stat */}
      <div style={{ marginBottom: 20, padding: '16px 20px', background: color + '0e', border: `1px solid ${color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color, lineHeight: 1 }}>{data.stat}</div>
        <div style={{ fontSize: 12, color: '#8B949E' }}>{data.statLabel}</div>
      </div>

      {/* Feature list */}
      <div style={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #21262D' }}>
          <span style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Funcionalidades disponibles</span>
        </div>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < data.items.length - 1 ? '1px solid #0D1117' : 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: color + '66', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#8B949E' }}>{item}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#30363D' }}>→</span>
          </div>
        ))}
      </div>

      {/* Coming soon note */}
      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid #21262D', fontSize: 10, color: '#30363D', fontFamily: 'monospace' }}>
        Sección en construcción · Charlie Marketplace Builder v1.5
      </div>
    </div>
  )
}
