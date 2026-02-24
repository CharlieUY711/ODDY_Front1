/* =====================================================
   Second Hand View — Admin Panel
   Moderación, Estadísticas, Publicaciones y Mediación
   ===================================================== */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  CheckCircle2, CircleX, Clock, Eye, Package,
  TrendingUp, DollarSign, Users, Star, AlertTriangle,
  Search, MessageSquare, Scale, ShieldAlert, X,
  Send, ChevronRight, RotateCcw, CheckCheck, Ban,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface Props { onNavigate: (section: MainSection) => void; }

const PURPLE = '#7C3AED';
const ORANGE = '#FF6835';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const AMBER  = '#D97706';
const TEAL   = '#0D9488';

type TabType = 'estadisticas' | 'moderacion' | 'publicaciones' | 'mediacion';

/* ── Listings ── */
interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  seller: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  image: string;
}

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'iPhone 13 Pro 256GB - Muy buen estado',   price: 650, category: 'Tecnología', seller: 'Juan P.',    status: 'pending',  createdAt: '2026-02-19', image: '📱' },
  { id: '2', title: 'Silla de escritorio ergonómica',           price: 120, category: 'Hogar',      seller: 'María G.',   status: 'pending',  createdAt: '2026-02-18', image: '🪑' },
  { id: '3', title: 'Bicicleta montaña Trek - R26',             price: 280, category: 'Deportes',   seller: 'Carlos M.',  status: 'approved', createdAt: '2026-02-17', image: '🚲' },
  { id: '4', title: 'Campera de cuero talle M',                 price: 85,  category: 'Moda',       seller: 'Ana L.',     status: 'rejected', createdAt: '2026-02-16', image: '🧥' },
  { id: '5', title: 'PS5 con 3 juegos incluidos',               price: 420, category: 'Tecnología', seller: 'Pedro R.',   status: 'approved', createdAt: '2026-02-15', image: '🎮' },
  { id: '6', title: 'Cochecito de bebé Graco - nuevo',          price: 150, category: 'Bebés',      seller: 'Laura S.',   status: 'pending',  createdAt: '2026-02-19', image: '🍼' },
];

/* ── Disputes ── */
type DisputeStatus = 'abierta' | 'en-mediacion' | 'resuelta' | 'cerrada';
type MsgFrom = 'buyer' | 'seller' | 'admin';

interface DisputeMsg {
  id: string;
  from: MsgFrom;
  name: string;
  text: string;
  time: string;
}

