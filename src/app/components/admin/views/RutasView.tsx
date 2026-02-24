/* =====================================================
   RutasView — Gestión de Rutas de Distribución
   Rutas Standard · Por Proyecto · Asignación
   ===================================================== */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Map, MapPin, Package, Truck, Clock, Plus,
  Search, CheckCircle2, AlertCircle, ChevronRight,
  Navigation, Users, Calendar, Edit2, Layers,
  ArrowRight, RotateCcw,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }
const ORANGE = '#FF6835';

type TipoRuta = 'standard' | 'proyecto';
type EstadoRuta = 'activa' | 'pausada' | 'completada' | 'planificada';

interface Parada {
  id: string;
  orden: number;
  direccion: string;
  localidad: string;
  envios: number;
  estado: 'pendiente' | 'entregado' | 'fallido';
}

interface Ruta {
  id: string;
  nombre: string;
  tipo: TipoRuta;
  estado: EstadoRuta;
  carrier: string;
  zona: string;
  frecuencia?: string;
  proyecto?: string;
  paradas: Parada[];
  enviosTotales: number;
  kmsEstimados: number;
  tiempoEstimado: string;
  fechaProxima?: string;
  observaciones?: string;
}

const RUTAS: Ruta[] = [
  {
    id: 'r1', nombre: 'Ruta CABA Sur — Zona A', tipo: 'standard', estado: 'activa',
    carrier: 'Express Delivery GBA', zona: 'CABA Sur', frecuencia: 'Lunes / Miércoles / Viernes',
    enviosTotales: 18, kmsEstimados: 42, tiempoEstimado: '4-5 hs',
    paradas: [
      { id: 'p1', orden: 1, direccion: 'Av. San Juan 1200', localidad: 'San Cristóbal', envios: 3, estado: 'entregado' },
      { id: 'p2', orden: 2, direccion: 'Caseros 540', localidad: 'Boedo', envios: 2, estado: 'entregado' },
      { id: 'p3', orden: 3, direccion: 'Av. Rivadavia 4500', localidad: 'Caballito', envios: 5, estado: 'pendiente' },
      { id: 'p4', orden: 4, direccion: 'Acoyte 234', localidad: 'Caballito', envios: 4, estado: 'pendiente' },
      { id: 'p5', orden: 5, direccion: 'Av. Corrientes 6800', localidad: 'Palermo', envios: 4, estado: 'pendiente' },
    ],
  },
  {
    id: 'r2', nombre: 'Ruta GBA Norte — Zona B', tipo: 'standard', estado: 'activa',
    carrier: 'Correo Argentino', zona: 'GBA Norte', frecuencia: 'Martes / Jueves',
    enviosTotales: 24, kmsEstimados: 78, tiempoEstimado: '6-7 hs',
    paradas: [
      { id: 'p6', orden: 1, direccion: 'Av. Maipú 1800', localidad: 'Vicente López', envios: 6, estado: 'entregado' },
      { id: 'p7', orden: 2, direccion: 'Moreno 2340', localidad: 'San Isidro', envios: 8, estado: 'pendiente' },
      { id: 'p8', orden: 3, direccion: 'Pavón 560', localidad: 'San Martín', envios: 10, estado: 'pendiente' },
    ],
  },
  {
    id: 'r3', nombre: 'Proyecto Canastas Navideñas 2024', tipo: 'proyecto', estado: 'planificada',
    carrier: 'Express Delivery GBA', zona: 'CABA + GBA', proyecto: 'Canastas Corp 2024',
    enviosTotales: 120, kmsEstimados: 340, tiempoEstimado: '3 días', fechaProxima: '20/12/2024',
    observaciones: 'Distribución masiva de 120 canastas corporativas. Requiere 3 camionetas.',
    paradas: [
      { id: 'p9',  orden: 1,  direccion: 'Catalinas Norte — Torre 1', localidad: 'CABA Microcentro', envios: 25, estado: 'pendiente' },
      { id: 'p10', orden: 2,  direccion: 'WTC Buenos Aires', localidad: 'CABA Puerto Madero', envios: 18, estado: 'pendiente' },
      { id: 'p11', orden: 3,  direccion: 'Av. del Libertador 5000', localidad: 'CABA Palermo', envios: 15, estado: 'pendiente' },
      { id: 'p12', orden: 4,  direccion: 'Panamericana km 35', localidad: 'GBA Norte', envios: 62, estado: 'pendiente' },
    ],
  },
  {
    id: 'r4', nombre: 'Ruta Córdoba Capital', tipo: 'standard', estado: 'activa',
    carrier: 'Andreani', zona: 'Córdoba Capital', frecuencia: 'Miércoles',
    enviosTotales: 8, kmsEstimados: 25, tiempoEstimado: '3-4 hs',
    paradas: [
      { id: 'p13', orden: 1, direccion: 'Av. Colón 800', localidad: 'Córdoba Centro', envios: 3, estado: 'pendiente' },
      { id: 'p14', orden: 2, direccion: 'Dean Funes 1200', localidad: 'Córdoba', envios: 5, estado: 'pendiente' },
    ],
  },
  {
    id: 'r5', nombre: 'Ruta Especial — Clientes VIP', tipo: 'proyecto', estado: 'activa',
    carrier: 'Express Delivery GBA', zona: 'CABA Premium', proyecto: 'Clientes VIP Q1-2024',
    enviosTotales: 6, kmsEstimados: 28, tiempoEstimado: '2-3 hs', fechaProxima: '18/01/2024',
    paradas: [
      { id: 'p15', orden: 1, direccion: 'Av. Alvear 1698', localidad: 'Recoleta', envios: 2, estado: 'entregado' },
      { id: 'p16', orden: 2, direccion: 'Santa Fe 3592', localidad: 'Palermo', envios: 2, estado: 'entregado' },
      { id: 'p17', orden: 3, direccion: 'Juramento 1788', localidad: 'Belgrano', envios: 2, estado: 'pendiente' },
    ],
  },
];

