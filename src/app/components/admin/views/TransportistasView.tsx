/* =====================================================
   TransportistasView — Catálogo de Carriers
   Transportistas · Tramos · Tarifas
   ===================================================== */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Users, Truck, Star, MapPin, Clock, Package,
  DollarSign, Plus, Search, Edit2, CheckCircle2,
  ArrowRight, Globe, Phone, Mail, ToggleLeft, ToggleRight,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }
const ORANGE = '#FF6835';

interface Transportista {
  id: string;
  nombre: string;
  tipo: 'nacional' | 'local' | 'internacional';
  logo: string;
  contacto: string;
  email: string;
  telefono: string;
  rating: number;
  enviosActivos: number;
  enviosTotales: number;
  activo: boolean;
  tiempoPromedio: string;
  cobertura: string[];
}

interface Tramo {
  id: string;
  carrierId: string;
  carrier: string;
  origen: string;
  destino: string;
  tipo: 'local' | 'intercity' | 'internacional';
  tiempoEstimado: string;
  tarifaBase: number;
  tarifaKg: number;
  activo: boolean;
}

const TRANSPORTISTAS: Transportista[] = [
  { id: 'c1', nombre: 'Correo Argentino', tipo: 'nacional', logo: '📮', contacto: 'Cuenta Empresa', email: 'empresas@correoargentino.com.ar', telefono: '0800-999-2767', rating: 4.1, enviosActivos: 34, enviosTotales: 1240, activo: true, tiempoPromedio: '3-5 días', cobertura: ['CABA', 'GBA', 'Interior'] },
  { id: 'c2', nombre: 'Andreani', tipo: 'nacional', logo: '🚚', contacto: 'Cuenta Empresa #AE-7823', email: 'empresas@andreani.com', telefono: '0810-122-7263', rating: 4.5, enviosActivos: 21, enviosTotales: 890, activo: true, tiempoPromedio: '2-4 días', cobertura: ['CABA', 'GBA', 'Interior', 'Patagonia'] },
  { id: 'c3', nombre: 'OCA', tipo: 'nacional', logo: '🔵', contacto: 'Cuenta OCA Business', email: 'business@oca.com.ar', telefono: '0810-999-622', rating: 3.8, enviosActivos: 12, enviosTotales: 456, activo: true, tiempoPromedio: '2-3 días', cobertura: ['CABA', 'GBA'] },
  { id: 'c4', nombre: 'FedEx', tipo: 'internacional', logo: '📦', contacto: 'Cuenta Fedex #FE-2024', email: 'ar.entreprise@fedex.com', telefono: '+54 11 5555-9999', rating: 4.7, enviosActivos: 5, enviosTotales: 127, activo: true, tiempoPromedio: '3-7 días', cobertura: ['Internacional', 'Interior'] },
  { id: 'c5', nombre: 'DHL Express', tipo: 'internacional', logo: '🌐', contacto: 'Cuenta DHL AR', email: 'ar.business@dhl.com', telefono: '+54 11 4318-7500', rating: 4.6, enviosActivos: 3, enviosTotales: 89, activo: true, tiempoPromedio: '2-5 días', cobertura: ['Internacional'] },
  { id: 'c6', nombre: 'Express Delivery GBA', tipo: 'local', logo: '⚡', contacto: 'Diego Herrera', email: 'operaciones@expressdelivery.com.ar', telefono: '011 4567-8910', rating: 4.3, enviosActivos: 18, enviosTotales: 2340, activo: true, tiempoPromedio: 'Same day / 24h', cobertura: ['CABA', 'GBA Norte', 'GBA Sur'] },
  { id: 'c7', nombre: 'Rápido del Sur', tipo: 'local', logo: '🏍️', contacto: 'Moto Courier', email: 'info@rapidodelsur.com', telefono: '011 4987-1234', rating: 3.9, enviosActivos: 0, enviosTotales: 340, activo: false, tiempoPromedio: '2-4 horas', cobertura: ['CABA', 'GBA Sur'] },
];

