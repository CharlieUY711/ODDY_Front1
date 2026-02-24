/**
 * 📄 Catalog Extractor v2 — Catálogo → eCommerce
 * Tres formas de input:
 *   1. URL  → screenshot via ScreenshotOne API → Claude Vision
 *   2. Ctrl+V → imagen del portapapeles → Claude Vision
 *   3. Archivo → PDF o imagen → Claude Vision
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Upload, Download, RefreshCw, CheckCircle2, AlertCircle, Zap, FileText, Link as LinkIcon, Clipboard } from 'lucide-react';
import { extractCatalog } from '../../../services/catalogExtractorApi';
import { exportToCSV, exportToXLSX } from '../../../lib/exporters';

interface Props { onNavigate: (s: MainSection) => void; }

type Status = 'idle' | 'uploading' | 'extracting' | 'done' | 'error';
type Mode = 'url' | 'paste' | 'file';

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const TABS: { id: Mode; icon: string; label: string }[] = [
  { id: "url",   icon: "🔗", label: "URL" },
  { id: "paste", icon: "📋", label: "Pegar imagen" },
  { id: "file",  icon: "📄", label: "PDF / Imagen" },
];

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({
  mode, setMode, url, setUrl, file, status,
  onUpload, onExtract, onReset,
}: {
  mode: Mode; setMode: (m: Mode) => void;
  url: string; setUrl: (u: string) => void;
  file: File | null; status: Status;
  onUpload: () => void; onExtract: () => void; onReset: () => void;
}) {
  const canExtract = (mode === 'url' && url.trim().startsWith('http')) || 
                     ((mode === 'paste' || mode === 'file') && file) && 
                     status !== 'extracting';
  const isProcessing = status === 'uploading' || status === 'extracting';

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7,
              border: `1.5px solid ${mode === t.id ? '#8B5CF6' : '#E5E7EB'}`,
              backgroundColor: mode === t.id ? '#F5F3FF' : '#fff',
              color: mode === t.id ? '#7C3AED' : '#374151',
              cursor: 'pointer', fontSize: '0.72rem', fontWeight: mode === t.id ? '700' : '500',
            }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '10px 0' }} />

      {/* URL Input */}
      {mode === 'url' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            URL del catálogo
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/tienda"
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #E5E7EB',
              fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box',
            }}
            onKeyDown={(e) => e.key === 'Enter' && canExtract && onExtract()}
          />
          <p style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 4, marginBottom: 0 }}>
            📸 Screenshot automático de la página completa
          </p>
        </div>
      )}

      {/* File Upload */}
      {(mode === 'paste' || mode === 'file') && (
        <>
          <button onClick={onUpload}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: '1.5px dashed #DDD6FE', backgroundColor: '#F5F3FF', color: '#8B5CF6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', marginBottom: 12 }}>
            <Upload size={13} /> {mode === 'paste' ? 'Pegar imagen (Ctrl+V)' : 'Cargar archivo'}
          </button>

          {file && (
            <div style={{ marginBottom: 12, padding: '8px 10px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Archivo</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', wordBreak: 'break-word' }}>{file.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
          )}

          {mode === 'paste' && !file && (
            <div style={{ padding: '8px 10px', backgroundColor: '#FEF3C7', borderRadius: 7, border: '1px solid #FDE68A', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: '0.68rem', color: '#92400E' }}>
                💡 Presioná <kbd style={{ background: '#E5E7EB', borderRadius: 3, padding: '1px 4px', fontSize: '0.65rem', fontFamily: 'monospace' }}>Ctrl+V</kbd> para pegar una imagen
              </p>
            </div>
          )}
        </>
      )}

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '10px 0' }} />

      {/* Extract */}
      <button onClick={onExtract} disabled={!canExtract || isProcessing}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', backgroundColor: canExtract && !isProcessing ? '#8B5CF6' : '#E5E7EB', color: canExtract && !isProcessing ? '#fff' : '#9CA3AF', cursor: canExtract && !isProcessing ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
        {isProcessing ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Extrayendo…</> : <><Zap size={12} /> Extraer productos</>}
      </button>

      {(status === 'done' || status === 'error') && (
        <button onClick={onReset}
          style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <RefreshCw size={11} /> Nuevo catálogo
        </button>
      )}

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '12px 0' }} />

      <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Consejos</p>
        {mode === 'url' ? [
          'Funciona con cualquier página web pública',
          'Captura automática de scroll completo',
          'Ideal para catálogos online',
        ] : mode === 'paste' ? [
          'Presioná Ctrl+V con una imagen en el portapapeles',
          'Funciona con capturas de pantalla',
          'Rápido para análisis rápidos',
        ] : [
          'PDFs de alta resolución dan mejores resultados',
          'Catálogos con tablas claras se extraen mejor',
          'Máximo 5 páginas por catálogo',
        ].map((tip, i) => (
          <p key={i} style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#9CA3AF', lineHeight: 1.4 }}>
            · {tip}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Canvas ─────────────────────────────────────────────────────────────── */
function CatalogCanvas({
  mode, url, file, preview, status, products, errorMsg,
  onExportCSV, onExportXLSX,
}: {
  mode: Mode; url: string; file: File | null; preview: string | null; status: Status;
  products: Record<string, unknown>[]; errorMsg: string;
  onExportCSV: () => void; onExportXLSX: () => void;
}) {
  // Empty state
  if (mode === 'url' && !url.trim()) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: '#9CA3AF' }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🔗</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#374151', fontSize: '0.9rem' }}>Ingresá una URL</p>
          <p style={{ margin: 0, fontSize: '0.78rem' }}>Pegá la URL del catálogo en el panel izquierdo</p>
        </div>
      </div>
    );
  }

  if ((mode === 'paste' || mode === 'file') && !file) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: '#9CA3AF' }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
          {mode === 'paste' ? '📋' : '📄'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#374151', fontSize: '0.9rem' }}>
            {mode === 'paste' ? 'Sin imagen pegada' : 'Sin archivo cargado'}
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem' }}>
            {mode === 'paste' ? 'Presioná Ctrl+V para pegar una imagen' : 'Usá el botón "Cargar archivo" o arrastrá un archivo'}
          </p>
        </div>
        {mode === 'file' && (
          <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: '#9CA3AF' }}>
            {['PDF', 'PNG', 'JPG', 'WEBP'].map(f => (
              <span key={f} style={{ padding: '3px 8px', borderRadius: 4, backgroundColor: '#F5F3FF', color: '#8B5CF6', fontWeight: '600' }}>{f}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isProcessing = status === 'uploading' || status === 'extracting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      {status === 'done' && products.length > 0 && (
        <div style={{ height: 44, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
          <CheckCircle2 size={14} color="#10B981" />
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10B981' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={onExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', color: '#374151' }}>
            <Download size={11} /> CSV
          </button>
          <button onClick={onExportXLSX}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: '#8B5CF6', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
            <Download size={11} /> Excel
          </button>
        </div>
      )}

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Preview panel */}
        <div style={{ flex: '0 0 40%', borderRight: '1px solid #E5E7EB', overflow: 'auto', position: 'relative', backgroundColor: '#E5E7EB', backgroundImage: 'repeating-conic-gradient(#D1D5DB 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }}>
          {mode === 'url' && url.trim() && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: '#9CA3AF', padding: 20 }}>
              <LinkIcon size={48} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '600', wordBreak: 'break-word' }}>{url}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.7rem' }}>Screenshot automático al extraer</p>
              </div>
            </div>
          )}
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
          ) : file && mode !== 'url' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: '#9CA3AF' }}>
              <FileText size={48} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '600' }}>{file.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.7rem' }}>PDF (preview no disponible)</p>
              </div>
            </div>
          ) : null}

          {/* Processing overlay */}
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000000cc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: '2rem' }}>⏳</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', color: '#fff', fontWeight: '700', fontSize: '0.82rem' }}>
                  {status === 'uploading' ? 'Subiendo archivo...' : mode === 'url' ? 'Tomando screenshot...' : 'Extrayendo productos...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Productos extraídos</span>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div style={{ margin: 12, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: '700', color: '#DC2626' }}>Error al procesar</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#EF4444' }}>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Results table */}
          {status === 'done' && products.length > 0 && (
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      {Object.keys(products[0]).map((key) => (
                        <th key={key} style={{
                          background: '#f9fafb',
                          padding: '8px 10px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb',
                          whiteSpace: 'nowrap',
                        }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {Object.values(product).map((val, j) => (
                          <td key={j} style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                            {val ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {status === 'done' && products.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600' }}>No se encontraron productos estructurados</p>
                <p style={{ fontSize: '0.7rem', marginTop: 4 }}>Intentá con otra URL, imagen o revisá la calidad del PDF</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600' }}>
                  {mode === 'url' ? 'Tomando screenshot y analizando…' : 'Analizando catálogo…'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Properties Panel ───────────────────────────────────────────────────── */
function PropertiesPanel({ products, status, mode }: { products: Record<string, unknown>[]; status: Status; mode: Mode }) {
  if (status === 'done' && products.length > 0) {
    const columns = Object.keys(products[0]);
    return (
      <div>
        <p style={pLabel}>Resultados</p>
        {[
          { l: 'Productos', v: products.length.toString(), color: '#10B981' },
          { l: 'Columnas', v: columns.length.toString(), color: '#374151' },
        ].map(row => (
          <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', marginBottom: 3, backgroundColor: '#F9FAFB', borderRadius: 5 }}>
            <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{row.l}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: row.color }}>{row.v}</span>
          </div>
        ))}

        <p style={{ ...pLabel, marginTop: 12 }}>Columnas detectadas</p>
        <div style={{ maxHeight: 200, overflowY: 'auto', padding: '6px 8px', backgroundColor: '#F9FAFB', borderRadius: 7, border: '1px solid #E5E7EB' }}>
          {columns.map(col => (
            <div key={col} style={{ fontSize: '0.68rem', color: '#6B7280', marginBottom: 3 }}>
              · {col}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: '#D1D5DB' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{mode === 'url' ? '🔗' : mode === 'paste' ? '📋' : '📄'}</div>
      <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
        {status === 'idle' ? `Seleccioná un modo y ${mode === 'url' ? 'ingresá una URL' : mode === 'paste' ? 'pegá una imagen' : 'cargá un archivo'}` :
         status === 'extracting' ? 'Procesando…' : ''}
      </p>
    </div>
  );
}

const pLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' };

/* ── Main Component ─────────────────────────────────────────────────────── */
export function CatalogExtractorWorkspace({ onNavigate }: Props) {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  // Reset al cambiar modo
  const resetInput = () => {
    setFile(null);
    setPreview(null);
    setUrl('');
    setErrorMsg('');
    setProducts([]);
    setStatus('idle');
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetInput();
  };

  // Paste global (Ctrl+V) cuando el tab es "paste"
  useEffect(() => {
    if (mode !== 'paste') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((i) => i.type.startsWith('image/'));
      if (!imageItem) return;
      const blob = imageItem.getAsFile();
      if (blob) {
        setPreview(URL.createObjectURL(blob));
        setFile(blob);
        setErrorMsg('');
        setProducts([]);
        setStatus('idle');
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [mode]);

  const loadFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrorMsg('Formato no soportado. Usá PDF, PNG, JPG o WEBP.');
      setStatus('error');
      return;
    }

    setFile(f);
    setErrorMsg('');
    setProducts([]);
    setStatus('idle');

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleExtract = useCallback(async () => {
    setStatus('extracting');
    setErrorMsg('');

    try {
      let fileToSend: File | null = null;
      let modeToSend: 'url' | 'file' = 'file';

      if (mode === 'url') {
        if (!url.trim().startsWith('http')) {
          throw new Error('URL inválida. Debe comenzar con http:// o https://');
        }
        modeToSend = 'url';
      } else {
        if (!file) {
          throw new Error('No hay archivo para procesar');
        }

        // Si es PDF, convertirlo a imagen primero
        if (file.type === 'application/pdf') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfjsLib = await import('pdfjs-dist');
            
            // Configurar el worker - usar múltiples opciones
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
              // Opción 1: Worker desde public (copiado localmente)
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
              
              // Si falla, intentar con CDN alternativo
              // El worker se cargará automáticamente cuando se necesite
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport }).promise;

            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/png');
            });

            if (!blob) {
              throw new Error('Error al convertir PDF a imagen');
            }

            fileToSend = new File([blob], file.name.replace('.pdf', '.png'), { type: 'image/png' });
          } catch (pdfErr) {
            throw new Error(`Error al convertir PDF: ${pdfErr instanceof Error ? pdfErr.message : 'Error desconocido'}`);
          }
        } else {
          fileToSend = file;
        }
      }

      const result = await extractCatalog(modeToSend === 'url' ? url : fileToSend!, modeToSend);
      
      if (!result.ok || !result.products) {
        throw new Error(result.error || 'Error al procesar el catálogo');
      }

      setProducts(result.products);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
    }
  }, [mode, url, file]);

  const handleExportCSV = () => exportToCSV(products, 'catalogo');
  const handleExportXLSX = () => exportToXLSX(products, 'catalogo');

  const handleReset = () => resetInput();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  }, []);

  return (
    <>
      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
      <WorkspaceShell
        toolId="extraer-catalogo"
        onNavigate={onNavigate}
        leftPanel={
          <LeftPanel
            mode={mode} setMode={handleModeChange}
            url={url} setUrl={setUrl}
            file={file} status={status}
            onUpload={() => fileRef.current?.click()}
            onExtract={handleExtract}
            onReset={handleReset}
          />
        }
        canvas={
          <div style={{ height: '100%' }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
            <CatalogCanvas
              mode={mode} url={url} file={file} preview={preview} status={status} products={products} errorMsg={errorMsg}
              onExportCSV={handleExportCSV} onExportXLSX={handleExportXLSX}
            />
          </div>
        }
        properties={<PropertiesPanel products={products} status={status} mode={mode} />}
        actions={status === 'done' && products.length > 0 ? (
          <>
            <button onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
              <Download size={11} /> CSV
            </button>
            <button onClick={handleExportXLSX}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', backgroundColor: '#8B5CF6', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
              <Download size={11} /> Excel
            </button>
          </>
        ) : undefined}
      />
    </>
  );
}
