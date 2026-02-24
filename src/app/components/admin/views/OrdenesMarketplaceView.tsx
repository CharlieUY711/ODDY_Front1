/* =====================================================
   OrdenesMarketplaceView — Gestión de órdenes del Marketplace
   Charlie Marketplace Builder v1.5
   ===================================================== */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { toast } from 'sonner';
import {
  Search, RefreshCw, X, Eye, CheckCircle, XCircle, Truck, Package,
  Clock, ChevronRight, User, CreditCard, MapPin, Calendar, DollarSign,
  AlertCircle, RotateCcw,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const API = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/ordenes`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ORANGE = '#FF6835';

// ── Types ──────────────────────────────────────────
interface OrdenItem {
  id: string;
  producto_id: string;
  producto_tipo: 'market' | 'secondhand';
  nombre_producto: string;
  imagen_producto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Orden {
  id: string;
  numero_orden: string;
  usuario_id?: string;
  sesion_id?: string;
  estado: 'pendiente' | 'confirmada' | 'en_proceso' | 'enviada' | 'entregada' | 'cancelada';
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
  metodo_pago?: string;
  estado_pago: 'pendiente' | 'pagado' | 'reembolsado' | 'fallido';
  nombre_completo: string;
  email: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  codigo_postal?: string;
  pais: string;
  notas?: string;
  created_at: string;
  updated_at?: string;
  items?: OrdenItem[];
}

// ── Estado config ──────────────────────────────────
const ESTADO_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendiente:  { label: 'Pendiente',  color: '#D97706', bg: '#FEF3C7', icon: Clock        },
  confirmada: { label: 'Confirmada', color: '#2563EB', bg: '#EFF6FF', icon: CheckCircle  },
  en_proceso: { label: 'En proceso', color: '#7C3AED', bg: '#F5F3FF', icon: Package      },
  enviada:    { label: 'Enviada',    color: '#0891B2', bg: '#ECFEFF', icon: Truck        },
  entregada:  { label: 'Entregada',  color: '#059669', bg: '#D1FAE5', icon: CheckCircle  },
  cancelada:  { label: 'Cancelada',  color: '#DC2626', bg: '#FEE2E2', icon: XCircle      },
};

const PAGO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pago pendiente', color: '#D97706', bg: '#FEF3C7' },
  pagado:      { label: 'Pagado',         color: '#059669', bg: '#D1FAE5' },
  reembolsado: { label: 'Reembolsado',    color: '#6B7280', bg: '#F3F4F6' },
  fallido:     { label: 'Fallido',        color: '#DC2626', bg: '#FEE2E2' },
};

// ── Component ─────────────────────────────────────
export function OrdenesMarketplaceView({ onNavigate }: Props) {
  const [ordenesList, setOrdenesList] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEstadoPago, setFilterEstadoPago] = useState('');
  const [detailOrden, setDetailOrden] = useState<Orden | null>(null);

  // ── Fetch ──
  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: HEADERS });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setOrdenesList(json.data ?? []);
    } catch (e: unknown) {
      console.error('Error cargando órdenes:', e);
      toast.error('Error al cargar órdenes');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = ordenesList.length;
    const pendientes = ordenesList.filter(p => p.estado === 'pendiente').length;
    const enProceso = ordenesList.filter(p => p.estado === 'en_proceso').length;
    const enviadas = ordenesList.filter(p => p.estado === 'enviada').length;
    const entregadas = ordenesList.filter(p => p.estado === 'entregada').length;
    const canceladas = ordenesList.filter(p => p.estado === 'cancelada').length;
    const totalVentas = ordenesList.reduce((sum, p) => sum + p.total, 0);
    return { total, pendientes, enProceso, enviadas, entregadas, canceladas, totalVentas };
  }, [ordenesList]);

  // ── Filtros ──
  const filtered = useMemo(() => {
    let result = ordenesList;
    if (filterEstado) result = result.filter(p => p.estado === filterEstado);
    if (filterEstadoPago) result = result.filter(p => p.estado_pago === filterEstadoPago);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.numero_orden.toLowerCase().includes(s) ||
        p.nombre_completo.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s)
      );
    }
    return result;
  }, [ordenesList, filterEstado, filterEstadoPago, search]);

  // ── Actualizar estado ──
  const updateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success('Estado actualizado');
      fetchOrdenes();
    } catch (e: unknown) {
      console.error('Error actualizando estado:', e);
      toast.error('Error al actualizar estado');
    }
  };

  const fmtNum = (n: number) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA' }}>
      <OrangeHeader
        icon={Package}
        title="Órdenes del Marketplace"
        subtitle="Gestión de órdenes del storefront público"
        onBack={() => onNavigate('ecommerce')}
      />

      {/* Stats */}
      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Órdenes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#222' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Pendientes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#D97706' }}>{stats.pendientes}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>En Proceso</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7C3AED' }}>{stats.enProceso}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Ventas</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{fmtNum(stats.totalVentas)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Buscar por número, nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '0.875rem',
            background: 'white',
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterEstadoPago}
          onChange={(e) => setFilterEstadoPago(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '0.875rem',
            background: 'white',
          }}
        >
          <option value="">Todos los pagos</option>
          {Object.entries(PAGO_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={fetchOrdenes}
          style={{
            padding: '0.75rem 1rem',
            background: ORANGE,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 1.5rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>No hay órdenes</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((orden) => {
              const estadoCfg = ESTADO_CFG[orden.estado] || ESTADO_CFG.pendiente;
              const pagoCfg = PAGO_CFG[orden.estado_pago] || PAGO_CFG.pendiente;
              const EstadoIcon = estadoCfg.icon;

              return (
                <div
                  key={orden.id}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.boxShadow = `0 0 0 3px ${ORANGE}20`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  onClick={() => setDetailOrden(orden)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#222' }}>{orden.numero_orden}</div>
                        <div style={{ padding: '0.25rem 0.5rem', background: estadoCfg.bg, color: estadoCfg.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <EstadoIcon size={12} />
                          {estadoCfg.label}
                        </div>
                        <div style={{ padding: '0.25rem 0.5rem', background: pagoCfg.bg, color: pagoCfg.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {pagoCfg.label}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                        {orden.nombre_completo} · {orden.email}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {orden.ciudad} · {orden.items?.length || 0} {orden.items?.length === 1 ? 'producto' : 'productos'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#222', marginBottom: '0.25rem' }}>
                        {fmtNum(orden.total)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {new Date(orden.created_at).toLocaleDateString('es-UY')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detailOrden && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDetailOrden(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#222' }}>{detailOrden.numero_orden}</h2>
              <button onClick={() => setDetailOrden(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#6B7280" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>Cliente</h3>
                <div style={{ fontSize: '0.875rem', color: '#222' }}>
                  <div>{detailOrden.nombre_completo}</div>
                  <div>{detailOrden.email}</div>
                  {detailOrden.telefono && <div>{detailOrden.telefono}</div>}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>Dirección</h3>
                <div style={{ fontSize: '0.875rem', color: '#222' }}>
                  <div>{detailOrden.direccion}</div>
                  <div>{detailOrden.ciudad}</div>
                  {detailOrden.codigo_postal && <div>{detailOrden.codigo_postal}</div>}
                  <div>{detailOrden.pais}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>Productos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {detailOrden.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#222' }}>{item.nombre_producto}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Cantidad: {item.cantidad} × {fmtNum(item.precio_unitario)}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#222' }}>{fmtNum(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Subtotal</span>
                <span style={{ fontSize: '0.875rem', color: '#222' }}>{fmtNum(detailOrden.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>IVA (22%)</span>
                <span style={{ fontSize: '0.875rem', color: '#222' }}>{fmtNum(detailOrden.impuestos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Envío</span>
                <span style={{ fontSize: '0.875rem', color: '#222' }}>{fmtNum(detailOrden.envio)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: '700', color: '#222' }}>
                <span>Total</span>
                <span>{fmtNum(detailOrden.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['confirmada', 'en_proceso', 'enviada', 'entregada'].includes(detailOrden.estado) && (
                <button
                  onClick={() => {
                    const next = detailOrden.estado === 'confirmada' ? 'en_proceso' : detailOrden.estado === 'en_proceso' ? 'enviada' : 'entregada';
                    updateEstado(detailOrden.id, next);
                    setDetailOrden({ ...detailOrden, estado: next as any });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: ORANGE,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  {detailOrden.estado === 'confirmada' ? 'Marcar en proceso' : detailOrden.estado === 'en_proceso' ? 'Marcar enviada' : 'Marcar entregada'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
