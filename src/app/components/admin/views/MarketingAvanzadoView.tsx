/* =====================================================
   Marketing Avanzado — Integración de IMKTG Avanzado
   ===================================================== */

import React, { useState } from 'react';
import type { MainSection } from '../../../AdminDashboard';

// Platform sections
import { Dashboard } from '../../marketing-avanzado/platform/Dashboard';
import { PlaceholderSection } from '../../marketing-avanzado/platform/PlaceholderSection';

// Marketing · Activation Engine
import { Overview } from '../../marketing-avanzado/arch/Overview';
import { FolderStructure } from '../../marketing-avanzado/arch/FolderStructure';
import { DomainModels } from '../../marketing-avanzado/arch/DomainModels';
import { Services } from '../../marketing-avanzado/arch/Services';
import { ActivationFlow } from '../../marketing-avanzado/arch/ActivationFlow';
import { Security } from '../../marketing-avanzado/arch/Security';
import { Scalability } from '../../marketing-avanzado/arch/Scalability';
import { TypesPackage } from '../../marketing-avanzado/arch/TypesPackage';
import { DBSchema } from '../../marketing-avanzado/arch/DBSchema';
import { Simulator } from '../../marketing-avanzado/arch/Simulator';

// Marketing · Behavior Orchestrator
import { BehaviorOverview } from '../../marketing-avanzado/bo/BehaviorOverview';
import { BehaviorModels } from '../../marketing-avanzado/bo/BehaviorModels';
import { BehaviorServices } from '../../marketing-avanzado/bo/BehaviorServices';
import { BehaviorFlow } from '../../marketing-avanzado/bo/BehaviorFlow';
import { BehaviorStructure } from '../../marketing-avanzado/bo/BehaviorStructure';

// Marketing · Department Spotlight System
import { DSSOverview } from '../../marketing-avanzado/dss/DSSOverview';
import { DSSModels } from '../../marketing-avanzado/dss/DSSModels';
import { DSSIntegration } from '../../marketing-avanzado/dss/DSSIntegration';
import { DSSLandingAdmin } from '../../marketing-avanzado/dss/DSSLandingAdmin';

interface Props {
  onNavigate: (s: MainSection) => void;
}

// ── Marketing modules & sections ─────────────────────────────────
const MARKETING_MODULES = [
  {
    id: 'ae', label: 'Activation Engine', color: '#6366F1', abbr: 'AE',
    sublabel: 'Rewards probabilísticos',
    sections: [
      { id: 'overview',   label: 'Overview',      icon: '◈', sublabel: 'Principios & capas' },
      { id: 'structure',  label: 'Estructura',    icon: '⊞', sublabel: 'Árbol de carpetas' },
      { id: 'models',     label: 'Modelos',       icon: '⬡', sublabel: 'Interfaces de dominio' },
      { id: 'services',   label: 'Servicios',     icon: '⚙', sublabel: '5 servicios core' },
      { id: 'flow',       label: 'Flujo',         icon: '⟳', sublabel: '10 pasos' },
      { id: 'security',   label: 'Seguridad',     icon: '⊕', sublabel: 'Antifraude' },
      { id: 'scale',      label: 'Escala',        icon: '⟢', sublabel: 'A/B testing' },
      { id: 'types',      label: 'Types Pkg',     icon: '⬡', sublabel: '@oddy/ae-types' },
      { id: 'schema',     label: 'DB Schema',     icon: '⊟', sublabel: '4 tablas' },
      { id: 'simulator',  label: 'Simulador',     icon: '⚛', sublabel: 'Probabilidades' },
    ],
  },
  {
    id: 'bo', label: 'Behavior Orchestrator', color: '#F59E0B', abbr: 'BO',
    sublabel: 'Análisis de comportamiento',
    sections: [
      { id: 'bo-overview',  label: 'Overview',   icon: '◈', sublabel: 'Arquitectura' },
      { id: 'bo-models',    label: 'Modelos',    icon: '⬡', sublabel: 'UserProfile · Rules' },
      { id: 'bo-services',  label: 'Servicios',  icon: '⚙', sublabel: 'Analyzer · Scorer' },
      { id: 'bo-flow',      label: 'Flujo',      icon: '⟳', sublabel: 'decideStrategy()' },
      { id: 'bo-structure', label: 'Estructura', icon: '⊞', sublabel: 'Carpetas · DB' },
    ],
  },
  {
    id: 'dss', label: 'Dept Spotlight System', color: '#38BDF8', abbr: 'DSS',
    sublabel: 'Protagonismo semanal',
    sections: [
      { id: 'dss-overview', label: 'Overview',    icon: '◈', sublabel: 'Ciclo de vida' },
      { id: 'dss-models',   label: 'Modelos',     icon: '⬡', sublabel: 'Edition · Hints' },
      { id: 'dss-int',      label: 'Integración', icon: '⟳', sublabel: 'AE · BO · Port' },
      { id: 'dss-landing',  label: 'Landing',     icon: '⊟', sublabel: 'Builder · Admin' },
    ],
  },
];

