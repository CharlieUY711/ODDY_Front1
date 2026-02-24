import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Mail, Users, BarChart2, TestTube2, TrendingUp,
  Plus, Search, Filter, Send, Clock, FileText,
  CheckCircle2, CircleX, Eye, Edit2, Trash2,
  Upload, Download, Tag, ChevronDown,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';
type Tab = 'campanas' | 'suscriptores' | 'segmentacion' | 'abtesting' | 'analiticas';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  recipients: number;
  openRate?: number;
  clickRate?: number;
  sentAt?: string;
  scheduledAt?: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Newsletter Agosto 2025', subject: '🔥 Ofertas de temporada + Nuevos productos', status: 'sent', recipients: 1240, openRate: 34.2, clickRate: 8.7, sentAt: '2025-08-01' },
  { id: '2', name: 'Promo Fin de Semana', subject: '⚡ Solo por 48hs: 20% OFF en todo', status: 'sent', recipients: 980, openRate: 41.5, clickRate: 12.3, sentAt: '2025-07-26' },
  { id: '3', name: 'Bienvenida nuevos usuarios', subject: '👋 ¡Bienvenido a Charlie Marketplace!', status: 'sent', recipients: 312, openRate: 62.1, clickRate: 28.4, sentAt: '2025-07-20' },
  { id: '4', name: 'Campaña Septiembre', subject: '🍂 Novedades de otoño — próximamente', status: 'scheduled', recipients: 1500, scheduledAt: '2025-09-01' },
  { id: '5', name: 'Black Friday Early Access', subject: '🖤 Acceso anticipado para miembros VIP', status: 'draft', recipients: 0 },
];

interface Subscriber {
  id: string;
  email: string;
  name: string;
  tags: string[];
  status: 'active' | 'unsubscribed';
  createdAt: string;
}

const MOCK_SUBSCRIBERS: Subscriber[] = [
  { id: '1', email: 'ana@ejemplo.com',     name: 'Ana García',     tags: ['VIP', 'Electrónica'],   status: 'active',       createdAt: '2025-06-15' },
  { id: '2', email: 'carlos@ejemplo.com',  name: 'Carlos Martín',  tags: ['Oferta'],               status: 'active',       createdAt: '2025-07-02' },
  { id: '3', email: 'lucia@ejemplo.com',   name: 'Lucía Pérez',    tags: ['Moda', 'VIP'],          status: 'active',       createdAt: '2025-07-10' },
  { id: '4', email: 'mario@ejemplo.com',   name: 'Mario Silva',    tags: ['Hogar'],                status: 'unsubscribed', createdAt: '2025-05-20' },
  { id: '5', email: 'sofia@ejemplo.com',   name: 'Sofía López',    tags: ['Electrónica'],          status: 'active',       createdAt: '2025-07-18' },
  { id: '6', email: 'pedro@ejemplo.com',   name: 'Pedro Ruiz',     tags: ['VIP', 'Hogar', 'Moda'], status: 'active',       createdAt: '2025-07-22' },
];

const STATUS_BADGE: Record<Campaign['status'], { label: string; bg: string; color: string }> = {
  sent:      { label: 'Enviada',     bg: '#DCFCE7', color: '#15803D' },
  scheduled: { label: 'Programada', bg: '#EDE9FE', color: '#7C3AED' },
  draft:     { label: 'Borrador',   bg: '#F3F4F6', color: '#374151' },
  sending:   { label: 'Enviando…', bg: '#FEF3C7', color: '#B45309' },
};

