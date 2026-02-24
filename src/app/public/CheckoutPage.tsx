/* =====================================================
   Checkout Page — Página de Checkout
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCarrito, type CarritoItem } from '../services/carritoApi';
import { fetchProductoMarketById, fetchProductoSecondHandById, type ProductoMarket, type ProductoSecondHand } from '../services/productosApi';
import { crearOrden, type CrearOrdenData } from '../services/ordenesApi';
import '../../styles/oddy.css';

interface CarritoItemCompleto extends CarritoItem {
  producto?: ProductoMarket | ProductoSecondHand;
}

const fmtNum = (n: number) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CarritoItemCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario
  const [formData, setFormData] = useState<CrearOrdenData>({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    pais: 'Uruguay',
    notas: '',
    metodo_pago: 'transferencia',
    envio: 0,
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    const cargarCarrito = async () => {
      try {
        setLoading(true);
        const carritoItems = await getCarrito();
        
        if (carritoItems.length === 0) {
          navigate('/carrito');
          return;
        }
        
        const itemsCompletos = await Promise.all(
          carritoItems.map(async (item) => {
            try {
              const producto = item.producto_tipo === 'market'
                ? await fetchProductoMarketById(item.producto_id)
                : await fetchProductoSecondHandById(item.producto_id);
              
              return { ...item, producto: producto || undefined };
            } catch (err) {
              console.error(`Error cargando producto ${item.producto_id}:`, err);
              return { ...item, producto: undefined };
            }
          })
        );
        
        setItems(itemsCompletos);
      } catch (err) {
        console.error('Error cargando carrito:', err);
        setError('Error al cargar el carrito');
      } finally {
        setLoading(false);
      }
    };

    cargarCarrito();
  }, [navigate]);

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombre_completo.trim() || formData.nombre_completo.trim().length < 2) {
      nuevosErrores.nombre_completo = 'El nombre completo es requerido (mínimo 2 caracteres)';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'Email inválido';
    }
    if (!formData.direccion.trim() || formData.direccion.trim().length < 5) {
      nuevosErrores.direccion = 'La dirección es requerida (mínimo 5 caracteres)';
    }
    if (!formData.ciudad.trim() || formData.ciudad.trim().length < 2) {
      nuevosErrores.ciudad = 'La ciudad es requerida';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      const orden = await crearOrden(formData);
      navigate(`/orden/${orden.id}`, { state: { orden } });
    } catch (err) {
      console.error('Error creando orden:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la orden. Intenta nuevamente.');
      setProcesando(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  const impuestos = subtotal * 0.22;
  const envio = formData.envio || 0;
  const total = subtotal + impuestos + envio;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      <header style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/carrito')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#222',
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ← Volver al carrito
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#222' }}>Checkout</h1>

        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Formulario */}
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#222' }}>Información de Contacto</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errores.nombre_completo ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                    required
                  />
                  {errores.nombre_completo && (
                    <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errores.nombre_completo}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errores.email ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                    required
                  />
                  {errores.email && (
                    <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errores.email}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#222' }}>Dirección de Envío</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errores.direccion ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                    required
                  />
                  {errores.direccion && (
                    <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errores.direccion}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: errores.ciudad ? '1px solid #EF4444' : '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '1rem',
                      }}
                      required
                    />
                    {errores.ciudad && (
                      <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {errores.ciudad}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_postal}
                      onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#222' }}>Método de Pago</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="metodo_pago"
                    value="transferencia"
                    checked={formData.metodo_pago === 'transferencia'}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  />
                  <span>Transferencia Bancaria</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="metodo_pago"
                    value="tarjeta"
                    checked={formData.metodo_pago === 'tarjeta'}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  />
                  <span>Tarjeta de Crédito/Débito</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="metodo_pago"
                    value="efectivo"
                    checked={formData.metodo_pago === 'efectivo'}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  />
                  <span>Efectivo</span>
                </label>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#222' }}>Notas Adicionales</h2>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Instrucciones especiales, comentarios, etc."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Resumen */}
          <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#222' }}>Resumen del Pedido</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {items.map((item) => {
                  const producto = item.producto;
                  const nombre = producto?.nombre || 'Producto no disponible';
                  const precioTotal = item.precio_unitario * item.cantidad;

                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#6B7280' }}>
                        {nombre} × {item.cantidad}
                      </span>
                      <span style={{ color: '#222', fontWeight: '600' }}>{fmtNum(precioTotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>Subtotal</span>
                    <span>{fmtNum(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>IVA (22%)</span>
                    <span>{fmtNum(impuestos)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>Envío</span>
                    <span>{envio === 0 ? 'Gratis' : fmtNum(envio)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', color: '#222' }}>
                      <span>Total</span>
                      <span>{fmtNum(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={procesando}
              style={{
                width: '100%',
                padding: '1rem',
                background: procesando ? '#D1D5DB' : '#FF6835',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: procesando ? 'not-allowed' : 'pointer',
              }}
            >
              {procesando ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