const ESTADO_CFG: Record<EstadoRuta, { label: string; color: string; bg: string }> = {
  activa:       { label: 'Activa',       color: '#059669', bg: '#ECFDF5' },
  pausada:      { label: 'Pausada',      color: '#D97706', bg: '#FFFBEB' },
  planificada:  { label: 'Planificada',  color: '#2563EB', bg: '#EFF6FF' },
  completada:   { label: 'Completada',   color: '#6B7280', bg: '#F3F4F6' },
};

type Tab = 'todas' | 'standard' | 'proyecto';

export function RutasView({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('todas');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Ruta | null>(RUTAS[0]);

  const filtered = RUTAS.filter(r => {
    if (tab === 'standard' && r.tipo !== 'standard') return false;
    if (tab === 'proyecto' && r.tipo !== 'proyecto') return false;
    if (search && !r.nombre.toLowerCase().includes(search.toLowerCase()) &&
        !r.zona.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalEnviosActivos = RUTAS.filter(r => r.estado === 'activa').reduce((s,r) => s + r.enviosTotales, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Map}
        title="Rutas de Distribución"
        subtitle={`${RUTAS.filter(r=>r.estado==='activa').length} rutas activas · ${totalEnviosActivos} envíos planificados`}
        actions={[
          { label: '← Logística', onClick: () => onNavigate('logistica') },
          { label: '+ Nueva Ruta', primary: true },
        ]}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
        {/* Lista de rutas */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E5E7EB', backgroundColor: '#fff' }}>
          {/* Tabs + búsqueda */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ruta o zona..."
                style={{ width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0', borderRadius: '8px', backgroundColor: '#F3F4F6', padding: '3px' }}>
              {([['todas','Todas'],['standard','Standard'],['proyecto','Proyecto']] as [Tab,string][]).map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, backgroundColor: tab === id ? '#fff' : 'transparent', color: tab === id ? '#111' : '#6B7280', boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((ruta) => {
              const estadoCfg = ESTADO_CFG[ruta.estado];
              const isSelected = selected?.id === ruta.id;
              const entregados = ruta.paradas.filter(p => p.estado === 'entregado').length;
              const pct = Math.round((entregados / ruta.paradas.length) * 100);
              return (
                <div key={ruta.id} onClick={() => setSelected(ruta)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', backgroundColor: isSelected ? '#FFF4EC' : 'transparent', borderLeft: isSelected ? `3px solid ${ORANGE}` : '3px solid transparent', transition: 'all 0.1s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: ruta.tipo === 'proyecto' ? '#EFF6FF' : '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ruta.tipo === 'proyecto' ? <Layers size={14} color="#2563EB" /> : <Navigation size={14} color={ORANGE} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: '3px' }}>{ruta.nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: estadoCfg.color, backgroundColor: estadoCfg.bg, padding: '1px 6px', borderRadius: '8px' }}>{estadoCfg.label}</span>
                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{ruta.carrier}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
                    <span>📍 {ruta.paradas.length} paradas</span>
                    <span>📦 {ruta.enviosTotales} envíos</span>
                    <span>🛣 {ruta.kmsEstimados} km</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#059669' : ORANGE, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{entregados}/{ruta.paradas.length} entregados ({pct}%)</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle de ruta */}
        {selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header detalle */}
            <div style={{ backgroundColor: '#fff', padding: '20px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111' }}>{selected.nombre}</h2>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: ESTADO_CFG[selected.estado].color, backgroundColor: ESTADO_CFG[selected.estado].bg, padding: '3px 8px', borderRadius: '10px' }}>
                      {ESTADO_CFG[selected.estado].label}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: selected.tipo === 'proyecto' ? '#2563EB' : ORANGE, backgroundColor: selected.tipo === 'proyecto' ? '#EFF6FF' : '#FFF4EC', padding: '3px 8px', borderRadius: '10px' }}>
                      {selected.tipo === 'proyecto' ? '📋 Proyecto' : '🔄 Standard'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#6B7280', flexWrap: 'wrap' }}>
                    <span>🚚 {selected.carrier}</span>
                    <span>📍 {selected.zona}</span>
                    <span>🛣 {selected.kmsEstimados} km</span>
                    <span>⏱ {selected.tiempoEstimado}</span>
                    {selected.frecuencia && <span>📅 {selected.frecuencia}</span>}
                    {selected.fechaProxima && <span style={{ color: ORANGE, fontWeight: 700 }}>📆 Próxima: {selected.fechaProxima}</span>}
                  </div>
                  {selected.observaciones && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#FFFBEB', borderRadius: '8px', fontSize: '12px', color: '#92400E', border: '1px solid #FDE68A' }}>
                      ⚠ {selected.observaciones}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button style={{ padding: '8px 16px', border: `1.5px solid ${ORANGE}`, borderRadius: '8px', backgroundColor: 'transparent', color: ORANGE, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    ▶ Iniciar ruta
                  </button>
                </div>
              </div>
            </div>

            {/* Paradas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Paradas ({selected.paradas.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selected.paradas.map((parada, idx) => {
                  const isDone = parada.estado === 'entregado';
                  const isFail = parada.estado === 'fallido';
                  return (
                    <div key={parada.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {/* Número + línea conectora */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800,
                          backgroundColor: isDone ? '#D1FAE5' : isFail ? '#FEE2E2' : `${ORANGE}18`,
                          color: isDone ? '#059669' : isFail ? '#DC2626' : ORANGE,
                          border: `2px solid ${isDone ? '#A7F3D0' : isFail ? '#FCA5A5' : `${ORANGE}40`}`,
                        }}>
                          {isDone ? '✓' : parada.orden}
                        </div>
                        {idx < selected.paradas.length - 1 && (
                          <div style={{ width: '2px', height: '20px', backgroundColor: isDone ? '#A7F3D0' : '#E5E7EB', margin: '3px 0' }} />
                        )}
                      </div>
                      {/* Contenido */}
                      <div style={{
                        flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #E5E7EB',
                        backgroundColor: isDone ? '#F0FDF4' : isFail ? '#FFF5F5' : '#fff',
                        marginBottom: idx < selected.paradas.length - 1 ? '0' : '0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '3px' }}>{parada.direccion}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>{parada.localidad} · {parada.envios} envío{parada.envios > 1 ? 's' : ''}</div>
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px',
                            color: isDone ? '#059669' : isFail ? '#DC2626' : '#D97706',
                            backgroundColor: isDone ? '#D1FAE5' : isFail ? '#FEE2E2' : '#FFFBEB',
                          }}>
                            {isDone ? '✓ Entregado' : isFail ? '✗ Fallido' : '⏳ Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px' }}>
            Seleccioná una ruta para ver el detalle
          </div>
        )}
      </div>
    </div>
  );
}