export function MailingView({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('campanas');
  const [searchSubs, setSearchSubs] = useState('');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '' });

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'campanas',     label: 'Campañas',    Icon: Mail },
    { id: 'suscriptores', label: 'Suscriptores', Icon: Users },
    { id: 'segmentacion', label: 'Segmentación', Icon: Filter },
    { id: 'abtesting',    label: 'A/B Testing',  Icon: TestTube2 },
    { id: 'analiticas',   label: 'Analíticas',   Icon: BarChart2 },
  ];

  const sent       = MOCK_CAMPAIGNS.filter(c => c.status === 'sent').length;
  const scheduled  = MOCK_CAMPAIGNS.filter(c => c.status === 'scheduled').length;
  const drafts     = MOCK_CAMPAIGNS.filter(c => c.status === 'draft').length;
  const filteredSubs = MOCK_SUBSCRIBERS.filter(s =>
    s.email.toLowerCase().includes(searchSubs.toLowerCase()) ||
    s.name.toLowerCase().includes(searchSubs.toLowerCase())
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Mail}
        title="Sistema de Mailing Avanzado"
        subtitle="Gestión completa de campañas, segmentación y analíticas · Powered by Resend"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('marketing') },
          { label: '+ Nueva Campaña', primary: true, onClick: () => setShowNewCampaign(true) },
        ]}
      />

      {/* Sticky tabs + stats bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px' }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '14px 18px',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                color: activeTab === id ? ORANGE : '#6B7280',
                fontWeight: activeTab === id ? '700' : '500',
                fontSize: '0.875rem',
                borderBottom: activeTab === id ? `2px solid ${ORANGE}` : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

          {/* ── CAMPAÑAS ── */}
          {activeTab === 'campanas' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Campañas', value: MOCK_CAMPAIGNS.length, color: '#111827' },
                  { label: 'Enviadas',        value: sent,      color: '#16A34A' },
                  { label: 'Programadas',     value: scheduled, color: '#7C3AED' },
                  { label: 'Borradores',      value: drafts,    color: '#374151' },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px 20px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Campaigns list */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>Gestión de Campañas</h3>
                  <button
                    onClick={() => setShowNewCampaign(true)}
                    style={{ padding: '9px 18px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} /> Nueva Campaña
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['Nombre / Asunto', 'Estado', 'Destinatarios', 'Apertura', 'Clics', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CAMPAIGNS.map((c, i) => {
                      const s = STATUS_BADGE[c.status];
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{c.name}</p>
                            <p style={{ margin: '2px 0 0', color: '#6B7280', fontSize: '0.75rem' }}>{c.subject}</p>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: '700' }}>{s.label}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#374151', fontSize: '0.875rem' }}>{c.recipients > 0 ? c.recipients.toLocaleString() : '—'}</td>
                          <td style={{ padding: '14px 16px', color: c.openRate ? '#16A34A' : '#9CA3AF', fontSize: '0.875rem', fontWeight: c.openRate ? '700' : '400' }}>{c.openRate ? `${c.openRate}%` : '—'}</td>
                          <td style={{ padding: '14px 16px', color: c.clickRate ? '#2563EB' : '#9CA3AF', fontSize: '0.875rem', fontWeight: c.clickRate ? '700' : '400' }}>{c.clickRate ? `${c.clickRate}%` : '—'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}><Eye size={15} /></button>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}><Edit2 size={15} /></button>
                              {c.status === 'draft' && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ORANGE, padding: '4px' }}><Send size={15} /></button>}
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SUSCRIPTORES ── */}
          {activeTab === 'suscriptores' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111827' }}>Suscriptores</h2>
                  <p style={{ margin: '3px 0 0', color: '#6B7280', fontSize: '0.8rem' }}>{MOCK_SUBSCRIBERS.filter(s => s.status === 'active').length} activos · {MOCK_SUBSCRIBERS.filter(s => s.status === 'unsubscribed').length} desuscriptos</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFF', color: '#374151', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Importar CSV
                  </button>
                  <button style={{ padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFF', color: '#374151', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={14} /> Exportar
                  </button>
                  <button style={{ padding: '9px 16px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} size={15} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchSubs}
                  onChange={e => setSearchSubs(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['Nombre', 'Email', 'Tags', 'Estado', 'Registrado', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((s, i) => (
                      <tr key={s.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ORANGE + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: ORANGE, fontSize: '0.8rem' }}>
                              {s.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontSize: '0.875rem' }}>{s.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {s.tags.map(t => (
                              <span key={t} style={{ padding: '2px 8px', backgroundColor: '#F3F4F6', borderRadius: '12px', fontSize: '0.72rem', color: '#374151', fontWeight: '600' }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: s.status === 'active' ? '#16A34A' : '#9CA3AF', fontWeight: '600' }}>
                            {s.status === 'active' ? <CheckCircle2 size={13} /> : <CircleX size={13} />}
                            {s.status === 'active' ? 'Activo' : 'Desuscripto'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{s.createdAt}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Edit2 size={14} /></button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SEGMENTACIÓN ── */}
          {activeTab === 'segmentacion' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {[
                  { name: 'Clientes VIP', count: 312, color: '#F59E0B', desc: 'Usuarios con tag VIP o +3 compras' },
                  { name: 'Electrónica',  count: 489, color: '#3B82F6', desc: 'Interesados en categoría Electrónica' },
                  { name: 'Moda',         count: 234, color: '#EC4899', desc: 'Interesados en categoría Moda' },
                  { name: 'Hogar',        count: 178, color: '#10B981', desc: 'Interesados en categoría Hogar' },
                  { name: 'Inactivos',    count: 97,  color: '#9CA3AF', desc: 'Sin actividad hace +60 días' },
                  { name: 'Nuevos',       count: 156, color: ORANGE,    desc: 'Registrados en los últimos 30 días' },
                ].map((seg, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{seg.name}</h4>
                        <p style={{ margin: '3px 0 0', color: '#6B7280', fontSize: '0.78rem' }}>{seg.desc}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: seg.color }}>{seg.count}</p>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.72rem' }}>contactos</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ flex: 1, padding: '7px', border: `1px solid ${seg.color}`, borderRadius: '6px', backgroundColor: 'transparent', color: seg.color, fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                        Enviar campaña
                      </button>
                      <button style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#FFF', color: '#374151', fontSize: '0.78rem', cursor: 'pointer' }}>
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ padding: '12px 20px', border: `2px dashed ${ORANGE}`, borderRadius: '10px', backgroundColor: '#FFF4EC', color: ORANGE, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                <Plus size={16} /> Crear nuevo segmento
              </button>
            </div>
          )}

          {/* ── A/B TESTING ── */}
          {activeTab === 'abtesting' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>Crear prueba A/B</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {['Variante A', 'Variante B'].map((v, i) => (
                    <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px' }}>
                      <p style={{ margin: '0 0 12px', fontWeight: '700', color: i === 0 ? '#3B82F6' : '#EC4899', fontSize: '0.85rem' }}>{v}</p>
                      {[{ label: 'Asunto', ph: 'Ej: 🔥 Oferta especial para vos' }, { label: 'Nombre del remitente', ph: 'Ej: Charlie Marketplace' }].map(({ label, ph }) => (
                        <div key={label} style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', color: '#374151', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>{label}</label>
                          <input type="text" placeholder={ph} style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', color: '#374151', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>% de muestra</label>
                    <input type="number" defaultValue={20} style={{ width: '100px', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#374151', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Métrica ganadora</label>
                    <select style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none' }}>
                      <option>Tasa de apertura</option>
                      <option>Tasa de clics</option>
                      <option>Conversiones</option>
                    </select>
                  </div>
                  <button style={{ marginTop: '18px', padding: '10px 20px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem' }}>
                    Iniciar prueba
                  </button>
                </div>
              </div>
              {/* Empty state for active tests */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                <TestTube2 size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No hay pruebas A/B activas</p>
              </div>
            </div>
          )}

          {/* ── ANALÍTICAS ── */}
          {activeTab === 'analiticas' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Tasa de apertura',  value: '38.4%', sub: '+2.1% vs mes ant.', color: '#16A34A' },
                  { label: 'Tasa de clics',     value: '9.7%',  sub: '+0.8% vs mes ant.', color: '#2563EB' },
                  { label: 'Desuscriptos',      value: '0.3%',  sub: 'Bajo promedio',      color: '#9CA3AF' },
                  { label: 'Emails entregados', value: '98.9%', sub: 'Excelente',           color: ORANGE },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '18px 20px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{s.sub}</p>
                  </div>
                ))}
              </div>
              {/* Simple bar chart */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>Rendimiento por campaña</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {MOCK_CAMPAIGNS.filter(c => c.openRate).map(c => (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '600' }}>{c.name}</span>
                        <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>{c.openRate}% apertura · {c.clickRate}% clics</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#16A34A', width: `${(c.openRate! / 70) * 100}%`, transition: 'width 0.5s' }} />
                        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#2563EB', width: `${(c.clickRate! / 70) * 100}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
                  {[{ color: '#16A34A', label: 'Apertura' }, { color: '#2563EB', label: 'Clics' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: l.color }} />
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNewCampaign(false)}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '28px', width: '560px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontWeight: '800', fontSize: '1.1rem', color: '#111827' }}>✉️ Nueva Campaña</h2>
            {[
              { label: 'Nombre de la campaña', key: 'name' as const, ph: 'Ej: Newsletter Agosto 2025' },
              { label: 'Asunto del email', key: 'subject' as const, ph: 'Ej: 🔥 Ofertas imperdibles de la semana' },
            ].map(({ label, key, ph }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#374151', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>{label}</label>
                <input type="text" placeholder={ph} value={newCampaign[key]} onChange={e => setNewCampaign(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Contenido (HTML o texto)</label>
              <textarea rows={5} placeholder="Escribe el contenido de tu email aquí..." value={newCampaign.body} onChange={e => setNewCampaign(prev => ({ ...prev, body: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowNewCampaign(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Cancelar</button>
              <button style={{ flex: 1, padding: '11px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FileText size={15} /> Guardar borrador
              </button>
              <button style={{ flex: 1, padding: '11px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Send size={15} /> Enviar ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}