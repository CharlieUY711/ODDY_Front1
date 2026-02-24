/**
 * ModuleFilesPanel — Panel de archivos adjuntos por módulo
 * 3 tipos: Definición · Variables · Otros
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Settings2, FolderOpen,
  Upload, Trash2, Download, Loader2,
  CheckCircle2, AlertCircle, X, FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

/* ── tipos ──────────────────────────────────────────── */
type FileType = "definicion" | "variables" | "otros";

interface ModuleFile {
  id:         string;
  moduleId:   string;
  type:       FileType;
  name:       string;
  size:       number;
  path:       string;
  uploadedAt: string;
  url?:       string | null;
}

interface Props {
  moduleId:   string;
  moduleName: string;
}

/* ── config de pestañas ─────────────────────────────── */
const TABS: { id: FileType; label: string; icon: React.ElementType; color: string; bg: string; desc: string }[] = [
  {
    id:    "definicion",
    label: "Definición",
    icon:  FileText,
    color: "#2563EB",
    bg:    "#EFF6FF",
    desc:  "Documento de especificación funcional, wireframes, requerimientos",
  },
  {
    id:    "variables",
    label: "Variables",
    icon:  Settings2,
    color: "#7C3AED",
    bg:    "#F5F3FF",
    desc:  "Variables de entorno, configuración, constantes y parámetros",
  },
  {
    id:    "otros",
    label: "Otros",
    icon:  FolderOpen,
    color: "#D97706",
    bg:    "#FFFBEB",
    desc:  "Referencias, mockups, recursos adicionales",
  },
];

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

