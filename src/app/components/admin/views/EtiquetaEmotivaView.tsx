/* =====================================================
   Etiqueta Emotiva — Módulo de Marketing
   Mensajes personalizados con QR para envíos
   ===================================================== */
import React, { useState, useEffect, useCallback } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import { QrCodeDisplay, downloadQrPng, generateQrDataUrl } from '../QrCodeDisplay';
import type { MainSection } from '../../../AdminDashboard';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import {
  Gift, Heart, Star, Coffee, Package, Sparkles, Sun,
  TreePine, Music, Award, Smile, Home, QrCode, Plus,
  ChevronRight, CheckCircle, Clock, Eye, Trash2, Copy,
  Download, Printer, RefreshCw, ArrowLeft, ArrowRight,
  User, Send, MessageSquare, Cake, Wine, Flower,
  X, ExternalLink,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const API     = `https://${projectId}.supabase.co/functions/v1/make-server-75638143`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ORANGE  = '#FF6835';

/* ── Tipos ── */
interface Etiqueta {
  token: string;
  envio_numero: string;
  remitente_nombre: string;
  destinatario_nombre: string;
  destinatario_email: string;
  destinatario_tel: string;
  mensaje: string;
  icono: string;
  ocasion: string;
  formato: string;
  estado: 'pendiente' | 'escaneada' | 'respondida';
  scanned_at: string | null;
  respuesta: string | null;
  respuesta_nombre: string | null;
  respondida_at: string | null;
  optin_contacto: string | null;
  created_at: string;
}

type Tab = 'resumen' | 'etiquetas' | 'nueva';
type Step = 1 | 2 | 3 | 4;

/* ── Iconos para impresión térmica ── */
const ICONOS = [
  { id: 'gift',     Icon: Gift,     label: 'Regalo',       cat: 'general'    },
  { id: 'heart',    Icon: Heart,    label: 'Afecto',       cat: 'general'    },
  { id: 'star',     Icon: Star,     label: 'Celebración',  cat: 'general'    },
  { id: 'sparkles', Icon: Sparkles, label: 'Especial',     cat: 'general'    },
  { id: 'smile',    Icon: Smile,    label: 'Amistad',      cat: 'general'    },
  { id: 'award',    Icon: Award,    label: 'Logro',        cat: 'corporativo'},
  { id: 'home',     Icon: Home,     label: 'Hogar',        cat: 'corporativo'},
  { id: 'coffee',   Icon: Coffee,   label: 'Casual',       cat: 'general'    },
  { id: 'wine',     Icon: Wine,     label: 'Gourmet',      cat: 'canastas'   },
  { id: 'package',  Icon: Package,  label: 'Canasta',      cat: 'canastas'   },
  { id: 'flower',   Icon: Flower,   label: 'Natural',      cat: 'canastas'   },
  { id: 'treepine', Icon: TreePine, label: 'Navidad',      cat: 'fiestas'    },
  { id: 'cake',     Icon: Cake,     label: 'Cumpleaños',   cat: 'fiestas'    },
  { id: 'sun',      Icon: Sun,      label: 'Verano',       cat: 'fiestas'    },
  { id: 'music',    Icon: Music,    label: 'Fiesta',       cat: 'fiestas'    },
  { id: 'send',     Icon: Send,     label: 'Corporativo',  cat: 'corporativo'},
];

/* ── Sugerencias IA por ocasión ── */
const SUGERENCIAS: Record<string, string[]> = {
  navidad: [
    '{name}, que esta Navidad llegue cargada de todo lo que merecés. Con cariño, {remitente}',
    '{name}, te enviamos este regalo con mucha gratitud. ¡Felices Fiestas para vos y tu familia! {remitente}',
    '{name}, gracias por ser parte de este año especial. Que la magia de las fiestas ilumine tu hogar. {remitente}',
  ],
  cumpleanos: [
    '{name}, ¡Feliz cumpleaños! Este regalo viene con todo el cariño y los mejores deseos. {remitente}',
    '{name}, hoy es tu día y queremos celebrarlo con vos. ¡Que sea un año lleno de logros! {remitente}',
    '{name}, los años te sientan de maravilla. ¡Feliz cumpleaños con todo nuestro afecto! {remitente}',
  ],
  agradecimiento: [
    '{name}, gracias por tu confianza y apoyo. Este detalle es una muestra de todo lo que significás para nosotros. {remitente}',
    '{name}, trabajar con vos es un genuino placer. Gracias por este año compartido. {remitente}',
    '{name}, tu apoyo hace la diferencia. Recibí este regalo como símbolo de nuestra gratitud. {remitente}',
  ],
  corporativo: [
    '{name}, en nombre de todo el equipo, gracias por este año. Seguimos construyendo juntos. {remitente}',
    '{name}, valoramos enormemente tu relación con nosotros. Que este detalle refleje nuestra estima. {remitente}',
    '{name}, la confianza que depositaste en nosotros nos impulsa cada día. Muchas gracias. {remitente}',
  ],
  general: [
    '{name}, pensamos en vos al preparar este envío. Esperamos que lo disfrutes. {remitente}',
    '{name}, con mucho cariño para vos. Que llegue con toda la buena onda. {remitente}',
    '{name}, este paquete viene cargado de cariño genuino. ¡Que lo disfrutes! {remitente}',
  ],
};

const OCASIONES = [
  { id: 'general',        label: 'General'        },
  { id: 'navidad',        label: 'Navidad / Fiestas' },
  { id: 'cumpleanos',     label: 'Cumpleaños'     },
  { id: 'agradecimiento', label: 'Agradecimiento' },
  { id: 'corporativo',    label: 'Corporativo'    },
];

const FORMATOS = [
  { id: 'etiqueta', label: 'Etiqueta Térmica',  desc: '100×150 mm — Impresión B&N', icon: Printer  },
  { id: 'tarjeta',  label: 'Tarjeta / PDF',     desc: 'A6 color — Para imprimir',   icon: Download },
  { id: 'embebido', label: 'QR Embebido',       desc: 'Solo el código para imprenta', icon: QrCode },
];

/* ── Estado config ── */
const ESTADO_CFG = {
  pendiente:  { label: 'Sin escanear', color: '#D97706', bg: '#FFFBEB', icon: Clock },
  escaneada:  { label: 'Escaneada',    color: '#2563EB', bg: '#EFF6FF', icon: Eye   },
  respondida: { label: 'Respondida',   color: '#059669', bg: '#F0FDF4', icon: CheckCircle },
};

/* ── Format date ── */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Replace placeholders ── */
function fillTemplate(tpl: string, name: string, remitente: string): string {
  return tpl.replace(/{name}/g, name || 'destinatario').replace(/{remitente}/g, remitente || 'Remitente');
}

/* ── Icon component helper ── */
function IconById({ id, size = 24, color = '#111', strokeWidth = 1.8 }: { id: string; size?: number; color?: string; strokeWidth?: number }) {
  const found = ICONOS.find(i => i.id === id);
  if (!found) return <Gift size={size} color={color} strokeWidth={strokeWidth} />;
  const { Icon } = found;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

/* ════════════════════════════════════════════════════
   MAIN VIEW
   ════════════════════════════════════════════════════ */
export function EtiquetaEmotivaView({ onNavigate }: Props) {
  const [tab, setTab]             = useState<Tab>('resumen');
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading]     = useState(true);
  const [detalle, setDetalle]     = useState<Etiqueta | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/etiquetas`, { headers: HEADERS });
      const data = await r.json();
      setEtiquetas(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Error cargando etiquetas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (nueva: Etiqueta) => {
    setEtiquetas(prev => [nueva, ...prev]);
    setTab('etiquetas');
    toast.success(`Etiqueta ${nueva.token} creada correctamente`);
  };

  const handleDelete = async (token: string) => {
    if (!confirm(`¿Eliminar etiqueta ${token}?`)) return;
    try {
      await fetch(`${API}/etiquetas/${token}`, { method: 'DELETE', headers: HEADERS });
      setEtiquetas(prev => prev.filter(e => e.token !== token));
      toast.success('Etiqueta eliminada');
    } catch (e) {
      toast.error('Error eliminando etiqueta');
    }
  };

  const kpis = {
    total:      etiquetas.length,
    escaneadas: etiquetas.filter(e => e.estado !== 'pendiente').length,
    respondidas:etiquetas.filter(e => e.estado === 'respondida').length,
    optins:     etiquetas.filter(e => e.optin_contacto).length,
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'resumen',   label: 'Resumen'        },
    { id: 'etiquetas', label: 'Mis Etiquetas'  },
    { id: 'nueva',     label: '+ Nueva Etiqueta' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={QrCode}
        title="Etiqueta Emotiva"
        subtitle="Mensajes personalizados con QR para tus envíos"
        actions={[
          { label: '← Marketing', onClick: () => onNavigate('marketing') },
          { label: 'Nueva Etiqueta', primary: true, onClick: () => setTab('nueva') },
        ]}
      />

      {/* Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', padding: '0 28px', flexShrink: 0 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px', border: 'none',
              borderBottom: `3px solid ${active ? ORANGE : 'transparent'}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              fontSize: '14px', fontWeight: active ? 700 : 500,
              color: active ? ORANGE : '#555',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 0 16px' }}>
          <button onClick={load} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        {tab === 'resumen'   && <TabResumen etiquetas={etiquetas} kpis={kpis} loading={loading} onVerDetalle={setDetalle} onNueva={() => setTab('nueva')} />}
        {tab === 'etiquetas' && <TabEtiquetas etiquetas={etiquetas} loading={loading} onDelete={handleDelete} onVerDetalle={setDetalle} />}
        {tab === 'nueva'     && <TabNueva onCreated={handleCreated} onCancel={() => setTab('resumen')} />}
      </div>

      {/* Modal detalle */}
      {detalle && <DetalleModal etiqueta={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB RESUMEN
   ════════════════════════════════════════════════════ */
function TabResumen({ etiquetas, kpis, loading, onVerDetalle, onNueva }: {
  etiquetas: Etiqueta[]; kpis: any; loading: boolean;
  onVerDetalle: (e: Etiqueta) => void; onNueva: () => void;
}) {
  const recientes = etiquetas.slice(0, 6);

  return (
    <div style={{ padding: '28px' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total enviadas',    value: kpis.total,       color: ORANGE,   Icon: QrCode      },
          { label: 'Escaneadas',        value: kpis.escaneadas,  color: '#2563EB', Icon: Eye         },
          { label: 'Respondidas',       value: kpis.respondidas, color: '#059669', Icon: MessageSquare},
          { label: 'Opt-ins capturados',value: kpis.optins,      color: '#8B5CF6', Icon: User        },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <k.Icon size={20} color={k.color} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#111', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tasas */}
      {kpis.total > 0 && (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px', marginBottom: '24px', display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Tasa de escaneo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '160px', height: '8px', backgroundColor: '#F0F0F0', borderRadius: '4px' }}>
                <div style={{ height: '100%', borderRadius: '4px', backgroundColor: '#2563EB', width: `${Math.round((kpis.escaneadas / kpis.total) * 100)}%` }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563EB' }}>{Math.round((kpis.escaneadas / kpis.total) * 100)}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Tasa de respuesta</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '160px', height: '8px', backgroundColor: '#F0F0F0', borderRadius: '4px' }}>
                <div style={{ height: '100%', borderRadius: '4px', backgroundColor: '#059669', width: `${Math.round((kpis.respondidas / kpis.total) * 100)}%` }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{Math.round((kpis.respondidas / kpis.total) * 100)}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Opt-in contacto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '160px', height: '8px', backgroundColor: '#F0F0F0', borderRadius: '4px' }}>
                <div style={{ height: '100%', borderRadius: '4px', backgroundColor: '#8B5CF6', width: `${Math.round((kpis.optins / kpis.total) * 100)}%` }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6' }}>{Math.round((kpis.optins / kpis.total) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Recientes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111' }}>Recientes</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Cargando...</div>
      ) : recientes.length === 0 ? (
        <EmptyState onNueva={onNueva} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {recientes.map(e => (
            <EtiquetaCard key={e.token} etiqueta={e} onVer={onVerDetalle} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Etiqueta Card ── */
function EtiquetaCard({ etiqueta: e, onVer }: { etiqueta: Etiqueta; onVer: (e: Etiqueta) => void }) {
  const cfg = ESTADO_CFG[e.estado];
  const StatusIcon = cfg.icon;
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '18px', cursor: 'pointer', transition: 'all 0.15s' }}
      onClick={() => onVer(e)}
      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (ev.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.boxShadow = 'none'; (ev.currentTarget as HTMLElement).style.transform = 'none'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconById id={e.icono} size={20} color={ORANGE} />
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg }}>
          <StatusIcon size={11} />{cfg.label}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '13px', color: ORANGE, marginBottom: '2px' }}>{e.token}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>Para: {e.destinatario_nombre}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {e.mensaje}
      </div>
      {e.respuesta && (
        <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '2px' }}>💬 Respuesta recibida</div>
          <div style={{ fontSize: '11px', color: '#374151' }}>{e.respuesta}</div>
        </div>
      )}
      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '10px' }}>{fmtDate(e.created_at)}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB ETIQUETAS
   ════════════════════════════════════════════════════ */
function TabEtiquetas({ etiquetas, loading, onDelete, onVerDetalle }: {
  etiquetas: Etiqueta[]; loading: boolean;
  onDelete: (token: string) => void; onVerDetalle: (e: Etiqueta) => void;
}) {
  const [filtro, setFiltro] = useState<'todos' | 'pendiente' | 'escaneada' | 'respondida'>('todos');
  const filtered = filtro === 'todos' ? etiquetas : etiquetas.filter(e => e.estado === filtro);

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['todos', 'pendiente', 'escaneada', 'respondida'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '7px 16px', border: `1.5px solid ${filtro === f ? ORANGE : '#E0E0E0'}`,
            borderRadius: '8px', backgroundColor: filtro === f ? '#FFF4EC' : '#fff',
            color: filtro === f ? ORANGE : '#555', cursor: 'pointer',
            fontSize: '13px', fontWeight: filtro === f ? 700 : 500,
          }}>
            {f === 'todos' ? 'Todas' : ESTADO_CFG[f].label}
            {' '}({f === 'todos' ? etiquetas.length : etiquetas.filter(e => e.estado === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>No hay etiquetas con ese filtro</div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}>
                {['Token', 'Remitente → Destinatario', 'Ocasión', 'Mensaje', 'Estado', 'Creada', 'QR', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cfg = ESTADO_CFG[e.estado];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={e.token} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }}
                    onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = '#FAFAFA')}
                    onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '14px', fontWeight: 700, fontSize: '13px', color: ORANGE }} onClick={() => onVerDetalle(e)}>{e.token}</td>
                    <td style={{ padding: '14px' }} onClick={() => onVerDetalle(e)}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{e.remitente_nombre}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>→ {e.destinatario_nombre}</div>
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px', color: '#555', textTransform: 'capitalize' }} onClick={() => onVerDetalle(e)}>
                      {OCASIONES.find(o => o.id === e.ocasion)?.label || e.ocasion}
                    </td>
                    <td style={{ padding: '14px', maxWidth: '200px' }} onClick={() => onVerDetalle(e)}>
                      <div style={{ fontSize: '12px', color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.mensaje}</div>
                    </td>
                    <td style={{ padding: '14px' }} onClick={() => onVerDetalle(e)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg }}>
                        <StatusIcon size={11} />{cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }} onClick={() => onVerDetalle(e)}>{fmtDate(e.created_at)}</td>
                    <td style={{ padding: '14px' }}>
                      <QrCodeDisplay value={`${window.location.origin}/m/${e.token}`} options={{ size: 48, margin: 1 }} style={{ borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button onClick={() => onDelete(e.token)} style={{ width: 30, height: 30, borderRadius: '8px', border: '1px solid #FEE2E2', backgroundColor: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB NUEVA — Wizard 4 pasos
   ════════════════════════════════════════════════════ */
function TabNueva({ onCreated, onCancel }: { onCreated: (e: Etiqueta) => void; onCancel: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  /* Datos del wizard */
  const [form, setForm] = useState({
    envio_numero:        '',
    remitente_nombre:    '',
    destinatario_nombre: '',
    destinatario_email:  '',
    destinatario_tel:    '',
    ocasion:             'general',
    mensaje:             '',
    icono:               'gift',
    formato:             'etiqueta',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const sugerencias = (SUGERENCIAS[form.ocasion] || SUGERENCIAS.general).map(s =>
    fillTemplate(s, form.destinatario_nombre, form.remitente_nombre)
  );

  const canNext: Record<Step, boolean> = {
    1: !!(form.remitente_nombre && form.destinatario_nombre),
    2: !!form.mensaje,
    3: !!(form.icono && form.formato),
    4: true,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/etiquetas`, { method: 'POST', headers: HEADERS, body: JSON.stringify(form) });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      onCreated(data);
    } catch (e) {
      toast.error(`Error al crear etiqueta: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  const STEPS_LABELS = ['Destinatario', 'Mensaje', 'Visual', 'Vista previa'];

  return (
    <div style={{ padding: '28px', maxWidth: '820px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {STEPS_LABELS.map((label, idx) => {
            const n = (idx + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: done ? '#059669' : active ? ORANGE : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {done ? <CheckCircle size={18} color="#fff" /> : <span style={{ fontSize: '14px', fontWeight: 700, color: active ? '#fff' : '#9CA3AF' }}>{n}</span>}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active ? ORANGE : done ? '#059669' : '#9CA3AF' }}>{label}</span>
                </div>
                {idx < STEPS_LABELS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', marginTop: '17px', backgroundColor: done ? '#059669' : '#E5E7EB', transition: 'all 0.2s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '32px', marginBottom: '24px' }}>
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} sugerencias={sugerencias} />}
        {step === 3 && <Step3 form={form} set={set} />}
        {step === 4 && <Step4 form={form} saving={saving} onSave={handleSave} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={step === 1 ? onCancel : () => setStep((step - 1) as Step)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', border: '1.5px solid #E0E0E0', borderRadius: '10px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#555' }}>
          <ArrowLeft size={15} /> {step === 1 ? 'Cancelar' : 'Anterior'}
        </button>
        {step < 4 ? (
          <button onClick={() => setStep((step + 1) as Step)} disabled={!canNext[step]} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 24px', border: 'none', borderRadius: '10px', backgroundColor: canNext[step] ? ORANGE : '#E5E7EB', color: canNext[step] ? '#fff' : '#9CA3AF', cursor: canNext[step] ? 'pointer' : 'default', fontSize: '14px', fontWeight: 700 }}>
            Siguiente <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 28px', border: 'none', borderRadius: '10px', backgroundColor: saving ? '#E5E7EB' : ORANGE, color: saving ? '#9CA3AF' : '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
            {saving ? 'Guardando...' : <><CheckCircle size={16} /> Crear Etiqueta</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Destinatario ── */
function Step1({ form, set }: { form: any; set: (k: string, v: string) => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#111' }}>¿Para quién es?</h3>
      <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280' }}>Completá los datos del remitente y destinatario</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Nombre del remitente *" value={form.remitente_nombre} onChange={v => set('remitente_nombre', v)} placeholder="Ej: Charlie, María García..." />
        <Field label="N° de envío (opcional)" value={form.envio_numero} onChange={v => set('envio_numero', v)} placeholder="Ej: PEDX15000-ENV001" />
        <Field label="Nombre del destinatario *" value={form.destinatario_nombre} onChange={v => set('destinatario_nombre', v)} placeholder="Ej: Sonnet, Pedro López..." />
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Ocasión</label>
          <select value={form.ocasion} onChange={e => set('ocasion', e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', color: '#111', backgroundColor: '#fff', outline: 'none' }}>
            {OCASIONES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <Field label="Email del destinatario (opcional)" value={form.destinatario_email} onChange={v => set('destinatario_email', v)} placeholder="ejemplo@email.com" type="email" />
        <Field label="Celular del destinatario (opcional)" value={form.destinatario_tel} onChange={v => set('destinatario_tel', v)} placeholder="+598 99 123 456" />
      </div>
    </div>
  );
}

/* ── Step 2: Mensaje ── */
function Step2({ form, set, sugerencias }: { form: any; set: (k: string, v: string) => void; sugerencias: string[] }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#111' }}>El mensaje</h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6B7280' }}>Elegí una sugerencia y editala como quieras, o escribí uno propio</p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>💡 Sugerencias para "{OCASIONES.find(o => o.id === form.ocasion)?.label}"</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sugerencias.map((s, i) => {
            const selected = form.mensaje === s;
            return (
              <button key={i} onClick={() => set('mensaje', s)} style={{ padding: '14px 16px', border: `2px solid ${selected ? ORANGE : '#E5E7EB'}`, borderRadius: '12px', backgroundColor: selected ? '#FFF4EC' : '#FAFAFA', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151', lineHeight: '1.55', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <span style={{ fontWeight: 700, color: selected ? ORANGE : '#9CA3AF', marginRight: '8px' }}>{i + 1}.</span>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
          Tu mensaje {form.mensaje && '(editá libremente)'}
        </label>
        <textarea
          value={form.mensaje}
          onChange={e => set('mensaje', e.target.value)}
          placeholder="Escribí tu mensaje personalizado..."
          rows={4}
          style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${form.mensaje ? ORANGE : '#E5E7EB'}`, borderRadius: '10px', fontSize: '14px', color: '#111', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: '1.55', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
        />
        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>{form.mensaje.length} caracteres</div>
      </div>
    </div>
  );
}

/* ── Step 3: Visual ── */
function Step3({ form, set }: { form: any; set: (k: string, v: string) => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#111' }}>Visual e impresión</h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6B7280' }}>Elegí un ícono para la etiqueta (optimizados para impresión térmica B&N)</p>

      {/* Icono selector */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Ícono</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px' }}>
          {ICONOS.map(({ id, Icon, label }) => {
            const selected = form.icono === id;
            return (
              <button key={id} onClick={() => set('icono', id)} title={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 8px', border: `2px solid ${selected ? ORANGE : '#E5E7EB'}`, borderRadius: '12px', backgroundColor: selected ? '#FFF4EC' : '#FAFAFA', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Icon size={24} color={selected ? ORANGE : '#6B7280'} strokeWidth={1.8} />
                <span style={{ fontSize: '10px', color: selected ? ORANGE : '#9CA3AF', fontWeight: selected ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formato */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Formato de salida</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {FORMATOS.map(f => {
            const selected = form.formato === f.id;
            const FormatIcon = f.icon;
            return (
              <button key={f.id} onClick={() => set('formato', f.id)} style={{ padding: '18px', border: `2px solid ${selected ? ORANGE : '#E5E7EB'}`, borderRadius: '14px', backgroundColor: selected ? '#FFF4EC' : '#FAFAFA', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <FormatIcon size={22} color={selected ? ORANGE : '#9CA3AF'} strokeWidth={1.8} style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: 700, fontSize: '13px', color: selected ? ORANGE : '#111' }}>{f.label}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>{f.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Preview ── */
function Step4({ form, saving, onSave }: { form: any; saving: boolean; onSave: () => void }) {
  const msgUrl = `${window.location.origin}/m/[token]`;

  return (
    <div>
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#111' }}>Vista previa</h3>
      <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280' }}>Así verá tu etiqueta. Al guardar se genera el QR único.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>

        {/* Preview etiqueta */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            {FORMATOS.find(f => f.id === form.formato)?.label}
          </div>
          <LabelPreview form={form} />
        </div>

        {/* Resumen datos */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Resumen</div>
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Remitente',    value: form.remitente_nombre    },
              { label: 'Destinatario', value: form.destinatario_nombre },
              { label: 'Ocasión',      value: OCASIONES.find(o => o.id === form.ocasion)?.label },
              { label: 'Formato',      value: FORMATOS.find(f => f.id === form.formato)?.label  },
              { label: 'Envío',        value: form.envio_numero || '— sin vincular' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '3px' }}>ℹ️ URL del mensaje</div>
            <div style={{ fontSize: '11px', color: '#3B82F6', fontFamily: 'monospace' }}>{window.location.origin}/m/<strong>[token único]</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Label Preview ── */
function LabelPreview({ form, token }: { form: any; token?: string }) {
  return (
    <div style={{ border: '2px solid #111', borderRadius: '10px', padding: '20px', backgroundColor: '#fff', maxWidth: '280px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #ccc' }}>
        <IconById id={form.icono} size={28} color="#111" strokeWidth={2} />
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#555' }}>CHARLIE MARKETPLACE</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#111' }}>ETIQUETA EMOTIVA</div>
        </div>
      </div>

      {/* Para */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Para</div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>{form.destinatario_nombre || 'Destinatario'}</div>
      </div>

      {/* Mensaje */}
      <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.5', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #ccc', fontStyle: 'italic' }}>
        "{form.mensaje ? (form.mensaje.length > 80 ? form.mensaje.slice(0, 80) + '...' : form.mensaje) : 'Tu mensaje aparecerá aquí...'}"
      </div>

      {/* QR area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {token ? (
          <QrCodeDisplay value={`${window.location.origin}/m/${token}`} options={{ size: 60, margin: 1 }} style={{ borderRadius: '6px' }} />
        ) : (
          <div style={{ width: 60, height: 60, border: '2px dashed #ccc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={24} color="#ccc" />
          </div>
        )}
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Escaneame</div>
          <div style={{ fontSize: '9px', color: '#888', lineHeight: 1.4 }}>Tengo un mensaje especial para vos</div>
          {token && <div style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', marginTop: '2px' }}>{token}</div>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DETALLE MODAL
   ════════════════════════════════════════════════════ */
function DetalleModal({ etiqueta: e, onClose }: { etiqueta: Etiqueta; onClose: () => void }) {
  const cfg = ESTADO_CFG[e.estado];
  const StatusIcon = cfg.icon;
  const publicUrl = `${window.location.origin}/m/${e.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} color="#6B7280" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconById id={e.icono} size={24} color={ORANGE} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '20px', color: '#111' }}>{e.token}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, marginTop: '4px' }}>
              <StatusIcon size={12} />{cfg.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Info */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Datos</div>
            {[
              { label: 'Remitente',    value: e.remitente_nombre    },
              { label: 'Destinatario', value: e.destinatario_nombre },
              { label: 'Email',        value: e.destinatario_email  || '—' },
              { label: 'Teléfono',     value: e.destinatario_tel    || '—' },
              { label: 'Ocasión',      value: OCASIONES.find(o => o.id === e.ocasion)?.label || e.ocasion },
              { label: 'Formato',      value: FORMATOS.find(f => f.id === e.formato)?.label  || e.formato },
              { label: 'Envío',        value: e.envio_numero || '— sin vincular' },
              { label: 'Creada',       value: fmtDate(e.created_at) },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{r.value}</span>
              </div>
            ))}

            {/* Tracking */}
            <div style={{ marginTop: '16px', fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Tracking</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TrackStep done icon={QrCode}      label="Etiqueta creada"  time={fmtDate(e.created_at)} />
              <TrackStep done={e.estado !== 'pendiente'} icon={Eye}       label="Escaneada"           time={e.scanned_at ? fmtDate(e.scanned_at) : undefined} />
              <TrackStep done={e.estado === 'respondida'} icon={MessageSquare} label="Respondida"      time={e.respondida_at ? fmtDate(e.respondida_at) : undefined} />
            </div>
          </div>

          {/* QR y mensaje */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>QR Code</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <QrCodeDisplay
                value={`${window.location.origin}/m/${e.token}`}
                options={{ size: 160, margin: 2 }}
                style={{ borderRadius: '10px', border: '1px solid #E5E7EB' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#555' }}>
                  <Copy size={13} /> Copiar link
                </button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#555', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> Ver página
                </a>
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', textAlign: 'center' }}>{publicUrl}</div>
            </div>

            {/* Mensaje */}
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Mensaje</div>
            <div style={{ backgroundColor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FEF3C7', padding: '14px', fontSize: '13px', color: '#374151', lineHeight: '1.6', fontStyle: 'italic' }}>
              "{e.mensaje}"
            </div>

            {/* Respuesta */}
            {e.respuesta && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Respuesta de {e.respuesta_nombre}</div>
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', padding: '14px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                  "{e.respuesta}"
                </div>
                {e.optin_contacto && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                    📱 Opt-in capturado: {e.optin_contacto}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Label preview */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Etiqueta</div>
          <LabelPreview form={e} token={e.token} />
        </div>
      </div>
    </div>
  );
}

/* ── Track Step ── */
function TrackStep({ done, icon: Icon, label, time }: { done: boolean; icon: React.ElementType; label: string; time?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: done ? 1 : 0.4 }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: done ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${done ? '#10B981' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={done ? '#059669' : '#9CA3AF'} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: done ? '#111' : '#9CA3AF' }}>{label}</span>
        {time && <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px' }}>{time}</span>}
      </div>
    </div>
  );
}

/* ── Field helper ── */
function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', color: '#111', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
        onFocus={e => (e.target.style.borderColor = ORANGE)}
        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
      />
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ onNueva }: { onNueva: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Heart size={28} color={ORANGE} strokeWidth={1.5} />
      </div>
      <div style={{ fontWeight: 800, fontSize: '18px', color: '#111', marginBottom: '8px' }}>Todavía no hay etiquetas</div>
      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Creá tu primera Etiqueta Emotiva y hacé que cada envío cuente</div>
      <button onClick={onNueva} style={{ padding: '12px 24px', backgroundColor: ORANGE, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <Plus size={16} /> Nueva Etiqueta
      </button>
    </div>
  );
}