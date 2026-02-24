/* =====================================================
   MapaEnviosView — Mapa Visual de Envíos Activos
   Vista geográfica por ruta y estado
   ===================================================== */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  MapPin, Truck, Package, Navigation, CheckCircle2,
  AlertCircle, Filter, RefreshCw, Eye, Clock,
  ZoomIn, ZoomOut, Layers, Circle,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }
const ORANGE = '#FF6835';

interface PuntoMapa {
  id: string;
  tipo: 'deposito' | 'en_transito' | 'entregado' | 'fallido' | 'en_reparto';
  numero: string;
  x: number; // % horizontal
  y: number; // % vertical
  cliente: string;
  carrier: string;
  localidad: string;
  provincia: string;
}

const PUNTOS: PuntoMapa[] = [
  // CABA / GBA
  { id: 'dep1', tipo: 'deposito',    numero: 'DEP-CABA',        x: 38, y: 57, cliente: 'Depósito Central', carrier: '—', localidad: 'CABA', provincia: 'CABA' },
  { id: 'dep2', tipo: 'deposito',    numero: 'DEP-GBA-N',       x: 40, y: 53, cliente: 'Depósito Norte', carrier: '—', localidad: 'San Martín', provincia: 'Buenos Aires' },
  { id: 'e01',  tipo: 'en_reparto',  numero: 'ENV-15000-001',   x: 37, y: 56, cliente: 'Martín García', carrier: 'CA', localidad: 'Caballito', provincia: 'CABA' },
  { id: 'e02',  tipo: 'en_transito', numero: 'ENV-15000-002',   x: 36, y: 62, cliente: 'Martín García', carrier: 'Andreani', localidad: 'Córdoba', provincia: 'Córdoba' },
  { id: 'e03',  tipo: 'entregado',   numero: 'ENV-15001-001',   x: 40, y: 54, cliente: 'Sofía Rodríguez', carrier: 'OCA', localidad: 'San Isidro', provincia: 'Buenos Aires' },
  { id: 'e04',  tipo: 'en_transito', numero: 'ENV-15002-001',   x: 26, y: 65, cliente: 'Empresa Textil', carrier: 'Fedex', localidad: 'Mendoza', provincia: 'Mendoza' },
  { id: 'e05',  tipo: 'en_reparto',  numero: 'ENV-15003-001',   x: 39, y: 59, cliente: 'Lucas Fernández', carrier: 'CA', localidad: 'Lomas de Zamora', provincia: 'Buenos Aires' },
  { id: 'e06',  tipo: 'fallido',     numero: 'ENV-15002-003',   x: 44, y: 42, cliente: 'Punto Tucumán', carrier: 'DHL', localidad: 'Tucumán', provincia: 'Tucumán' },
  { id: 'e07',  tipo: 'en_reparto',  numero: 'ENV-XXX-004',     x: 35, y: 56, cliente: 'Julia Pereyra', carrier: 'Andreani', localidad: 'Córdoba Centro', provincia: 'Córdoba' },
  { id: 'e08',  tipo: 'en_transito', numero: 'ENV-XXX-005',     x: 39, y: 76, cliente: 'Estudio Sur', carrier: 'CA', localidad: 'Bariloche', provincia: 'Río Negro' },
  { id: 'e09',  tipo: 'entregado',   numero: 'ENV-XXX-006',     x: 48, y: 44, cliente: 'Don Luis', carrier: 'Andreani', localidad: 'Salta', provincia: 'Salta' },
  { id: 'e10',  tipo: 'en_reparto',  numero: 'ENV-XXX-007',     x: 52, y: 42, cliente: 'Empresa Jujuy', carrier: 'CA', localidad: 'Jujuy', provincia: 'Jujuy' },
];

const TIPO_CFG: Record<string, { color: string; label: string; icon: React.ElementType; size: number }> = {
  deposito:    { color: '#374151', label: 'Depósito',     icon: Package,      size: 18 },
  en_transito: { color: '#7C3AED', label: 'En tránsito',  icon: Truck,        size: 14 },
  en_reparto:  { color: ORANGE,    label: 'En reparto',   icon: Navigation,   size: 14 },
  entregado:   { color: '#059669', label: 'Entregado',    icon: CheckCircle2, size: 13 },
  fallido:     { color: '#DC2626', label: 'Fallido',      icon: AlertCircle,  size: 14 },
};

