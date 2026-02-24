import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import { ModuleCardGrid } from '../ModuleCard';
import type { CardDef } from '../ModuleCard';
import type { MainSection } from '../../../AdminDashboard';
import {
  ShoppingCart, Megaphone, Database, Monitor,
  BookOpen, Store,
  Sparkles, FileText, QrCode, ScanLine,
  DollarSign, RotateCcw, Printer,
} from 'lucide-react';

type Tab = '1' | '2' | '3' | '4';

interface Props {
  onNavigate: (section: MainSection) => void;
}

/* ── VISTA #1 cards ─ eCommerce, Marketing, Gestión, Sistema, Documentación, Módulo Marketplace */
const tab1Cards: CardDef[] = [
  { id: 'ec',    icon: ShoppingCart, label: 'eCommerce',         description: 'Tienda online, pedidos y catálogo',        color: 'blue'    },
  { id: 'mkt',   icon: Megaphone,    label: 'Marketing',          description: 'Campañas, CRM y fidelización',             color: 'green'   },
  { id: 'ges',   icon: Database,     label: 'Gestión',            description: 'ERP, POS, Inventario y Ventas',            color: 'lavender' },
  { id: 'sis',   icon: Monitor,      label: 'Sistema',            description: 'Configuración, auditoría y usuarios',      color: 'teal'    },
  { id: 'docs',  icon: BookOpen,     label: 'Documentación',      description: 'Manuales, guías y base de conocimiento',   color: 'yellow'  },
  { id: 'mkt2',  icon: Store,        label: 'Módulo Marketplace',  description: 'Vendedores externos y comisiones',         color: 'pink'    },
];

/* ── VISTA #4 cards ─ Herramientas */
const tab4Cards: CardDef[] = [
  { id: 'editor', icon: Sparkles,    label: 'Editor de Imágenes',          description: 'Editor profesional con 50+ herramientas e IA',  color: 'orange'   },
  { id: 'docgen', icon: FileText,    label: 'Generador de Documentos',     description: 'Crea facturas, contratos y más con IA',         color: 'blue'     },
  { id: 'qrgen',  icon: QrCode,      label: 'Generación del QR',           description: 'Códigos QR dinámicos y personalizados',         color: 'green'    },
  { id: 'ocr',    icon: ScanLine,    label: 'OCR',                          description: 'Extrae texto de imágenes y documentos',         color: 'lavender' },
  { id: 'presu',  icon: DollarSign,  label: 'Generador de Presupuestos',   description: 'Presupuestos profesionales para clientes',      color: 'teal'     },
  { id: 'rueda',  icon: RotateCcw,   label: 'Rueda de Sorteos',            description: 'Sorteos y campañas interactivas',               color: 'purple'   },
  { id: 'print',  icon: Printer,     label: 'Impresión',                   description: 'Trabajos de impresión y etiquetas',             color: 'yellow'   },
  { id: 'bib',    icon: BookOpen,    label: 'Biblioteca / Documentación',  description: 'Manuales, guías y documentación técnica',       color: 'rose'     },
];

/* ── VISTA #2 — Departamentos data */
const departamentos = [
  { id: 1,  nombre: 'Ventas',            jefe: 'Carlos Ruiz',      empleados: 12, presupuesto: '$48,000', estado: 'Activo',   icon: '💰' },
  { id: 2,  nombre: 'Marketing',         jefe: 'Ana García',       empleados: 8,  presupuesto: '$32,000', estado: 'Activo',   icon: '📢' },
  { id: 3,  nombre: 'Logística',         jefe: 'Pedro Martínez',   empleados: 15, presupuesto: '$55,000', estado: 'Activo',   icon: '🚚' },
  { id: 4,  nombre: 'Soporte Técnico',   jefe: 'Laura Sánchez',    empleados: 6,  presupuesto: '$24,000', estado: 'Activo',   icon: '🔧' },
  { id: 5,  nombre: 'Finanzas',          jefe: 'Miguel Torres',    empleados: 5,  presupuesto: '$28,000', estado: 'Activo',   icon: '📊' },
  { id: 6,  nombre: 'RRHH',              jefe: 'Sofía López',      empleados: 4,  presupuesto: '$18,000', estado: 'Activo',   icon: '👥' },
  { id: 7,  nombre: 'Desarrollo',        jefe: 'Javier Morales',   empleados: 10, presupuesto: '$72,000', estado: 'Activo',   icon: '💻' },
  { id: 8,  nombre: 'Almacén',           jefe: 'Roberto Díaz',     empleados: 9,  presupuesto: '$21,000', estado: 'Inactivo', icon: '📦' },
];

