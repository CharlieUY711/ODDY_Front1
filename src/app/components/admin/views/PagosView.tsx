/* =====================================================
   PagosView — Transacciones y estados de pago
   Vista operacional (eCommerce) — no configuración
   ===================================================== */
import React, { useState, useEffect, useCallback } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import {
  CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
  DollarSign, AlertCircle, RotateCcw, ChevronDown,
  Search, Eye, TrendingUp,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const API     = `https://${projectId}.supabase.co/functions/v1/make-server-75638143`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ORANGE  = '#FF6835';

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: string;
  estado_pago: string;
  total: number;
  subtotal: number;
  descuento: number;
  created_at: string;
  updated_at?: string;
  cliente_persona?: { id: string; nombre: string; apellido: string; email?: string };
  cliente_org?: { id: string; nombre: string };
  metodo_pago?: { id: string; nombre: string; tipo: string; proveedor?: string };
}

const ESTADO_PAGO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendiente:    { label: 'Pendiente',    color: '#D97706', bg: '#FFFBEB', icon: Clock        },
  pagado:       { label: 'Pagado',       color: '#059669', bg: '#ECFDF5', icon: CheckCircle  },
  parcial:      { label: 'Pago parcial', color: '#2563EB', bg: '#EFF6FF', icon: TrendingUp   },
  fallido:      { label: 'Fallido',      color: '#DC2626', bg: '#FEF2F2', icon: XCircle      },
  reembolsado:  { label: 'Reembolsado', color: '#7C3AED', bg: '#F5F3FF', icon: RotateCcw    },
};

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente',   label: 'Pendientes'   },
  { value: 'pagado',      label: 'Pagados'       },
  { value: 'parcial',     label: 'Pago parcial'  },
  { value: 'fallido',     label: 'Fallidos'      },
  { value: 'reembolsado', label: 'Reembolsados'  },
];

const PROVEEDOR_EMOJI: Record<string, string> = {
  mercadopago: '🛒', stripe: '💳', paypal: '🅿️', redpagos: '🔴', abitab: '🏪',
};

