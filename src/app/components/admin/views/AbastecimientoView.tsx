/* =====================================================
   AbastecimientoView — Abastecimiento / MRP
   OC Automáticas · Stock de Reserva · MRP
   ===================================================== */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Package, AlertTriangle, TrendingDown, ShoppingCart,
  CheckCircle2, Clock, Plus, Search, BarChart3,
  RefreshCw, Zap, ArrowRight, ArrowUp, ArrowDown,
  AlertCircle, Settings,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }
const ORANGE = '#FF6835';

type EstadoOC = 'sugerida' | 'aprobada' | 'enviada' | 'recibida' | 'cancelada';

interface AlertaStock {
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  stockOptimo: number;
  unidad: string;
  proveedor: string;
  tiempoReposicion: number; // días
  consumoPromDiario: number;
  diasRestantes: number;
  nivel: 'critico' | 'bajo' | 'ok';
}

interface SugerenciaOC {
  id: string;
  sku: string;
  nombre: string;
  proveedor: string;
  cantidad: number;
  precioUnit: number;
  total: number;
  motivoOC: string;
  estado: EstadoOC;
  fechaSugerida: string;
}

interface ComponenteMRP {
  sku: string;
  descripcion: string;
  necesario: number;
  stockDisponible: number;
  aComprar: number;
  unidad: string;
}

const ALERTAS: AlertaStock[] = [
  { sku: 'ALI-003', nombre: 'Galletitas surtidas 300g', categoria: 'Alimentación', stockActual: 15, stockMinimo: 50, stockOptimo: 200, unidad: 'u', proveedor: 'Distribuidora El Sol', tiempoReposicion: 5, consumoPromDiario: 8, diasRestantes: 2, nivel: 'critico' },
  { sku: 'IND-003', nombre: 'Medias deportivas', categoria: 'Indumentaria', stockActual: 0, stockMinimo: 30, stockOptimo: 100, unidad: 'u', proveedor: 'Textil Importadora SA', tiempoReposicion: 12, consumoPromDiario: 5, diasRestantes: 0, nivel: 'critico' },
  { sku: 'NOT-001', nombre: 'Cuaderno tapa dura A5', categoria: 'Papelería', stockActual: 48, stockMinimo: 60, stockOptimo: 200, unidad: 'u', proveedor: 'Papelera Bonaerense', tiempoReposicion: 3, consumoPromDiario: 4, diasRestantes: 12, nivel: 'bajo' },
  { sku: 'CAN-BOX', nombre: 'Caja decorativa kraft', categoria: 'Packaging', stockActual: 100, stockMinimo: 80, stockOptimo: 300, unidad: 'u', proveedor: 'Cajas & Envases SA', tiempoReposicion: 7, consumoPromDiario: 15, diasRestantes: 7, nivel: 'bajo' },
  { sku: 'ADH-001', nombre: 'Post-it variados', categoria: 'Papelería', stockActual: 60, stockMinimo: 40, stockOptimo: 150, unidad: 'pack', proveedor: '3M Argentina', tiempoReposicion: 2, consumoPromDiario: 3, diasRestantes: 20, nivel: 'ok' },
  { sku: 'BOL-002', nombre: 'Bolígrafo metálico', categoria: 'Papelería', stockActual: 120, stockMinimo: 100, stockOptimo: 400, unidad: 'u', proveedor: 'Papelera Bonaerense', tiempoReposicion: 3, consumoPromDiario: 6, diasRestantes: 20, nivel: 'ok' },
];

const SUGERENCIAS_OC: SugerenciaOC[] = [
  { id: 'oc1', sku: 'ALI-003', nombre: 'Galletitas surtidas 300g', proveedor: 'Distribuidora El Sol', cantidad: 300, precioUnit: 480, total: 144000, motivoOC: 'Stock crítico — 2 días restantes', estado: 'sugerida', fechaSugerida: '17/01/2024' },
  { id: 'oc2', sku: 'IND-003', nombre: 'Medias deportivas', proveedor: 'Textil Importadora SA', cantidad: 200, precioUnit: 2200, total: 440000, motivoOC: 'Stock en 0 — reposición urgente', estado: 'aprobada', fechaSugerida: '16/01/2024' },
  { id: 'oc3', sku: 'NOT-001', nombre: 'Cuaderno tapa dura A5', proveedor: 'Papelera Bonaerense', cantidad: 200, precioUnit: 1850, total: 370000, motivoOC: 'Por debajo del mínimo', estado: 'sugerida', fechaSugerida: '17/01/2024' },
  { id: 'oc4', sku: 'CAN-BOX', nombre: 'Caja decorativa kraft', proveedor: 'Cajas & Envases SA', cantidad: 500, precioUnit: 340, total: 170000, motivoOC: 'Proyecto Canastas navideñas 2024', estado: 'enviada', fechaSugerida: '15/01/2024' },
];

