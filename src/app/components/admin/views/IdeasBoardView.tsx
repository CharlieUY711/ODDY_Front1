/**
 * Ideas Board — Canvas visual de ideas y módulos
 * ═══════════════════════════════════════════════
 * Módulo independiente en Herramientas.
 * Stickers = módulos del sistema + ideas libres.
 * Conectores con 5 colores. Múltiples canvases vinculables.
 * Navegación jerárquica con ⊙ (padre) y ⊕ (hijo).
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  Panel,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus, ChevronDown, ChevronRight, X, Edit3, Check, LayoutGrid,
  Lightbulb, Trash2, Link2, CircleDot, PlusCircle, MoreHorizontal,
  Save, RefreshCw, Layers,
} from 'lucide-react';
import { MANIFEST_BY_SECTION } from '../../../utils/moduleManifest';
import type { MainSection } from '../../../AdminDashboard';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { OrangeHeader } from '../OrangeHeader';

const API = `https://${projectId}.supabase.co/functions/v1/make-server-75638143/ideas`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };

const ORANGE = '#FF6835';

/* ── Colores de conectores ── */
export const EDGE_COLORS = [
  { id: 'general', label: 'General',   color: '#9CA3AF' },
  { id: 'depends', label: 'Depende de', color: '#FF6835' },
  { id: 'blocks',  label: 'Bloquea',   color: '#EF4444' },
  { id: 'enables', label: 'Habilita',  color: '#10B981' },
  { id: 'part_of', label: 'Parte de',  color: '#3B82F6' },
];

