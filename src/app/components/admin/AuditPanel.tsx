/**
 * AuditPanel — Auditoría automática del registry vs MODULES_DATA
 * ═══════════════════════════════════════════════════════════════
 * Compara MODULE_MANIFEST contra la lista de módulos del checklist
 * y muestra qué está cubierto, qué falta y qué sobra.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, CheckCircle2, AlertTriangle, XCircle, Info,
  Database, FileCode2, GitBranch, RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { MODULE_MANIFEST, type ManifestEntry } from '../../utils/moduleManifest';

interface Module { id: string; name: string; category: string; estimatedHours?: number; }

type AuditTab = 'covered' | 'hubs' | 'missing' | 'orphan';

interface AuditResult {
  /** IDs en MODULES_DATA cubiertos por vistas reales */
  covered: Array<{ id: string; name: string; hours: number; entries: ManifestEntry[] }>;
  /** Vistas reales pero con checklistIds vacíos — raros */
  realNoIds: ManifestEntry[];
  /** Secciones hub / placeholder */
  hubs: ManifestEntry[];
  /** IDs en MODULES_DATA sin ninguna entrada real en el manifest */
  missing: Array<{ id: string; name: string; hours: number; category: string }>;
  /** IDs en el manifest que NO existen en MODULES_DATA */
  orphan: Array<{ id: string; section: string; viewFile: string }>;
}

interface Props {
  modules: Module[];
  onClose: () => void;
}