interface Dispute {
  id: string;
  itemEmoji: string;
  itemTitle: string;
  itemPrice: number;
  buyer: string;
  seller: string;
  reason: string;
  status: DisputeStatus;
  openedAt: string;
  priority: 'alta' | 'media' | 'baja';
  messages: DisputeMsg[];
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'D-001',
    itemEmoji: '📱',
    itemTitle: 'iPhone 13 Pro 256GB',
    itemPrice: 650,
    buyer: 'Sofía R.',
    seller: 'Juan P.',
    reason: 'El artículo no coincide con la descripción',
    status: 'en-mediacion',
    openedAt: '2026-02-18',
    priority: 'alta',
    messages: [
      { id: 'm1', from: 'buyer',  name: 'Sofía R.',  time: '18 Feb 10:30', text: 'La pantalla tiene rayones que no aparecían en las fotos. Quiero la devolución del dinero.' },
      { id: 'm2', from: 'seller', name: 'Juan P.',   time: '18 Feb 11:45', text: 'Las fotos muestran el estado real. Las rayitas son mínimas y propias del uso normal.' },
      { id: 'm3', from: 'admin',  name: 'Admin',     time: '19 Feb 09:00', text: 'Iniciamos la mediación. Solicitamos al vendedor que envíe fotos adicionales del estado actual.' },
      { id: 'm4', from: 'seller', name: 'Juan P.',   time: '19 Feb 09:55', text: 'Adjunto más fotos. El teléfono está en perfecto estado salvo esas marcas mínimas.' },
    ],
  },
  {
    id: 'D-002',
    itemEmoji: '🚲',
    itemTitle: 'Bicicleta montaña Trek R26',
    itemPrice: 280,
    buyer: 'Lucas M.',
    seller: 'Carlos M.',
    reason: 'El vendedor no entrega el artículo',
    status: 'abierta',
    openedAt: '2026-02-19',
    priority: 'alta',
    messages: [
      { id: 'm1', from: 'buyer',  name: 'Lucas M.',  time: '19 Feb 14:00', text: 'Pagué hace 5 días y el vendedor no coordina la entrega. No responde mensajes.' },
      { id: 'm2', from: 'admin',  name: 'Admin',     time: '19 Feb 15:30', text: 'Recibimos tu disputa. Notificamos al vendedor para que responda en 24 hs.' },
    ],
  },
  {
    id: 'D-003',
    itemEmoji: '🎮',
    itemTitle: 'PS5 con 3 juegos incluidos',
    itemPrice: 420,
    buyer: 'Martina V.',
    seller: 'Pedro R.',
    reason: 'Un juego llegó dañado',
    status: 'resuelta',
    openedAt: '2026-02-12',
    priority: 'media',
    messages: [
      { id: 'm1', from: 'buyer',  name: 'Martina V.', time: '12 Feb 10:00', text: 'El juego FIFA llegó sin caja y con el disco rayado.' },
      { id: 'm2', from: 'seller', name: 'Pedro R.',   time: '12 Feb 12:00', text: 'Fue un error al empacar. Le envío el juego en nuevo estado sin costo.' },
      { id: 'm3', from: 'admin',  name: 'Admin',      time: '13 Feb 09:00', text: 'El vendedor se comprometió a reenviar el artículo. Damos 7 días para confirmar recepción.' },
      { id: 'm4', from: 'buyer',  name: 'Martina V.', time: '17 Feb 11:00', text: 'Recibí el juego nuevo. Todo perfecto, gracias.' },
      { id: 'm5', from: 'admin',  name: 'Admin',      time: '17 Feb 11:30', text: '✅ Disputa resuelta satisfactoriamente. Cerramos el caso.' },
    ],
  },
  {
    id: 'D-004',
    itemEmoji: '🧥',
    itemTitle: 'Campera de cuero talle M',
    itemPrice: 85,
    buyer: 'Romina C.',
    seller: 'Ana L.',
    reason: 'Talle incorrecto, pide reembolso',
    status: 'cerrada',
    openedAt: '2026-02-10',
    priority: 'baja',
    messages: [
      { id: 'm1', from: 'buyer',  name: 'Romina C.', time: '10 Feb 09:00', text: 'El talle M equivale a XS. No me queda. Quiero devolución.' },
      { id: 'm2', from: 'seller', name: 'Ana L.',    time: '10 Feb 10:30', text: 'Las medidas estaban en la descripción. No acepto devolución.' },
      { id: 'm3', from: 'admin',  name: 'Admin',     time: '11 Feb 08:00', text: 'Revisamos la publicación. Las medidas sí estaban descriptas. Cerramos sin reembolso.' },
    ],
  },
  {
    id: 'D-005',
    itemEmoji: '🍼',
    itemTitle: 'Cochecito bebé Graco',
    itemPrice: 150,
    buyer: 'Valentina S.',
    seller: 'Laura S.',
    reason: 'Artículo no llega, tracking sin movimiento',
    status: 'en-mediacion',
    openedAt: '2026-02-17',
    priority: 'media',
    messages: [
      { id: 'm1', from: 'buyer',  name: 'Valentina S.', time: '17 Feb 16:00', text: 'El tracking lleva 4 días sin actualización. No sé si el paquete se perdió.' },
      { id: 'm2', from: 'seller', name: 'Laura S.',     time: '18 Feb 08:30', text: 'Consulté al correo y dicen que está en tránsito. Debería llegar hoy o mañana.' },
      { id: 'm3', from: 'admin',  name: 'Admin',        time: '19 Feb 10:00', text: 'Abrimos reclamo formal con el operador logístico. Esperamos respuesta en 48 hs.' },
    ],
  },
];

/* ── Chart data ── */
const MONTHLY_DATA = [
  { mes: 'Sep', publicaciones: 42, aprobadas: 35, rechazadas: 7 },
  { mes: 'Oct', publicaciones: 58, aprobadas: 49, rechazadas: 9 },
  { mes: 'Nov', publicaciones: 74, aprobadas: 62, rechazadas: 12 },
  { mes: 'Dic', publicaciones: 91, aprobadas: 78, rechazadas: 13 },
  { mes: 'Ene', publicaciones: 67, aprobadas: 55, rechazadas: 12 },
  { mes: 'Feb', publicaciones: 83, aprobadas: 68, rechazadas: 15 },
];

