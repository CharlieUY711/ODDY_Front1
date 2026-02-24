import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import { RRSSBanner }   from '../RRSSBanner';
import type { MainSection } from '../../../AdminDashboard';
import {
  BarChart2, Users, Heart, Eye, Send, MessageCircle,
  Image, Calendar, ChevronLeft, ChevronRight, Plus,
  Share2, ShoppingBag, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props { onNavigate: (section: MainSection) => void; }

type Tab = 'panel' | 'facebook' | 'instagram' | 'whatsapp' | 'calendario';
type FBTab = 'publicaciones' | 'mensajes';

const ORANGE = '#FF6835';

const LINE_DATA = [
  { day: '13 Feb', facebook: 320, instagram: 280, whatsapp: 140 },
  { day: '14 Feb', facebook: 310, instagram: 295, whatsapp: 155 },
  { day: '15 Feb', facebook: 340, instagram: 302, whatsapp: 148 },
  { day: '16 Feb', facebook: 328, instagram: 318, whatsapp: 162 },
  { day: '17 Feb', facebook: 355, instagram: 290, whatsapp: 170 },
  { day: '18 Feb', facebook: 342, instagram: 308, whatsapp: 158 },
  { day: '19 Feb', facebook: 370, instagram: 325, whatsapp: 180 },
];

const PIE_DATA = [
  { name: 'Facebook',  value: 45, color: '#1877F2' },
  { name: 'Instagram', value: 35, color: '#E1306C' },
  { name: 'WhatsApp',  value: 20, color: '#25D366' },
];

// Calendar events Feb 2026
const CAL_EVENTS: Record<number, { label: string; color: string }[]> = {
  5:  [{ label: 'Promoción especial', color: '#1877F2' }, { label: 'Nueva colección', color: '#E1306C' }],
  12: [{ label: 'Broadcast semanal',  color: '#25D366' }],
  18: [{ label: 'Post de engagement', color: '#1877F2' }, { label: 'Story del día',   color: '#E1306C' }],
  26: [{ label: 'Lanzamiento nueva temporada', color: '#E1306C' }],
  28: [{ label: 'Cierre mes – Resumen', color: '#25D366' }],
};

export function RedesSocialesView({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('panel');
  const [fbTab, setFbTab] = useState<FBTab>('publicaciones');
  const [calMonth] = useState({ year: 2026, month: 2 });

  const TABS: { id: Tab; label: string; icon?: any }[] = [
    { id: 'panel',      label: '⊞ Panel Unificado' },
    { id: 'facebook',   label: '🔵 Facebook' },
    { id: 'instagram',  label: '📸 Instagram' },
    { id: 'whatsapp',   label: '💬 WhatsApp' },
    { id: 'calendario', label: '📅 Calendario' },
  ];

  /* ─ Stat chip ─ */
  const Stat = ({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) => (
    <div style={{ padding: '14px 20px', borderRadius: '8px', border: highlight ? `1.5px solid ${ORANGE}33` : '1px solid #E5E7EB', backgroundColor: highlight ? `${ORANGE}08` : '#FFFFFF', minWidth: '110px' }}>
      <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: highlight ? ORANGE : '#111827' }}>{value}</p>
      <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#6B7280' }}>{label}</p>
    </div>
  );

  /* ─ Platform action cards ─ */
  const ActionCard = ({ icon: Icon, label, desc, color }: { icon: any; label: string; desc: string; color: string }) => (
    <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s', backgroundColor: '#FFFFFF' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
        <Icon size={18} color={color} />
      </div>
      <p style={{ margin: '0 0 3px', fontWeight: '700', color: '#111827', fontSize: '0.85rem' }}>{label}</p>
      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.72rem' }}>{desc}</p>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Share2}
        title="Redes Sociales"
        subtitle="Gestión y administración"
        actions={[
          { label: '← Volver', onClick: () => onNavigate('rrss') },
          { label: 'Volver a la tienda' },
        ]}
      />

      <RRSSBanner onNavigate={onNavigate} active="redes-sociales" />

      {/* Sub-header: Centro Operativo title + tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ padding: '16px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Share2 size={16} color={ORANGE} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111827' }}>Centro Operativo de Redes Sociales</h2>
          </div>
          <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: '0.78rem' }}>
            Meta Business Suite · Gestión unificada de Facebook, Instagram y WhatsApp
          </p>
          <div style={{ display: 'flex', gap: '0' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: '10px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === t.id ? ORANGE : '#6B7280', fontWeight: activeTab === t.id ? '700' : '500', fontSize: '0.82rem', borderBottom: activeTab === t.id ? `2px solid ${ORANGE}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '20px 28px', maxWidth: '1200px' }}>

          {/* ── PANEL UNIFICADO ── */}
          {activeTab === 'panel' && (
            <>
              {/* Platform stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { platform: 'Facebook', color: '#1877F2', bg: '#EFF6FF', stats: [{ v: '18.5K', l: 'Seguidores' }, { v: '243', l: 'Alcance hoy' }, { v: '12', l: 'Posts' }] },
                  { platform: 'Instagram', color: '#E1306C', bg: '#FFF0F6', stats: [{ v: '22.8K', l: 'Seguidores' }, { v: '9.8%', l: 'Engagement' }, { v: '245', l: 'Productos' }] },
                  { platform: 'WhatsApp', color: '#25D366', bg: '#F0FFF4', stats: [{ v: '3.9K', l: 'Contactos' }, { v: '156', l: 'Conversaciones' }, { v: '94%', l: 'Tasa respuesta' }] },
                  { platform: 'Programadas', color: '#8B5CF6', bg: '#F5F3FF', stats: [{ v: '8', l: 'Posts programados' }, { v: '3', l: 'Pendientes' }, { v: '5', l: 'Esta semana' }] },
                ].map((p, i) => (
                  <div key={i} style={{ backgroundColor: p.bg, borderRadius: '12px', border: `1px solid ${p.color}22`, padding: '16px 18px' }}>
                    <p style={{ margin: '0 0 10px', fontWeight: '700', color: p.color, fontSize: '0.85rem' }}>{p.platform}</p>
                    {p.stats.map((s, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{s.l}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#111827' }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: '#111827', fontSize: '0.88rem' }}>Resumen Métricas — 7 días</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={LINE_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '0.75rem' }} />
                      <Line type="monotone" dataKey="facebook"  stroke="#1877F2" strokeWidth={2} dot={false} name="Facebook" />
                      <Line type="monotone" dataKey="instagram" stroke="#E1306C" strokeWidth={2} dot={false} name="Instagram" />
                      <Line type="monotone" dataKey="whatsapp"  stroke="#25D366" strokeWidth={2} dot={false} name="WhatsApp" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: '#111827', fontSize: '0.88rem' }}>Distribución Engagement</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={PIE_DATA} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false} fontSize={10}>
                        {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent publications */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontWeight: '700', color: '#111827', fontSize: '0.88rem' }}>Publicaciones en Meta Business</h3>
                {[
                  { platform: 'Facebook', icon: '🔵', content: 'Llega el verano con nuestras novedades ☀️', date: '18 Feb', likes: 124, reach: '1.2K' },
                  { platform: 'Instagram', icon: '📸', content: 'Nueva colección disponible — Link en bio 🛍️', date: '17 Feb', likes: 342, reach: '3.8K' },
                  { platform: 'Instagram', icon: '📸', content: 'Behind the scenes del nuevo lanzamiento 🎬', date: '15 Feb', likes: 287, reach: '2.9K' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#111827', fontWeight: '600' }}>{p.content}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>{p.platform} · {p.date}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#6B7280' }}>
                      <span>❤️ {p.likes}</span>
                      <span>👁 {p.reach}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending tasks */}
              <div style={{ backgroundColor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A', padding: '14px 18px' }}>
                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#92400E', fontSize: '0.85rem' }}>⚠️ Tareas Pendientes</p>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#78350F', fontSize: '0.78rem', lineHeight: '1.8' }}>
                  <li>Conectar cuenta de Facebook con token de acceso válido</li>
                  <li>Configurar webhook de WhatsApp para recibir mensajes</li>
                  <li>Completar configuración de Instagram Shopping</li>
                </ul>
              </div>
            </>
          )}

          {/* ── FACEBOOK ── */}
          {activeTab === 'facebook' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <Stat value="18.5K" label="Seguidores" highlight />
                <Stat value="0" label="Total Likes" />
                <Stat value="0.0K" label="Alcance" />
                <Stat value="0" label="Programadas" />
                <Stat value="0" label="Sin leer" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {(['publicaciones', 'mensajes'] as FBTab[]).map(t => (
                  <button key={t} onClick={() => setFbTab(t)}
                    style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: fbTab === t ? '#1877F2' : '#FFFFFF', color: fbTab === t ? '#FFF' : '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t === 'publicaciones' ? <Image size={13} /> : <MessageCircle size={13} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <button style={{ marginLeft: 'auto', padding: '8px 18px', backgroundColor: '#1877F2', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Nueva Publicación
                </button>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1877F222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Image size={22} color="#1877F2" />
                </div>
                <p style={{ margin: 0, fontWeight: '600', color: '#374151' }}>No hay publicaciones</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Crea tu primera publicación para comenzar</p>
              </div>
            </>
          )}

          {/* ── INSTAGRAM ── */}
          {activeTab === 'instagram' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <Stat value="22.8K" label="Seguidores" highlight />
                <Stat value="9.8%" label="Engagement" />
                <Stat value="63" label="DMs" />
                <Stat value="245" label="Productos" />
              </div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '40px', textAlign: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #405DE6, #E1306C, #FD1D1D)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📸</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>Instagram Management</h3>
                <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '0.8rem', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                  Gestión completa de Instagram incluyendo feed, stories, reels, mensajes directos y shopping tag
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { icon: Image,         label: 'Feed & Stories',      desc: 'Publicar y programar contenido',  color: '#E1306C' },
                    { icon: MessageCircle, label: 'Mensajes Directos',    desc: 'Gestionar DMs y respuestas',      color: '#405DE6' },
                    { icon: ShoppingBag,   label: 'Instagram Shopping',   desc: 'Etiquetar productos y ventas',    color: '#25D366' },
                  ].map((card, i) => <ActionCard key={i} {...card} />)}
                </div>
              </div>
            </>
          )}

          {/* ── WHATSAPP ── */}
          {activeTab === 'whatsapp' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <Stat value="3.9K" label="Contactos" highlight />
                <Stat value="156" label="Conversaciones" />
                <Stat value="94%" label="Tasa Respuesta" />
                <Stat value="245" label="Catálogo" />
              </div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '40px', textAlign: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#25D36622', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <MessageCircle size={30} color="#25D366" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>WhatsApp Business API</h3>
                <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '0.8rem', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                  Gestión profesional de WhatsApp Business con mensajería masiva, chatbot y catálogo de productos
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { icon: Send,        label: 'Mensajería',    desc: 'Chats y broadcasts',         color: '#25D366' },
                    { icon: ShoppingBag, label: 'Catálogo',      desc: 'Productos y ventas',          color: '#128C7E' },
                    { icon: Zap,         label: 'Automatización', desc: 'Respuestas automáticas',    color: '#FF6835' },
                  ].map((card, i) => <ActionCard key={i} {...card} />)}
                </div>
              </div>
            </>
          )}

          {/* ── CALENDARIO ── */}
          {activeTab === 'calendario' && <ContentCalendar events={CAL_EVENTS} />}
        </div>
      </div>
    </div>
  );
}

