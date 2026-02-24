/**
 * 📁 Biblioteca — Gestión centralizada de assets (imágenes, documentos, archivos)
 * Hub de assets: upload, organización, búsqueda y preview.
 */
import React, { useState, useRef, useCallback } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Upload, Grid, List, Search, Trash2, Download, Copy, Tag, CheckCircle2, X } from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

export interface LibraryAsset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'other';
  size: number;        // bytes
  date: string;
  url: string;         // data URL or object URL
  thumbnail?: string;
  tags: string[];
  collection: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mime: string): LibraryAsset['type'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.includes('pdf') || mime.includes('doc') || mime.includes('text')) return 'document';
  return 'other';
}

const TYPE_COLOR: Record<LibraryAsset['type'], string> = {
  image: '#3B82F6', document: '#10B981', video: '#8B5CF6', other: '#9CA3AF',
};
const TYPE_EMOJI: Record<LibraryAsset['type'], string> = {
  image: '🖼️', document: '📄', video: '🎬', other: '📎',
};

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({ filter, setFilter, collection, setCollection, assets }: {
  filter: string; setFilter: (s: string) => void;
  collection: string; setCollection: (s: string) => void;
  assets: LibraryAsset[];
}) {
  const counts: Record<string, number> = { all: assets.length };
  assets.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });

  const collections = ['General', 'Productos', 'Marketing', 'Documentos'];

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Type filter */}
      <div style={{ padding: '0 10px', marginBottom: 6 }}>
        <p style={sectionLabel}>Tipo de archivo</p>
        {[
          { id: 'all', label: 'Todos', emoji: '📂' },
          { id: 'image', label: 'Imágenes', emoji: '🖼️' },
          { id: 'document', label: 'Documentos', emoji: '📄' },
          { id: 'video', label: 'Videos', emoji: '🎬' },
          { id: 'other', label: 'Otros', emoji: '📎' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, border: 'none', backgroundColor: filter === f.id ? '#EFF6FF' : 'transparent', color: filter === f.id ? '#2563EB' : '#374151', cursor: 'pointer', fontSize: '0.78rem', fontWeight: filter === f.id ? '700' : '500', marginBottom: 1 }}>
            <span>{f.emoji} {f.label}</span>
            <span style={{ fontSize: '0.65rem', backgroundColor: filter === f.id ? '#BFDBFE' : '#F3F4F6', color: filter === f.id ? '#1D4ED8' : '#9CA3AF', borderRadius: 10, padding: '1px 6px', fontWeight: '700' }}>{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '8px 0' }} />

      {/* Collections */}
      <div style={{ padding: '0 10px' }}>
        <p style={sectionLabel}>Colecciones</p>
        {collections.map(c => (
          <button key={c} onClick={() => setCollection(collection === c ? '' : c)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 7, border: 'none', backgroundColor: collection === c ? '#FFF4F0' : 'transparent', color: collection === c ? '#FF6835' : '#374151', cursor: 'pointer', fontSize: '0.78rem', fontWeight: collection === c ? '700' : '500', marginBottom: 1 }}>
            <Tag size={12} style={{ color: collection === c ? '#FF6835' : '#9CA3AF' }} />
            {c}
          </button>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '8px 0' }} />

      {/* Stats */}
      <div style={{ padding: '4px 10px' }}>
        <p style={sectionLabel}>Almacenamiento</p>
        <div style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#111827' }}>
            {formatSize(assets.reduce((acc, a) => acc + a.size, 0))}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{assets.length} archivos en total</div>
        </div>
      </div>
    </div>
  );
}