const TAB_INFO: Record<AuditTab, { label: string; icon: any; color: string; bg: string }> = {
  covered: { label: 'Cubiertos',      icon: CheckCircle2,   color: 'text-green-700',  bg: 'bg-green-50 border-green-200'  },
  hubs:    { label: 'Hubs / Placeholders', icon: GitBranch, color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'    },
  missing: { label: 'Sin vista',       icon: XCircle,        color: 'text-red-700',    bg: 'bg-red-50 border-red-200'      },
  orphan:  { label: 'Sin checklist',   icon: AlertTriangle,  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'  },
};

export function AuditPanel({ modules, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<AuditTab>('missing');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const toggleRow = (id: string) =>
    setExpandedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleRefresh = () => {
    setSpinning(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setSpinning(false), 600);
  };

  // ── Compute audit ─────────────────────────────────────────────────────────
  const audit = useMemo<AuditResult>(() => {
    const allChecklistIds = new Set(modules.map(m => m.id));

    // Map: checklistId → entries (del manifest) que lo cubren con isReal=true
    const coveredByReal = new Map<string, ManifestEntry[]>();
    for (const entry of MODULE_MANIFEST) {
      if (!entry.isReal) continue;
      for (const cid of entry.checklistIds) {
        const prev = coveredByReal.get(cid) ?? [];
        coveredByReal.set(cid, [...prev, entry]);
      }
    }

    // Cubiertos
    const covered: AuditResult['covered'] = [];
    for (const [cid, entries] of coveredByReal.entries()) {
      if (!allChecklistIds.has(cid)) continue; // orphan, handled below
      const mod = modules.find(m => m.id === cid)!;
      covered.push({ id: cid, name: mod.name, hours: mod.estimatedHours ?? 0, entries });
    }
    covered.sort((a, b) => a.name.localeCompare(b.name));

    // Vistas reales sin checklistIds
    const realNoIds = MODULE_MANIFEST.filter(e => e.isReal && e.checklistIds.length === 0);

    // Hubs / placeholders
    const hubs = MODULE_MANIFEST.filter(e => !e.isReal);

    // Missing: IDs en MODULES_DATA no cubiertos por ninguna vista real
    const missing: AuditResult['missing'] = modules
      .filter(m => !coveredByReal.has(m.id))
      .map(m => ({ id: m.id, name: m.name, hours: m.estimatedHours ?? 0, category: m.category }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Orphan: IDs en manifest que no existen en MODULES_DATA
    const orphan: AuditResult['orphan'] = [];
    for (const entry of MODULE_MANIFEST) {
      for (const cid of entry.checklistIds) {
        if (!allChecklistIds.has(cid)) {
          orphan.push({ id: cid, section: entry.section, viewFile: entry.viewFile });
        }
      }
    }

    return { covered, realNoIds, hubs, missing, orphan };
  }, [modules, refreshKey]);

  const counts: Record<AuditTab, number> = {
    covered: audit.covered.length,
    hubs:    audit.hubs.length,
    missing: audit.missing.length,
    orphan:  audit.orphan.length,
  };

  const totalHoursMissing = audit.missing.reduce((s, m) => s + m.hours, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '780px', maxWidth: '95vw', maxHeight: '88vh' }}
      >
        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg, #FF6835 0%, #e5532a 100%)', padding: '20px 24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                title="Recalcular auditoría"
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/35 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              >
                <RefreshCw size={18} className={`text-white transition-transform duration-500 ${spinning ? 'animate-spin' : ''}`} />
              </button>
              <div>
                <h2 className="text-white font-bold text-lg leading-none">Auditoría de Módulos</h2>
                <p className="text-white/75 text-xs mt-0.5">
                  Compara <code className="bg-white/20 px-1 rounded text-white">moduleManifest.ts</code> vs{' '}
                  <code className="bg-white/20 px-1 rounded text-white">MODULES_DATA</code> — auto-actualizado en cada render
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { label: 'Cubiertos',    value: audit.covered.length, color: '#22c55e' },
              { label: 'Hubs',         value: audit.hubs.length,    color: '#60a5fa' },
              { label: 'Sin vista',    value: audit.missing.length, color: '#f87171' },
              { label: 'Sin checklist',value: audit.orphan.length,  color: '#fbbf24' },
              { label: `${totalHoursMissing}h pendientes`, value: null, color: 'rgba(255,255,255,0.5)' },
            ].map(p => (
              <span
                key={p.label}
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: 'white', border: `1px solid ${p.color}55` }}
              >
                {p.value !== null && (
                  <span style={{ color: p.color }} className="font-bold mr-1">{p.value}</span>
                )}
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-1">
          {(Object.keys(TAB_INFO) as AuditTab[]).map(tab => {
            const t = TAB_INFO[tab];
            const Icon = t.icon;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
                  active
                    ? 'bg-white border-[#FF6835] text-[#FF6835]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <Icon size={14} />
                {t.label}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                  active ? 'bg-[#FF6835] text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >

              {/* ── CUBIERTOS ── */}
              {activeTab === 'covered' && (
                <div className="space-y-1.5">
                  {audit.covered.length === 0 && <Empty label="Ningún módulo cubierto aún." />}
                  {audit.covered.map(item => (
                    <div key={item.id} className="border border-green-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleRow(item.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors text-left"
                      >
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                          <code className="ml-2 text-xs text-gray-400">#{item.id}</code>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{item.hours}h</span>
                        {expandedRows.has(item.id)
                          ? <ChevronDown size={14} className="text-gray-400" />
                          : <ChevronRight size={14} className="text-gray-400" />}
                      </button>
                      {expandedRows.has(item.id) && (
                        <div className="px-4 py-2 bg-white border-t border-green-100 space-y-1">
                          {item.entries.map(e => (
                            <div key={e.section} className="flex items-center gap-2 text-xs text-gray-600">
                              <FileCode2 size={12} className="text-green-500" />
                              <code className="text-green-700 font-mono">{e.viewFile}</code>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-500">sección: <code>{e.section}</code></span>
                              {e.hasSupabase && (
                                <span className="flex items-center gap-0.5 text-blue-600">
                                  <Database size={10} /> Supabase
                                </span>
                              )}
                            </div>
                          ))}
                          {item.entries[0]?.notes && (
                            <p className="text-xs text-gray-400 italic mt-1">{item.entries[0].notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── HUBS ── */}
              {activeTab === 'hubs' && (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3 text-sm text-blue-700">
                    <Info size={15} className="mt-0.5 shrink-0" />
                    <span>Estos hubs son secciones de navegación. <strong>No cuentan como completados</strong> en el checklist — son el cascarón que contiene a los módulos reales.</span>
                  </div>
                  {audit.hubs.map(e => (
                    <div key={e.section} className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <GitBranch size={15} className="text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <code className="text-xs text-blue-600 font-mono">{e.viewFile}</code>
                        <span className="ml-2 text-xs text-gray-500">sección: <code>{e.section}</code></span>
                      </div>
                      {e.notes && <span className="text-xs text-gray-400 italic truncate max-w-[220px]">{e.notes}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── MISSING ── */}
              {activeTab === 'missing' && (
                <div className="space-y-1.5">
                  {audit.missing.length === 0 && <Empty label="¡Todos los módulos del checklist tienen vista asignada!" icon="🎉" />}
                  {audit.missing.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3 text-sm text-red-700">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        Estos <strong>{audit.missing.length} módulos</strong> existen en el checklist pero no tienen ninguna
                        vista real en <code className="bg-red-100 px-1 rounded">moduleManifest.ts</code>.
                        Son el backlog real pendiente de construir ({totalHoursMissing}h estimadas).
                      </span>
                    </div>
                  )}
                  {audit.missing.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                      <XCircle size={15} className="text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                        <code className="ml-2 text-xs text-gray-400">#{item.id}</code>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{item.category}</span>
                      <span className="text-xs font-semibold text-red-600 shrink-0">{item.hours}h</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ORPHAN ── */}
              {activeTab === 'orphan' && (
                <div className="space-y-1.5">
                  {audit.orphan.length === 0 && <Empty label="Todos los IDs del manifest existen en MODULES_DATA." icon="✅" />}
                  {audit.orphan.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-sm text-amber-700">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        El manifest declara estos IDs pero <strong>no existen en MODULES_DATA</strong>.
                        Hay que agregarlos al checklist o corregir el ID en el manifest.
                      </span>
                    </div>
                  )}
                  {audit.orphan.map(item => (
                    <div key={`${item.section}-${item.id}`} className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono text-amber-800">{item.id}</code>
                        <span className="ml-2 text-xs text-gray-400">en {item.viewFile}</span>
                      </div>
                      <code className="text-xs text-gray-400">sección: {item.section}</code>
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Para agregar un módulo: editá <code className="bg-gray-200 px-1 rounded">moduleManifest.ts</code> → el checklist se actualiza solo.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Empty({ label, icon = '📭' }: { label: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm">{label}</p>
    </div>
  );
}