const MRP_COMPONENTES: ComponenteMRP[] = [
  { sku: 'ALI-001', descripcion: 'Dulce de leche 450g', necesario: 240, stockDisponible: 80, aComprar: 160, unidad: 'u' },
  { sku: 'ALI-002', descripcion: 'Mermelada berries 340g', necesario: 120, stockDisponible: 60, aComprar: 60, unidad: 'u' },
  { sku: 'ALI-003', descripcion: 'Galletitas surtidas 300g', necesario: 120, stockDisponible: 15, aComprar: 105, unidad: 'u' },
  { sku: 'ALI-004', descripcion: 'Chocolate tableta 80g', necesario: 360, stockDisponible: 90, aComprar: 270, unidad: 'u' },
  { sku: 'CAN-BOX', descripcion: 'Caja decorativa kraft', necesario: 120, stockDisponible: 100, aComprar: 20, unidad: 'u' },
  { sku: 'CAN-RIB', descripcion: 'Lazo y cinta', necesario: 120, stockDisponible: 150, aComprar: 0, unidad: 'set' },
];

type Tab = 'alertas' | 'oc_sugeridas' | 'mrp';

const ESTADO_OC_CFG: Record<EstadoOC, { label: string; color: string; bg: string }> = {
  sugerida:  { label: 'Sugerida',   color: '#D97706', bg: '#FFFBEB' },
  aprobada:  { label: 'Aprobada',   color: '#2563EB', bg: '#EFF6FF' },
  enviada:   { label: 'Enviada',    color: '#7C3AED', bg: '#F5F3FF' },
  recibida:  { label: 'Recibida',   color: '#059669', bg: '#ECFDF5' },
  cancelada: { label: 'Cancelada',  color: '#DC2626', bg: '#FEF2F2' },
};

