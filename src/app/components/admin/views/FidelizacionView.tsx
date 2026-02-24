import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, Gift, DollarSign, TrendingUp, Star, Edit2, Save } from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';

const LEVEL_DISTRIBUTION = [
  { nivel: 'Bronce', count: 320 },
  { nivel: 'Plata',  count: 210 },
  { nivel: 'Oro',    count: 140 },
  { nivel: 'Platino', count: 80  },
];

const TIERS = [
  {
    name: 'Bronce',
    from: 0,
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    features: ['5% descuento', 'Puntos x1'],
  },
  {
    name: 'Plata',
    from: 500,
    gradient: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
    features: ['10% descuento', 'Puntos x1.5', 'Email gratis'],
  },
  {
    name: 'Oro',
    from: 2000,
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    features: ['15% descuento', 'Puntos x2', 'Acceso anticipado'],
  },
  {
    name: 'Platino',
    from: 5000,
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    features: ['20% descuento', 'Puntos x3', 'Soporte VIP'],
  },
];

interface PointsConfig {
  pointsPerDollar: number;
  dollarPerPoints: number;
}

export function FidelizacionView({ onNavigate }: Props) {
  const [pointsConfig, setPointsConfig] = useState<PointsConfig>({ pointsPerDollar: 10, dollarPerPoints: 100 });
  const [editingConfig, setEditingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rewards'>('overview');

  const MOCK_MEMBERS = [
    { id: '1', name: 'Ana García',    email: 'ana@ejemplo.com',    tier: 'Platino', points: 8420, spent: 1240.50 },
    { id: '2', name: 'Carlos Martín', email: 'carlos@ejemplo.com', tier: 'Oro',     points: 3210, spent: 620.00 },
    { id: '3', name: 'Lucía Pérez',   email: 'lucia@ejemplo.com',  tier: 'Plata',   points: 1580, spent: 310.20 },
    { id: '4', name: 'Mario Silva',   email: 'mario@ejemplo.com',  tier: 'Bronce',  points: 340,  spent: 85.00  },
    { id: '5', name: 'Sofía López',   email: 'sofia@ejemplo.com',  tier: 'Plata',   points: 720,  spent: 145.00 },
  ];

  const TIER_COLORS: Record<string, string> = { Platino: '#7C3AED', Oro: '#F59E0B', Plata: '#9CA3AF', Bronce: '#D97706' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Star}
        title="Programa de Fidelización"
        subtitle="Recompensa a tus clientes más leales"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('marketing') },
          { label: 'Configurar', primary: true },
        ]}
      />

      {/* Sticky tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '0 28px' }}>
          {[
            { id: 'overview' as const, label: 'Resumen' },
            { id: 'members' as const, label: 'Miembros' },
            { id: 'rewards' as const, label: 'Recompensas' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '14px 18px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === t.id ? ORANGE : '#6B7280', fontWeight: activeTab === t.id ? '700' : '500', fontSize: '0.875rem', borderBottom: activeTab === t.id ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

          {activeTab === 'overview' && (
            <>
              {/* Top stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', borderRadius: '12px', padding: '20px', color: '#FFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Users size={18} color="rgba(255,255,255,0.85)" />
                    <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>Miembros activos</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>1,240</p>
                </div>
                {[
                  { label: 'Puntos canjeados',  value: '124,500', Icon: Gift,        color: '#F59E0B' },
                  { label: 'Valor recompensas', value: '$8,450',  Icon: DollarSign,  color: '#10B981' },
                  { label: 'Retención clientes', value: '+45%',   Icon: TrendingUp,  color: '#7C3AED' },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <s.Icon size={18} color={s.color} />
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.7rem', fontWeight: '900', color: '#111827' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Two columns: config + chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Points config */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>Configuración de Puntos</h3>
                    <button onClick={() => setEditingConfig(!editingConfig)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: editingConfig ? ORANGE : '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600' }}>
                      {editingConfig ? <><Save size={13} /> Guardar</> : <><Edit2 size={13} /> Editar</>}
                    </button>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '600' }}>Puntos por dólar gastado:</label>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111827' }}>{pointsConfig.pointsPerDollar}</span>
                    </div>
                    <input type="range" min={1} max={50} value={pointsConfig.pointsPerDollar}
                      disabled={!editingConfig}
                      onChange={e => setPointsConfig(p => ({ ...p, pointsPerDollar: +e.target.value }))}
                      style={{ width: '100%', accentColor: ORANGE }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '600' }}>Puntos por $1 de descuento:</label>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111827' }}>{pointsConfig.dollarPerPoints}</span>
                    </div>
                    <input type="range" min={10} max={500} step={10} value={pointsConfig.dollarPerPoints}
                      disabled={!editingConfig}
                      onChange={e => setPointsConfig(p => ({ ...p, dollarPerPoints: +e.target.value }))}
                      style={{ width: '100%', accentColor: ORANGE }} />
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#0369A1' }}>
                      💡 <strong>Ejemplo:</strong> Un cliente que compra por $100 recibe {pointsConfig.pointsPerDollar * 100} puntos.
                      Al juntar {pointsConfig.dollarPerPoints} puntos podrá canjearlos por $1 de descuento.
                    </p>
                  </div>
                </div>

                {/* Distribution chart */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>Distribución por Niveles</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={LEVEL_DISTRIBUTION} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="nivel" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.78rem' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}
                        fill="#8B5CF6"
                        label={{ position: 'top', fontSize: 10, fill: '#6B7280' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Membership tiers */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>Niveles de Membresía</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {TIERS.map((tier) => (
                    <div key={tier.name} style={{ background: tier.gradient, borderRadius: '14px', padding: '20px', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <Star size={16} fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.6)" />
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontWeight: '900', fontSize: '1.05rem' }}>{tier.name}</h4>
                      <p style={{ margin: '0 0 14px', fontSize: '0.75rem', opacity: 0.85 }}>
                        Desde {tier.from === 0 ? '0 puntos' : `${tier.from.toLocaleString()} puntos`}
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {tier.features.map((f, i) => (
                          <li key={i} style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ opacity: 0.7 }}>•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'members' && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>Miembros del Programa</h3>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{MOCK_MEMBERS.length} miembros</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    {['Miembro', 'Email', 'Nivel', 'Puntos', 'Gasto Total'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MEMBERS.map((m, i) => (
                    <tr key={m.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${TIER_COLORS[m.tier]}, ${TIER_COLORS[m.tier]}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: '700', fontSize: '0.8rem' }}>
                            {m.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{m.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: TIER_COLORS[m.tier] + '20', color: TIER_COLORS[m.tier], fontSize: '0.75rem', fontWeight: '700' }}>
                          ⭐ {m.tier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: ORANGE, fontSize: '0.875rem' }}>{m.points.toLocaleString()} pts</td>
                      <td style={{ padding: '12px 16px', color: '#374151', fontSize: '0.875rem' }}>${m.spent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: '10% OFF en toda la tienda',        points: 200,  uses: 142, color: ORANGE },
                  { label: 'Envío gratis en cualquier pedido', points: 100,  uses: 310, color: '#10B981' },
                  { label: '$5 de descuento directo',          points: 500,  uses: 67,  color: '#3B82F6' },
                  { label: '$15 de descuento',                 points: 1500, uses: 23,  color: '#8B5CF6' },
                  { label: 'Acceso VIP early sale',            points: 2000, uses: 12,  color: '#F59E0B' },
                  { label: 'Regalo sorpresa',                  points: 3000, uses: 5,   color: '#EC4899' },
                ].map((r, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <Gift size={18} color={r.color} />
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Usado {r.uses}x</span>
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{r.label}</h4>
                    <p style={{ margin: '0 0 12px', fontWeight: '800', color: r.color, fontSize: '1rem' }}>{r.points.toLocaleString()} pts</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ flex: 1, padding: '7px', border: `1px solid ${r.color}`, borderRadius: '6px', backgroundColor: 'transparent', color: r.color, fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Editar</button>
                      <button style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#FFF', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ marginTop: '16px', padding: '12px 20px', border: `2px dashed ${ORANGE}`, borderRadius: '10px', backgroundColor: '#FFF4EC', color: ORANGE, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                <Gift size={16} /> Crear nueva recompensa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}