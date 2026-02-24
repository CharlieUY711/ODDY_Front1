/* =====================================================
   Orden Page — Página de Confirmación de Orden
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { getOrdenById, type Orden } from '../services/ordenesApi';
import '../../styles/oddy.css';

const fmtNum = (n: number) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function OrdenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [orden, setOrden] = useState<Orden | null>(location.state?.orden || null);
  const [loading, setLoading] = useState(!orden);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orden) return;

    const cargarOrden = async () => {
      if (!id) {
        setError('ID de orden no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const ordenData = await getOrdenById(id);
        setOrden(ordenData);
      } catch (err) {
        console.error('Error cargando orden:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la orden');
      } finally {
        setLoading(false);
      }
    };

    cargarOrden();
  }, [id, orden]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Cargando orden...</div>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#EF4444' }}>Error</div>
          <div style={{ marginBottom: '1rem' }}>{error || 'Orden no encontrada'}</div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#FF6835',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return '#F59E0B';
      case 'confirmada': return '#10B981';
      case 'en_proceso': return '#3B82F6';
      case 'enviada': return '#8B5CF6';
      case 'entregada': return '#059669';
      case 'cancelada': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      <header style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#222',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ← Volver a la tienda
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#222' }}>¡Pedido Confirmado!</h1>
          <p style={{ color: '#6B7280', fontSize: '1.125rem' }}>
            Tu pedido ha sido recibido y está siendo procesado
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Número de Orden</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#222' }}>{orden.numero_orden}</div>
            </div>
            <div
              style={{
                padding: '0.5rem 1rem',
                background: getEstadoColor(orden.estado),
                color: 'white',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {orden.estado.replace('_', ' ')}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#222' }}>Items del Pedido</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orden.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                >
                  {item.imagen_producto && (
                    <img
                      src={item.imagen_producto}
                      alt={item.nombre_producto}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: '#222' }}>
                      {item.nombre_producto}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                      Cantidad: {item.cantidad} × {fmtNum(item.precio_unitario)}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#222' }}>
                      {fmtNum(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#222' }}>Dirección de Envío</h3>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '600', color: '#222' }}>{orden.nombre_completo}</div>
              <div>{orden.direccion}</div>
              <div>{orden.ciudad}</div>
              {orden.codigo_postal && <div>{orden.codigo_postal}</div>}
              <div>{orden.pais}</div>
              {orden.telefono && <div style={{ marginTop: '0.5rem' }}>Tel: {orden.telefono}</div>}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#222' }}>Resumen</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                <span>Subtotal</span>
                <span>{fmtNum(orden.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                <span>IVA (22%)</span>
                <span>{fmtNum(orden.impuestos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                <span>Envío</span>
                <span>{orden.envio === 0 ? 'Gratis' : fmtNum(orden.envio)}</span>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: '700', color: '#222' }}>
                  <span>Total</span>
                  <span>{fmtNum(orden.total)}</span>
                </div>
              </div>
            </div>
            {orden.metodo_pago && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Método de Pago</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#222', textTransform: 'capitalize' }}>
                  {orden.metodo_pago}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 2rem',
              background: '#FF6835',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
}
