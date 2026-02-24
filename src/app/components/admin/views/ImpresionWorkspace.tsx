/**
 * 🖨️ Módulo de Impresión
 * Configuración de papel, orientación, copias y color · Preview A4 · window.print()
 */
import React, { useState, useRef } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Printer, Plus, Trash2, FileText, Image as ImgIcon, File, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

type PaperSize = 'A4' | 'A5' | 'Letter' | 'Legal' | 'A3';
type Orientation = 'portrait' | 'landscape';
type ColorMode = 'color' | 'bw';
type Quality = 'draft' | 'normal' | 'high';
type PageRange = 'all' | 'current';

interface PrintJob {
  id: string;
  name: string;
  type: 'document' | 'image' | 'other';
  pages: number;
  selected: boolean;
}

const PAPER_DIMS: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 }, A5: { w: 148, h: 210 },
  Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 }, A3: { w: 297, h: 420 },
};

function newJob(name: string, type: PrintJob['type'] = 'document', pages = 1): PrintJob {
  return { id: `job-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, type, pages, selected: false };
}

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({
  paper, setPaper, orient, setOrient, colorMode, setColorMode,
  quality, setQuality, copies, setCopies, pageRange, setPageRange,
  jobs, setJobs, activeJobId, setActiveJobId,
}: {
  paper: PaperSize; setPaper: (p: PaperSize) => void;
  orient: Orientation; setOrient: (o: Orientation) => void;
  colorMode: ColorMode; setColorMode: (c: ColorMode) => void;
  quality: Quality; setQuality: (q: Quality) => void;
  copies: number; setCopies: (n: number) => void;
  pageRange: PageRange; setPageRange: (r: PageRange) => void;
  jobs: PrintJob[]; setJobs: React.Dispatch<React.SetStateAction<PrintJob[]>>;
  activeJobId: string | null; setActiveJobId: (id: string | null) => void;
}) {
  const TypeIcon = ({ type }: { type: PrintJob['type'] }) =>
    type === 'image' ? <ImgIcon size={11} /> : type === 'document' ? <FileText size={11} /> : <File size={11} />;

  return (
    <div style={{ padding: '10px 12px', overflowY: 'auto', height: '100%' }}>
      {/* Queue */}
      <p style={sLabel}>Cola de impresión ({jobs.length})</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        {jobs.map(job => (
          <div key={job.id}
            onClick={() => setActiveJobId(job.id === activeJobId ? null : job.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 7, border: `1.5px solid ${activeJobId === job.id ? '#EC4899' : '#E5E7EB'}`, backgroundColor: activeJobId === job.id ? '#FDF2F8' : '#fff', cursor: 'pointer' }}>
            <span style={{ color: activeJobId === job.id ? '#EC4899' : '#9CA3AF' }}><TypeIcon type={job.type} /></span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.name}</div>
              <div style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>{job.pages} pág.</div>
            </div>
            <button onClick={e => { e.stopPropagation(); setJobs(p => p.filter(j => j.id !== job.id)); if (activeJobId === job.id) setActiveJobId(null); }}
              style={{ border: 'none', background: 'none', color: '#E5E7EB', cursor: 'pointer', padding: 2, borderRadius: 3 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#E5E7EB'; }}>
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#D1D5DB', fontSize: '0.72rem' }}>Cola vacía</div>
        )}
      </div>

      <button onClick={() => { const j = newJob(`Documento ${jobs.length + 1}`, 'document', Math.floor(Math.random() * 4) + 1); setJobs(p => [...p, j]); setActiveJobId(j.id); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px', borderRadius: 7, border: '1.5px dashed #FBCFE8', backgroundColor: '#FDF2F8', color: '#EC4899', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', marginBottom: 12 }}>
        <Plus size={11} /> Agregar documento
      </button>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '8px 0' }} />

      {/* Settings */}
      <p style={sLabel}>Papel</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
        {(['A4', 'A5', 'Letter', 'Legal', 'A3'] as PaperSize[]).map(p => (
          <button key={p} onClick={() => setPaper(p)}
            style={{ padding: '3px 7px', borderRadius: 4, border: `1.5px solid ${paper === p ? '#EC4899' : '#E5E7EB'}`, backgroundColor: paper === p ? '#FDF2F8' : '#fff', color: paper === p ? '#EC4899' : '#374151', cursor: 'pointer', fontSize: '0.63rem', fontWeight: '700' }}>{p}</button>
        ))}
      </div>

      <p style={sLabel}>Orientación</p>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['portrait', 'landscape'] as Orientation[]).map(o => (
          <button key={o} onClick={() => setOrient(o)}
            style={{ flex: 1, padding: '5px', borderRadius: 6, border: `1.5px solid ${orient === o ? '#EC4899' : '#E5E7EB'}`, backgroundColor: orient === o ? '#FDF2F8' : '#fff', color: orient === o ? '#EC4899' : '#374151', cursor: 'pointer', fontSize: '0.63rem', fontWeight: '700' }}>
            {o === 'portrait' ? '↕ Vertical' : '↔ Horizontal'}
          </button>
        ))}
      </div>

      <p style={sLabel}>Color</p>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {([{ v: 'color', l: '🎨 Color' }, { v: 'bw', l: '⬛ B&N' }] as { v: ColorMode; l: string }[]).map(({ v, l }) => (
          <button key={v} onClick={() => setColorMode(v)}
            style={{ flex: 1, padding: '5px', borderRadius: 6, border: `1.5px solid ${colorMode === v ? '#EC4899' : '#E5E7EB'}`, backgroundColor: colorMode === v ? '#FDF2F8' : '#fff', color: colorMode === v ? '#EC4899' : '#374151', cursor: 'pointer', fontSize: '0.63rem', fontWeight: '700' }}>
            {l}
          </button>
        ))}
      </div>

      <p style={sLabel}>Calidad</p>
      <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
        {([{ v: 'draft', l: 'Borrador' }, { v: 'normal', l: 'Normal' }, { v: 'high', l: 'Alta' }] as { v: Quality; l: string }[]).map(({ v, l }) => (
          <button key={v} onClick={() => setQuality(v)}
            style={{ flex: 1, padding: '4px 2px', borderRadius: 5, border: `1.5px solid ${quality === v ? '#EC4899' : '#E5E7EB'}`, backgroundColor: quality === v ? '#FDF2F8' : '#fff', color: quality === v ? '#EC4899' : '#374151', cursor: 'pointer', fontSize: '0.6rem', fontWeight: '700' }}>
            {l}
          </button>
        ))}
      </div>

      <p style={sLabel}>Copias</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => setCopies(Math.max(1, copies - 1))} style={cntBtn}>−</button>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827', minWidth: 20, textAlign: 'center' }}>{copies}</span>
        <button onClick={() => setCopies(copies + 1)} style={cntBtn}>+</button>
        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>cop.</span>
      </div>
    </div>
  );
}

/* ── Canvas ─────────────────────────────────────────────────────────────── */
function PrintCanvas({ paper, orient, colorMode, activeJob, copies, quality }: {
  paper: PaperSize; orient: Orientation; colorMode: ColorMode;
  activeJob: PrintJob | null; copies: number; quality: Quality;
}) {
  const dims = PAPER_DIMS[paper];
  const isLandscape = orient === 'landscape';
  const previewW = isLandscape ? dims.h : dims.w;
  const previewH = isLandscape ? dims.w : dims.h;
  const scale = 2.2;
  const pageW = previewW * scale;
  const pageH = previewH * scale;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 44, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151' }}>
          {activeJob ? activeJob.name : 'Vista previa de impresión'}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
          {paper} · {orient === 'portrait' ? 'Vertical' : 'Horizontal'} · {colorMode === 'color' ? 'Color' : 'B&N'} · {copies} cop.
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, border: 'none', backgroundColor: '#EC4899', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800' }}>
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#374151', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 24px', gap: 20, flexWrap: 'wrap' }}>
        {/* Ruler guide */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {paper} · {previewW}×{previewH}mm
          </div>

          {/* Page */}
          <div style={{
            width: pageW, minHeight: pageH,
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            filter: colorMode === 'bw' ? 'grayscale(100%)' : 'none',
            position: 'relative',
            overflow: 'hidden',
            padding: '48px 40px',
          }}>
            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: '#EC4899' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid #F3F4F6' }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FF6835' }}>Charlie</div>
                <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>Marketplace Builder</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>{activeJob?.name ?? 'Documento de muestra'}</div>
                <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{new Date().toLocaleDateString('es-UY')}</div>
              </div>
            </div>

            {/* Mock content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 12, backgroundColor: '#F3F4F6', borderRadius: 4, width: '60%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '100%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '92%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '96%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '88%' }} />
              <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '4px 0' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '70%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '100%' }} />
              <div style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: '85%' }} />
              <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '4px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[80, 95, 70].map((w, i) => (
                  <div key={i} style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: `${w}%` }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[90, 75, 100].map((w, i) => (
                  <div key={i} style={{ height: 8, backgroundColor: '#F9FAFB', borderRadius: 3, width: `${w}%` }} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: 14, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#D1D5DB' }}>
              <span>Charlie Marketplace Builder · {quality === 'high' ? 'Alta calidad' : quality === 'normal' ? 'Calidad normal' : 'Borrador'}</span>
              <span>Página 1 de {activeJob?.pages ?? 1}</span>
            </div>
          </div>

          {/* Copies indicator */}
          {copies > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: '#9CA3AF', fontWeight: '600' }}>
              <Printer size={11} color="#EC4899" /> {copies} copias a imprimir
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Properties Panel ───────────────────────────────────────────────────── */
function PropertiesPanel({ paper, orient, colorMode, quality, copies, activeJob, onPrint }: {
  paper: PaperSize; orient: Orientation; colorMode: ColorMode;
  quality: Quality; copies: number; activeJob: PrintJob | null; onPrint: () => void;
}) {
  const dims = PAPER_DIMS[paper];
  const isL = orient === 'landscape';
  const totalPages = (activeJob?.pages ?? 1) * copies;

  return (
    <div>
      <p style={pLabel}>Trabajo activo</p>
      {activeJob ? (
        <div style={{ marginBottom: 12, padding: '8px 10px', backgroundColor: '#FDF2F8', borderRadius: 7, border: '1px solid #FBCFE8' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#111827' }}>{activeJob.name}</div>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{activeJob.pages} página{activeJob.pages > 1 ? 's' : ''} · {activeJob.type}</div>
        </div>
      ) : (
        <div style={{ marginBottom: 12, padding: '8px 10px', backgroundColor: '#F9FAFB', borderRadius: 7, border: '1px solid #E5E7EB', textAlign: 'center', fontSize: '0.7rem', color: '#9CA3AF' }}>
          Sin trabajo seleccionado
        </div>
      )}

      <p style={pLabel}>Configuración</p>
      {[
        { l: 'Papel',       v: `${paper} (${isL ? dims.h : dims.w}×${isL ? dims.w : dims.h}mm)` },
        { l: 'Orientación', v: orient === 'portrait' ? 'Vertical' : 'Horizontal' },
        { l: 'Color',       v: colorMode === 'color' ? 'Color completo' : 'Blanco y negro' },
        { l: 'Calidad',     v: quality === 'high' ? 'Alta' : quality === 'normal' ? 'Normal' : 'Borrador' },
        { l: 'Copias',      v: copies.toString() },
        { l: 'Total págs.', v: totalPages.toString() },
      ].map(row => (
        <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 3, backgroundColor: '#F9FAFB', borderRadius: 5 }}>
          <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{row.l}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#374151' }}>{row.v}</span>
        </div>
      ))}

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '12px 0' }} />

      {/* Status */}
      <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 8, backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle2 size={13} color="#10B981" />
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#065F46' }}>Lista para imprimir</span>
      </div>

      <button onClick={onPrint}
        style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', backgroundColor: '#EC4899', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        <Printer size={14} /> Imprimir ahora
      </button>
      <p style={{ margin: '6px 0 0', fontSize: '0.65rem', color: '#9CA3AF', textAlign: 'center' }}>
        Se abrirá el diálogo de impresión del sistema
      </p>
    </div>
  );
}

const sLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' };
const pLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' };
const cntBtn: React.CSSProperties = { width: 24, height: 24, borderRadius: 5, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* ── Main ────────────────────────────────────────────────────────────────── */
export function ImpresionWorkspace({ onNavigate }: Props) {
  const [paper, setPaper]           = useState<PaperSize>('A4');
  const [orient, setOrient]         = useState<Orientation>('portrait');
  const [colorMode, setColorMode]   = useState<ColorMode>('color');
  const [quality, setQuality]       = useState<Quality>('normal');
  const [copies, setCopies]         = useState(1);
  const [pageRange, setPageRange]   = useState<PageRange>('all');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobs, setJobs]             = useState<PrintJob[]>([
    newJob('Presupuesto #001', 'document', 2),
    newJob('Contrato de servicios', 'document', 4),
    newJob('Logo empresa', 'image', 1),
  ]);

  const activeJob = jobs.find(j => j.id === activeJobId) ?? null;

  return (
    <WorkspaceShell
      toolId="impresion"
      onNavigate={onNavigate}
      leftPanel={
        <LeftPanel
          paper={paper} setPaper={setPaper} orient={orient} setOrient={setOrient}
          colorMode={colorMode} setColorMode={setColorMode} quality={quality} setQuality={setQuality}
          copies={copies} setCopies={setCopies} pageRange={pageRange} setPageRange={setPageRange}
          jobs={jobs} setJobs={setJobs} activeJobId={activeJobId} setActiveJobId={setActiveJobId}
        />
      }
      canvas={<PrintCanvas paper={paper} orient={orient} colorMode={colorMode} activeJob={activeJob} copies={copies} quality={quality} />}
      properties={<PropertiesPanel paper={paper} orient={orient} colorMode={colorMode} quality={quality} copies={copies} activeJob={activeJob} onPrint={() => window.print()} />}
      actions={
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: '#EC4899', color: '#fff', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>
          <Printer size={12} /> Imprimir
        </button>
      }
    />
  );
}