export function AbastecimientoView({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('alertas');
  const [search, setSearch] = useState('');

  const criticos = ALERTAS.filter(a => a.nivel === 'critico').length;
  const bajos = ALERTAS.filter(a => a.nivel === 'bajo').length;
  const valorOCSugeridas = SUGERENCIAS_OC.filter(o=>o.estado==='sugerida').reduce((s,o)=>s+o.total,0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={ShoppingCart}
        title="Abastecimiento"
        subtitle={`${criticos} alertas críticas · ${bajos} alertas bajas · OCs sugeridas: $${valorOCSugeridas.toLocaleString('es-AR')}`}
        actions={[
          { label: '← Logística', onClick: () => onNavigate('logistica') },
          { label: '+ OC Manual', primary: true },
        ]}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', padding: '16px 20px 0' }}>
          {[
            { label: 'Alertas Críticas',   value: criticos,     icon: AlertTriangle, color: '#DC2626' },
            { label: 'Stock Bajo',         value: bajos,        icon: TrendingDown,  color: '#D97706' },
            { label: 'OC Sugeridas',       value: SUGERENCIAS_OC.filter(o=>o.estado==='sugerida').length, icon: ShoppingCart, color: '#2563EB' },
            { label: 'Valor a Reponer',    value: `$${(valorOCSugeridas/1000).toFixed(0)}K`, icon: BarChart3, color: ORANGE },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} style={{ backgroundColor: '#fff', borderRadius: '12px', border: `1px solid ${c.color === '#DC2626' && criticos > 0 ? '#FCA5A5' : '#E5E7EB'}`, padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>{c.value}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '12px 20px 0', backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', marginTop: '12px' }}>
          {([['alertas','⚠️ Alertas de Stock'],['oc_sugeridas','📋 OC Sugeridas'],['mrp','⚙️ MRP — Cálculo']] as [Tab,string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 700 : 500, color: tab === id ? ORANGE : '#6B7280', borderBottom: tab === id ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
              {label}
              {id === 'alertas' && criticos > 0 && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '1px 6px', borderRadius: '10px' }}>{criticos}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Tab: Alertas */}
          {tab === 'alertas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ALERTAS.sort((a,b) => (a.nivel === 'critico' ? -1 : b.nivel === 'critico' ? 1 : 0)).map(alerta => {
                const pct = Math.min(100, Math.round((alerta.stockActual / alerta.stockOptimo) * 100));
                const barColor = alerta.nivel === 'critico' ? '#DC2626' : alerta.nivel === 'bajo' ? '#D97706' : '#059669';
                const bgCard = alerta.nivel === 'critico' ? '#FFF5F5' : alerta.nivel === 'bajo' ? '#FFFDF0' : '#fff';
                const borderCard = alerta.nivel === 'critico' ? '#FCA5A5' : alerta.nivel === 'bajo' ? '#FDE68A' : '#E5E7EB';
                return (
                  <div key={alerta.sku} style={{ backgroundColor: bgCard, borderRadius: '12px', border: `1px solid ${borderCard}`, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${barColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {alerta.nivel === 'critico' ? <AlertTriangle size={18} color={barColor} /> : alerta.nivel === 'bajo' ? <AlertCircle size={18} color={barColor} /> : <CheckCircle2 size={18} color={barColor} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>{alerta.nombre}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: barColor, backgroundColor: `${barColor}18`, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>{alerta.nivel}</span>
                          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>SKU: {alerta.sku}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6B7280', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span>📦 Stock actual: <strong style={{ color: alerta.nivel === 'critico' ? '#DC2626' : '#111' }}>{alerta.stockActual} {alerta.unidad}</strong></span>
                          <span>🎯 Mínimo: {alerta.stockMinimo}</span>
                          <span>⚡ Óptimo: {alerta.stockOptimo}</span>
                          <span>🏭 Proveedor: {alerta.proveedor}</span>
                          <span>📅 Reposición: {alerta.tiempoReposicion} días</span>
                          {alerta.diasRestantes <= alerta.tiempoReposicion && (
                            <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠ ¡Quedan {alerta.diasRestantes} día{alerta.diasRestantes !== 1 ? 's' : ''}!</span>
                          )}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Nivel de stock</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: barColor }}>{pct}%</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {alerta.nivel !== 'ok' && (
                          <button style={{ padding: '8px 14px', border: 'none', borderRadius: '8px', backgroundColor: alerta.nivel === 'critico' ? '#DC2626' : ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            {alerta.nivel === 'critico' ? '🚨 OC Urgente' : '📋 Sugerir OC'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: OC Sugeridas */}
          {tab === 'oc_sugeridas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{SUGERENCIAS_OC.length} órdenes de compra · Total: <strong style={{ color: '#111' }}>${SUGERENCIAS_OC.reduce((s,o)=>s+o.total,0).toLocaleString('es-AR')}</strong></span>
                <button style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} /> Aprobar todas las sugeridas
                </button>
              </div>
              {SUGERENCIAS_OC.map(oc => {
                const cfg = ESTADO_OC_CFG[oc.estado];
                return (
                  <div key={oc.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>{oc.nombre}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, padding: '2px 8px', borderRadius: '10px' }}>{cfg.label}</span>
                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>SKU: {oc.sku}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6B7280', flexWrap: 'wrap' }}>
                        <span>🏭 {oc.proveedor}</span>
                        <span>📦 {oc.cantidad} u × ${oc.precioUnit.toLocaleString('es-AR')}</span>
                        <span style={{ color: '#111', fontWeight: 700 }}>💰 Total: ${oc.total.toLocaleString('es-AR')}</span>
                        <span>⚠ {oc.motivoOC}</span>
                        <span>📅 {oc.fechaSugerida}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {oc.estado === 'sugerida' && (
                        <>
                          <button style={{ padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#fff', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Rechazar</button>
                          <button style={{ padding: '8px 14px', border: 'none', borderRadius: '8px', backgroundColor: '#2563EB', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✓ Aprobar</button>
                        </>
                      )}
                      {oc.estado === 'aprobada' && (
                        <button style={{ padding: '8px 14px', border: 'none', borderRadius: '8px', backgroundColor: ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Enviar a Proveedor</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: MRP */}
          {tab === 'mrp' && (
            <div style={{ maxWidth: '800px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Settings size={18} color={ORANGE} />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#111' }}>MRP — Cálculo de Requerimientos</h3>
                  <div style={{ flex: 1 }} />
                  <button style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: ORANGE, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={13} /> Recalcular
                  </button>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#FFF4EC', borderRadius: '8px', border: '1px solid #FED7AA', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
                  📋 Basado en: <strong>OA-2024-001 — 120 Canastas Navideñas</strong> · Fecha de entrega: 20/12/2024
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['SKU', 'Componente', 'Necesario', 'Disponible', 'A Comprar', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MRP_COMPONENTES.map((comp, i) => {
                      const ok = comp.aComprar === 0;
                      return (
                        <tr key={comp.sku} style={{ borderBottom: i < MRP_COMPONENTES.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: !ok ? '#FFFBEB' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace', color: '#6B7280' }}>{comp.sku}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 500, color: '#111' }}>{comp.descripcion}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#374151' }}>{comp.necesario} {comp.unidad}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: comp.stockDisponible >= comp.necesario ? '#059669' : '#D97706', fontWeight: 600 }}>{comp.stockDisponible}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, color: comp.aComprar > 0 ? '#DC2626' : '#059669' }}>{comp.aComprar > 0 ? `${comp.aComprar}` : '✓ 0'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {ok ? (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '3px 8px', borderRadius: '10px' }}>✓ Stock OK</span>
                            ) : (
                              <button style={{ fontSize: '10px', fontWeight: 700, color: '#fff', backgroundColor: ORANGE, padding: '3px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                Crear OC
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '3px' }}>Componentes a comprar</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#DC2626' }}>{MRP_COMPONENTES.filter(c=>c.aComprar>0).length} de {MRP_COMPONENTES.length} necesitan OC</div>
                  </div>
                  <button style={{ padding: '10px 20px', border: 'none', borderRadius: '10px', backgroundColor: ORANGE, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Generar todas las OC necesarias
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}