/* ── Familias de módulos (espejo del sidebar) ── */
const FAMILIES = [
  {
    id: 'ecommerce', label: 'eCommerce', emoji: '🛒', color: '#3B82F6',
    modules: [
      { id: 'ecommerce', label: 'eCommerce' },
      { id: 'pedidos', label: 'Pedidos' },
      { id: 'pagos', label: 'Pagos & Transacciones' },
      { id: 'departamentos', label: 'Departamentos' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'storefront', label: 'Portal del Cliente' },
      { id: 'secondhand', label: 'Second Hand' },
    ],
  },
  {
    id: 'logistica', label: 'Logística', emoji: '🚚', color: '#10B981',
    modules: [
      { id: 'logistica', label: 'Hub Logístico' },
      { id: 'envios', label: 'Envíos' },
      { id: 'transportistas', label: 'Transportistas' },
      { id: 'rutas', label: 'Rutas' },
      { id: 'fulfillment', label: 'Fulfillment' },
      { id: 'produccion', label: 'Producción / Armado' },
      { id: 'abastecimiento', label: 'Abastecimiento' },
      { id: 'mapa-envios', label: 'Mapa de Envíos' },
      { id: 'tracking-publico', label: 'Tracking Público' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing', emoji: '📣', color: '#F59E0B',
    modules: [
      { id: 'marketing', label: 'Dashboard Marketing' },
      { id: 'mailing', label: 'Email / Mailing' },
      { id: 'google-ads', label: 'Google Ads' },
      { id: 'seo', label: 'SEO' },
      { id: 'fidelizacion', label: 'Fidelización' },
      { id: 'rueda-sorteos', label: 'Rueda de Sorteos' },
      { id: 'etiqueta-emotiva', label: 'Etiqueta Emotiva' },
    ],
  },
  {
    id: 'rrss', label: 'RRSS', emoji: '📱', color: '#EC4899',
    modules: [
      { id: 'redes-sociales', label: 'Centro Operativo' },
      { id: 'migracion-rrss', label: 'Migración RRSS' },
    ],
  },
  {
    id: 'gestion', label: 'Gestión', emoji: '🗃️', color: '#6B7280',
    modules: [
      { id: 'gestion', label: 'Resumen ERP' },
      { id: 'erp-inventario', label: 'Inventario' },
      { id: 'erp-facturacion', label: 'Facturación' },
      { id: 'erp-compras', label: 'Compras' },
      { id: 'erp-crm', label: 'CRM' },
      { id: 'erp-contabilidad', label: 'Contabilidad' },
      { id: 'erp-rrhh', label: 'RRHH' },
      { id: 'proyectos', label: 'Proyectos' },
      { id: 'personas', label: 'Personas' },
      { id: 'organizaciones', label: 'Organizaciones' },
    ],
  },
  {
    id: 'herramientas', label: 'Herramientas', emoji: '🔧', color: '#8B5CF6',
    modules: [
      { id: 'qr-generator', label: 'Generador QR' },
      { id: 'herramientas', label: 'Hub Herramientas' },
    ],
  },
  {
    id: 'sistema', label: 'Sistema', emoji: '⚙️', color: '#1F2937',
    modules: [
      { id: 'sistema', label: 'Configuración' },
      { id: 'metodos-pago', label: 'Métodos de Pago' },
      { id: 'metodos-envio', label: 'Métodos de Envío' },
      { id: 'integraciones', label: 'Integraciones' },
      { id: 'diseno', label: 'Diseño / Marca' },
    ],
  },
];

/* ── Helper: obtener status del módulo ── */
function getModuleStatus(sectionId: string): 'completed-db' | 'ui-only' | 'pending' {
  const entry = MANIFEST_BY_SECTION.get(sectionId as MainSection);
  if (!entry || !entry.isReal) return 'pending';
  if (entry.hasSupabase) return 'completed-db';
  return 'ui-only';
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  'completed-db': { color: '#10B981', label: '🟢 DB' },
  'ui-only':      { color: '#3B82F6', label: '🔵 UI' },
  'pending':      { color: '#9CA3AF', label: '⚫ Pend.' },
  'idea':         { color: '#FF6835', label: '💡 Idea' },
};

/* ── Tipos de nodos ── */
export type StickerData = {
  label: string;
  text?: string;
  area?: string;
  family?: string;
  familyColor?: string;
  moduleId?: string;
  status: 'completed-db' | 'ui-only' | 'pending' | 'idea';
  editable: boolean;
  timestamp?: string;
  onChange?: (id: string, text: string) => void;
};

export type CanvasLinkData = {
  canvasId: string;
  canvasName: string;
  linkType: 'parent' | 'child';
  onNavigate?: (id: string) => void;
};

/* ══════════════════════════════════════════════
   CUSTOM NODE: STICKER
══════════════════════════════════════════════ */
function StickerNode({ id, data, selected }: NodeProps) {
  const d = data as StickerData;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.text ?? '');
  const dot = STATUS_DOT[d.status] ?? STATUS_DOT['pending'];

  const handleSave = () => {
    setEditing(false);
    if (d.onChange) d.onChange(id, draft);
  };

  return (
    <div
      style={{
        width: 180,
        minHeight: 90,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        border: selected ? `2px solid ${ORANGE}` : '1.5px solid #E5E7EB',
        boxShadow: selected ? `0 0 0 3px ${ORANGE}33` : '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, backgroundColor: d.familyColor ?? ORANGE }} />

      <Handle type="target" position={Position.Top}    style={{ background: '#9CA3AF', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#9CA3AF', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left}   style={{ background: '#9CA3AF', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right}  style={{ background: '#9CA3AF', width: 8, height: 8 }} />

      <div style={{ padding: '8px 10px' }}>
        {/* Family tag */}
        {d.family && (
          <p style={{
            margin: '0 0 3px',
            fontSize: '0.62rem',
            fontWeight: '700',
            color: d.familyColor ?? ORANGE,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {d.family}
          </p>
        )}
        {/* Label */}
        <p style={{
          margin: '0 0 5px',
          fontSize: '0.78rem',
          fontWeight: '700',
          color: '#111827',
          lineHeight: 1.3,
        }}>
          {d.label}
        </p>

        {/* Text / edit area */}
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              rows={3}
              style={{
                width: '100%',
                fontSize: '0.72rem',
                border: `1px solid ${ORANGE}`,
                borderRadius: 5,
                padding: '4px 6px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSave}
              style={{
                marginTop: 3,
                padding: '2px 8px',
                backgroundColor: ORANGE,
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                fontSize: '0.68rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Check size={10} style={{ display: 'inline', marginRight: 3 }} />
              OK
            </button>
          </div>
        ) : (
          d.text && (
            <p style={{
              margin: '0 0 5px',
              fontSize: '0.72rem',
              color: '#6B7280',
              lineHeight: 1.4,
            }}>
              {d.text}
            </p>
          )
        )}

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: '700',
            color: dot.color,
            backgroundColor: `${dot.color}18`,
            padding: '2px 6px',
            borderRadius: 4,
          }}>
            {dot.label}
          </span>
          {d.editable && !editing && (
            <button
              onClick={() => { setDraft(d.text ?? ''); setEditing(true); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Edit3 size={11} />
            </button>
          )}
          {d.timestamp && (
            <span style={{ fontSize: '0.58rem', color: '#D1D5DB' }}>
              {new Date(d.timestamp).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CUSTOM NODE: CANVAS LINK (⊙ padre / ⊕ hijo)
══════════════════════════════════════════════ */
function CanvasLinkNode({ data }: NodeProps) {
  const d = data as CanvasLinkData;
  const [hovered, setHovered] = useState(false);
  const isParent = d.linkType === 'parent';

  return (
    <div
      onClick={() => d.onNavigate?.(d.canvasId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `2.5px solid ${ORANGE}`,
        backgroundColor: hovered ? `${ORANGE}22` : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 2px 8px ${ORANGE}33`,
        transition: 'all 0.15s',
        position: 'relative',
        userSelect: 'none',
      }}
      title={`${isParent ? 'Canvas padre' : 'Canvas hijo'}: ${d.canvasName}`}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, width: 4, height: 4 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 4, height: 4 }} />

      {isParent ? (
        /* ⊙ círculo con punto */
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: ORANGE,
        }} />
      ) : (
        /* ⊕ círculo con cruz */
        <svg width="14" height="14" viewBox="0 0 14 14">
          <line x1="7" y1="1" x2="7" y2="13" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="1" y1="7" x2="13" y2="7" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1F2937',
          color: '#fff',
          fontSize: '0.68rem',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 100,
        }}>
          {isParent ? '⊙' : '⊕'} {d.canvasName}
        </div>
      )}
    </div>
  );
}

const NODE_TYPES = { sticker: StickerNode, canvasLink: CanvasLinkNode };

/* ══════════════════════════════════════════════
   PANEL IZQUIERDO: FAMILIAS DE MÓDULOS
══════════════════════════════════════════════ */
interface ModulePanelProps {
  canvasNodes: Node[];
  onDragStart: (e: React.DragEvent, family: typeof FAMILIES[0], mod: { id: string; label: string }) => void;
  onAddIdea: () => void;
}

function ModulePanel({ canvasNodes, onDragStart, onAddIdea }: ModulePanelProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const canvasIds = new Set(canvasNodes.filter(n => n.type === 'sticker').map(n => (n.data as StickerData).moduleId));

  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{
      width: 220,
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
      }}>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Módulos del Sistema
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#9CA3AF' }}>
          Arrastrá al canvas
        </p>
      </div>

      {/* Agregar idea rápida */}
      <button
        onClick={onAddIdea}
        style={{
          margin: '10px 10px 6px',
          padding: '8px 12px',
          backgroundColor: `${ORANGE}12`,
          border: `1.5px dashed ${ORANGE}66`,
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          color: ORANGE,
          fontSize: '0.78rem',
          fontWeight: '700',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${ORANGE}22`)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${ORANGE}12`)}
      >
        <Lightbulb size={14} />
        Nueva Idea
      </button>

      {/* Familias */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
        {FAMILIES.map(fam => (
          <div key={fam.id}>
            {/* Family header */}
            <button
              onClick={() => toggle(fam.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{fam.emoji}</span>
              <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', color: '#374151' }}>
                {fam.label}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginRight: 2 }}>
                {fam.modules.filter(m => canvasIds.has(m.id)).length}/{fam.modules.length}
              </span>
              {open[fam.id]
                ? <ChevronDown size={12} color="#9CA3AF" />
                : <ChevronRight size={12} color="#9CA3AF" />
              }
            </button>

            {/* Modules list */}
            {open[fam.id] && (
              <div style={{ paddingBottom: 4 }}>
                {fam.modules.map(mod => {
                  const status = getModuleStatus(mod.id);
                  const dot = STATUS_DOT[status];
                  const inCanvas = canvasIds.has(mod.id);
                  return (
                    <div
                      key={mod.id}
                      draggable={!inCanvas}
                      onDragStart={e => !inCanvas && onDragStart(e, fam, mod)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 14px 5px 30px',
                        cursor: inCanvas ? 'default' : 'grab',
                        opacity: inCanvas ? 0.45 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => !inCanvas && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: dot.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '0.72rem', color: '#374151', flex: 1, lineHeight: 1.3 }}>
                        {mod.label}
                      </span>
                      {inCanvas && <span style={{ fontSize: '0.58rem', color: '#D1D5DB' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODAL: NUEVA IDEA
══════════════════════════════════════════════ */
const AREAS = ['General', 'Logística', 'Pagos', 'Tiendas', 'Redes Sociales', 'Servicios', 'eCommerce', 'Marketing', 'ERP', 'Sistema', 'Herramientas'];

interface IdeaModalProps {
  onClose: () => void;
  onSave: (area: string, text: string) => void;
  ideas: any[];
}

function IdeaModal({ onClose, onSave, ideas }: IdeaModalProps) {
  const [area, setArea] = useState('General');
  const [text, setText] = useState('');

  const recent = ideas.filter(i => i.area === area).slice(0, 4);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      border: '1.5px solid #E5E7EB',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      width: 360,
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: ORANGE,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={16} color="#fff" />
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>Nueva Idea</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Área */}
        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: 5 }}>
          Área
        </label>
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px',
            border: '1.5px solid #E5E7EB',
            borderRadius: 8,
            fontSize: '0.82rem',
            outline: 'none',
            marginBottom: 12,
            color: '#111827',
          }}
        >
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Idea text */}
        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: 5 }}>
          Idea
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribí tu idea..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1.5px solid #E5E7EB',
            borderRadius: 8,
            fontSize: '0.82rem',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            color: '#111827',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = ORANGE)}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        />

        {/* Recientes del área */}
        {recent.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recientes en {area}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recent.map(idea => (
                <div key={idea.id} style={{
                  padding: '6px 9px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 7,
                  border: '1px solid #E5E7EB',
                }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#374151', lineHeight: 1.4 }}>
                    {idea.text.length > 60 ? idea.text.slice(0, 60) + '…' : idea.text}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: '#9CA3AF' }}>
                    {new Date(idea.timestamp).toLocaleString('es-UY', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón guardar */}
        <button
          disabled={!text.trim()}
          onClick={() => { onSave(area, text); onClose(); }}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '10px',
            backgroundColor: text.trim() ? ORANGE : '#E5E7EB',
            color: text.trim() ? '#fff' : '#9CA3AF',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Guardar en canvas
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE INTERNO (necesita useReactFlow)
══════════════════════════════════════════════ */
interface InnerProps {
  canvases: any[];
  activeCanvas: any;
  onNewCanvas: () => void;
  onSelectCanvas: (id: string) => void;
  onUpdateCanvas: (nodes: Node[], edges: Edge[]) => void;
  onLinkCanvas: (type: 'parent' | 'child') => void;
  ideas: any[];
  onSaveIdea: (area: string, text: string) => Promise<any>;
}

function IdeasBoardInner({
  canvases, activeCanvas, onNewCanvas, onSelectCanvas,
  onUpdateCanvas, onLinkCanvas, ideas, onSaveIdea,
}: InnerProps) {
  const rf = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeEdgeColor, setActiveEdgeColor] = useState(EDGE_COLORS[0]);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cargar nodos/edges del canvas activo
  useEffect(() => {
    if (!activeCanvas) return;
    setNodes(activeCanvas.nodes ?? []);
    setEdges(activeCanvas.edges ?? []);
  }, [activeCanvas?.id]);

  // Auto-save con debounce
  const triggerSave = useCallback((n: Node[], e: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onUpdateCanvas(n, e);
    }, 1200);
  }, [onUpdateCanvas]);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Crear edge con color seleccionado
  const onConnect: OnConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: `e-${Date.now()}`,
      style: { stroke: activeEdgeColor.color, strokeWidth: 2 },
      type: 'default',
      animated: false,
    };
    setEdges(eds => {
      const updated = addEdge(newEdge, eds);
      triggerSave(nodes, updated);
      return updated;
    });
  }, [activeEdgeColor, nodes, triggerSave]);

  // Guardar al soltar nodo
  const onNodeDragStop = useCallback(() => {
    setNodes(nds => {
      triggerSave(nds, edges);
      return nds;
    });
  }, [edges, triggerSave]);

  // Drop desde panel izquierdo
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/reactflow');
    if (!raw) return;
    const { family, mod } = JSON.parse(raw);
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const status = getModuleStatus(mod.id);
    const newNode: Node = {
      id: `${mod.id}-${Date.now()}`,
      type: 'sticker',
      position,
      data: {
        label: mod.label,
        family: family.label,
        familyColor: family.color,
        moduleId: mod.id,
        status,
        editable: status === 'pending',
        text: '',
        onChange: handleNodeTextChange,
      } as StickerData,
    };
    setNodes(nds => {
      const updated = [...nds, newNode];
      triggerSave(updated, edges);
      return updated;
    });
  }, [rf, edges, triggerSave]);

  const handleNodeTextChange = useCallback((id: string, text: string) => {
    setNodes(nds => {
      const updated = nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, text } } : n
      );
      triggerSave(updated, edges);
      return updated;
    });
  }, [edges, triggerSave]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragStart = (
    e: React.DragEvent,
    family: typeof FAMILIES[0],
    mod: { id: string; label: string }
  ) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ family, mod }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Agregar idea al canvas
  const handleSaveIdea = async (area: string, text: string) => {
    const idea = await onSaveIdea(area, text);
    if (!idea) return;
    const position = rf.screenToFlowPosition({
      x: window.innerWidth / 2 + Math.random() * 100 - 50,
      y: window.innerHeight / 2 + Math.random() * 100 - 50,
    });
    const newNode: Node = {
      id: `idea-${idea.id}`,
      type: 'sticker',
      position,
      data: {
        label: area,
        text: text,
        family: `💡 Idea · ${area}`,
        familyColor: ORANGE,
        status: 'idea',
        editable: true,
        timestamp: idea.timestamp,
        onChange: handleNodeTextChange,
      } as StickerData,
    };
    setNodes(nds => {
      const updated = [...nds, newNode];
      triggerSave(updated, edges);
      return updated;
    });
  };

  // Agregar canvas link
  const handleAddLink = (type: 'parent' | 'child') => {
    const linkedCanvas = type === 'parent'
      ? canvases.find(c => c.id === activeCanvas?.parentId)
      : null;
    if (type === 'parent' && !linkedCanvas) {
      onLinkCanvas(type);
      return;
    }
    onLinkCanvas(type);
  };

  // Rename canvas
  const handleRename = () => {
    if (!draftName.trim()) { setRenaming(false); return; }
    // Trigger save with new name
    onUpdateCanvas(nodes, edges, draftName);
    setRenaming(false);
  };

  // Delete selected nodes
  const deleteSelected = () => {
    setNodes(nds => {
      const updated = nds.filter(n => !n.selected);
      setEdges(eds => {
        const updatedEdges = eds.filter(e =>
          updated.some(n => n.id === e.source) && updated.some(n => n.id === e.target)
        );
        triggerSave(updated, updatedEdges);
        return updatedEdges;
      });
      return updated;
    });
  };

  const canvasName = activeCanvas?.name ?? 'Sin canvas';
  const parentCanvas = canvases.find(c => c.id === activeCanvas?.parentId);
  const childCanvases = canvases.filter(c => c.parentId === activeCanvas?.id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: 54,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 12,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Canvas selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCanvasMenu(p => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 12px',
              border: '1.5px solid #E5E7EB',
              borderRadius: 8,
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: '#111827',
            }}
          >
            <Layers size={14} color={ORANGE} />
            {renaming ? (
              <input
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                autoFocus
                style={{ border: 'none', outline: 'none', background: 'none', fontSize: '0.82rem', fontWeight: '700', width: 120 }}
                onClick={e => e.stopPropagation()}
              />
            ) : canvasName}
            <ChevronDown size={12} color="#9CA3AF" />
          </button>

          {showCanvasMenu && (
            <div style={{
              position: 'absolute',
              top: 40,
              left: 0,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              minWidth: 200,
              zIndex: 100,
            }}>
              {canvases.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelectCanvas(c.id); setShowCanvasMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 14px',
                    border: 'none',
                    background: c.id === activeCanvas?.id ? `${ORANGE}12` : 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#111827',
                    textAlign: 'left',
                  }}
                >
                  <Layers size={13} color={c.id === activeCanvas?.id ? ORANGE : '#9CA3AF'} />
                  {c.name}
                  {c.id === activeCanvas?.id && <span style={{ marginLeft: 'auto', color: ORANGE, fontSize: '0.65rem' }}>Activo</span>}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #E5E7EB', padding: '6px 8px' }}>
                <button
                  onClick={() => { onNewCanvas(); setShowCanvasMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: ORANGE,
                    fontWeight: '700',
                  }}
                >
                  <Plus size={13} /> Nuevo Canvas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rename button */}
        <button
          onClick={() => { setDraftName(canvasName); setRenaming(true); setShowCanvasMenu(false); }}
          title="Renombrar canvas"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 5 }}
        >
          <Edit3 size={14} />
        </button>

        <div style={{ width: 1, height: 24, backgroundColor: '#E5E7EB' }} />

        {/* Navegación jerárquica */}
        {parentCanvas && (
          <button
            onClick={() => onSelectCanvas(parentCanvas.id)}
            title={`Canvas padre: ${parentCanvas.name}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              border: `1.5px solid ${ORANGE}66`,
              borderRadius: 20,
              backgroundColor: `${ORANGE}0D`,
              color: ORANGE,
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid ${ORANGE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: ORANGE }} />
            </span>
            {parentCanvas.name}
          </button>
        )}

        {childCanvases.map(child => (
          <button
            key={child.id}
            onClick={() => onSelectCanvas(child.id)}
            title={`Canvas hijo: ${child.name}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              border: `1.5px solid #3B82F666`,
              borderRadius: 20,
              backgroundColor: '#3B82F60D',
              color: '#3B82F6',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid #3B82F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="7" height="7" viewBox="0 0 7 7">
                <line x1="3.5" y1="0.5" x2="3.5" y2="6.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0.5" y1="3.5" x2="6.5" y2="3.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            {child.name}
          </button>
        ))}

        {/* Acciones */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={deleteSelected}
            title="Eliminar seleccionados"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px',
              border: '1.5px solid #FECACA',
              borderRadius: 7,
              backgroundColor: '#FFF5F5',
              color: '#EF4444',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Borrar
          </button>
          <button
            onClick={() => triggerSave(nodes, edges)}
            title="Guardar ahora"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              border: 'none',
              borderRadius: 7,
              backgroundColor: ORANGE,
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <Save size={13} /> Guardar
          </button>
        </div>
      </div>

      {/* ── Body: panel + canvas ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <ModulePanel
          canvasNodes={nodes}
          onDragStart={handleDragStart}
          onAddIdea={() => setShowIdeaModal(true)}
        />

        {/* Canvas ReactFlow */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            onClick={() => setShowCanvasMenu(false)}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
            <Controls style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            <MiniMap
              nodeColor={(n) => {
                const d = n.data as StickerData;
                return d?.familyColor ?? ORANGE;
              }}
              style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
            />

            {/* Edge color picker */}
            <Panel position="bottom-center">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 30,
                padding: '6px 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', marginRight: 4 }}>
                  Conector:
                </span>
                {EDGE_COLORS.map(ec => (
                  <button
                    key={ec.id}
                    onClick={() => setActiveEdgeColor(ec)}
                    title={ec.label}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: ec.color,
                      border: activeEdgeColor.id === ec.id ? `3px solid #111827` : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: activeEdgeColor.id === ec.id ? 'scale(1.25)' : 'scale(1)',
                      outline: 'none',
                    }}
                  />
                ))}
                <div style={{ width: 1, height: 18, backgroundColor: '#E5E7EB', margin: '0 4px' }} />
                <span style={{ fontSize: '0.68rem', color: activeEdgeColor.color, fontWeight: '700' }}>
                  {activeEdgeColor.label}
                </span>
              </div>
            </Panel>

            {/* Empty state */}
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div style={{
                  marginTop: 60,
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px dashed #E5E7EB',
                  borderRadius: 14,
                  padding: '28px 40px',
                }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🗺️</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', margin: '0 0 4px' }}>
                    Canvas vacío
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
                    Arrastrá módulos desde el panel izquierdo<br />o creá una nueva idea
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Idea Modal (overlay) */}
        {showIdeaModal && (
          <>
            <div
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999 }}
              onClick={() => setShowIdeaModal(false)}
            />
            <IdeaModal
              onClose={() => setShowIdeaModal(false)}
              onSave={handleSaveIdea}
              ideas={ideas}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN VIEW (con ReactFlowProvider + data layer)
══════════════════════════════════════════════ */
interface Props {
  onNavigate: (section: MainSection) => void;
}

export function IdeasBoardView({ onNavigate }: Props) {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [activeCanvas, setActiveCanvas] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar canvases
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/canvases`, { headers: HEADERS });
        const { canvases: list } = await res.json();
        if (list?.length) {
          setCanvases(list);
          setActiveCanvasId(list[0].id);
        } else {
          // Crear canvas inicial
          const created = await createCanvas('Mi Canvas Principal');
          if (created) {
            setCanvases([created]);
            setActiveCanvasId(created.id);
          }
        }
      } catch (err) {
        console.error('[IdeasBoard] Error cargando canvases:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cargar ideas
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/ideas`, { headers: HEADERS });
        const { ideas: list } = await res.json();
        setIdeas(list ?? []);
      } catch (err) {
        console.error('[IdeasBoard] Error cargando ideas:', err);
      }
    })();
  }, []);

  // Cargar canvas activo
  useEffect(() => {
    if (!activeCanvasId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/canvases/${activeCanvasId}`, { headers: HEADERS });
        const { canvas } = await res.json();
        setActiveCanvas(canvas ?? null);
      } catch (err) {
        console.error('[IdeasBoard] Error cargando canvas activo:', err);
      }
    })();
  }, [activeCanvasId]);

  const createCanvas = async (name: string, parentId?: string) => {
    try {
      const res = await fetch(`${API}/canvases`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ name, parentId: parentId ?? null }),
      });
      const { canvas } = await res.json();
      return canvas;
    } catch (err) {
      console.error('[IdeasBoard] Error creando canvas:', err);
      return null;
    }
  };

  const handleNewCanvas = async () => {
    const name = `Canvas ${canvases.length + 1}`;
    const created = await createCanvas(name);
    if (created) {
      setCanvases(p => [...p, created]);
      setActiveCanvasId(created.id);
    }
  };

  const handleSelectCanvas = (id: string) => {
    setActiveCanvasId(id);
  };

  const handleUpdateCanvas = async (nodes: any[], edges: any[], newName?: string) => {
    if (!activeCanvasId) return;
    try {
      const body: any = { nodes, edges };
      if (newName) body.name = newName;
      const res = await fetch(`${API}/canvases/${activeCanvasId}`, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      const { canvas } = await res.json();
      if (newName) {
        setCanvases(p => p.map(c => c.id === activeCanvasId ? { ...c, name: newName } : c));
      }
      setActiveCanvas(canvas);
    } catch (err) {
      console.error('[IdeasBoard] Error guardando canvas:', err);
    }
  };

  const handleLinkCanvas = async (type: 'parent' | 'child') => {
    if (type === 'child') {
      const name = `Sub-canvas de ${activeCanvas?.name ?? 'este canvas'}`;
      const created = await createCanvas(name, activeCanvasId ?? undefined);
      if (created) {
        setCanvases(p => [...p, created]);
      }
    }
  };

  const handleSaveIdea = async (area: string, text: string): Promise<any> => {
    try {
      const res = await fetch(`${API}/ideas`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ area, text }),
      });
      const { idea } = await res.json();
      setIdeas(p => [idea, ...p]);
      return idea;
    } catch (err) {
      console.error('[IdeasBoard] Error guardando idea:', err);
      return null;
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} color={ORANGE} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6B7280', marginTop: 12, fontSize: '0.875rem' }}>Cargando Registro de Ideas…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <OrangeHeader
        icon={Lightbulb}
        title="Registro de Ideas"
        subtitle={`Canvas visual de módulos e ideas — ${canvases.length} canvas${canvases.length !== 1 ? 'es' : ''}`}
        actions={[
          {
            label: '← Herramientas',
            onClick: () => onNavigate('herramientas'),
          },
        ]}
      />

      {/* Board */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <IdeasBoardInner
            canvases={canvases}
            activeCanvas={activeCanvas}
            onNewCanvas={handleNewCanvas}
            onSelectCanvas={handleSelectCanvas}
            onUpdateCanvas={handleUpdateCanvas}
            onLinkCanvas={handleLinkCanvas}
            ideas={ideas}
            onSaveIdea={handleSaveIdea}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}