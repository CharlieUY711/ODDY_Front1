/**
 * 🔍 OCR — Texto desde Imagen
 * Tesseract.js · 100% browser · sin API key · Español/Inglés/Portugués
 */
import React, { useState, useRef, useCallback } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Upload, Copy, Download, RefreshCw, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

type Lang = 'spa' | 'eng' | 'por';
type OCRStatus = 'idle' | 'loading' | 'processing' | 'done' | 'error';

interface OCRResult {
  text: string;
  confidence: number;
  words: number;
  lines: number;
  processingMs: number;
}

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'spa', label: 'Español',    flag: '🇪🇸' },
  { id: 'eng', label: 'Inglés',     flag: '🇺🇸' },
  { id: 'por', label: 'Portugués',  flag: '🇧🇷' },
];

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({
  lang, setLang, status, imageSrc,
  onUpload, onProcess, onReset,
}: {
  lang: Lang; setLang: (l: Lang) => void;
  status: OCRStatus; imageSrc: string | null;
  onUpload: () => void; onProcess: () => void; onReset: () => void;
}) {
  const canProcess = !!imageSrc && (status === 'idle' || status === 'done' || status === 'error');
  const isProcessing = status === 'loading' || status === 'processing';

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Upload */}
      <button onClick={onUpload}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: '1.5px dashed #DDD6FE', backgroundColor: '#F5F3FF', color: '#8B5CF6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', marginBottom: 12 }}>
        <Upload size={13} /> Cargar imagen
      </button>

      <p style={sLabel}>Idioma</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
        {LANGS.map(l => (
          <button key={l.id} onClick={() => setLang(l.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${lang === l.id ? '#8B5CF6' : '#E5E7EB'}`, backgroundColor: lang === l.id ? '#F5F3FF' : '#fff', color: lang === l.id ? '#7C3AED' : '#374151', cursor: 'pointer', fontSize: '0.75rem', fontWeight: lang === l.id ? '700' : '500' }}>
            <span>{l.flag}</span> {l.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '10px 0' }} />

      {/* Process */}
      <button onClick={onProcess} disabled={!canProcess || isProcessing}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', backgroundColor: canProcess && !isProcessing ? '#8B5CF6' : '#E5E7EB', color: canProcess && !isProcessing ? '#fff' : '#9CA3AF', cursor: canProcess && !isProcessing ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
        {isProcessing ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Procesando…</> : <><Zap size={12} /> Extraer texto</>}
      </button>

      {(status === 'done' || status === 'error') && (
        <button onClick={onReset}
          style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <RefreshCw size={11} /> Nueva imagen
        </button>
      )}

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '12px 0' }} />

      <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Consejos</p>
        {[
          'Imágenes con texto nítido dan mejores resultados',
          'Fondo claro y texto oscuro es ideal',
          'Facturas impresas: 90%+ precisión',
          'Fotos con perspectiva pueden reducir la precisión',
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
function OCRCanvas({
  imageSrc, status, progress, progressStatus, result, extractedText, setExtractedText, onCopy, onDownload, errorMsg,
}: {
  imageSrc: string | null; status: OCRStatus; progress: number; progressStatus: string;
  result: OCRResult | null; extractedText: string; setExtractedText: (s: string) => void;
  onCopy: () => void; onDownload: () => void; errorMsg: string;
}) {
  // Empty state
  if (!imageSrc) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: '#9CA3AF' }}>
      <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🔍</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#374151', fontSize: '0.9rem' }}>Sin imagen cargada</p>
        <p style={{ margin: 0, fontSize: '0.78rem' }}>Usá el botón "Cargar imagen" o arrastrá un archivo</p>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: '#9CA3AF' }}>
        {['JPG', 'PNG', 'WEBP', 'BMP', 'TIFF'].map(f => (
          <span key={f} style={{ padding: '3px 8px', borderRadius: 4, backgroundColor: '#F5F3FF', color: '#8B5CF6', fontWeight: '600' }}>{f}</span>
        ))}
      </div>
    </div>
  );

  const isProcessing = status === 'loading' || status === 'processing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      {status === 'done' && (
        <div style={{ height: 44, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
          <CheckCircle2 size={14} color="#10B981" />
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10B981' }}>Texto extraído correctamente</span>
          <div style={{ flex: 1 }} />
          <button onClick={onCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', color: '#374151' }}>
            <Copy size={11} /> Copiar texto
          </button>
          <button onClick={onDownload}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: '#8B5CF6', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
            <Download size={11} /> Descargar .txt
          </button>
        </div>
      )}

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Image panel */}
        <div style={{ flex: '0 0 45%', borderRight: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative', backgroundColor: '#E5E7EB', backgroundImage: 'repeating-conic-gradient(#D1D5DB 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }}>
          <img src={imageSrc} alt="OCR source"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

          {/* Processing overlay */}
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000000cc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: '2rem' }}>🔍</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', color: '#fff', fontWeight: '700', fontSize: '0.82rem' }}>{progressStatus || 'Inicializando Tesseract...'}</p>
                <div style={{ width: 200, height: 6, backgroundColor: '#ffffff30', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#8B5CF6', borderRadius: 3, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ margin: '6px 0 0', color: '#A1A1AA', fontSize: '0.72rem' }}>{Math.round(progress)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Text panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Texto extraído</span>
            {status === 'done' && result && (
              <span style={{ fontSize: '0.62rem', color: '#8B5CF6', fontWeight: '600', marginLeft: 'auto' }}>
                {result.words} palabras · {result.lines} líneas · {result.confidence.toFixed(0)}% conf.
              </span>
            )}
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

          {/* Editable text */}
          {(status === 'done' || status === 'idle') && (
            <textarea
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
              placeholder={status === 'idle' ? 'El texto extraído aparecerá aquí. Podés editarlo libremente...' : ''}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 16px', fontSize: '0.84rem', lineHeight: 1.7, color: '#374151', resize: 'none', fontFamily: 'ui-monospace, SFMono-Regular, monospace', backgroundColor: '#fff' }}
            />
          )}

          {isProcessing && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
                <p style={{ fontSize: '0.78rem', fontWeight: '600' }}>Analizando imagen…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Properties Panel ───────────────────────────────────────────────────── */
function PropertiesPanel({ result, status, lang }: { result: OCRResult | null; status: OCRStatus; lang: Lang }) {
  const langMeta = LANGS.find(l => l.id === lang)!;

  return (
    <div>
      <p style={pLabel}>Motor OCR</p>
      <div style={{ marginBottom: 12, padding: '8px 10px', backgroundColor: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7C3AED' }}>Tesseract.js</div>
        <div style={{ fontSize: '0.65rem', color: '#8B5CF6' }}>100% browser · sin API · gratuito</div>
      </div>

      <p style={pLabel}>Idioma activo</p>
      <div style={{ marginBottom: 12, padding: '6px 10px', backgroundColor: '#F9FAFB', borderRadius: 7, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '1rem' }}>{langMeta.flag}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>{langMeta.label}</span>
      </div>

      {result && status === 'done' ? (
        <>
          <p style={pLabel}>Resultados</p>
          {[
            { l: 'Confianza',     v: `${result.confidence.toFixed(1)}%`, color: result.confidence > 80 ? '#10B981' : result.confidence > 60 ? '#F59E0B' : '#EF4444' },
            { l: 'Palabras',      v: result.words.toString(),  color: '#374151' },
            { l: 'Líneas',        v: result.lines.toString(),  color: '#374151' },
            { l: 'Tiempo',        v: `${result.processingMs}ms`, color: '#374151' },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', marginBottom: 3, backgroundColor: '#F9FAFB', borderRadius: 5 }}>
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{row.l}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: row.color }}>{row.v}</span>
            </div>
          ))}

          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, backgroundColor: result.confidence > 80 ? '#D1FAE5' : result.confidence > 60 ? '#FEF3C7' : '#FEF2F2', border: `1px solid ${result.confidence > 80 ? '#6EE7B7' : result.confidence > 60 ? '#FDE68A' : '#FECACA'}` }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: result.confidence > 80 ? '#065F46' : result.confidence > 60 ? '#92400E' : '#991B1B' }}>
              {result.confidence > 80 ? '✅ Excelente calidad' : result.confidence > 60 ? '⚠️ Calidad aceptable' : '❌ Baja calidad — revisá el texto'}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#D1D5DB' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
            {status === 'idle' ? 'Cargá una imagen y presioná "Extraer texto"' :
             status === 'loading' || status === 'processing' ? 'Procesando…' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

const sLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' };
const pLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' };

/* ── Main Component ─────────────────────────────────────────────────────── */
export function OCRWorkspace({ onNavigate }: Props) {
  const [lang, setLang]                   = useState<Lang>('spa');
  const [imageSrc, setImageSrc]           = useState<string | null>(null);
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [status, setStatus]               = useState<OCRStatus>('idle');
  const [progress, setProgress]           = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult]               = useState<OCRResult | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [errorMsg, setErrorMsg]           = useState('');
  const [copied, setCopied]               = useState(false);
  const fileRef                           = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      setImageSrc(e.target?.result as string);
      setImageFile(file);
      setStatus('idle');
      setResult(null);
      setExtractedText('');
      setProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = useCallback(async () => {
    if (!imageSrc) return;
    setStatus('loading');
    setProgress(0);
    setProgressStatus('Cargando Tesseract...');
    const t0 = Date.now();

    try {
      const { createWorker } = await import('tesseract.js');

      const worker = await createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
            setProgressStatus('Inicializando motor OCR...');
            setProgress(m.progress * 20);
          } else if (m.status === 'loading language traineddata') {
            setProgressStatus(`Cargando modelo de idioma...`);
            setProgress(20 + m.progress * 30);
          } else if (m.status === 'initializing api') {
            setProgressStatus('Preparando API...');
            setProgress(50 + m.progress * 10);
          } else if (m.status === 'recognizing text') {
            setStatus('processing');
            setProgressStatus('Reconociendo texto...');
            setProgress(60 + m.progress * 40);
          }
        },
      });

      const { data } = await worker.recognize(imageSrc);
      await worker.terminate();

      const words = data.words?.length ?? data.text.trim().split(/\s+/).filter(Boolean).length;
      const lines = data.lines?.length ?? data.text.trim().split('\n').filter(l => l.trim()).length;

      setResult({
        text: data.text,
        confidence: data.confidence,
        words,
        lines,
        processingMs: Date.now() - t0,
      });
      setExtractedText(data.text);
      setStatus('done');
      setProgress(100);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al procesar la imagen.');
    }
  }, [imageSrc, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ocr-resultado-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadFile(file);
  }, []);

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
      <WorkspaceShell
        toolId="ocr"
        onNavigate={onNavigate}
        leftPanel={
          <LeftPanel
            lang={lang} setLang={setLang} status={status} imageSrc={imageSrc}
            onUpload={() => fileRef.current?.click()}
            onProcess={handleProcess}
            onReset={() => { setImageSrc(null); setImageFile(null); setStatus('idle'); setResult(null); setExtractedText(''); setProgress(0); }}
          />
        }
        canvas={
          <div style={{ height: '100%' }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
            <OCRCanvas
              imageSrc={imageSrc} status={status} progress={progress} progressStatus={progressStatus}
              result={result} extractedText={extractedText} setExtractedText={setExtractedText}
              onCopy={handleCopy} onDownload={handleDownload} errorMsg={errorMsg}
            />
          </div>
        }
        properties={<PropertiesPanel result={result} status={status} lang={lang} />}
        actions={status === 'done' ? (
          <button onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', backgroundColor: copied ? '#10B981' : '#8B5CF6', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
            {copied ? '✓ Copiado' : <><Copy size={11} /> Copiar</>}
          </button>
        ) : undefined}
      />
    </>
  );
}