// Mapa SVG de Argentina simplificado (outline aproximado)
function ArgentinaSVG({ puntos, filtro, onSelect, selected }: {
  puntos: PuntoMapa[];
  filtro: string;
  onSelect: (p: PuntoMapa | null) => void;
  selected: PuntoMapa | null;
}) {
  const shown = filtro === 'todos' ? puntos : puntos.filter(p => p.tipo === filtro);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Fondo tipo mapa */}
      <svg viewBox="0 0 100 120" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Océano */}
        <rect width="100" height="120" fill="#EFF6FF" />
        {/* Perfil aproximado de Argentina */}
        <path
          d="M 45 15 L 55 14 L 62 18 L 65 22 L 67 28 L 65 35 L 68 42 L 65 50 L 60 55 L 58 60 L 52 63 L 50 68 L 48 74 L 45 80 L 42 88 L 40 96 L 38 104 L 36 110 L 34 115 L 32 118 L 30 115 L 28 108 L 30 98 L 33 88 L 32 80 L 30 74 L 28 68 L 30 62 L 32 55 L 30 48 L 28 40 L 30 32 L 32 26 L 35 20 Z"
          fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5"
        />
        {/* Provincias simplificadas - líneas divisorias */}
        <line x1="30" y1="50" x2="65" y2="50" stroke="#D1D5DB" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="30" y1="62" x2="60" y2="62" stroke="#D1D5DB" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="32" y1="74" x2="52" y2="74" stroke="#D1D5DB" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="34" y1="88" x2="45" y2="88" stroke="#D1D5DB" strokeWidth="0.3" strokeDasharray="1,1" />
        {/* Etiquetas de provincias */}
        {[
          { x: 48, y: 46, label: 'Salta/Jujuy' },
          { x: 50, y: 57, label: 'Córdoba/Tucumán' },
          { x: 42, y: 68, label: 'Cuyo' },
          { x: 43, y: 55, label: 'CABA/GBA' },
          { x: 40, y: 80, label: 'Neuquén' },
          { x: 40, y: 96, label: 'Patagonia' },
        ].map(({ x, y, label }) => (
          <text key={label} x={x} y={y} textAnchor="middle" fontSize="2.2" fill="#9CA3AF" fontFamily="sans-serif">{label}</text>
        ))}
      </svg>

      {/* Puntos del mapa */}
      {shown.map(punto => {
        const cfg = TIPO_CFG[punto.tipo];
        const Icon = cfg.icon;
        const isSelected = selected?.id === punto.id;
        const isDeposito = punto.tipo === 'deposito';
        return (
          <div
            key={punto.id}
            onClick={() => onSelect(isSelected ? null : punto)}
            style={{
              position: 'absolute',
              left: `${punto.x}%`,
              top: `${punto.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: isDeposito ? 20 : isSelected ? 30 : 10,
            }}
          >
            <div style={{
              width: isDeposito ? '32px' : '26px',
              height: isDeposito ? '32px' : '26px',
              borderRadius: '50%',
              backgroundColor: isDeposito ? '#374151' : cfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${isSelected ? '#fff' : isDeposito ? '#1F2937' : cfg.color}`,
              boxShadow: isSelected ? `0 0 0 3px ${cfg.color}, 0 4px 12px rgba(0,0,0,0.2)` : '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
              animation: punto.tipo === 'en_reparto' ? 'pulse 2s infinite' : 'none',
            }}>
              <Icon size={isDeposito ? 14 : 11} color="#fff" strokeWidth={2.5} />
            </div>
            {isDeposito && (
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '-16px', fontSize: '7px', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.85)', padding: '1px 4px', borderRadius: '3px' }}>
                {punto.numero}
              </div>
            )}
            {isSelected && !isDeposito && (
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '-30px', fontSize: '8px', fontWeight: 700, color: '#111', whiteSpace: 'nowrap', backgroundColor: '#fff', padding: '3px 7px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB' }}>
                {punto.numero}
              </div>
            )}
          </div>
        );
      })}
      <style>{`@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 ${ORANGE}60; } 50% { box-shadow: 0 0 0 8px ${ORANGE}00; } }`}</style>
    </div>
  );
}

