/* =====================================================
   EnviosView — Módulo de Envíos Operativo
   Árbol Pedido Madre → Envíos Hijos · Multi-tramo
   ===================================================== */
import React, { useState, useMemo } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Truck, Package, MapPin, CheckCircle2, Clock, XCircle,
  ChevronRight, ChevronDown, Search, Filter, Eye,
  AlertCircle, RotateCcw, Navigation, Users, Calendar,
  ArrowLeft, TrendingUp, Layers, Inbox,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

const ORANGE = '#FF6835';

type EstadoEnvio =
  | 'creado' | 'despachado' | 'en_transito' | 'en_deposito'
  | 'en_reparto' | 'entregado' | 'fallido' | 'devuelto';

interface EventoTracking {
  fecha: string;
  hora: string;
  estado: EstadoEnvio;
  descripcion: string;
  ubicacion: string;
}

interface Envio {
  id: string;
  numero: string;
  pedidoMadre: string;
  estado: EstadoEnvio;
  origen: string;
  destino: string;
  destinatario: string;
  carrier: string;
  tramo: 'local' | 'intercity' | 'internacional' | 'last_mile';
  peso: number;
  bultos: number;
  fechaCreacion: string;
  fechaEstimada: string;
  tracking?: string;
  eventos: EventoTracking[];
}

interface PedidoMadre {
  id: string;
  numero: string;
  cliente: string;
  envios: Envio[];
  total: number;
}

