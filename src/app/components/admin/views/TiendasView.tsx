/* =====================================================
   TiendasView — Vista de tiendas con tarjetas
   Doble clic en tarjeta abre la tienda en el navegador
   ===================================================== */
import React, { useState } from 'react';
import { Store, ExternalLink, Plus, X } from 'lucide-react';
import type { MainSection } from '../../../AdminDashboard';

const ORANGE = '#FF6835';

interface Tienda {
  id: string;
  nombre: string;
  url: string;
  descripcion?: string;
  color?: string;
  icono?: string;
}

interface Props {
  onNavigate: (s: MainSection) => void;
}

// Datos iniciales vacíos - el usuario agregará sus propias tiendas
const TIENDAS_INICIALES: Tienda[] = [];

export function TiendasView({ onNavigate }: Props) {
  const [tiendas, setTiendas] = useState<Tienda[]>(TIENDAS_INICIALES);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaTienda, setNuevaTienda] = useState<Partial<Tienda>>({
    nombre: '',
    url: '',
    descripcion: '',
    color: '#FF6835',
  });

  const handleDoubleClick = (url: string) => {
    if (!url) {
      console.error('URL no válida');
      return;
    }
    
    try {
      // Asegurar que la URL tenga protocolo
      let urlToOpen = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToOpen = `https://${url}`;
      }
      
      const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        // Si el navegador bloquea la ventana, intentar con location
        window.location.href = urlToOpen;
      }
    } catch (error) {
      console.error('Error al abrir la tienda:', error);
      alert(`Error al abrir la tienda: ${url}`);
    }
  };

  const handleAgregarTienda = () => {
    if (nuevaTienda.nombre && nuevaTienda.url) {
      const tienda: Tienda = {
        id: Date.now().toString(),
        nombre: nuevaTienda.nombre,
        url: nuevaTienda.url.startsWith('http') ? nuevaTienda.url : `https://${nuevaTienda.url}`,
        descripcion: nuevaTienda.descripcion || '',
        color: nuevaTienda.color || '#FF6835',
      };
      setTiendas([...tiendas, tienda]);
      setNuevaTienda({ nombre: '', url: '', descripcion: '', color: '#FF6835' });
      setMostrarModal(false);
    }
  };

  const handleEliminarTienda = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTiendas(tiendas.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '28px 32px 20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #E9ECEF',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Store size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1A1A2E' }}>
                Tiendas
              </h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6C757D' }}>
                Haz doble clic en una tarjeta para abrir la tienda en el navegador
              </p>
            </div>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: ORANGE,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#e04e20';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = ORANGE;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            Agregar Tienda
          </button>
        </div>
      </div>

      {/* ── Contenido scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {tiendas.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <Store size={48} color="#ADB5BD" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#6C757D', margin: '0 0 8px' }}>
              No hay tiendas agregadas
            </p>
            <p style={{ fontSize: '0.9rem', color: '#ADB5BD', margin: 0 }}>
              Haz clic en "Agregar Tienda" para comenzar
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {tiendas.map(tienda => (
              <div
                key={tienda.id}
                onDoubleClick={() => handleDoubleClick(tienda.url)}
                style={{
                  background: '#fff',
                  border: '1px solid #E9ECEF',
                  borderRadius: '16px',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-3px)';
                  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  el.style.borderColor = tienda.color || ORANGE;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  el.style.borderColor = '#E9ECEF';
                }}
              >
                {/* Header con color */}
                <div style={{
                  background: `linear-gradient(135deg, ${tienda.color || ORANGE} 0%, ${tienda.color || ORANGE}dd 100%)`,
                  padding: '22px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Store size={22} color="#fff" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: '800' }}>
                      {tienda.nombre}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEliminarTienda(tienda.id, e);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                      position: 'relative',
                      zIndex: 10,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)';
                    }}
                    title="Eliminar tienda"
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 24px 20px' }}>
                  {tienda.descripcion && (
                    <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: '#6C757D', lineHeight: '1.5' }}>
                      {tienda.descripcion}
                    </p>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#6C757D',
                    wordBreak: 'break-all',
                  }}>
                    <ExternalLink size={14} />
                    <span>{tienda.url}</span>
                  </div>
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: tienda.color || ORANGE,
                  }}>
                    Doble clic para abrir →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Agregar Tienda ── */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setMostrarModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: '800', color: '#1A1A2E' }}>
              Agregar Nueva Tienda
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  Nombre de la tienda *
                </label>
                <input
                  type="text"
                  value={nuevaTienda.nombre || ''}
                  onChange={e => setNuevaTienda({ ...nuevaTienda, nombre: e.target.value })}
                  placeholder="Ej: Tienda Principal"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = ORANGE}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  URL de la tienda *
                </label>
                <input
                  type="text"
                  value={nuevaTienda.url || ''}
                  onChange={e => setNuevaTienda({ ...nuevaTienda, url: e.target.value })}
                  placeholder="Ej: https://mitienda.com o mitienda.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = ORANGE}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={nuevaTienda.descripcion || ''}
                  onChange={e => setNuevaTienda({ ...nuevaTienda, descripcion: e.target.value })}
                  placeholder="Breve descripción de la tienda"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = ORANGE}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  Color de la tarjeta
                </label>
                <input
                  type="color"
                  value={nuevaTienda.color || ORANGE}
                  onChange={e => setNuevaTienda({ ...nuevaTienda, color: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setNuevaTienda({ nombre: '', url: '', descripcion: '', color: ORANGE });
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    color: '#6C757D',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarTienda}
                  disabled={!nuevaTienda.nombre || !nuevaTienda.url}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: (!nuevaTienda.nombre || !nuevaTienda.url) ? '#D1D5DB' : ORANGE,
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: (!nuevaTienda.nombre || !nuevaTienda.url) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (nuevaTienda.nombre && nuevaTienda.url) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#e04e20';
                    }
                  }}
                  onMouseLeave={e => {
                    if (nuevaTienda.nombre && nuevaTienda.url) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = ORANGE;
                    }
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
