import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  ChevronRight, ChevronDown, Edit2, AlertTriangle,
  RefreshCw, Download, Zap, ShieldCheck, UserCog,
} from 'lucide-react';

import { FolderTree } from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';

type ViewMode = 'admin' | 'operador';

interface Dept {
  id: string;
  emoji: string;
  name: string;
  categories: number;
  visible: boolean;
  currency: boolean;
  scope: 'Local' | 'Nacional' | 'Internacional';
  age: 'Todas' | '+18';
  mlSync: boolean;
  adult?: boolean;
}

const INITIAL_DEPARTMENTS: Dept[] = [
  { id: '1',  emoji: '🍕', name: 'Alimentos y Bebidas',                categories: 10, visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '2',  emoji: '🧴', name: 'Higiene y Cuidado Personal',         categories: 10, visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '3',  emoji: '💻', name: 'Tecnología',                         categories: 8,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '4',  emoji: '👜', name: 'Moda y Accesorios',                  categories: 9,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '5',  emoji: '🏠', name: 'Hogar y Decoración',                 categories: 8,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '6',  emoji: '🔧', name: 'Herramientas y Mejoras',             categories: 8,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '7',  emoji: '📺', name: 'Electrodomésticos',                  categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '8',  emoji: '👗', name: 'Indumentaria',                       categories: 7,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '9',  emoji: '👶', name: 'Bebés y Niños',                      categories: 8,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '10', emoji: '⚽', name: 'Deportes y Fitness',                 categories: 8,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '11', emoji: '🚗', name: 'Automotriz',                         categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '12', emoji: '📚', name: 'Oficina y Librería',                 categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '13', emoji: '🐾', name: 'Mascotas',                           categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '14', emoji: '🎮', name: 'Juguetería',                         categories: 7,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '15', emoji: '💊', name: 'Salud y Bienestar',                  categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '16', emoji: '🧹', name: 'Limpieza del Hogar',                 categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '17', emoji: '🎸', name: 'Música e Instrumentos',              categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '18', emoji: '🎬', name: 'Películas, Series y Entretenimiento',categories: 6,  visible: true,  currency: true, scope: 'Local', age: 'Todas', mlSync: false },
  { id: '19', emoji: '🔞', name: 'Contenido Adulto',                   categories: 8,  visible: true,  currency: true, scope: 'Local', age: '+18',   mlSync: false, adult: true },
];

const SUBCATS: Record<string, string[]> = {
  '1': ['Frutas y Verduras', 'Carnes y Pescados', 'Lácteos', 'Bebidas', 'Panadería', 'Enlatados', 'Snacks', 'Condimentos', 'Congelados', 'Orgánicos'],
  '3': ['Smartphones', 'Laptops y PCs', 'Tablets', 'Accesorios Tech', 'Audio', 'Cámaras', 'Gaming', 'Smart Home'],
  '4': ['Bolsos y Carteras', 'Bijouterie', 'Relojes', 'Cinturones', 'Sombreros', 'Bufandas', 'Gafas', 'Wallets', 'Joyería Fina'],
};

/* ─── Shared table row ─── */
interface RowProps {
  dept: Dept;
  index: number;
  isExpanded: boolean;
  viewMode: ViewMode;
  onToggleExpand: (id: string) => void;
  onToggleField: (id: string, field: keyof Dept, value: any) => void;
}

