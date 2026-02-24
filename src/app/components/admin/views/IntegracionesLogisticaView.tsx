/**
 * 🚚 Integraciones Logística
 * Carriers, Google Maps Platform y rutas — Uruguay first, Latam progresivo
 * "Sin API": configuración de URL de tracking + ingreso manual de código
 */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { ExternalLink, Settings2, CheckCircle2, AlertCircle, Clock, Zap, Link2, Copy, Check, Map, Key } from 'lucide-react';
import { Truck } from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }
const ORANGE = '#FF6835';

type Status = 'connected' | 'sandbox' | 'pending' | 'coming-soon';
type Region = 'uy' | 'ar' | 'global';
type ApiMode = 'api' | 'no-api';

interface Carrier {
  id: string; emoji: string; name: string;
  description: string; countries: string[];
  region: Region; apiMode: ApiMode; status: Status;
  badge?: string; recommended?: boolean;
  trackingUrlPattern?: string;   // for no-api: e.g. https://track.carrier.com/{codigo}
  docsUrl?: string;
}

const CARRIERS: Carrier[] = [
  // ── Uruguay · Con API ────────────────────────────
  {
    id: 'brixo', emoji: '🟣', name: 'Brixo',
    description: 'Logística urbana en Uruguay. API REST para creación de envíos, tracking en tiempo real y webhooks de estado.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'api', status: 'pending',
    recommended: true,
    docsUrl: 'https://brixo.com.uy',
  },
  {
    id: 'moviapp', emoji: '🔵', name: 'MoviMiento',
    description: 'Plataforma de última milla en Montevideo. API para despachar y rastrear envíos en el día.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'api', status: 'pending',
    docsUrl: 'https://movimiento.com.uy',
  },
  {
    id: 'pedidosya', emoji: '🟡', name: 'PedidosYa Envíos',
    description: 'Servicio de envíos de PedidosYa. Cobertura en Montevideo y ciudades principales.',
    countries: ['🇺🇾', '🇦🇷'], region: 'uy', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developers.pedidosya.com',
  },
  {
    id: 'gexpress', emoji: '🟢', name: 'GexPress',
    description: 'Distribución y logística nacional en Uruguay. API disponible para grandes volúmenes.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'api', status: 'pending',
  },
  // ── Uruguay · Sin API ─────────────────────────────
  {
    id: 'correo-uy', emoji: '🔴', name: 'Correo Uruguayo',
    description: 'Servicio postal oficial de Uruguay. Cobertura nacional. Tracking disponible en web.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Tracking manual',
    trackingUrlPattern: 'https://www.correo.com.uy/sitio/online/seguimiento/{codigo}',
  },
  {
    id: 'oca-uy', emoji: '🟠', name: 'OCA (Uruguay)',
    description: 'Red de envíos de OCA en Uruguay. Amplia cobertura en todo el país.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Tracking manual',
    trackingUrlPattern: 'https://www.oca.com.uy/tracking?nro={codigo}',
  },
  {
    id: 'mosca', emoji: '⚫', name: 'Mosca',
    description: 'Empresa de transporte terrestre nacional. Sin API pública, gestión manual de envíos.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Sin tracking web',
  },
  {
    id: 'copasa', emoji: '🔵', name: 'Copasa',
    description: 'Transporte de mercancías en el interior del país.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Tracking manual',
  },
  // ── Argentina ─────────────────────────────────────
  {
    id: 'andreani', emoji: '🔵', name: 'Andreani',
    description: 'La empresa de logística más grande de Argentina. API robusta con tracking y webhooks.',
    countries: ['🇦🇷'], region: 'ar', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developers.andreani.com',
  },
  {
    id: 'correo-ar', emoji: '🔵', name: 'Correo Argentino',
    description: 'Servicio postal oficial de Argentina. Cobertura nacional total.',
    countries: ['🇦🇷'], region: 'ar', apiMode: 'no-api', status: 'pending',
    trackingUrlPattern: 'https://www.correoargentino.com.ar/formularios/ondp?id={codigo}',
  },
  // ── Global ─────────────────────────────────────────
  {
    id: 'fedex', emoji: '🟣', name: 'FedEx',
    description: 'Envíos internacionales con API completa, generación de guías y tracking en tiempo real.',
    countries: ['🌎'], region: 'global', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developer.fedex.com',
  },
  {
    id: 'dhl', emoji: '🔴', name: 'DHL',
    description: 'Logística internacional. API para cotización, generación de envíos y tracking.',
    countries: ['🌎'], region: 'global', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developer.dhl.com',
  },
  {
    id: 'ups', emoji: '🟤', name: 'UPS',
    description: 'Envíos internacionales con API completa y cobertura global extendida.',
    countries: ['🌎'], region: 'global', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developer.ups.com',
  },
];