/* ─ Content Calendar Component ─ */
function ContentCalendar({ events }: { events: Record<number, { label: string; color: string }[]> }) {
  // Feb 2026: starts Sunday, 28 days
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const startDow = 0; // Sunday
  const today = 19;
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '1rem' }}>Calendario de Contenido</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px' }}><ChevronLeft size={14} /></button>
          <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Febrero 2026</span>
          <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px' }}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '2px' }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px', color: '#6B7280', fontSize: '0.75rem', fontWeight: '700' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#F3F4F6' }}>
        {/* Empty cells for start day */}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`e${i}`} style={{ backgroundColor: '#FAFAFA', minHeight: '80px', padding: '6px' }} />
        ))}
        {days.map(day => {
          const isToday = day === today;
          const dayEvents = events[day] || [];
          return (
            <div key={day} style={{ backgroundColor: isToday ? '#FFF4EC' : '#FFFFFF', minHeight: '80px', padding: '6px', borderLeft: isToday ? `2px solid ${ORANGE}` : '1px solid transparent' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: isToday ? ORANGE : 'transparent', color: isToday ? '#FFF' : '#374151', fontSize: '0.78rem', fontWeight: isToday ? '700' : '400', marginBottom: '4px' }}>
                {day}
              </span>
              {dayEvents.map((ev, i) => (
                <div key={i} style={{ padding: '2px 5px', borderRadius: '3px', backgroundColor: ev.color + '20', borderLeft: `2px solid ${ev.color}`, marginBottom: '2px', fontSize: '0.65rem', color: ev.color, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
        {[{ color: '#1877F2', label: 'Facebook' }, { color: '#E1306C', label: 'Instagram' }, { color: '#25D366', label: 'WhatsApp' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: l.color }} />
            <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}