/* ── Canvas ─────────────────────────────────────────────────────────────── */
function Canvas({ assets, viewMode, setViewMode, onUpload, onSelect, selectedId, onDelete, searchQuery, setSearchQuery }: {
  assets: LibraryAsset[]; viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  onUpload: (files: FileList) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onDelete: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files);
  }, [onUpload]);

  const displayed = assets.filter(a =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 48, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
        {/* Search */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', padding: '6px 10px' }}>
          <Search size={13} color="#9CA3AF" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por nombre o tag..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', backgroundColor: 'transparent', color: '#374151' }} />
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', borderRadius: 7, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ padding: '6px 10px', border: 'none', backgroundColor: viewMode === v ? '#FF6835' : '#fff', color: viewMode === v ? '#fff' : '#6B7280', cursor: 'pointer' }}>
              {v === 'grid' ? <Grid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
        {/* Upload */}
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files && onUpload(e.target.files)} />
        <button onClick={() => fileRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: '#FF6835', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}>
          <Upload size={13} /> Subir archivos
        </button>
      </div>

      {/* Drop zone / Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}>

        {/* Drop overlay */}
        {dragOver && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#3B82F620', border: '2px dashed #3B82F6', borderRadius: 10, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#2563EB' }}>
              <Upload size={32} />
              <p style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: 8 }}>Soltar archivos aquí</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {displayed.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#9CA3AF', gap: 12 }}>
            <div style={{ fontSize: '3rem' }}>📭</div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', margin: '0 0 4px' }}>
                {searchQuery ? 'Sin resultados' : 'Biblioteca vacía'}
              </p>
              <p style={{ fontSize: '0.78rem', margin: 0 }}>
                {searchQuery ? 'Probá con otros términos' : 'Subí tus primeros archivos o arrastralos aquí'}
              </p>
            </div>
            {!searchQuery && (
              <button onClick={() => fileRef.current?.click()}
                style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px dashed #3B82F6', backgroundColor: '#EFF6FF', color: '#2563EB', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}>
                + Subir primer archivo
              </button>
            )}
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && displayed.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {displayed.map(asset => (
              <div key={asset.id} onClick={() => onSelect(asset.id)}
                style={{ borderRadius: 10, border: `2px solid ${selectedId === asset.id ? '#3B82F6' : '#E5E7EB'}`, backgroundColor: '#fff', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s', boxShadow: selectedId === asset.id ? '0 0 0 3px #3B82F625' : 'none' }}
                onMouseEnter={e => { if (selectedId !== asset.id) e.currentTarget.style.borderColor = '#93C5FD'; }}
                onMouseLeave={e => { if (selectedId !== asset.id) e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                {/* Thumbnail */}
                <div style={{ height: 90, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {asset.type === 'image' && asset.thumbnail ? (
                    <img src={asset.thumbnail} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{TYPE_EMOJI[asset.type]}</span>
                  )}
                  {selectedId === asset.id && (
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <CheckCircle2 size={16} color="#3B82F6" fill="#fff" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '7px 8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                  <div style={{ fontSize: '0.62rem', color: '#9CA3AF', marginTop: 2 }}>{formatSize(asset.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && displayed.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 8, padding: '4px 12px', fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Nombre</span><span>Tipo</span><span>Fecha</span><span>Tamaño</span>
            </div>
            {displayed.map(asset => (
              <div key={asset.id} onClick={() => onSelect(asset.id)}
                style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 8, padding: '8px 12px', backgroundColor: '#fff', borderRadius: 8, border: `1.5px solid ${selectedId === asset.id ? '#3B82F6' : '#E5E7EB'}`, cursor: 'pointer', alignItems: 'center', transition: 'all 0.12s' }}
                onMouseEnter={e => { if (selectedId !== asset.id) e.currentTarget.style.borderColor = '#93C5FD'; }}
                onMouseLeave={e => { if (selectedId !== asset.id) e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {asset.type === 'image' && asset.thumbnail
                    ? <img src={asset.thumbnail} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{TYPE_EMOJI[asset.type]}</span>
                  }
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: TYPE_COLOR[asset.type], fontWeight: '600', textTransform: 'capitalize' }}>{asset.type}</span>
                <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{asset.date}</span>
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{formatSize(asset.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Properties Panel ───────────────────────────────────────────────────── */
function PropertiesPanel({ asset, onDelete, onDownload }: { asset: LibraryAsset | null; onDelete: (id: string) => void; onDownload: (a: LibraryAsset) => void }) {
  const [newTag, setNewTag] = useState('');

  if (!asset) return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>👆</div>
      <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>Seleccioná un archivo para ver sus propiedades</p>
    </div>
  );

  return (
    <div>
      {/* Preview */}
      <div style={{ height: 110, backgroundColor: '#F9FAFB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
        {asset.type === 'image' && asset.thumbnail
          ? <img src={asset.thumbnail} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '3rem' }}>{TYPE_EMOJI[asset.type]}</span>
        }
      </div>
      <p style={propLabel}>Nombre</p>
      <p style={{ fontSize: '0.78rem', fontWeight: '600', color: '#111827', wordBreak: 'break-word', marginBottom: 8 }}>{asset.name}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          <p style={propLabel}>Tipo</p>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: TYPE_COLOR[asset.type], backgroundColor: `${TYPE_COLOR[asset.type]}15`, padding: '2px 7px', borderRadius: 4 }}>{asset.type}</span>
        </div>
        <div>
          <p style={propLabel}>Tamaño</p>
          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: '600' }}>{formatSize(asset.size)}</span>
        </div>
        <div>
          <p style={propLabel}>Colección</p>
          <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{asset.collection}</span>
        </div>
        <div>
          <p style={propLabel}>Fecha</p>
          <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{asset.date}</span>
        </div>
      </div>

      <p style={propLabel}>Tags</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {asset.tags.map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', backgroundColor: '#F3F4F6', borderRadius: 12, fontSize: '0.65rem', color: '#374151', fontWeight: '600' }}>
            {t} <X size={9} style={{ cursor: 'pointer', color: '#9CA3AF' }} />
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="+ nuevo tag" onKeyDown={e => e.key === 'Enter' && setNewTag('')}
          style={{ flex: 1, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: '0.72rem', outline: 'none' }} />
        <button onClick={() => setNewTag('')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '0.72rem' }}>+</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => onDownload(asset)}
          style={{ width: '100%', padding: '8px', borderRadius: 7, border: 'none', backgroundColor: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Download size={12} /> Descargar
        </button>
        <button onClick={() => { navigator.clipboard.writeText(asset.url).catch(() => {}); }}
          style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Copy size={12} /> Copiar URL
        </button>
        <button onClick={() => onDelete(asset.id)}
          style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4, marginTop: 0 };
const propLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' };

/* ── Main Component ─────────────────────────────────────────────────────── */
export function BibliotecaWorkspace({ onNavigate }: Props) {
  const [assets, setAssets]           = useState<LibraryAsset[]>([]);
  const [filter, setFilter]           = useState('all');
  const [collection, setCollection]   = useState('');
  const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAsset = assets.find(a => a.id === selectedId) ?? null;

  const filteredAssets = assets.filter(a => {
    const typeOk = filter === 'all' || a.type === filter;
    const colOk  = !collection || a.collection === collection;
    return typeOk && colOk;
  });

  const handleUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const asset: LibraryAsset = {
          id: `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name, type: getFileType(file.type),
          size: file.size,
          date: new Date().toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          url, thumbnail: getFileType(file.type) === 'image' ? url : undefined,
          tags: [], collection: 'General',
        };
        setAssets(prev => [asset, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDownload = (asset: LibraryAsset) => {
    const a = document.createElement('a');
    a.href = asset.url; a.download = asset.name; a.click();
  };

  return (
    <WorkspaceShell
      toolId="biblioteca"
      onNavigate={onNavigate}
      leftPanel={<LeftPanel filter={filter} setFilter={setFilter} collection={collection} setCollection={setCollection} assets={assets} />}
      canvas={<Canvas assets={filteredAssets} viewMode={viewMode} setViewMode={setViewMode} onUpload={handleUpload} onSelect={setSelectedId} selectedId={selectedId} onDelete={handleDelete} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      properties={<PropertiesPanel asset={selectedAsset} onDelete={handleDelete} onDownload={handleDownload} />}
      actions={
        <>
          <span style={{ fontSize: '0.7rem', color: '#71717A' }}>{assets.length} archivos</span>
        </>
      }
    />
  );
}