function fmtMonto(n: number) {
  return '$' + (n ?? 0).toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function PagosView({ onNavigate }: Props) {
  const [pedidos, setPedidos]       = useState<Pedido[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState('');
  const [search, setSearch]         = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtro) params.append('estado_pago', filtro);
      if (search) params.append('search', search);
      const res  = await fetch(`${API}/pedidos?${params}`, { headers: HEADERS });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPedidos(json.data ?? []);
    } catch (e) {
      console.error('Error cargando transacciones:', e);
      toast.error('Error al cargar transacciones');
    } finally { setLoading(false); }
  }, [filtro, search]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const cambiarEstadoPago = async (pedido: Pedido, estado_pago: string) => {
    setUpdatingId(pedido.id);
    setOpenDropdown(null);
    try {
      const res  = await fetch(`${API}/pedidos/${pedido.id}/estado-pago`, {
        method: 'PUT', headers: HEADERS, body: JSON.stringify({ estado_pago }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success(`Estado de pago actualizado: ${ESTADO_PAGO_CONFIG[estado_pago]?.label}`);
      fetchPedidos();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : e}`);
    } finally { setUpdatingId(null); }
  };

  // Stats
  const total      = pedidos.length;
  const pagados    = pedidos.filter(p => p.estado_pago === 'pagado').length;
  const pendientes = pedidos.filter(p => p.estado_pago === 'pendiente').length;
  const fallidos   = pedidos.filter(p => p.estado_pago === 'fallido').length;
  const montoCobrado = pedidos.filter(p => p.estado_pago === 'pagado').reduce((s, p) => s + (p.total ?? 0), 0);
  const montoPendiente = pedidos.filter(p => p.estado_pago === 'pendiente').reduce((s, p) => s + (p.total ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <OrangeHeader
        icon={DollarSign}
        title="Pagos & Transacciones"
        subtitle="Estado de pagos por pedido · vista operacional"
        actions={[
          { label: 'Ver Pedidos', primary: false, onClick: () => onNavigate('pedidos') },
          { label: '↺ Actualizar', primary: true, onClick: fetchPedidos },
        ]}
      />

      {/* Stats */}
      <div style={{ padding: '12px 28px', backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Transacciones',    value: total,                       icon: CreditCard,  color: ORANGE,    sub: 'total' },
          { label: 'Cobrado',          value: fmtMonto(montoCobrado),      icon: CheckCircle, color: '#059669', sub: `${pagados} pedidos` },
          { label: 'Pendiente cobro',  value: fmtMonto(montoPendiente),    icon: Clock,       color: '#D97706', sub: `${pendientes} pedidos` },
          { label: 'Fallidos',         value: fallidos,                    icon: XCircle,     color: '#DC2626', sub: 'requieren atención' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', minWidth: 150 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#9CA3AF' }}>{s.sub}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B7280' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ padding: '10px 28px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nº pedido…"
            style={{ paddingLeft: 30, height: 34, border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.82rem', outline: 'none', width: 200, color: '#374151' }}
          />
        </div>
        {/* Estado pago */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button key={f.value} onClick={() => setFiltro(f.value)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filtro === f.value ? ORANGE : '#E5E7EB'}`,
                backgroundColor: filtro === f.value ? ORANGE + '15' : '#fff',
                color: filtro === f.value ? ORANGE : '#6B7280',
                fontSize: '0.78rem', fontWeight: filtro === f.value ? 700 : 500, cursor: 'pointer',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px' }}>
        {loading ? (
          <LoadingSpinner />
        ) : pedidos.length === 0 ? (
          <EmptyState filtro={filtro} />
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 160px 90px 110px 130px', gap: 0, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['# Pedido', 'Cliente', 'Método de pago', 'Monto', 'Fecha', 'Estado pago'].map(h => (
                <div key={h} style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {pedidos.map(p => {
              const cfg = ESTADO_PAGO_CONFIG[p.estado_pago] ?? ESTADO_PAGO_CONFIG['pendiente'];
              const StatusIcon = cfg.icon;
              const clienteNombre = p.cliente_persona
                ? `${p.cliente_persona.nombre} ${p.cliente_persona.apellido}`
                : p.cliente_org?.nombre ?? '—';
              const emoji = PROVEEDOR_EMOJI[p.metodo_pago?.proveedor ?? ''] ?? '💰';
              const isUpdating = updatingId === p.id;
              const isDropOpen = openDropdown === p.id;

              return (
                <div key={p.id}
                  style={{ display: 'grid', gridTemplateColumns: '140px 1fr 160px 90px 110px 130px', borderBottom: '1px solid #F3F4F6', alignItems: 'center', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}
                >
                  {/* # Pedido */}
                  <div style={{ padding: '12px 14px' }}>
                    <button onClick={() => onNavigate('pedidos')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5, color: ORANGE, fontWeight: 700, fontSize: '0.8rem' }}>
                      <Eye size={11} />
                      {p.numero_pedido}
                    </button>
                  </div>

                  {/* Cliente */}
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 600, color: '#111827' }}>{clienteNombre}</p>
                    {p.cliente_persona?.email && (
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{p.cliente_persona.email}</p>
                    )}
                  </div>

                  {/* Método pago */}
                  <div style={{ padding: '12px 14px' }}>
                    {p.metodo_pago ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1rem' }}>{emoji}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{p.metodo_pago.nombre}</p>
                          <p style={{ margin: 0, fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'capitalize' }}>{p.metodo_pago.tipo}</p>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>—</span>
                    )}
                  </div>

                  {/* Monto */}
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{fmtMonto(p.total)}</p>
                    {p.descuento > 0 && (
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#059669' }}>-{fmtMonto(p.descuento)} desc.</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>{fmtFecha(p.created_at)}</p>
                  </div>

                  {/* Estado pago — dropdown */}
                  <div style={{ padding: '12px 14px', position: 'relative' }}>
                    <button
                      disabled={isUpdating}
                      onClick={() => setOpenDropdown(isDropOpen ? null : p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px',
                        borderRadius: 20, border: `1.5px solid ${cfg.color}50`,
                        backgroundColor: cfg.bg, color: cfg.color,
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', width: '100%',
                        opacity: isUpdating ? 0.6 : 1,
                      }}>
                      {isUpdating
                        ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        : <StatusIcon size={11} />
                      }
                      <span style={{ flex: 1, textAlign: 'left' }}>{cfg.label}</span>
                      <ChevronDown size={10} />
                    </button>

                    {isDropOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 14, zIndex: 100,
                        backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
                      }}>
                        {Object.entries(ESTADO_PAGO_CONFIG).map(([key, c]) => {
                          const Icon = c.icon;
                          return (
                            <button key={key} onClick={() => cambiarEstadoPago(p, key)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 12px', border: 'none', background: key === p.estado_pago ? c.bg : '#fff',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: key === p.estado_pago ? 700 : 500,
                                color: key === p.estado_pago ? c.color : '#374151', textAlign: 'left',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'}
                              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = key === p.estado_pago ? c.bg : '#fff'}
                            >
                              <Icon size={13} color={c.color} /> {c.label}
                              {key === p.estado_pago && <span style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Cerrar dropdown al clickear fuera */}
      {openDropdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenDropdown(null)} />
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#9CA3AF', gap: 8 }}>
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Cargando transacciones…
    </div>
  );
}
function EmptyState({ filtro }: { filtro: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
      <DollarSign size={44} style={{ marginBottom: 12, opacity: 0.25 }} />
      <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#374151' }}>
        {filtro ? `No hay transacciones "${FILTROS.find(f => f.value === filtro)?.label}"` : 'No hay transacciones aún'}
      </p>
      <p style={{ fontSize: '0.875rem', marginTop: 6 }}>Los pagos aparecerán aquí cuando se creen pedidos</p>
    </div>
  );
}