export function MapaEnviosView({ onNavigate }: Props) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [selectedPunto, setSelectedPunto] = useState<PuntoMapa | null>(null);

  const counts = {
    en_transito: PUNTOS.filter(p => p.tipo === 'en_transito').length,
    en_reparto:  PUNTOS.filter(p => p.tipo === 'en_reparto').length,
    entregado:   PUNTOS.filter(p => p.tipo === 'entregado').length,
    fallido:     PUNTOS.filter(p => p.tipo === 'fallido').length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Navigation}
        title="Mapa de Envíos"
        subtitle={`${counts.en_transito} en tránsito · ${counts.en_reparto} en reparto · ${counts.entregado} entregados · ${counts.fallido} fallidos`}
        actions={[
          { label: '← Logística', onClick: () => onNavigate('logistica') },
          { label: '↻ Actualizar', onClick: () => {} },
        ]}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
        {/* Panel lateral izquierdo */}
        <div style={{ width: '260px', flexShrink: 0, backgroundColor: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filtros */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtrar por estado</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'todos',       label: 'Todos los envíos', count: PUNTOS.filter(p=>p.tipo!=='deposito').length },
                { id: 'en_transito', label: 'En tránsito',     count: counts.en_transito },
                { id: 'en_reparto',  label: 'En reparto',      count: counts.en_reparto  },
                { id: 'entregado',   label: 'Entregados',      count: counts.entregado   },
                { id: 'fallido',     label: 'Fallidos',        count: counts.fallido     },
              ].map(f => {
                const cfg = f.id !== 'todos' ? TIPO_CFG[f.id] : { color: '#374151' };
                const isActive = filtroTipo === f.id;
                return (
                  <button key={f.id} onClick={() => setFiltroTipo(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: `1px solid ${isActive ? cfg.color : '#E5E7EB'}`, borderRadius: '8px', backgroundColor: isActive ? `${cfg.color}12` : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? cfg.color : '#374151', flex: 1, textAlign: 'left' }}>{f.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', backgroundColor: '#F3F4F6', padding: '1px 6px', borderRadius: '8px' }}>{f.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leyenda */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leyenda</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(TIPO_CFG).filter(([k])=>k!=='deposito').map(([tipo, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={10} color="#fff" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#374151' }}>{cfg.label}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={10} color="#fff" />
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Depósito / origen</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ORANGE, boxShadow: `0 0 0 4px ${ORANGE}30`, flexShrink: 0, marginLeft: '5px' }} />
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '5px' }}>Pulso = en reparto activo</span>
              </div>
            </div>
          </div>

          {/* Lista de puntos (scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {PUNTOS.filter(p => p.tipo !== 'deposito' && (filtroTipo === 'todos' || p.tipo === filtroTipo)).map(punto => {
              const cfg = TIPO_CFG[punto.tipo];
              const isSelected = selectedPunto?.id === punto.id;
              return (
                <div key={punto.id} onClick={() => setSelectedPunto(isSelected ? null : punto)}
                  style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', backgroundColor: isSelected ? '#FFF4EC' : 'transparent', borderLeft: isSelected ? `3px solid ${ORANGE}` : '3px solid transparent' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cfg.icon size={11} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{punto.numero}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{punto.localidad} · {punto.carrier}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mapa */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ArgentinaSVG puntos={PUNTOS} filtro={filtroTipo} onSelect={setSelectedPunto} selected={selectedPunto} />

          {/* Tooltip del punto seleccionado */}
          {selectedPunto && selectedPunto.tipo !== 'deposito' && (
            <div style={{
              position: 'absolute', bottom: '20px', right: '20px',
              backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
              padding: '16px', width: '240px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: TIPO_CFG[selectedPunto.tipo].color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(TIPO_CFG[selectedPunto.tipo].icon, { size: 13, color: '#fff' })}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{selectedPunto.numero}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{TIPO_CFG[selectedPunto.tipo].label}</div>
                </div>
                <button onClick={() => setSelectedPunto(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px', lineHeight: 1 }}>×</button>
              </div>
              {[
                ['Cliente', selectedPunto.cliente],
                ['Carrier', selectedPunto.carrier],
                ['Localidad', selectedPunto.localidad],
                ['Provincia', selectedPunto.provincia],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '5px' }}>
                  <span style={{ color: '#9CA3AF', width: '65px', flexShrink: 0 }}>{k}</span>
                  <span style={{ color: '#111', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <button onClick={() => onNavigate('envios')} style={{ marginTop: '10px', width: '100%', padding: '8px', border: `1.5px solid ${ORANGE}`, borderRadius: '8px', backgroundColor: 'transparent', color: ORANGE, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Ver detalle del envío →
              </button>
            </div>
          )}

          {/* Stats superpuestos */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(counts).map(([tipo, cnt]) => {
              if (cnt === 0) return null;
              const cfg = TIPO_CFG[tipo];
              return (
                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.92)', padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: `1px solid ${cfg.color}30` }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>{cnt}</span>
                  <span style={{ fontSize: '11px', color: '#374151' }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}