const TRAMOS: Tramo[] = [
  { id: 't1', carrierId: 'c6', carrier: 'Express Delivery GBA', origen: 'CABA / GBA', destino: 'CABA', tipo: 'local', tiempoEstimado: 'Same day', tarifaBase: 1200, tarifaKg: 150, activo: true },
  { id: 't2', carrierId: 'c6', carrier: 'Express Delivery GBA', origen: 'CABA / GBA', destino: 'GBA Norte', tipo: 'local', tiempoEstimado: '24h', tarifaBase: 1800, tarifaKg: 200, activo: true },
  { id: 't3', carrierId: 'c6', carrier: 'Express Delivery GBA', origen: 'CABA / GBA', destino: 'GBA Sur', tipo: 'local', tiempoEstimado: '24h', tarifaBase: 1800, tarifaKg: 200, activo: true },
  { id: 't4', carrierId: 'c1', carrier: 'Correo Argentino', origen: 'Depósito Central', destino: 'Interior (zona 1)', tipo: 'intercity', tiempoEstimado: '3-4 días', tarifaBase: 2800, tarifaKg: 350, activo: true },
  { id: 't5', carrierId: 'c1', carrier: 'Correo Argentino', origen: 'Depósito Central', destino: 'Interior (zona 2)', tipo: 'intercity', tiempoEstimado: '5-7 días', tarifaBase: 4200, tarifaKg: 480, activo: true },
  { id: 't6', carrierId: 'c2', carrier: 'Andreani', origen: 'Depósito Central', destino: 'Córdoba / Rosario', tipo: 'intercity', tiempoEstimado: '2-3 días', tarifaBase: 2500, tarifaKg: 320, activo: true },
  { id: 't7', carrierId: 'c2', carrier: 'Andreani', origen: 'Depósito Central', destino: 'NOA / NEA', tipo: 'intercity', tiempoEstimado: '4-6 días', tarifaBase: 5500, tarifaKg: 600, activo: true },
  { id: 't8', carrierId: 'c4', carrier: 'FedEx', origen: 'Argentina', destino: 'Uruguay / Chile', tipo: 'internacional', tiempoEstimado: '3-5 días', tarifaBase: 8500, tarifaKg: 1200, activo: true },
  { id: 't9', carrierId: 'c5', carrier: 'DHL Express', origen: 'Argentina', destino: 'Europa / USA', tipo: 'internacional', tiempoEstimado: '5-8 días', tarifaBase: 15000, tarifaKg: 2500, activo: true },
  { id: 't10', carrierId: 'c3', carrier: 'OCA', origen: 'CABA', destino: 'GBA', tipo: 'local', tiempoEstimado: '24-48h', tarifaBase: 1500, tarifaKg: 180, activo: true },
];

type Tab = 'transportistas' | 'tramos' | 'tarifas';

const TIPO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  local:         { label: 'Local',          color: '#059669', bg: '#ECFDF5' },
  nacional:      { label: 'Nacional',       color: '#2563EB', bg: '#EFF6FF' },
  intercity:     { label: 'Intercity',      color: '#7C3AED', bg: '#F5F3FF' },
  internacional: { label: 'Internacional',  color: '#D97706', bg: '#FFFBEB' },
};

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} color={i <= Math.round(n) ? '#F59E0B' : '#E5E7EB'} fill={i <= Math.round(n) ? '#F59E0B' : 'none'} />
      ))}
      <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '3px' }}>{n}</span>
    </span>
  );
}