/* ── VISTA #3 — Artículos data */
const articulos = [
  { id: 1,  nombre: 'Laptop Pro 15"',       sku: 'LAP-001', cat: 'Electrónica', precio: 1299.00, stock: 45,  estado: 'Activo',    icon: '💻' },
  { id: 2,  nombre: 'Mouse Inalámbrico',     sku: 'MOU-012', cat: 'Accesorios',  precio: 39.99,   stock: 120, estado: 'Activo',    icon: '🖱️' },
  { id: 3,  nombre: 'Teclado Mecánico RGB',  sku: 'TEC-023', cat: 'Accesorios',  precio: 89.99,   stock: 67,  estado: 'Activo',    icon: '⌨️' },
  { id: 4,  nombre: 'Monitor 27" 4K',        sku: 'MON-034', cat: 'Electrónica', precio: 549.00,  stock: 23,  estado: 'Activo',    icon: '🖥️' },
  { id: 5,  nombre: 'Auriculares Bluetooth', sku: 'AUR-045', cat: 'Audio',       precio: 129.00,  stock: 88,  estado: 'Activo',    icon: '🎧' },
  { id: 6,  nombre: 'Cámara Web HD',         sku: 'CAM-056', cat: 'Electrónica', precio: 79.99,   stock: 4,   estado: 'Crítico',   icon: '📷' },
  { id: 7,  nombre: 'SSD 1TB NVMe',          sku: 'SSD-067', cat: 'Almacenaje',  precio: 119.00,  stock: 56,  estado: 'Activo',    icon: '💾' },
  { id: 8,  nombre: 'Hub USB-C 7 en 1',      sku: 'HUB-078', cat: 'Accesorios',  precio: 49.99,   stock: 0,   estado: 'Sin Stock', icon: '🔌' },
  { id: 9,  nombre: 'Silla Ergonómica',      sku: 'SIL-089', cat: 'Mobiliario',  precio: 349.00,  stock: 12,  estado: 'Activo',    icon: '🪑' },
  { id: 10, nombre: 'Impresora Láser',        sku: 'IMP-090', cat: 'Periféricos', precio: 229.00,  stock: 18,  estado: 'Activo',    icon: '🖨️' },
  { id: 11, nombre: 'Tablet 10"',             sku: 'TAB-101', cat: 'Electrónica', precio: 399.00,  stock: 34,  estado: 'Activo',    icon: '📱' },
  { id: 12, nombre: 'Router WiFi 6',          sku: 'ROU-112', cat: 'Redes',       precio: 159.00,  stock: 29,  estado: 'Activo',    icon: '📡' },
];

const ORANGE = '#FF6835';