/* ── Mock Data ─────────────────────────────────────── */
const PEDIDOS: PedidoMadre[] = [
  {
    id: 'pm1', numero: 'PED-15000', cliente: 'Martín García', total: 47800,
    envios: [
      {
        id: 'e1', numero: 'ENV-15000-001', pedidoMadre: 'PED-15000',
        estado: 'en_reparto', origen: 'Depósito Central — CABA', destino: 'Av. Corrientes 2145, CABA',
        destinatario: 'Martín García', carrier: 'Correo Argentino', tramo: 'local',
        peso: 1.2, bultos: 2, fechaCreacion: '2024-01-15', fechaEstimada: '2024-01-17', tracking: 'CA123456789AR',
        eventos: [
          { fecha: '17/01', hora: '09:15', estado: 'en_reparto', descripcion: 'Salió para entrega', ubicacion: 'CABA Sur' },
          { fecha: '16/01', hora: '18:30', estado: 'en_deposito', descripcion: 'Llegó al centro de distribución', ubicacion: 'CABA Centro' },
          { fecha: '15/01', hora: '14:00', estado: 'despachado', descripcion: 'Despachado desde depósito', ubicacion: 'Depósito Central' },
          { fecha: '15/01', hora: '10:30', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
      {
        id: 'e2', numero: 'ENV-15000-002', pedidoMadre: 'PED-15000',
        estado: 'despachado', origen: 'Depósito Central — CABA', destino: 'Rivadavia 890, Córdoba',
        destinatario: 'Martín García (Cba)', carrier: 'Andreani', tramo: 'intercity',
        peso: 3.5, bultos: 1, fechaCreacion: '2024-01-15', fechaEstimada: '2024-01-19', tracking: 'AND789012',
        eventos: [
          { fecha: '15/01', hora: '15:00', estado: 'despachado', descripcion: 'En camino a Córdoba', ubicacion: 'CABA' },
          { fecha: '15/01', hora: '10:30', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
    ],
  },
  {
    id: 'pm2', numero: 'PED-15001', cliente: 'Sofía Rodríguez', total: 28500,
    envios: [
      {
        id: 'e3', numero: 'ENV-15001-001', pedidoMadre: 'PED-15001',
        estado: 'entregado', origen: 'Depósito Norte — GBA', destino: 'Mitre 340, San Isidro',
        destinatario: 'Sofía Rodríguez', carrier: 'OCA', tramo: 'local',
        peso: 0.8, bultos: 1, fechaCreacion: '2024-01-12', fechaEstimada: '2024-01-14', tracking: 'OCA456789',
        eventos: [
          { fecha: '14/01', hora: '11:22', estado: 'entregado', descripcion: 'Entregado al destinatario', ubicacion: 'San Isidro' },
          { fecha: '14/01', hora: '08:00', estado: 'en_reparto', descripcion: 'En reparto local', ubicacion: 'GBA Norte' },
          { fecha: '13/01', hora: '20:00', estado: 'en_deposito', descripcion: 'En sucursal San Isidro', ubicacion: 'San Isidro' },
          { fecha: '12/01', hora: '14:00', estado: 'despachado', descripcion: 'Despachado', ubicacion: 'Depósito Norte' },
          { fecha: '12/01', hora: '09:00', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
    ],
  },
  {
    id: 'pm3', numero: 'PED-15002', cliente: 'Empresa Textil S.A.', total: 185000,
    envios: [
      {
        id: 'e4', numero: 'ENV-15002-001', pedidoMadre: 'PED-15002',
        estado: 'en_transito', origen: 'Depósito Central — CABA', destino: 'Las Heras 1200, Mendoza',
        destinatario: 'Empresa Textil S.A.', carrier: 'Fedex', tramo: 'intercity',
        peso: 12.5, bultos: 4, fechaCreacion: '2024-01-14', fechaEstimada: '2024-01-20', tracking: 'FDX334455',
        eventos: [
          { fecha: '16/01', hora: '06:30', estado: 'en_transito', descripcion: 'En ruta Mendoza', ubicacion: 'San Luis' },
          { fecha: '15/01', hora: '22:00', estado: 'despachado', descripcion: 'Salió hacia Mendoza', ubicacion: 'CABA' },
          { fecha: '14/01', hora: '16:00', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
      {
        id: 'e5', numero: 'ENV-15002-002', pedidoMadre: 'PED-15002',
        estado: 'creado', origen: 'Depósito Central — CABA', destino: 'Av. San Martín 500, Rosario',
        destinatario: 'Empresa Textil S.A. — Suc. Rosario', carrier: 'Andreani', tramo: 'intercity',
        peso: 8.0, bultos: 3, fechaCreacion: '2024-01-16', fechaEstimada: '2024-01-19',
        eventos: [
          { fecha: '16/01', hora: '17:00', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
      {
        id: 'e6', numero: 'ENV-15002-003', pedidoMadre: 'PED-15002',
        estado: 'fallido', origen: 'Depósito Norte — GBA', destino: 'Urquiza 88, Tucumán',
        destinatario: 'Punto de entrega Tucumán', carrier: 'DHL', tramo: 'intercity',
        peso: 5.0, bultos: 2, fechaCreacion: '2024-01-10', fechaEstimada: '2024-01-15', tracking: 'DHL889900',
        eventos: [
          { fecha: '15/01', hora: '14:00', estado: 'fallido', descripcion: 'Dirección incorrecta — devolver', ubicacion: 'Tucumán' },
          { fecha: '13/01', hora: '09:00', estado: 'en_reparto', descripcion: 'Intentando entrega', ubicacion: 'Tucumán' },
          { fecha: '12/01', hora: '20:00', estado: 'en_transito', descripcion: 'En tránsito', ubicacion: 'Santiago del Estero' },
        ],
      },
    ],
  },
  {
    id: 'pm4', numero: 'PED-15003', cliente: 'Lucas Fernández', total: 9800,
    envios: [
      {
        id: 'e7', numero: 'ENV-15003-001', pedidoMadre: 'PED-15003',
        estado: 'en_deposito', origen: 'Depósito Sur — CABA', destino: 'Remedios de Escalada 234, Lomas de Zamora',
        destinatario: 'Lucas Fernández', carrier: 'Correo Argentino', tramo: 'local',
        peso: 0.5, bultos: 1, fechaCreacion: '2024-01-16', fechaEstimada: '2024-01-18', tracking: 'CA987654321AR',
        eventos: [
          { fecha: '17/01', hora: '08:00', estado: 'en_deposito', descripcion: 'En sucursal Lomas', ubicacion: 'Lomas de Zamora' },
          { fecha: '16/01', hora: '16:00', estado: 'despachado', descripcion: 'Despachado', ubicacion: 'Depósito Sur' },
          { fecha: '16/01', hora: '12:00', estado: 'creado', descripcion: 'Envío creado', ubicacion: 'Sistema' },
        ],
      },
    ],
  },
];

/* ── Estado config ─────────────────────────────────── */
const ESTADO_CFG: Record<EstadoEnvio, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  creado:      { label: 'Creado',        color: '#6B7280', bg: '#F3F4F6', icon: Package      },
  despachado:  { label: 'Despachado',    color: '#2563EB', bg: '#EFF6FF', icon: Truck        },
  en_transito: { label: 'En tránsito',   color: '#7C3AED', bg: '#F5F3FF', icon: Navigation   },
  en_deposito: { label: 'En depósito',   color: '#D97706', bg: '#FFFBEB', icon: Layers       },
  en_reparto:  { label: 'En reparto',    color: '#FF6835', bg: '#FFF4EC', icon: MapPin       },
  entregado:   { label: 'Entregado',     color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
  fallido:     { label: 'Fallido',       color: '#DC2626', bg: '#FEF2F2', icon: XCircle      },
  devuelto:    { label: 'Devuelto',      color: '#9CA3AF', bg: '#F9FAFB', icon: RotateCcw    },
};

const TRAMO_CFG: Record<string, { label: string; color: string }> = {
  local:         { label: 'Local',          color: '#059669' },
  intercity:     { label: 'Intercity',      color: '#2563EB' },
  internacional: { label: 'Internacional',  color: '#7C3AED' },
  last_mile:     { label: 'Last Mile',      color: '#D97706' },
};

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ElementType }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#111', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: color, marginTop: '2px', fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoEnvio }) {
  const cfg = ESTADO_CFG[estado];
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export function EnviosView({ onNavigate }: Props) {
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set(['pm1', 'pm3']));
  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoEnvio | 'todos'>('todos');
  const [filterTramo, setFilterTramo] = useState<string>('todos');

  const togglePedido = (id: string) => {
    setExpandedPedidos(prev => {
      const ne = new Set(prev);
      ne.has(id) ? ne.delete(id) : ne.add(id);
      return ne;
    });
  };

  // Estadísticas globales
  const allEnvios = PEDIDOS.flatMap(p => p.envios);
  const stats = {
    total:       allEnvios.length,
    entregados:  allEnvios.filter(e => e.estado === 'entregado').length,
    en_transito: allEnvios.filter(e => ['en_transito', 'despachado', 'en_reparto', 'en_deposito'].includes(e.estado)).length,
    fallidos:    allEnvios.filter(e => e.estado === 'fallido').length,
    pendientes:  allEnvios.filter(e => e.estado === 'creado').length,
  };

  // Filtro de pedidos
  const pedidosFiltrados = useMemo(() => {
    return PEDIDOS.filter(p => {
      const matchSearch = !search ||
        p.numero.toLowerCase().includes(search.toLowerCase()) ||
        p.cliente.toLowerCase().includes(search.toLowerCase()) ||
        p.envios.some(e => e.numero.toLowerCase().includes(search.toLowerCase()) || e.destinatario.toLowerCase().includes(search.toLowerCase()));
      if (!matchSearch) return false;
      if (filterEstado !== 'todos' && !p.envios.some(e => e.estado === filterEstado)) return false;
      if (filterTramo !== 'todos' && !p.envios.some(e => e.tramo === filterTramo)) return false;
      return true;
    });
  }, [search, filterEstado, filterTramo]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Truck}
        title="Envíos"
        subtitle={`${stats.total} envíos totales · ${stats.en_transito} en tránsito · ${stats.entregados} entregados`}
        actions={[
          { label: '← Logística', onClick: () => onNavigate('logistica') },
          { label: '+ Nuevo Envío', primary: true, onClick: () => {} },
        ]}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
        {/* ── Panel principal ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', padding: '20px 20px 0' }}>
            <StatCard label="Total Envíos"  value={stats.total}       color="#6B7280" icon={Package}      />
            <StatCard label="En Tránsito"   value={stats.en_transito} color="#7C3AED" icon={Navigation}   />
            <StatCard label="En Reparto"    value={allEnvios.filter(e=>e.estado==='en_reparto').length} color={ORANGE} icon={Truck} />
            <StatCard label="Entregados"    value={stats.entregados}  color="#059669" icon={CheckCircle2} />
            <StatCard label="Fallidos"      value={stats.fallidos}    color="#DC2626" icon={XCircle}      sub={stats.fallidos > 0 ? 'Requieren atención' : undefined} />
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar pedido, cliente, envío..."
                style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}
              />
            </div>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as any)}
              style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="todos">Todos los estados</option>
              {Object.entries(ESTADO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterTramo} onChange={e => setFilterTramo(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="todos">Todos los tramos</option>
              {Object.entries(TRAMO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{pedidosFiltrados.length} pedidos · {pedidosFiltrados.flatMap(p=>p.envios).length} envíos</span>
          </div>

          {/* Árbol Pedidos → Envíos */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pedidosFiltrados.map(pedido => {
                const isOpen = expandedPedidos.has(pedido.id);
                const estadosEnvios = pedido.envios.map(e => e.estado);
                const hayFallido = estadosEnvios.includes('fallido');
                const todosEntregados = estadosEnvios.every(s => s === 'entregado');
                return (
                  <div key={pedido.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${hayFallido ? '#FCA5A5' : todosEntregados ? '#A7F3D0' : '#E5E7EB'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    {/* Cabecera del pedido madre */}
                    <button
                      onClick={() => togglePedido(pedido.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', border: 'none', backgroundColor: todosEntregados ? '#F0FDF4' : hayFallido ? '#FFF5F5' : '#FAFAFA', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {isOpen ? <ChevronDown size={16} color="#6B7280" /> : <ChevronRight size={16} color="#6B7280" />}
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: todosEntregados ? '#D1FAE5' : hayFallido ? '#FEE2E2' : '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={16} color={todosEntregados ? '#059669' : hayFallido ? '#DC2626' : ORANGE} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>{pedido.numero}</span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>·</span>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{pedido.cliente}</span>
                          {hayFallido && <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 7px', borderRadius: '10px' }}>⚠ Tiene fallidos</span>}
                          {todosEntregados && <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 7px', borderRadius: '10px' }}>✓ Todo entregado</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                          {pedido.envios.length} envío{pedido.envios.length > 1 ? 's' : ''} · Total: ${pedido.total.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                        {pedido.envios.map(e => (
                          <EstadoBadge key={e.id} estado={e.estado} />
                        ))}
                      </div>
                    </button>

                    {/* Envíos hijos */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #E5E7EB' }}>
                        {pedido.envios.map((envio, idx) => {
                          const cfg = ESTADO_CFG[envio.estado];
                          const tramoCfg = TRAMO_CFG[envio.tramo];
                          const Icon = cfg.icon;
                          const isSelected = selectedEnvio?.id === envio.id;
                          return (
                            <div
                              key={envio.id}
                              onClick={() => setSelectedEnvio(isSelected ? null : envio)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 18px 12px 50px',
                                borderTop: idx > 0 ? '1px solid #F3F4F6' : 'none',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#FFF4EC' : 'transparent',
                                transition: 'background 0.12s',
                              }}
                            >
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{envio.numero}</span>
                                  <EstadoBadge estado={envio.estado} />
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: tramoCfg.color, backgroundColor: `${tramoCfg.color}18`, padding: '2px 7px', borderRadius: '10px' }}>{tramoCfg.label}</span>
                                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{envio.carrier}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  <span>📍 {envio.destino}</span>
                                  <span>👤 {envio.destinatario}</span>
                                  <span>📦 {envio.peso}kg · {envio.bultos} bulto{envio.bultos > 1 ? 's' : ''}</span>
                                  <span>📅 Est. {envio.fechaEstimada}</span>
                                  {envio.tracking && <span style={{ color: '#2563EB', fontWeight: 600 }}>🔍 {envio.tracking}</span>}
                                </div>
                              </div>
                              <Eye size={14} color={isSelected ? ORANGE : '#D1D5DB'} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Panel de detalle ── */}
        {selectedEnvio && (
          <div style={{ width: '360px', backgroundColor: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            {/* Header del panel */}
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#374151', fontFamily: 'monospace' }}>{selectedEnvio.numero}</span>
                <button onClick={() => setSelectedEnvio(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px', lineHeight: 1, padding: '2px' }}>×</button>
              </div>
              <EstadoBadge estado={selectedEnvio.estado} />
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  ['Carrier', selectedEnvio.carrier],
                  ['Tramo', TRAMO_CFG[selectedEnvio.tramo].label],
                  ['Origen', selectedEnvio.origen],
                  ['Destino', selectedEnvio.destino],
                  ['Destinatario', selectedEnvio.destinatario],
                  ['Peso', `${selectedEnvio.peso} kg · ${selectedEnvio.bultos} bulto${selectedEnvio.bultos > 1 ? 's' : ''}`],
                  ['F. estimada', selectedEnvio.fechaEstimada],
                  ...(selectedEnvio.tracking ? [['Tracking #', selectedEnvio.tracking]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#9CA3AF', width: '90px', flexShrink: 0 }}>{label}</span>
                    <span style={{ color: '#111', fontWeight: 500, flex: 1 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline de eventos */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Historial de seguimiento</p>
              <div style={{ position: 'relative' }}>
                {selectedEnvio.eventos.map((ev, idx) => {
                  const cfg = ESTADO_CFG[ev.estado];
                  const Icon = cfg.icon;
                  const isFirst = idx === 0;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
                      {/* línea vertical */}
                      {idx < selectedEnvio.eventos.length - 1 && (
                        <div style={{ position: 'absolute', left: '14px', top: '28px', bottom: 0, width: '2px', backgroundColor: '#E5E7EB' }} />
                      )}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isFirst ? cfg.bg : '#F3F4F6', border: `2px solid ${isFirst ? cfg.color : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                        <Icon size={12} color={isFirst ? cfg.color : '#9CA3AF'} />
                      </div>
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: isFirst ? 700 : 500, color: isFirst ? cfg.color : '#374151' }}>{ev.descripcion}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{ev.ubicacion} · {ev.fecha} {ev.hora}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button style={{ flex: 1, padding: '9px', border: `1.5px solid ${ORANGE}`, borderRadius: '8px', backgroundColor: 'transparent', color: ORANGE, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Ver tracking externo
              </button>
              {selectedEnvio.estado === 'fallido' && (
                <button style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Re-despachar
                </button>
              )}
              {selectedEnvio.estado === 'creado' && (
                <button style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Despachar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}