/* ── Google Maps Platform APIs ──────────────────────────────────────────── */
interface GoogleApi {
  id: string; emoji: string; name: string;
  description: string; unlocks: string[];
  docsUrl: string; required: boolean;
}

const GOOGLE_APIS: GoogleApi[] = [
  {
    id: 'maps-js', emoji: '🗺️', name: 'Maps JavaScript API',
    description: 'Renderizá mapas interactivos en el módulo Mapa de Envíos, tracking en vivo de repartidores y visualización de zonas de cobertura.',
    unlocks: ['Mapa de Envíos', 'Zonas de cobertura', 'Tracking en vivo'],
    docsUrl: 'https://developers.google.com/maps/documentation/javascript',
    required: true,
  },
  {
    id: 'geocoding', emoji: '📍', name: 'Geocoding API',
    description: 'Convierte automáticamente las direcciones de tus clientes en coordenadas lat/lng para geocodificar domicilios al crear pedidos.',
    unlocks: ['Geocodificado de domicilios', 'Validación de direcciones', 'Coordenadas en pedidos'],
    docsUrl: 'https://developers.google.com/maps/documentation/geocoding',
    required: true,
  },
  {
    id: 'places', emoji: '🔍', name: 'Places API',
    description: 'Autocompletado de direcciones al cargar un pedido o registrar un cliente. Reduce errores y acelera la carga de datos.',
    unlocks: ['Autocompletado de dirección', 'Búsqueda de sucursales', 'Datos de lugar'],
    docsUrl: 'https://developers.google.com/maps/documentation/places/web-service',
    required: true,
  },
  {
    id: 'distance-matrix', emoji: '📐', name: 'Distance Matrix API',
    description: 'Calcula distancias y tiempos de viaje entre múltiples orígenes y destinos. Esencial para cotizar envíos y optimizar asignación de repartidores.',
    unlocks: ['Cotización de envíos', 'Tiempo estimado de entrega', 'Asignación de repartidores'],
    docsUrl: 'https://developers.google.com/maps/documentation/distance-matrix',
    required: false,
  },
  {
    id: 'directions', emoji: '🧭', name: 'Directions API',
    description: 'Genera la ruta óptima para los repartidores incluyendo múltiples paradas ordenadas. Integración con el módulo de Rutas.',
    unlocks: ['Rutas de reparto', 'Múltiples paradas', 'Optimización de orden'],
    docsUrl: 'https://developers.google.com/maps/documentation/directions',
    required: false,
  },
  {
    id: 'routes', emoji: '🛣️', name: 'Routes API',
    description: 'La nueva generación de Directions. Soporta optimización avanzada de waypoints, tráfico en tiempo real y preferencias de ruta (peajes, autopistas).',
    unlocks: ['Rutas avanzadas', 'Tráfico en tiempo real', 'Optimización de waypoints'],
    docsUrl: 'https://developers.google.com/maps/documentation/routes',
    required: false,
  },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string; Icon: any }> = {
  connected:     { label: 'Conectado',   color: '#10B981', bg: '#D1FAE5', Icon: CheckCircle2 },
  sandbox:       { label: 'Sandbox',     color: '#F59E0B', bg: '#FEF3C7', Icon: AlertCircle  },
  pending:       { label: 'Sin conectar',color: '#9CA3AF', bg: '#F3F4F6', Icon: Clock        },
  'coming-soon': { label: 'Próximamente',color: '#3B82F6', bg: '#DBEAFE', Icon: Zap          },
};

type RegionFilter = 'all' | 'uy' | 'ar' | 'global';
type ApiFilter = 'all' | 'api' | 'no-api';