/* ── componente principal ───────────────────────────── */
export function ModuleFilesPanel({ moduleId, moduleName }: Props) {
  const [activeTab, setActiveTab]   = useState<FileType>("definicion");
  const [files, setFiles]           = useState<ModuleFile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API = projectId
    ? `https://${projectId}.supabase.co/functions/v1/make-server-75638143`
    : null;

  /* ── cargar archivos ─────────────────────────────── */
  const loadFiles = useCallback(async () => {
    if (!API) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/roadmap/files/${moduleId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const { files: data } = await res.json();
      setFiles(data ?? []);
    } catch (err) {
      console.error("[ModuleFilesPanel] loadFiles:", err);
      toast.error("No se pudieron cargar los archivos");
    } finally {
      setLoading(false);
    }
  }, [API, moduleId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  /* ── subir archivo ───────────────────────────────── */
  const uploadFile = async (file: File) => {
    if (!API) { toast.error("Servidor no disponible"); return; }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo no puede superar 20 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",     file);
      fd.append("moduleId", moduleId);
      fd.append("fileType", activeTab);

      const res = await fetch(`${API}/roadmap/files/upload`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body:    fd,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`✅ "${file.name}" subido correctamente`);
      await loadFiles();
    } catch (err) {
      console.error("[ModuleFilesPanel] uploadFile:", err);
      toast.error(`Error subiendo archivo: ${err}`);
    } finally {
      setUploading(false);
    }
  };

  /* ── eliminar archivo ────────────────────────────── */
  const deleteFile = async (fileId: string, fileName: string) => {
    if (!API) return;
    setDeleting(fileId);
    try {
      const res = await fetch(`${API}/roadmap/files/${moduleId}/${fileId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`"${fileName}" eliminado`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error("[ModuleFilesPanel] deleteFile:", err);
      toast.error(`Error eliminando archivo: ${err}`);
    } finally {
      setDeleting(null);
    }
  };

  /* ── drag & drop ─────────────────────────────────── */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) uploadFile(dropped);
  };

  /* ── archivos del tab activo ─────────────────────── */
  const tabFiles    = files.filter(f => f.type === activeTab);
  const activeCfg   = TABS.find(t => t.id === activeTab)!;
  const TabIcon     = activeCfg.icon;

  return (
    <div
      style={{
        borderTop: "1px dashed #E5E7EB",
        backgroundColor: "#FAFAFA",
        padding: "16px 20px 16px 64px", // indent para alinear con el contenido del módulo
      }}
    >
      {/* ── Header del panel ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <FilePlus size={14} color="#6B7280" />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
          Archivos adjuntos — {moduleName}
        </span>
        {files.length > 0 && (
          <span style={{
            fontSize: "10px", fontWeight: 700,
            padding: "2px 7px", borderRadius: "20px",
            backgroundColor: "#F3F4F6", color: "#6B7280",
            border: "1px solid #E5E7EB",
          }}>
            {files.length} archivo{files.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0", marginBottom: "14px", borderBottom: "1px solid #E5E7EB" }}>
        {TABS.map(tab => {
          const cnt    = files.filter(f => f.type === tab.id).length;
          const isAct  = activeTab === tab.id;
          const TIcon  = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "6px",
                padding:        "8px 16px",
                border:         "none",
                backgroundColor: "transparent",
                cursor:         "pointer",
                fontSize:       "12px",
                fontWeight:     isAct ? 700 : 500,
                color:          isAct ? tab.color : "#6B7280",
                borderBottom:   isAct ? `2px solid ${tab.color}` : "2px solid transparent",
                whiteSpace:     "nowrap",
                transition:     "all 0.15s",
              }}
            >
              <TIcon size={13} />
              {tab.label}
              {cnt > 0 && (
                <span style={{
                  fontSize: "10px", fontWeight: 700,
                  padding: "1px 6px", borderRadius: "20px",
                  backgroundColor: isAct ? tab.color : "#E5E7EB",
                  color: isAct ? "#fff" : "#6B7280",
                  minWidth: "18px", textAlign: "center",
                }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Contenido del tab ── */}
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>

        {/* Zona de upload */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            width:          "220px",
            flexShrink:     0,
            border:         `2px dashed ${dragging ? activeCfg.color : "#D1D5DB"}`,
            borderRadius:   "12px",
            backgroundColor: dragging ? activeCfg.bg : "#FFFFFF",
            padding:        "20px 14px",
            textAlign:      "center",
            cursor:         uploading ? "wait" : "pointer",
            transition:     "all 0.15s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: activeCfg.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 8px",
          }}>
            {uploading
              ? <Loader2 size={18} color={activeCfg.color} style={{ animation: "spin 1s linear infinite" }} />
              : <Upload size={18} color={activeCfg.color} />
            }
          </div>
          <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#374151" }}>
            {uploading ? "Subiendo..." : "Subir archivo"}
          </p>
          <p style={{ margin: 0, fontSize: "10px", color: "#9CA3AF" }}>
            {activeCfg.desc}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "10px", color: "#D1D5DB" }}>
            Máx. 20 MB
          </p>
        </div>

        {/* Lista de archivos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9CA3AF", padding: "20px 0" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "12px" }}>Cargando archivos...</span>
            </div>
          ) : tabFiles.length === 0 ? (
            <div style={{
              padding:         "24px 16px",
              borderRadius:    "10px",
              border:          "1px dashed #E5E7EB",
              backgroundColor: "#FFFFFF",
              textAlign:       "center",
            }}>
              <TabIcon size={22} color="#D1D5DB" style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>
                Sin archivos de <strong>{activeCfg.label}</strong> todavía
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {tabFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "10px",
                    padding:         "10px 14px",
                    backgroundColor: "#FFFFFF",
                    borderRadius:    "8px",
                    border:          "1px solid #E5E7EB",
                  }}
                >
                  {/* Icono tipo */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    backgroundColor: activeCfg.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <TabIcon size={14} color={activeCfg.color} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: "12px", fontWeight: 600, color: "#111827",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {file.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#9CA3AF" }}>
                      {fmtSize(file.size)} · {fmtDate(file.uploadedAt)}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: "28px", height: "28px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "6px", border: "1px solid #E5E7EB",
                          backgroundColor: "#F9FAFB", cursor: "pointer",
                          textDecoration: "none",
                        }}
                        title="Descargar"
                      >
                        <Download size={12} color="#6B7280" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteFile(file.id, file.name)}
                      disabled={deleting === file.id}
                      style={{
                        width: "28px", height: "28px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "6px", border: "1px solid #FEE2E2",
                        backgroundColor: "#FFF5F5", cursor: "pointer",
                      }}
                      title="Eliminar"
                    >
                      {deleting === file.id
                        ? <Loader2 size={12} color="#EF4444" style={{ animation: "spin 1s linear infinite" }} />
                        : <Trash2 size={12} color="#EF4444" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