function renderMarketingSection(id: string) {
  switch (id) {
    // AE
    case 'overview':     return <Overview />;
    case 'structure':    return <FolderStructure />;
    case 'models':       return <DomainModels />;
    case 'services':     return <Services />;
    case 'flow':         return <ActivationFlow />;
    case 'security':     return <Security />;
    case 'scale':        return <Scalability />;
    case 'types':        return <TypesPackage />;
    case 'schema':       return <DBSchema />;
    case 'simulator':    return <Simulator />;
    // BO
    case 'bo-overview':  return <BehaviorOverview />;
    case 'bo-models':    return <BehaviorModels />;
    case 'bo-services':  return <BehaviorServices />;
    case 'bo-flow':      return <BehaviorFlow />;
    case 'bo-structure': return <BehaviorStructure />;
    // DSS
    case 'dss-overview': return <DSSOverview />;
    case 'dss-models':   return <DSSModels />;
    case 'dss-int':      return <DSSIntegration />;
    case 'dss-landing':  return <DSSLandingAdmin />;
    default:             return <Overview />;
  }
}

export function MarketingAvanzadoView({ onNavigate }: Props) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'marketing'>('dashboard');
  const [marketingModule, setMarketingModule] = useState('ae');
  const [activeSection, setActiveSection] = useState('overview');
  const [mktSidebarOpen, setMktSidebarOpen] = useState(true);

  const activeModule = MARKETING_MODULES.find(m => m.id === marketingModule)!;

  // Navigate from Dashboard quicklinks
  const handleNavigate = (sectionId: string) => {
    const mod = MARKETING_MODULES.find(m => m.sections.some(s => s.id === sectionId));
    if (mod) {
      setViewMode('marketing');
      setMarketingModule(mod.id);
      setActiveSection(sectionId);
    }
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0D1117', color: '#E6EDF3',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,12,16,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1C2128',
        padding: '0 24px', height: 44,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {/* Breadcrumb */}
        <button
          onClick={() => onNavigate('marketing')}
          style={{
            fontSize: 10, color: '#8B949E', fontFamily: 'monospace',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 6px', borderRadius: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#E6EDF3'}
          onMouseLeave={e => e.currentTarget.style.color = '#8B949E'}
        >
          ← Marketing
        </button>
        <span style={{ color: '#30363D', fontSize: 12 }}>/</span>
        <span style={{
          fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
          color: '#EC4899', padding: '2px 7px', borderRadius: 5,
          background: '#EC489915',
        }}>
          Marketing Avanzado
        </span>

        {viewMode === 'marketing' && (
          <>
            <span style={{ color: '#30363D', fontSize: 12 }}>/</span>
            <span style={{
              fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
              color: activeModule.color, padding: '2px 7px', borderRadius: 5,
              background: activeModule.color + '15',
            }}>
              {activeModule.label}
            </span>
            <span style={{ color: '#30363D', fontSize: 12 }}>/</span>
            <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>
              {activeModule.sections.find(s => s.id === activeSection)?.label ?? ''}
            </span>
          </>
        )}

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {viewMode === 'marketing' && (
            <div style={{ display: 'flex', gap: 2 }}>
              {MARKETING_MODULES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMarketingModule(m.id); setActiveSection(m.sections[0].id); }}
                  style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700,
                    fontFamily: 'monospace', cursor: 'pointer',
                    background: marketingModule === m.id ? m.color + '20' : 'transparent',
                    border: marketingModule === m.id ? `1px solid ${m.color}50` : '1px solid transparent',
                    color: marketingModule === m.id ? m.color : '#484F58',
                    transition: 'all 0.12s',
                  }}
                >
                  {m.abbr}
                </button>
              ))}
            </div>
          )}
          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 2, padding: '2px', background: '#161B22', borderRadius: 6, border: '1px solid #21262D' }}>
            <button
              onClick={() => setViewMode('dashboard')}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                fontFamily: 'monospace', cursor: 'pointer',
                background: viewMode === 'dashboard' ? '#EC489920' : 'transparent',
                border: 'none',
                color: viewMode === 'dashboard' ? '#EC4899' : '#8B949E',
                transition: 'all 0.12s',
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('marketing')}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                fontFamily: 'monospace', cursor: 'pointer',
                background: viewMode === 'marketing' ? '#EC489920' : 'transparent',
                border: 'none',
                color: viewMode === 'marketing' ? '#EC4899' : '#8B949E',
                transition: 'all 0.12s',
              }}
            >
              Módulos
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {viewMode === 'dashboard' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Dashboard onNavigate={handleNavigate} />
        </div>
      )}

      {viewMode === 'marketing' && (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* ── Marketing module sidebar ─────────────────────── */}
          <aside style={{
            width: mktSidebarOpen ? 218 : 44,
            background: '#0D1117',
            borderRight: '1px solid #1C2128',
            flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {/* Module selector */}
            <div style={{ padding: mktSidebarOpen ? '10px 10px 8px' : '10px 0 8px', borderBottom: '1px solid #1C2128', flexShrink: 0 }}>
              {mktSidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 8, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                    Marketing
                  </span>
                  <button
                    onClick={() => setMktSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#30363D', fontSize: 10 }}
                  >
                    ←
                  </button>
                </div>
              )}
              <div style={{
                display: 'flex',
                flexDirection: mktSidebarOpen ? 'row' : 'column',
                gap: 4,
                alignItems: mktSidebarOpen ? 'stretch' : 'center',
                padding: mktSidebarOpen ? 0 : '0 4px',
              }}>
                {MARKETING_MODULES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMarketingModule(m.id);
                      setActiveSection(m.sections[0].id);
                      if (!mktSidebarOpen) setMktSidebarOpen(true);
                    }}
                    title={!mktSidebarOpen ? m.label : undefined}
                    style={{
                      flex: mktSidebarOpen ? 1 : undefined,
                      width: mktSidebarOpen ? undefined : 34,
                      height: mktSidebarOpen ? undefined : 34,
                      padding: mktSidebarOpen ? '5px 4px' : '0',
                      borderRadius: 8, cursor: 'pointer',
                      background: marketingModule === m.id ? m.color + '22' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${marketingModule === m.id ? m.color + '55' : '#21262D'}`,
                      color: marketingModule === m.id ? m.color : '#484F58',
                      fontSize: mktSidebarOpen ? 10 : 11,
                      fontWeight: marketingModule === m.id ? 700 : 400,
                      fontFamily: 'monospace',
                      transition: 'all 0.12s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {mktSidebarOpen ? m.abbr : m.abbr[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Section list */}
            {mktSidebarOpen && (
              <nav style={{ padding: '6px 6px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                {/* Module name header */}
                <div style={{ padding: '6px 6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: activeModule.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: activeModule.color }}>{activeModule.label}</div>
                    <div style={{ fontSize: 9, color: '#484F58' }}>{activeModule.sublabel}</div>
                  </div>
                </div>

                {activeModule.sections.map(s => {
                  const isCurrent = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '5px 8px', borderRadius: 6, marginBottom: 1,
                        background: isCurrent ? activeModule.color + '18' : 'transparent',
                        border: isCurrent ? `1px solid ${activeModule.color}30` : '1px solid transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                        overflow: 'hidden', transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 9, color: isCurrent ? activeModule.color : '#484F58', flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: isCurrent ? 600 : 400,
                          color: isCurrent ? '#E6EDF3' : '#8B949E',
                          whiteSpace: 'nowrap',
                        }}>
                          {s.label}
                        </div>
                        <div style={{
                          fontSize: 8,
                          color: isCurrent ? activeModule.color : '#30363D',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {s.sublabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Collapse toggle (bottom) */}
            {!mktSidebarOpen && (
              <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center', borderTop: '1px solid #1C2128', flexShrink: 0 }}>
                <button
                  onClick={() => setMktSidebarOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#484F58', fontSize: 11 }}
                >
                  →
                </button>
              </div>
            )}
          </aside>

          {/* ── Section content ─────────────────────────────── */}
          <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            <div style={{ padding: '28px 40px 64px', maxWidth: activeSection === 'simulator' ? 1050 : 860, width: '100%' }}>
              {renderMarketingSection(activeSection)}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
