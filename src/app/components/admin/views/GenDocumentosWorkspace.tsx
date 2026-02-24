/**
 * 📄 Generador de Documentos — WYSIWYG A4 con bloques arrastrables
 */
import React, { useState } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Plus, Trash2, GripVertical, Download, Type, Heading1, Heading2, List, Minus, Table, Image as ImageIcon, PenLine } from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

type BlockType = 'h1' | 'h2' | 'paragraph' | 'list' | 'divider' | 'image' | 'table' | 'signature';

interface DocBlock {
  id: string; type: BlockType; content: string;
  items?: string[];   // for list
  rows?: string[][];  // for table
}

const BLOCK_ICONS: Record<BlockType, React.ElementType> = {
  h1: Heading1, h2: Heading2, paragraph: Type, list: List,
  divider: Minus, image: ImageIcon, table: Table, signature: PenLine,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  h1: 'Título 1', h2: 'Título 2', paragraph: 'Párrafo', list: 'Lista',
  divider: 'Separador', image: 'Imagen', table: 'Tabla', signature: 'Firma',
};

function newBlock(type: BlockType): DocBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const defaults: Record<BlockType, Partial<DocBlock>> = {
    h1: { content: 'Título Principal' },
    h2: { content: 'Subtítulo' },
    paragraph: { content: 'Escribí tu texto aquí. Hacé clic para editar.' },
    list: { content: '', items: ['Ítem 1', 'Ítem 2', 'Ítem 3'] },
    divider: { content: '' },
    image: { content: '' },
    table: { content: '', rows: [['Columna 1', 'Columna 2', 'Columna 3'], ['', '', ''], ['', '', '']] },
    signature: { content: 'Firma: ________________________' },
  };
  return { id, type, ...defaults[type] } as DocBlock;
}

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({ docTitle, setDocTitle, onAdd, blockCount }: {
  docTitle: string; setDocTitle: (s: string) => void;
  onAdd: (t: BlockType) => void; blockCount: number;
}) {
  const blocks: { type: BlockType; emoji: string }[] = [
    { type: 'h1', emoji: '📰' }, { type: 'h2', emoji: '📌' }, { type: 'paragraph', emoji: '✏️' },
    { type: 'list', emoji: '📋' }, { type: 'divider', emoji: '〰️' }, { type: 'image', emoji: '🖼️' },
    { type: 'table', emoji: '📊' }, { type: 'signature', emoji: '✍️' },
  ];

  return (
    <div style={{ padding: '10px 12px' }}>
      <p style={sLabel}>Documento</p>
      <input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Nombre del documento"
        style={inputSt} />

      <p style={sLabel}>Insertar bloque</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {blocks.map(b => {
          const Icon = BLOCK_ICONS[b.type];
          return (
            <button key={b.type} onClick={() => onAdd(b.type)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem', color: '#374151', fontWeight: '500', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFF4F0'; e.currentTarget.style.borderColor = '#FF6835'; e.currentTarget.style.color = '#FF6835'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}>
              <Icon size={13} />{BLOCK_LABELS[b.type]}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '12px 0' }} />
      <p style={sLabel}>Formato de página</p>
      {(['A4', 'A5', 'Letter'] as const).map(f => (
        <button key={f} style={{ marginRight: 4, padding: '4px 9px', borderRadius: 5, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '0.68rem', fontWeight: '600', color: '#374151' }}>{f}</button>
      ))}
      <div style={{ marginTop: 10 }}>
        <p style={{ ...sLabel, marginBottom: 2 }}>Bloques: <strong style={{ color: '#374151' }}>{blockCount}</strong></p>
      </div>
    </div>
  );
}

/* ── Block renderers ─────────────────────────────────────────────────────── */
function RenderBlock({ block, onUpdate, onDelete, onMove, isFirst, isLast }: {
  block: DocBlock; onUpdate: (b: DocBlock) => void;
  onDelete: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void;
  isFirst: boolean; isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const baseStyle: React.CSSProperties = { position: 'relative', borderRadius: 6, padding: '4px', transition: 'all 0.12s' };

  const wrap = (content: React.ReactNode) => (
    <div style={baseStyle}
      onMouseEnter={e => { e.currentTarget.querySelector('.blk-ctrl')?.setAttribute('style', 'display:flex'); }}
      onMouseLeave={e => { e.currentTarget.querySelector('.blk-ctrl')?.setAttribute('style', 'display:none'); }}>
      {/* Controls */}
      <div className="blk-ctrl" style={{ display: 'none', position: 'absolute', top: 0, right: 0, gap: 3, padding: 3, zIndex: 2 }}>
        <button onClick={() => !isFirst && onMove(block.id, -1)} disabled={isFirst} style={ctrlBtn}>↑</button>
        <button onClick={() => !isLast && onMove(block.id, 1)} disabled={isLast} style={ctrlBtn}>↓</button>
        <button onClick={() => onDelete(block.id)} style={{ ...ctrlBtn, color: '#EF4444' }}>✕</button>
      </div>
      {content}
    </div>
  );

  if (block.type === 'h1') return wrap(
    editing
      ? <input value={block.content} autoFocus onChange={e => onUpdate({ ...block, content: e.target.value })} onBlur={() => setEditing(false)}
          style={{ width: '100%', fontSize: '1.8rem', fontWeight: '800', border: 'none', outline: '2px solid #FF6835', borderRadius: 4, padding: '2px 4px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      : <h1 onClick={() => setEditing(true)} style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px', cursor: 'text', color: '#111827' }}>{block.content}</h1>
  );

  if (block.type === 'h2') return wrap(
    editing
      ? <input value={block.content} autoFocus onChange={e => onUpdate({ ...block, content: e.target.value })} onBlur={() => setEditing(false)}
          style={{ width: '100%', fontSize: '1.3rem', fontWeight: '700', border: 'none', outline: '2px solid #FF6835', borderRadius: 4, padding: '2px 4px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      : <h2 onClick={() => setEditing(true)} style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 4px', cursor: 'text', color: '#1F2937' }}>{block.content}</h2>
  );

  if (block.type === 'paragraph') return wrap(
    editing
      ? <textarea value={block.content} autoFocus onChange={e => onUpdate({ ...block, content: e.target.value })} onBlur={() => setEditing(false)}
          style={{ width: '100%', fontSize: '0.9rem', border: 'none', outline: '2px solid #FF6835', borderRadius: 4, padding: '2px 4px', fontFamily: 'inherit', resize: 'vertical', minHeight: 60, boxSizing: 'border-box', lineHeight: 1.6 }} />
      : <p onClick={() => setEditing(true)} style={{ fontSize: '0.9rem', margin: '0 0 4px', cursor: 'text', color: '#374151', lineHeight: 1.6 }}>{block.content}</p>
  );

  if (block.type === 'list') return wrap(
    <ul style={{ paddingLeft: 20, margin: '0 0 4px' }}>
      {(block.items ?? []).map((item, i) => (
        <li key={i} style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
          <input value={item} onChange={e => { const items = [...(block.items ?? [])]; items[i] = e.target.value; onUpdate({ ...block, items }); }}
            style={{ border: 'none', outline: 'none', width: '90%', fontSize: '0.9rem', fontFamily: 'inherit', color: '#374151', background: 'transparent' }} />
        </li>
      ))}
      <li style={{ listStyle: 'none' }}>
        <button onClick={() => onUpdate({ ...block, items: [...(block.items ?? []), ''] })}
          style={{ border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.75rem' }}>+ agregar ítem</button>
      </li>
    </ul>
  );

  if (block.type === 'divider') return wrap(
    <hr style={{ border: 'none', borderTop: '2px solid #E5E7EB', margin: '8px 0' }} />
  );

  if (block.type === 'image') return wrap(
    <div style={{ border: '2px dashed #E5E7EB', borderRadius: 8, padding: '20px', textAlign: 'center', color: '#9CA3AF', cursor: 'pointer' }}
      onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = (ev) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) { const r = new FileReader(); r.onload = e => onUpdate({ ...block, content: e.target?.result as string }); r.readAsDataURL(f); } }; i.click(); }}>
      {block.content
        ? <img src={block.content} alt="img" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }} />
        : <><ImageIcon size={24} /><p style={{ fontSize: '0.78rem', margin: '6px 0 0' }}>Clic para insertar imagen</p></>
      }
    </div>
  );

  if (block.type === 'table') return wrap(
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
      <tbody>
        {(block.rows ?? []).map((row, ri) => (
          <tr key={ri} style={{ backgroundColor: ri === 0 ? '#F9FAFB' : '#fff' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ border: '1px solid #E5E7EB', padding: '6px 8px', fontWeight: ri === 0 ? '700' : '400' }}>
                <input value={cell} onChange={e => { const rows = block.rows!.map((r, i) => i === ri ? r.map((c, j) => j === ci ? e.target.value : c) : r); onUpdate({ ...block, rows }); }}
                  style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', background: 'transparent' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (block.type === 'signature') return wrap(
    <div style={{ borderTop: '2px solid #111827', paddingTop: 4, color: '#6B7280', fontSize: '0.8rem' }}>
      <input value={block.content} onChange={e => onUpdate({ ...block, content: e.target.value })}
        style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#6B7280', fontFamily: 'inherit', background: 'transparent', width: '100%' }} />
    </div>
  );

  return null;
}

/* ── Canvas ─────────────────────────────────────────────────────────────── */
function DocumentCanvas({ blocks, docTitle, onUpdate, onDelete, onMove, onAdd }: {
  blocks: DocBlock[]; docTitle: string;
  onUpdate: (b: DocBlock) => void; onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void; onAdd: (t: BlockType) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 40, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151' }}>{docTitle}</span>
        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>— {blocks.length} bloques</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
          <Download size={12} /> Exportar PDF
        </button>
      </div>

      {/* A4 page */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: '#E5E7EB' }}>
        <div style={{ width: 680, minHeight: 960, backgroundColor: '#fff', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', padding: '60px 72px', position: 'relative' }}>

          {/* Header line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#10B981', borderRadius: '4px 4px 0 0' }} />

          {/* Company header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#FF6835' }}>Charlie</div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Marketplace Builder</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: '600' }}>{docTitle}</div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Blocks */}
          {blocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>📄</p>
              <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>Documento vacío</p>
              <p style={{ fontSize: '0.75rem' }}>Usá el panel izquierdo para insertar bloques</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blocks.map((block, i) => (
                <RenderBlock key={block.id} block={block} onUpdate={onUpdate} onDelete={onDelete} onMove={onMove} isFirst={i === 0} isLast={i === blocks.length - 1} />
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: 20, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#D1D5DB' }}>
            <span>Generado con Charlie Marketplace Builder</span>
            <span>Página 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Properties ─────────────────────────────────────────────────────────── */
function PropertiesPanel({ blocks, docTitle }: { blocks: DocBlock[]; docTitle: string }) {
  const count: Partial<Record<BlockType, number>> = {};
  blocks.forEach(b => { count[b.type] = (count[b.type] ?? 0) + 1; });
  return (
    <div>
      <p style={pLabel}>Documento</p>
      <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#111827', marginBottom: 12 }}>{docTitle || '(sin nombre)'}</p>
      <p style={pLabel}>Bloques por tipo</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {Object.entries(count).map(([type, n]) => (
          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#F9FAFB', borderRadius: 5 }}>
            <span style={{ fontSize: '0.72rem', color: '#374151' }}>{BLOCK_LABELS[type as BlockType]}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#FF6835' }}>{n}</span>
          </div>
        ))}
        {blocks.length === 0 && <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Sin bloques</span>}
      </div>
      <p style={pLabel}>Exportar</p>
      <button onClick={() => window.print()}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}>
        📥 Exportar PDF
      </button>
    </div>
  );
}

const sLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' };
const pLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' };
const inputSt: React.CSSProperties = { width: '100%', padding: '7px 9px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.78rem', outline: 'none', marginBottom: 12, boxSizing: 'border-box', color: '#374151' };
const ctrlBtn: React.CSSProperties = { padding: '2px 6px', borderRadius: 4, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.68rem', color: '#374151' };

/* ── Main ────────────────────────────────────────────────────────────────── */
export function GenDocumentosWorkspace({ onNavigate }: Props) {
  const [docTitle, setDocTitle] = useState('Nuevo Documento');
  const [blocks, setBlocks]     = useState<DocBlock[]>([
    newBlock('h1'), newBlock('paragraph'),
  ]);

  const addBlock   = (type: BlockType) => setBlocks(p => [...p, newBlock(type)]);
  const updateBlock = (b: DocBlock) => setBlocks(p => p.map(x => x.id === b.id ? b : x));
  const deleteBlock = (id: string) => setBlocks(p => p.filter(x => x.id !== id));
  const moveBlock   = (id: string, dir: -1 | 1) => setBlocks(p => {
    const i = p.findIndex(x => x.id === id); if (i < 0) return p;
    const ni = i + dir; if (ni < 0 || ni >= p.length) return p;
    const arr = [...p]; [arr[i], arr[ni]] = [arr[ni], arr[i]]; return arr;
  });

  return (
    <WorkspaceShell
      toolId="gen-documentos"
      onNavigate={onNavigate}
      leftPanel={<LeftPanel docTitle={docTitle} setDocTitle={setDocTitle} onAdd={addBlock} blockCount={blocks.length} />}
      canvas={<DocumentCanvas blocks={blocks} docTitle={docTitle} onUpdate={updateBlock} onDelete={deleteBlock} onMove={moveBlock} onAdd={addBlock} />}
      properties={<PropertiesPanel blocks={blocks} docTitle={docTitle} />}
      actions={
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
          <Download size={12} /> PDF
        </button>
      }
    />
  );
}