function DeptRow({ dept, index, isExpanded, viewMode, onToggleExpand, onToggleField }: RowProps) {
  const isAdmin = viewMode === 'admin';

  return (
    <div>
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #F3F4F6',
          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF4EC')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#FFFFFF' : '#FAFAFA')}
      >
        {/* Expand */}
        <button
          onClick={() => onToggleExpand(dept.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px 6px', marginRight: '4px', flexShrink: 0 }}
        >
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {/* Emoji */}
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, marginRight: '12px' }}>
          {dept.emoji}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{dept.name}</span>
            {dept.adult && (
              <span style={{ padding: '1px 7px', borderRadius: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '0.65rem', fontWeight: '700' }}>🔞</span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{dept.categories} categorías</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>

          {/* ADMIN ONLY: Visible */}
          {isAdmin && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.72rem', color: '#6B7280' }}>
              <input
                type="checkbox"
                checked={dept.visible}
                onChange={e => onToggleField(dept.id, 'visible', e.target.checked)}
                style={{ accentColor: ORANGE }}
              />
              Visible
            </label>
          )}

          {/* ADMIN ONLY: Currency */}
          {isAdmin && (
            <span style={{ fontSize: '0.88rem', cursor: 'pointer', opacity: dept.currency ? 1 : 0.3 }} title="Mostrar precio">💲</span>
          )}

          {/* Scope — solo admin */}
          {isAdmin && (
            <select
              value={dept.scope}
              onChange={e => onToggleField(dept.id, 'scope', e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '0.72rem', color: '#374151', outline: 'none', cursor: 'pointer', backgroundColor: '#FFF' }}
            >
              <option>Local</option>
              <option>Nacional</option>
              <option>Internacional</option>
            </select>
          )}

          {/* Person icon — solo admin */}
          {isAdmin && (
            <span style={{ fontSize: '0.88rem', opacity: 0.5 }}>👤</span>
          )}

          {/* ADMIN ONLY: Age */}
          {isAdmin && (
            <select
              value={dept.age}
              onChange={e => onToggleField(dept.id, 'age', e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '0.72rem', color: dept.age === '+18' ? '#DC2626' : '#374151', outline: 'none', cursor: 'pointer', backgroundColor: '#FFF' }}
            >
              <option>Todas</option>
              <option>+18</option>
            </select>
          )}

          {/* ML — both views */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '0.72rem', color: '#F59E0B' }}>
            <input
              type="checkbox"
              checked={dept.mlSync}
              onChange={e => onToggleField(dept.id, 'mlSync', e.target.checked)}
              style={{ accentColor: '#F59E0B' }}
            />
            ML
          </label>

          {/* Edit — both views */}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '3px' }}>
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded subcategories */}
      {isExpanded && (
        <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #F3F4F6', padding: '12px 16px 12px 60px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subcategorías</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(SUBCATS[dept.id] || Array.from({ length: dept.categories }, (_, j) => `Subcategoría ${j + 1}`)).map((sub, j) => (
              <span
                key={j}
                style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', fontSize: '0.75rem', color: '#374151', cursor: 'pointer', transition: 'border-color 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = ORANGE)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                {sub}
              </span>
            ))}
            <button style={{ padding: '4px 10px', border: `1px dashed ${ORANGE}`, borderRadius: '20px', fontSize: '0.75rem', color: ORANGE, backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export function DepartamentosView({ onNavigate }: Props) {
  const [depts, setDepts] = useState<Dept[]>(INITIAL_DEPARTMENTS);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('admin');

  const totalCats   = depts.reduce((s, d) => s + d.categories, 0);
  const adultCount  = depts.filter(d => d.adult).length;

  const filteredDepts = depts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    const ne = new Set(expanded);
    ne.has(id) ? ne.delete(id) : ne.add(id);
    setExpanded(ne);
  };

  const toggleField = (id: string, field: keyof Dept, value: any) => {
    setDepts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const isAdmin = viewMode === 'admin';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={FolderTree}
        title="Departamentos y Categorías"
        subtitle="Gestión de departamentos, categorías y subcategorías"
        actions={[
          { label: '← Volver', onClick: () => onNavigate('gestion') },
        ]}
      />

      {/* ── Vista switcher tabs ── */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
        {([
          { key: 'admin',    icon: ShieldCheck, label: 'Vista Administrador', desc: 'Acceso completo a todos los controles' },
          { key: 'operador', icon: UserCog,     label: 'Vista Operador',       desc: 'Sin visibilidad, moneda ni edad' },
        ] as { key: ViewMode; icon: React.ElementType; label: string; desc: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 20px',
              border: 'none',
              borderBottom: viewMode === tab.key ? `3px solid ${ORANGE}` : '3px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: viewMode === tab.key ? ORANGE : '#6B7280',
              fontWeight: viewMode === tab.key ? '700' : '500',
              fontSize: '0.85rem',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
            <span style={{
              marginLeft: '4px',
              padding: '2px 8px',
              borderRadius: '20px',
              backgroundColor: viewMode === tab.key ? '#FFF4EC' : '#F3F4F6',
              color: viewMode === tab.key ? ORANGE : '#9CA3AF',
              fontSize: '0.68rem',
              fontWeight: '600',
            }}>
              {tab.desc}
            </span>
          </button>
        ))}

        {/* Restricted badge */}
        {!isAdmin && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#FEF3C7', borderRadius: '20px', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={13} color="#D97706" />
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#92400E' }}>
              Visibilidad · Moneda · Alcance · Edad — deshabilitados
            </span>
          </div>
        )}
      </div>

      {/* ── Sub-header ── */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '12px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
          <span style={{ fontSize: '1.1rem' }}>🏬</span>
          <h2 style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '1rem' }}>
            {isAdmin ? 'Gestión Completa de Departamentos' : 'Departamentos — Vista Restringida'}
          </h2>
          <span style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: isAdmin ? '#F0FFF4' : '#FEF3C7', color: isAdmin ? '#16A34A' : '#D97706', fontSize: '0.72rem', fontWeight: '700', border: `1px solid ${isAdmin ? '#BBF7D0' : '#FDE68A'}` }}>
            {isAdmin ? '⚡ Modo Local' : '🔒 Acceso Limitado'}
          </span>
        </div>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.75rem' }}>
          {isAdmin
            ? 'Control total: visibilidad, moneda, alcance, edad y sincronización ML'
            : 'Solo podés editar sincronización ML · Visibilidad, moneda, alcance y edad son de gestión exclusiva del Admin'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '20px 28px', maxWidth: '1200px' }}>

          {/* Local mode banner — admin only */}
          {isAdmin && (
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={16} color="#D97706" />
                <div>
                  <p style={{ margin: 0, fontWeight: '700', color: '#92400E', fontSize: '0.82rem' }}>⚠️ Modo Local Activo</p>
                  <p style={{ margin: '2px 0 0', color: '#78350F', fontSize: '0.75rem' }}>
                    El servidor Supabase no está disponible. Los cambios se guardan en tu navegador (localStorage).
                  </p>
                </div>
              </div>
              <button style={{ padding: '8px 16px', backgroundColor: '#D97706', color: '#FFF', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                Reconectar al servidor
              </button>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { value: depts.length, label: 'Departamentos', color: ORANGE },
              { value: totalCats,    label: 'Categorías',     color: '#3B82F6' },
              { value: 36,           label: 'Subcategorías',  color: '#10B981' },
              { value: 0,            label: '⭕ Sync ML',     color: '#6B7280' },
              { value: adultCount,   label: '🔞 Adultos',     color: '#8B5CF6' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: `1px solid ${s.color}22`, padding: '12px 16px' }}>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: s.color }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6B7280' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <input
                type="text"
                placeholder="Buscar departamento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }} />
            {isAdmin && (
              <button style={{ padding: '9px 16px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Inicializar ({depts.length})
              </button>
            )}
            <button style={{ padding: '9px 16px', backgroundColor: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Exportar
            </button>
            <button style={{ padding: '9px 16px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#374151', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Recargar
            </button>
          </div>

          {/* Column headers hint */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px 6px 64px', marginBottom: '4px', gap: '14px' }}>
            <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departamento</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAdmin && <span style={{ minWidth: '48px', textAlign: 'center' }}>Visible</span>}
              {isAdmin && <span style={{ minWidth: '20px', textAlign: 'center' }}>€</span>}
              {isAdmin && <span style={{ minWidth: '90px', textAlign: 'center' }}>Alcance</span>}
              {isAdmin && <span style={{ minWidth: '20px', textAlign: 'center' }}>👤</span>}
              {isAdmin && <span style={{ minWidth: '60px', textAlign: 'center' }}>Edad</span>}
              <span style={{ minWidth: '36px', textAlign: 'center' }}>ML</span>
              <span style={{ minWidth: '24px' }}></span>
            </div>
          </div>

          {/* Department list */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {filteredDepts.map((dept, i) => (
              <DeptRow
                key={dept.id}
                dept={dept}
                index={i}
                isExpanded={expanded.has(dept.id)}
                viewMode={viewMode}
                onToggleExpand={toggleExpand}
                onToggleField={toggleField}
              />
            ))}
          </div>

          {/* Add department — admin only */}
          {isAdmin && (
            <button style={{ marginTop: '14px', padding: '12px 20px', border: `2px dashed ${ORANGE}`, borderRadius: '10px', backgroundColor: '#FFF4EC', color: ORANGE, fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏬 + Nuevo Departamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}