const CAT_DATA = [
  { name: 'Tecnología', value: 38, color: '#3B82F6' },
  { name: 'Moda',       value: 22, color: '#EC4899' },
  { name: 'Hogar',      value: 18, color: '#10B981' },
  { name: 'Deportes',   value: 14, color: '#F59E0B' },
  { name: 'Otros',      value: 8,  color: '#9CA3AF' },
];

/* ═══════════════════════════════ DISPUTE STATUS CONFIG ══════════════════════ */
const DISPUTE_STATUS: Record<DisputeStatus, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  'abierta':       { label: 'Abierta',       bg: '#FEF3C7', color: AMBER,  Icon: AlertTriangle },
  'en-mediacion':  { label: 'En mediación',  bg: '#EDE9FE', color: PURPLE, Icon: Scale         },
  'resuelta':      { label: 'Resuelta',      bg: '#DCFCE7', color: GREEN,  Icon: CheckCheck    },
  'cerrada':       { label: 'Cerrada',       bg: '#F3F4F6', color: '#6B7280', Icon: Ban         },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: RED   },
  media: { label: 'Media', color: AMBER },
  baja:  { label: 'Baja',  color: GREEN },
};

/* ═══════════════════════════════ MODERATION CARD ═══════════════════════════ */
function ModerationCard({ listing }: { listing: Listing }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #FDE68A', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
        {listing.image}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{listing.title}</p>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.78rem' }}>
          {listing.category} · {listing.seller} · ${listing.price}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button style={{ padding: '8px 16px', backgroundColor: '#DCFCE7', color: '#15803D', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} /> Aprobar
        </button>
        <button style={{ padding: '8px 16px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CircleX size={13} /> Rechazar
        </button>
        <button style={{ padding: '8px 12px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ DISPUTE DETAIL ════════════════════════════ */
function DisputeDetail({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState<DisputeMsg[]>(dispute.messages);
  const [status, setStatus] = useState<DisputeStatus>(dispute.status);

  const cfg = DISPUTE_STATUS[status];

  const sendReply = () => {
    if (!reply.trim()) return;
    setMessages(prev => [...prev, {
      id: 'm' + Date.now(),
      from: 'admin',
      name: 'Admin',
      time: 'Ahora',
      text: reply.trim(),
    }]);
    setReply('');
  };

  const msgBg: Record<MsgFrom, { bg: string; align: 'flex-start' | 'flex-end'; nameColor: string }> = {
    buyer:  { bg: '#EFF6FF', align: 'flex-start', nameColor: '#2563EB' },
    seller: { bg: '#FFF7ED', align: 'flex-end',   nameColor: ORANGE    },
    admin:  { bg: '#F5F3FF', align: 'flex-start', nameColor: PURPLE    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.3rem' }}>{dispute.itemEmoji}</span>
            <span style={{ fontWeight: '800', color: '#111827', fontSize: '0.9rem' }}>{dispute.id}</span>
            <span style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <cfg.Icon size={10} /> {cfg.label}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: PRIORITY_CFG[dispute.priority].color + '18', color: PRIORITY_CFG[dispute.priority].color, fontSize: '0.68rem', fontWeight: '700' }}>
              {PRIORITY_CFG[dispute.priority].label}
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#374151', fontSize: '0.82rem' }}>{dispute.itemTitle} — ${dispute.itemPrice}</p>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.75rem' }}>
            🧑 Comprador: <b>{dispute.buyer}</b> · 🏪 Vendedor: <b>{dispute.seller}</b>
          </p>
          <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.72rem' }}>Motivo: {dispute.reason}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', flexShrink: 0 }}>
          <X size={18} />
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
        <button
          onClick={() => setStatus('en-mediacion')}
          disabled={status === 'en-mediacion'}
          style={{ padding: '7px 14px', backgroundColor: status === 'en-mediacion' ? PURPLE : '#EDE9FE', color: status === 'en-mediacion' ? '#fff' : PURPLE, border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', opacity: status === 'en-mediacion' ? 0.7 : 1 }}>
          <Scale size={12} /> Iniciar mediación
        </button>
        <button
          onClick={() => setStatus('resuelta')}
          disabled={status === 'resuelta' || status === 'cerrada'}
          style={{ padding: '7px 14px', backgroundColor: status === 'resuelta' ? GREEN : '#DCFCE7', color: status === 'resuelta' ? '#fff' : GREEN, border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', opacity: (status === 'resuelta' || status === 'cerrada') ? 0.6 : 1 }}>
          <CheckCheck size={12} /> Marcar resuelta
        </button>
        <button
          onClick={() => setStatus('cerrada')}
          disabled={status === 'cerrada'}
          style={{ padding: '7px 14px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', opacity: status === 'cerrada' ? 0.6 : 1 }}>
          <Ban size={12} /> Cerrar disputa
        </button>
        <button
          onClick={() => setStatus('abierta')}
          style={{ padding: '7px 14px', backgroundColor: '#FEF3C7', color: AMBER, border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <RotateCcw size={12} /> Reabrir
        </button>
      </div>

      {/* Messages thread */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map(msg => {
          const mc = msgBg[msg.from];
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mc.align }}>
              <div style={{ maxWidth: '85%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: mc.align }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: mc.nameColor }}>
                    {msg.from === 'admin' ? '🛡️ ' : msg.from === 'buyer' ? '🧑 ' : '🏪 '}{msg.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{msg.time}</span>
                </div>
                <div style={{ backgroundColor: mc.bg, borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.5 }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribí un mensaje como mediador..."
            rows={2}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.82rem', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim()}
            style={{ padding: '10px 16px', backgroundColor: reply.trim() ? PURPLE : '#E5E7EB', color: reply.trim() ? '#fff' : '#9CA3AF', border: 'none', borderRadius: '10px', cursor: reply.trim() ? 'pointer' : 'default', fontWeight: '700', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
            <Send size={13} /> Enviar
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.68rem', color: '#9CA3AF' }}>
          🛡️ Este mensaje será visible para comprador y vendedor como intervención del mediador
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ MAIN VIEW ═════════════════════════════ */
export function SecondHandView({ onNavigate }: Props) {
  const [tab, setTab]                   = useState<TabType>('estadisticas');
  const [filter, setFilter]             = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch]             = useState('');
  const [moderationOpen, setModerationOpen] = useState(true);
  const [disputeFilter, setDisputeFilter]   = useState<DisputeStatus | 'all'>('all');
  const [disputeSearch, setDisputeSearch]   = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const pending  = MOCK_LISTINGS.filter(l => l.status === 'pending').length;
  const approved = MOCK_LISTINGS.filter(l => l.status === 'approved').length;
  const rejected = MOCK_LISTINGS.filter(l => l.status === 'rejected').length;

  const filtered = MOCK_LISTINGS.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredDisputes = MOCK_DISPUTES.filter(d => {
    if (disputeFilter !== 'all' && d.status !== disputeFilter) return false;
    if (disputeSearch && !d.itemTitle.toLowerCase().includes(disputeSearch.toLowerCase()) &&
        !d.buyer.toLowerCase().includes(disputeSearch.toLowerCase()) &&
        !d.seller.toLowerCase().includes(disputeSearch.toLowerCase())) return false;
    return true;
  });

  const openDisputes    = MOCK_DISPUTES.filter(d => d.status === 'abierta').length;
  const mediatingD      = MOCK_DISPUTES.filter(d => d.status === 'en-mediacion').length;
  const resolvedDisputes = MOCK_DISPUTES.filter(d => d.status === 'resuelta').length;

  const STATUS_CONFIG = {
    pending:  { label: 'Pendiente', bg: '#FEF3C7', color: '#B45309', Icon: Clock },
    approved: { label: 'Aprobada',  bg: '#DCFCE7', color: '#15803D', Icon: CheckCircle2 },
    rejected: { label: 'Rechazada', bg: '#FEE2E2', color: '#DC2626', Icon: CircleX },
  };

  const TABS: { id: TabType; label: string }[] = [
    { id: 'estadisticas',  label: '📊 Estadísticas' },
    { id: 'moderacion',    label: '🛡️ Moderación' },
    { id: 'publicaciones', label: '📋 Publicaciones' },
    { id: 'mediacion',     label: '⚖️ Mediación' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={RefreshCw}
        title="Second Hand"
        subtitle="Marketplace de artículos usados — Moderación, estadísticas y mediación de disputas"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('gestion') },
          { label: 'Exportar Datos' },
        ]}
      />

      {/* Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '0 28px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedDispute(null); }}
              style={{ padding: '14px 18px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tab === t.id ? PURPLE : '#6B7280', fontWeight: tab === t.id ? '700' : '500', fontSize: '0.875rem', borderBottom: tab === t.id ? `2px solid ${PURPLE}` : '2px solid transparent', position: 'relative' }}>
              {t.label}
              {t.id === 'mediacion' && (openDisputes + mediatingD) > 0 && (
                <span style={{ position: 'absolute', top: '10px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: RED, color: '#fff', fontSize: '0.6rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {openDisputes + mediatingD}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

          {/* ── ESTADÍSTICAS ── */}
          {tab === 'estadisticas' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Publicaciones', value: MOCK_LISTINGS.length.toString(), Icon: Package,      color: PURPLE, sub: '+12% este mes' },
                  { label: 'Pendientes',           value: pending.toString(),             Icon: Clock,         color: AMBER,  sub: 'Requieren revisión' },
                  { label: 'Aprobadas',            value: approved.toString(),            Icon: CheckCircle2,  color: GREEN,  sub: `${Math.round((approved / MOCK_LISTINGS.length) * 100)}% del total` },
                  { label: 'Vendedores Activos',   value: '47',                           Icon: Users,         color: '#3B82F6', sub: '+5 esta semana' },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</span>
                      <s.Icon size={16} color={s.color} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '1.7rem', fontWeight: '900', color: s.color }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Valor Total Publicado', value: '$24,580', Icon: DollarSign, color: '#10B981', note: 'Suma de todos los precios' },
                  { label: 'Precio Promedio',        value: '$287',    Icon: TrendingUp,  color: ORANGE,   note: 'Por publicación activa' },
                  { label: 'Tasa de Aprobación',     value: '82%',     Icon: Star,        color: PURPLE,   note: 'Últimos 30 días' },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.Icon size={20} color={s.color} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#6B7280' }}>{s.label}</p>
                      <p style={{ margin: '0 0 2px', fontSize: '1.4rem', fontWeight: '900', color: s.color }}>{s.value}</p>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#9CA3AF' }}>{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Publicaciones por Mes</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '0.75rem' }} />
                      <Bar dataKey="aprobadas"  fill="#10B981" radius={[3, 3, 0, 0]} name="Aprobadas" />
                      <Bar dataKey="rechazadas" fill="#EF4444" radius={[3, 3, 0, 0]} name="Rechazadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Por Categoría</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={CAT_DATA} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={({ value }: { value: number }) => `${value}%`} labelLine={false} fontSize={9}>
                        {CAT_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '0.75rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ── MODERACIÓN ── */}
          {tab === 'moderacion' && (
            <>
              <div style={{ background: 'linear-gradient(135deg, #6D28D9, #7C3AED, #4F46E5)', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#FFFFFF', fontWeight: '800', fontSize: '1rem' }}>Panel de Moderación</h3>
                    <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>Revisa y aprueba publicaciones de Second Hand</p>
                  </div>
                </div>
                <button onClick={() => setModerationOpen(!moderationOpen)} style={{ padding: '8px 18px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' }}>
                  {moderationOpen ? 'Cerrar' : 'Abrir'}
                </button>
              </div>

              {moderationOpen && (
                pending === 0 ? (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '60px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle2 size={32} color="#16A34A" />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontWeight: '800', color: '#111827', fontSize: '1rem' }}>¡Todo revisado!</h3>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.82rem' }}>No hay publicaciones pendientes de aprobación</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {MOCK_LISTINGS.filter(l => l.status === 'pending').map(listing => (
                      <ModerationCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )
              )}
            </>
          )}

          {/* ── PUBLICACIONES ── */}
          {tab === 'publicaciones' && (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} size={14} color="#9CA3AF" />
                  <input type="text" placeholder="Buscar publicación o vendedor..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${filter === f ? PURPLE : '#E5E7EB'}`, backgroundColor: filter === f ? PURPLE : '#FFF', color: filter === f ? '#FFF' : '#374151', fontWeight: filter === f ? '700' : '500', cursor: 'pointer', fontSize: '0.78rem' }}>
                    {f === 'all' ? 'Todos' : f === 'pending' ? `Pendientes (${pending})` : f === 'approved' ? `Aprobadas (${approved})` : `Rechazadas (${rejected})`}
                  </button>
                ))}
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['Artículo', 'Categoría', 'Precio', 'Vendedor', 'Estado', 'Fecha', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((listing, i) => {
                      const st = STATUS_CONFIG[listing.status];
                      return (
                        <tr key={listing.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.3rem' }}>{listing.image}</span>
                              <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: '0.8rem' }}>{listing.category}</td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#111827', fontSize: '0.875rem' }}>${listing.price}</td>
                          <td style={{ padding: '12px 14px', color: '#374151', fontSize: '0.8rem' }}>{listing.seller}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <st.Icon size={11} /> {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '0.78rem' }}>{listing.createdAt}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Eye size={14} /></button>
                              {listing.status === 'pending' && (
                                <>
                                  <button style={{ padding: '3px 8px', backgroundColor: '#DCFCE7', color: '#15803D', border: 'none', borderRadius: '5px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>✓ Aprobar</button>
                                  <button style={{ padding: '3px 8px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '5px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>✕ Rechazar</button>
                                </>
                              )}
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

          {/* ── MEDIACIÓN ── */}
          {tab === 'mediacion' && (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'Total disputas',   value: MOCK_DISPUTES.length, color: '#374151',  bg: '#F9FAFB', Icon: MessageSquare },
                  { label: 'Abiertas',         value: openDisputes,         color: AMBER,      bg: '#FFFBEB', Icon: AlertTriangle },
                  { label: 'En mediación',     value: mediatingD,           color: PURPLE,     bg: '#F5F3FF', Icon: Scale         },
                  { label: 'Resueltas',        value: resolvedDisputes,     color: GREEN,      bg: '#F0FDF4', Icon: CheckCheck    },
                ].map((k, i) => (
                  <div key={i} style={{ backgroundColor: k.bg, border: `1px solid ${k.color}22`, borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <k.Icon size={18} color={k.color} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280' }}>{k.label}</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split panel: list + detail */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedDispute ? '380px 1fr' : '1fr', gap: '16px', alignItems: 'start' }}>

                {/* List */}
                <div>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} size={13} color="#9CA3AF" />
                      <input type="text" placeholder="Buscar disputa..." value={disputeSearch} onChange={e => setDisputeSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px 8px 28px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {(['all', 'abierta', 'en-mediacion', 'resuelta', 'cerrada'] as const).map(f => (
                      <button key={f} onClick={() => setDisputeFilter(f)}
                        style={{ padding: '5px 11px', borderRadius: '20px', border: `1px solid ${disputeFilter === f ? PURPLE : '#E5E7EB'}`, backgroundColor: disputeFilter === f ? PURPLE : '#FFF', color: disputeFilter === f ? '#FFF' : '#374151', fontWeight: disputeFilter === f ? '700' : '400', cursor: 'pointer', fontSize: '0.72rem' }}>
                        {f === 'all' ? 'Todas' : DISPUTE_STATUS[f as DisputeStatus]?.label ?? f}
                      </button>
                    ))}
                  </div>

                  {/* Dispute cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredDisputes.length === 0 && (
                      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.82rem' }}>
                        No hay disputas con ese filtro
                      </div>
                    )}
                    {filteredDisputes.map(d => {
                      const sc = DISPUTE_STATUS[d.status];
                      const selected = selectedDispute?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDispute(selected ? null : d)}
                          style={{ backgroundColor: selected ? '#F5F3FF' : '#FFFFFF', border: `1px solid ${selected ? PURPLE : '#E5E7EB'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{d.itemEmoji}</span>
                              <div>
                                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.82rem', color: '#111827' }}>{d.id}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>{d.itemTitle}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <sc.Icon size={9} /> {sc.label}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: PRIORITY_CFG[d.priority].color, fontWeight: '700' }}>
                                ● {PRIORITY_CFG[d.priority].label}
                              </span>
                            </div>
                          </div>
                          <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#374151' }}>
                            🧑 {d.buyer} → 🏪 {d.seller}
                          </p>
                          <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#6B7280', fontStyle: 'italic' }}>"{d.reason}"</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{d.openedAt} · {d.messages.length} mensajes</span>
                            <ChevronRight size={12} color={selected ? PURPLE : '#9CA3AF'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail panel */}
                {selectedDispute && (
                  <div style={{ position: 'sticky', top: '0', height: 'calc(100vh - 260px)', minHeight: '500px' }}>
                    <DisputeDetail
                      dispute={selectedDispute}
                      onClose={() => setSelectedDispute(null)}
                    />
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}