/* ════════════════════════════════════════════ */
export function DisenoView({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('1');

  const TAB_LABELS: { id: Tab; label: string }[] = [
    { id: '1', label: 'Módulos' },
    { id: '2', label: 'Departamentos' },
    { id: '3', label: 'Artículos' },
    { id: '4', label: 'Herramientas' },
  ];

  /* Header title with #1 #2 #3 #4 tab indicators */
  const headerTitle = (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span>Diseño</span>
      {(['1', '2', '3', '4'] as Tab[]).map((t) => (
        <span
          key={t}
          style={{
            color: t === activeTab ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
            fontWeight: t === activeTab ? '900' : '400',
            fontSize: t === activeTab ? '1.5rem' : '1.25rem',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab(t)}
        >
          #{t}
        </span>
      ))}
    </span>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Sparkles}
        title={headerTitle}
        subtitle="Espacio de diseño y pruebas visuales"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('sistema') },
          { label: 'Tienda', primary: true },
        ]}
      />

      {/* Tab bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: `3px solid ${ORANGE}`,
          padding: '0 32px',
          display: 'flex',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 20px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? ORANGE : '#6B7280',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '0.875rem',
              borderBottom:
                activeTab === tab.id ? `3px solid ${ORANGE}` : '3px solid transparent',
              marginBottom: '-3px',
              transition: 'all 0.15s ease',
            }}
          >
            #{tab.id} — {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 32px',
          backgroundColor: '#F8F9FA',
        }}
      >
        {activeTab === '1' && <Tab1Content />}
        {activeTab === '2' && <Tab2Departamentos />}
        {activeTab === '3' && <Tab3Articulos />}
        {activeTab === '4' && <Tab4Herramientas />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/* TAB #1 — Módulos principales               */
/* ──────────────────────────────────────────── */
function Tab1Content() {
  return (
    <div>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Vista #1 — Acceso rápido a los 6 módulos principales del sistema
      </p>
      <ModuleCardGrid cards={tab1Cards} columns={3} />

      {/* Design spec cards */}
      <h3 style={{ margin: '32px 0 16px', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
        Especificaciones de Diseño
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
        {[
          { title: 'Logo',    specs: [['Ancho','210px'],['Alto','100px'],['Margen','10px'],['Radius','14px']] },
          { title: 'Sidebar', specs: [['Ancho','210px'],['Left','10px'],['Gap Logo','10px'],['Padding','16px']] },
          { title: 'Header',  specs: [['Alto','100px'],['Left','10px'],['Right','10px'],['Top','10px']] },
          { title: 'Grid',    specs: [['Columnas','3'],['Filas','4'],['Total','12'],['Gap','6px']] },
          { title: 'Paleta',  specs: [['Naranja','#FF6835'],['Celeste','#00A8E8'],['Verde','#A8E6CF'],['Gris','#F3F4F6']], palette: true },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E5E7EB',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#FFF4EC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem',
                }}
              >
                🔲
              </div>
              <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{card.title}</span>
            </div>
            {card.specs.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>{k}</span>
                {card.palette ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '14px', height: '14px', borderRadius: '3px',
                        backgroundColor: v,
                        border: '1px solid #E5E7EB',
                      }}
                    />
                    <span style={{ color: '#374151', fontSize: '0.78rem', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ) : (
                  <span style={{ color: '#374151', fontSize: '0.78rem', fontWeight: '600' }}>{v}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/* TAB #2 — Departamentos (grid cards)        */
/* ──────────────────────────────────────────── */
function Tab2Departamentos() {
  return (
    <div>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Vista #2 — Departamentos en vista de tarjetas
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '16px',
        }}
      >
        {departamentos.map((dep) => (
          <div
            key={dep.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '22px',
              cursor: 'pointer',
              transition: 'box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 6px 20px rgba(0,0,0,0.08)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF4EC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {dep.icon}
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  backgroundColor: dep.estado === 'Activo' ? '#D1FAE5' : '#FEE2E2',
                  color: dep.estado === 'Activo' ? '#065F46' : '#991B1B',
                }}
              >
                {dep.estado}
              </span>
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>
              {dep.nombre}
            </p>
            <p style={{ margin: '0 0 14px', color: '#6B7280', fontSize: '0.78rem' }}>
              Jefe: {dep.jefe}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Empleados
                </p>
                <p style={{ margin: 0, color: '#111827', fontWeight: '700', fontSize: '0.95rem' }}>
                  {dep.empleados}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Presupuesto
                </p>
                <p style={{ margin: 0, color: ORANGE, fontWeight: '700', fontSize: '0.95rem' }}>
                  {dep.presupuesto}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/* TAB #3 — Artículos (list view)             */
/* ──────────────────────────────────────────── */
function Tab3Articulos() {
  const [search, setSearch] = useState('');
  const filtered = articulos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (estado: string) => {
    if (estado === 'Sin Stock') return { bg: '#FEE2E2', text: '#991B1B' };
    if (estado === 'Crítico')   return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#D1FAE5', text: '#065F46' };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
          Vista #3 — Artículos en vista de lista
        </p>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '9px 14px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              fontSize: '0.8rem',
              outline: 'none',
              width: '240px',
              backgroundColor: '#FFFFFF',
            }}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Artículo', 'SKU', 'Categoría', 'Precio', 'Stock', 'Estado', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((art, idx) => {
              const sc = getStatus(art.estado);
              return (
                <tr
                  key={art.id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.05rem' }}>{art.icon}</span>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem' }}>
                        {art.nombre}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {art.sku}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', fontSize: '0.8rem' }}>
                    {art.cat}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#111827', fontSize: '0.85rem', fontWeight: '700' }}>
                    ${art.precio.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', fontSize: '0.8rem' }}>
                    {art.stock > 0 ? `${art.stock} uds` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: sc.bg,
                        color: sc.text,
                      }}
                    >
                      {art.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {['✏️', '👁️'].map((a, ai) => (
                        <button
                          key={ai}
                          style={{
                            padding: '5px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/* TAB #4 — Herramientas                      */
/* ──────────────────────────────────────────── */
function Tab4Herramientas() {
  return (
    <div>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Vista #4 — Suite de herramientas con IA integrada
      </p>
      <ModuleCardGrid cards={tab4Cards} columns={2} />
    </div>
  );
}