export function IntegracionesLogisticaView({ onNavigate }: Props) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [apiFilter, setApiFilter]       = useState<ApiFilter>('all');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [trackingUrls, setTrackingUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googlePanelOpen, setGooglePanelOpen] = useState(false);
  const [googleSaved, setGoogleSaved]   = useState(false);

  const filtered = CARRIERS.filter(c => {
    const regionOk = regionFilter === 'all' || c.region === regionFilter;
    const apiOk    = apiFilter === 'all' || c.apiMode === apiFilter;
    return regionOk && apiOk;
  });

  const noApiCarriers = filtered.filter(c => c.apiMode === 'no-api');
  const apiCarriers   = filtered.filter(c => c.apiMode === 'api');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleGoogleSave = () => {
    if (!googleApiKey.trim()) return;
    setGoogleSaved(true);
    setTimeout(() => setGoogleSaved(false), 2500);
  };

  const CarrierCard = ({ carrier }: { carrier: Carrier }) => {
    const sm = STATUS_META[carrier.status];
    const SIcon = sm.Icon;
    const isExp = expandedId === carrier.id;

    return (
      <div style={{
        backgroundColor: '#fff', borderRadius: 14,
        border: carrier.recommended ? `1.5px solid ${ORANGE}` : '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: carrier.recommended ? `0 0 0 4px ${ORANGE}12` : 'none',
      }}>
        <div style={{ height: 3, backgroundColor: carrier.apiMode === 'api' ? '#10B981' : '#F59E0B' }} />
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {carrier.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>{carrier.name}</span>
                {carrier.recommended && (
                  <span style={{ padding: '2px 7px', backgroundColor: `${ORANGE}18`, color: ORANGE, borderRadius: 4, fontSize: '0.62rem', fontWeight: '700' }}>⭐ Recomendado</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {carrier.countries.map((c, i) => <span key={i} style={{ fontSize: '0.75rem' }}>{c}</span>)}
                <span style={{
                  padding: '1px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: '700',
                  backgroundColor: carrier.apiMode === 'api' ? '#D1FAE5' : '#FEF3C7',
                  color: carrier.apiMode === 'api' ? '#10B981' : '#92400E',
                }}>
                  {carrier.apiMode === 'api' ? '⚡ Con API' : '🔗 Sin API'}
                </span>
              </div>
            </div>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5 }}>{carrier.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', backgroundColor: sm.bg, color: sm.color, borderRadius: 20, fontSize: '0.7rem', fontWeight: '700' }}>
              <SIcon size={11} /> {sm.label}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {carrier.docsUrl && (
                <a href={carrier.docsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontSize: '0.72rem', fontWeight: '600', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> Docs
                </a>
              )}
              <button onClick={() => setExpandedId(isExp ? null : carrier.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', backgroundColor: ORANGE, color: '#fff', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                <Settings2 size={11} /> {carrier.apiMode === 'api' ? 'Conectar' : 'Configurar'}
              </button>
            </div>
          </div>

          {/* Config panel */}
          {isExp && (
            <div style={{ marginTop: 14, padding: '14px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              {carrier.apiMode === 'api' ? (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>Credenciales API — {carrier.name}</p>
                  {['API Key / Client ID', 'Secret / Token'].map((field, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field}</label>
                      <input type={i === 1 ? 'password' : 'text'} placeholder={`${field}...`}
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 7, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                        onFocus={e => (e.target.style.borderColor = ORANGE)}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>Configuración de seguimiento — {carrier.name}</p>
                  <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#6B7280' }}>Usá <code style={{ backgroundColor: '#E5E7EB', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>{'{codigo}'}</code> como placeholder del número de seguimiento.</p>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL de Tracking</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={trackingUrls[carrier.id] ?? carrier.trackingUrlPattern ?? ''}
                        onChange={e => setTrackingUrls(p => ({ ...p, [carrier.id]: e.target.value }))}
                        placeholder="https://tracking.carrier.com/{codigo}"
                        style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 7, fontSize: '0.78rem', outline: 'none', backgroundColor: '#fff', fontFamily: 'monospace' }}
                        onFocus={e => (e.target.style.borderColor = '#F59E0B')}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                      <button onClick={() => handleCopy(carrier.id, trackingUrls[carrier.id] ?? carrier.trackingUrlPattern ?? '')}
                        style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#374151', fontSize: '0.72rem' }}>
                        {copiedId === carrier.id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  {/* Preview */}
                  {(trackingUrls[carrier.id] ?? carrier.trackingUrlPattern) && (
                    <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#FEF9C3', borderRadius: 7, fontSize: '0.72rem', color: '#92400E' }}>
                      <strong>Preview:</strong>{' '}
                      <code style={{ fontFamily: 'monospace' }}>
                        {(trackingUrls[carrier.id] ?? carrier.trackingUrlPattern ?? '').replace('{codigo}', 'UY1234567890')}
                      </code>
                    </div>
                  )}
                </>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={{ flex: 1, padding: '8px', backgroundColor: ORANGE, color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                  Guardar configuración
                </button>
                <button onClick={() => setExpandedId(null)}
                  style={{ padding: '8px 12px', backgroundColor: '#fff', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.78rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Truck}
        title="Logística"
        subtitle="Carriers, Google Maps Platform y rutas — Uruguay first, Latam progresivo"
        actions={[{ label: '← Integraciones', onClick: () => onNavigate('integraciones') }]}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: '#F8F9FA' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Carriers disponibles', value: CARRIERS.length,                                         color: '#111827' },
            { label: 'Google APIs',           value: GOOGLE_APIS.length,                                     color: '#4285F4' },
            { label: 'Con API',               value: CARRIERS.filter(c => c.apiMode === 'api').length,       color: '#10B981' },
            { label: 'Uruguay 🇺🇾',            value: CARRIERS.filter(c => c.region === 'uy').length,        color: ORANGE },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            GOOGLE MAPS PLATFORM
        ══════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 28 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, backgroundColor: '#EFF6FF' }}>
                <Map size={14} color="#4285F4" />
              </span>
              Google Maps Platform — Mapas, Rutas y Geocoding
            </h3>
            <button
              onClick={() => setGooglePanelOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                backgroundColor: googleSaved ? '#10B981' : '#4285F4',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: '700', transition: 'background 0.2s',
              }}
            >
              <Key size={13} />
              {googleSaved ? '✓ API Key guardada' : googlePanelOpen ? 'Cerrar' : 'Configurar API Key'}
            </button>
          </div>

          {/* Google API Key callout */}
          <div style={{ marginBottom: 14, padding: '12px 18px', backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: '1.1rem', marginTop: 1 }}>🔑</span>
            <div>
              <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1D4ED8' }}>Una sola API Key activa todas las APIs de Google Maps</span>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#1E40AF', lineHeight: 1.5 }}>
                Activá las APIs que necesitás en{' '}
                <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#2563EB', fontWeight: '700' }}>Google Cloud Console</a>
                {' '}y pegá tu API Key acá. Las APIs marcadas con <strong>★ Esencial</strong> son necesarias para el funcionamiento básico del módulo de envíos.
              </p>
            </div>
          </div>

          {/* API Key config panel */}
          {googlePanelOpen && (
            <div style={{ marginBottom: 16, padding: '18px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1.5px solid #BFDBFE' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: '700', color: '#1D4ED8' }}>Google Maps Platform — API Key</p>
              <p style={{ margin: '0 0 14px', fontSize: '0.74rem', color: '#6B7280' }}>
                Creá una API Key en{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>
                  console.cloud.google.com/apis/credentials
                </a>
                {' '}y restringila a los dominios de tu app.
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key</label>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={e => setGoogleApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', backgroundColor: '#F9FAFB' }}
                  onFocus={e => (e.target.style.borderColor = '#4285F4')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
              <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>APIs a activar en Google Cloud Console:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {GOOGLE_APIS.map(api => (
                    <span key={api.id} style={{
                      padding: '3px 9px', borderRadius: 4, fontSize: '0.68rem', fontWeight: '600',
                      backgroundColor: api.required ? '#DBEAFE' : '#F3F4F6',
                      color: api.required ? '#1D4ED8' : '#6B7280',
                    }}>
                      {api.required ? '★ ' : ''}{api.name}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleGoogleSave}
                  disabled={!googleApiKey.trim()}
                  style={{ flex: 1, padding: '9px', backgroundColor: googleApiKey.trim() ? '#4285F4' : '#E5E7EB', color: googleApiKey.trim() ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: '700', cursor: googleApiKey.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Guardar API Key y probar conexión
                </button>
                <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 8, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.78rem', fontWeight: '600', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> Cloud Console
                </a>
              </div>
            </div>
          )}

          {/* Google API cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {GOOGLE_APIS.map(api => (
              <div key={api.id} style={{
                backgroundColor: '#fff', borderRadius: 12,
                border: api.required ? '1.5px solid #BFDBFE' : '1px solid #E5E7EB',
                overflow: 'hidden',
              }}>
                <div style={{ height: 3, backgroundColor: api.required ? '#4285F4' : '#9CA3AF' }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 8 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {api.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', color: '#111827', fontSize: '0.9rem' }}>{api.name}</span>
                        {api.required && (
                          <span style={{ padding: '1px 7px', backgroundColor: '#DBEAFE', color: '#1D4ED8', borderRadius: 4, fontSize: '0.6rem', fontWeight: '800' }}>★ ESENCIAL</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.5 }}>{api.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {api.unlocks.map(u => (
                      <span key={u} style={{ padding: '2px 8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: 4, fontSize: '0.66rem', fontWeight: '600' }}>
                        🔓 {u}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', color: googleSaved ? '#10B981' : '#9CA3AF', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {googleSaved ? <><CheckCircle2 size={12} /> Activa</> : <><Clock size={12} /> Sin API Key</>}
                    </span>
                    <a href={api.docsUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontSize: '0.7rem', fontWeight: '600', textDecoration: 'none' }}>
                      <ExternalLink size={10} /> Docs
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* "Sin API" info callout */}
        <div style={{ marginBottom: 20, padding: '12px 18px', backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link2 size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#92400E' }}>Carriers sin API</span>
            <span style={{ fontSize: '0.8rem', color: '#78350F', marginLeft: 8 }}>
              Configurá la URL de tracking del carrier y nosotros armamos el link automático para el comprador. Sin webhooks, sin código.
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6B7280', alignSelf: 'center', marginRight: 4 }}>País:</span>
          {(['all','uy','ar','global'] as RegionFilter[]).map(f => (
            <button key={f} onClick={() => setRegionFilter(f)}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${regionFilter === f ? '#10B981' : '#E5E7EB'}`, cursor: 'pointer', backgroundColor: regionFilter === f ? '#10B981' : '#fff', color: regionFilter === f ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: '600' }}>
              {{ all: 'Todos', uy: '🇺🇾 Uruguay', ar: '🇦🇷 Argentina', global: '🌎 Global' }[f]}
            </button>
          ))}
          <div style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', alignSelf: 'center', margin: '0 4px' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6B7280', alignSelf: 'center', marginRight: 4 }}>Tipo:</span>
          {(['all','api','no-api'] as ApiFilter[]).map(f => (
            <button key={f} onClick={() => setApiFilter(f)}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${apiFilter === f ? '#1F2937' : '#E5E7EB'}`, cursor: 'pointer', backgroundColor: apiFilter === f ? '#1F2937' : '#fff', color: apiFilter === f ? '#fff' : '#374151', fontSize: '0.78rem', fontWeight: '600' }}>
              {{ all: 'Todos', api: '⚡ Con API', 'no-api': '🔗 Sin API' }[f]}
            </button>
          ))}
        </div>

        {/* Con API section */}
        {apiCarriers.length > 0 && (
          <>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} /> Con API — Tracking automático
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 28 }}>
              {apiCarriers.map(c => <CarrierCard key={c.id} carrier={c} />)}
            </div>
          </>
        )}

        {/* Sin API section */}
        {noApiCarriers.length > 0 && (
          <>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} /> Sin API — Tracking manual con URL configurable
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {noApiCarriers.map(c => <CarrierCard key={c.id} carrier={c} />)}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🔍</p>
            <p style={{ fontWeight: '600' }}>Sin resultados para ese filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}