export function TransportistasView({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('transportistas');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Transportista | null>(null);

  const activos = TRANSPORTISTAS.filter(t => t.activo).length;
  const totalEnviosActivos = TRANSPORTISTAS.reduce((s, t) => s + t.enviosActivos, 0);

  const filteredCarriers = TRANSPORTISTAS.filter(t =>
    !search || t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTramos = TRAMOS.filter(t =>
    !search || t.carrier.toLowerCase().includes(search.toLowerCase()) ||
    t.origen.toLowerCase().includes(search.toLowerCase()) ||
    t.destino.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Truck}
        title="Transportistas"
        subtitle={`${activos} carriers activos · ${totalEnviosActivos} envíos en curso`}
        actions={[
          { label: '← Logística', onClick: () => onNavigate('logistica') },
          { label: '+ Nuevo Carrier', primary: true },
        ]}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', padding: '20px 20px 0' }}>
          {[
            { label: 'Carriers Activos', value: activos, icon: Users, color: ORANGE },
            { label: 'Envíos en curso', value: totalEnviosActivos, icon: Truck, color: '#2563EB' },
            { label: 'Tramos configurados', value: TRAMOS.filter(t=>t.activo).length, icon: MapPin, color: '#7C3AED' },
            { label: 'Rating promedio', value: (TRANSPORTISTAS.reduce((s,t)=>s+t.rating,0)/TRANSPORTISTAS.length).toFixed(1) + '★', icon: Star, color: '#F59E0B' },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>{c.value}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', padding: '16px 20px 0', borderBottom: '1px solid #E5E7EB', backgroundColor: '#fff', marginTop: '16px' }}>
          {([['transportistas','Transportistas'],['tramos','Tramos & Zonas'],['tarifas','Simulador de Tarifas']] as [Tab,string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 700 : 500, color: tab === id ? ORANGE : '#6B7280', borderBottom: tab === id ? `2px solid ${ORANGE}` : '2px solid transparent', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative', padding: '6px 0' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ paddingLeft: '30px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '180px' }} />
          </div>
        </div>

        {/* Contenido de tabs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          
          {/* Tab: Transportistas */}
          {tab === 'transportistas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '12px' }}>
              {filteredCarriers.map(carrier => {
                const tipoCfg = TIPO_CFG[carrier.tipo];
                const isSelected = selected?.id === carrier.id;
                return (
                  <div key={carrier.id}
                    onClick={() => setSelected(isSelected ? null : carrier)}
                    style={{
                      backgroundColor: '#fff', borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? ORANGE : carrier.activo ? '#E5E7EB' : '#F3F4F6'}`,
                      padding: '18px', cursor: 'pointer',
                      opacity: carrier.activo ? 1 : 0.6,
                      boxShadow: isSelected ? `0 0 0 3px ${ORANGE}22` : '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                        {carrier.logo}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>{carrier.nombre}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: tipoCfg.color, backgroundColor: tipoCfg.bg, padding: '2px 7px', borderRadius: '10px' }}>{tipoCfg.label}</span>
                          {!carrier.activo && <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '2px 7px', borderRadius: '10px' }}>Inactivo</span>}
                        </div>
                        <Stars n={carrier.rating} />
                      </div>
                      <div style={{ width: '36px', height: '20px', borderRadius: '10px', backgroundColor: carrier.activo ? '#D1FAE5' : '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 2px', cursor: 'pointer', flexShrink: 0, justifyContent: carrier.activo ? 'flex-end' : 'flex-start' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: carrier.activo ? '#059669' : '#9CA3AF' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>⏱ {carrier.tiempoPromedio}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>📦 {carrier.enviosActivos} activos</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>📊 {carrier.enviosTotales} totales</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>☎ {carrier.telefono}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {carrier.cobertura.map(z => (
                        <span key={z} style={{ fontSize: '10px', color: '#374151', backgroundColor: '#F3F4F6', padding: '2px 7px', borderRadius: '6px' }}>{z}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Card agregar */}
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: '12px', border: '2px dashed #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', minHeight: '160px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FFF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={22} color={ORANGE} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: ORANGE }}>Agregar Carrier</span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Conectar nuevo transportista al sistema</span>
              </div>
            </div>
          )}

          {/* Tab: Tramos */}
          {tab === 'tramos' && (
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    {['Carrier', 'Origen', 'Destino', 'Tipo', 'Tiempo Est.', 'Tarifa Base', '$/Kg', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTramos.map((tramo, i) => {
                    const tipoCfg = TIPO_CFG[tramo.tipo];
                    return (
                      <tr key={tramo.id} style={{ borderBottom: i < filteredTramos.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>{tramo.carrier}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{tramo.origen}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151', fontWeight: 500 }}>{tramo.destino}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: tipoCfg.color, backgroundColor: tipoCfg.bg, padding: '3px 8px', borderRadius: '10px' }}>{tipoCfg.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} color="#9CA3AF" /> {tramo.tiempoEstimado}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: '#111' }}>${tramo.tarifaBase.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>${tramo.tarifaKg}/kg</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: tramo.activo ? '#059669' : '#9CA3AF', backgroundColor: tramo.activo ? '#ECFDF5' : '#F3F4F6', padding: '3px 8px', borderRadius: '10px' }}>
                            {tramo.activo ? '● Activo' : '○ Inactivo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Simulador de Tarifas */}
          {tab === 'tarifas' && (
            <div style={{ maxWidth: '560px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 800, color: '#111' }}>Simulador de Tarifa de Envío</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Peso (kg)', type: 'number', placeholder: 'Ej: 2.5' },
                    { label: 'Volumen (m³)', type: 'number', placeholder: 'Ej: 0.02' },
                    { label: 'Código Postal Origen', type: 'text', placeholder: 'Ej: C1001' },
                    { label: 'Código Postal Destino', type: 'text', placeholder: 'Ej: 5000' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <button style={{ marginTop: '6px', padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: ORANGE, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    Calcular tarifas disponibles
                  </button>
                </div>
                <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>Tarifas estimadas:</p>
                  {[
                    { carrier: 'Express Delivery GBA', tiempo: 'Same day', precio: 1400 },
                    { carrier: 'OCA', tiempo: '24-48h', precio: 1680 },
                    { carrier: 'Correo Argentino', tiempo: '3-4 días', precio: 2450 },
                    { carrier: 'Andreani', tiempo: '2-3 días', precio: 2750 },
                  ].map(r => (
                    <div key={r.carrier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{r.carrier}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.tiempo}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: ORANGE }}>${r.precio.toLocaleString('es-AR')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}