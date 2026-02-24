import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, TrendingDown, BarChart2, Upload, Download } from 'lucide-react';
import { ProductModal } from '../ProductModal';
import type { ProductFormData } from '../ProductModal';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';

type ViewTab = 'articulos' | 'stock' | 'movimientos' | 'alertas';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
  status: 'active' | 'inactive';
}

const PRODUCTS: Product[] = [
  { id: '1', sku: 'ELE-001', name: 'iPhone 14 128GB Midnight',   category: 'Tecnología',    price: 899.99, cost: 650.00, stock: 12,  minStock: 5,  unit: 'unidad', barcode: '7501234567890', status: 'active' },
  { id: '2', sku: 'ELE-002', name: 'AirPods Pro 2da Gen',        category: 'Tecnología',    price: 249.99, cost: 180.00, stock: 8,   minStock: 3,  unit: 'unidad', barcode: '7501234567891', status: 'active' },
  { id: '3', sku: 'MOD-001', name: 'Campera Patagonia Fleece M', category: 'Moda',          price: 189.00, cost: 90.00,  stock: 3,   minStock: 5,  unit: 'unidad', status: 'active' },
  { id: '4', sku: 'HOG-001', name: 'Silla Ergonómica Mesh',      category: 'Hogar',         price: 349.00, cost: 200.00, stock: 6,   minStock: 2,  unit: 'unidad', status: 'active' },
  { id: '5', sku: 'ALI-001', name: 'Café Molido 500g',           category: 'Alimentos',     price: 8.50,   cost: 4.20,   stock: 48,  minStock: 20, unit: 'kg',     barcode: '7501234567892', status: 'active' },
  { id: '6', sku: 'DEP-001', name: 'Pelota de Fútbol Nike',      category: 'Deportes',      price: 45.00,  cost: 22.00,  stock: 0,   minStock: 5,  unit: 'unidad', status: 'active' },
  { id: '7', sku: 'ELE-003', name: 'Cargador USB-C 65W',         category: 'Tecnología',    price: 35.00,  cost: 15.00,  stock: 24,  minStock: 10, unit: 'unidad', barcode: '7501234567893', status: 'active' },
  { id: '8', sku: 'HOG-002', name: 'Juego de Sábanas 2 Plazas',  category: 'Hogar',         price: 55.00,  cost: 28.00,  stock: 15,  minStock: 5,  unit: 'juego',  status: 'active' },
];

const MOVEMENTS = [
  { id: '1', date: '2026-02-19', product: 'iPhone 14 128GB Midnight', type: 'entrada', qty: 5,  note: 'Compra #OC-2024-45', user: 'Carlos V.' },
  { id: '2', date: '2026-02-18', product: 'AirPods Pro 2da Gen',      type: 'salida',  qty: 2,  note: 'Venta #V-1290',       user: 'Sistema' },
  { id: '3', date: '2026-02-17', product: 'Café Molido 500g',         type: 'entrada', qty: 100, note: 'Compra #OC-2024-44', user: 'María G.' },
  { id: '4', date: '2026-02-16', product: 'Pelota de Fútbol Nike',    type: 'salida',  qty: 3,  note: 'Venta #V-1288',       user: 'Sistema' },
  { id: '5', date: '2026-02-15', product: 'Campera Patagonia',        type: 'ajuste',  qty: -2, note: 'Merma física',        user: 'Carlos V.' },
];

export function ERPInventarioView({ onNavigate }: Props) {
  const [tab, setTab] = useState<ViewTab>('articulos');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['all', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const lowStock = PRODUCTS.filter(p => p.stock <= p.minStock);
  const outOfStock = PRODUCTS.filter(p => p.stock === 0);

  const filtered = PRODUCTS.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalValue = PRODUCTS.reduce((s, p) => s + p.stock * p.cost, 0);

  const handleSave = (data: ProductFormData) => {
    console.log('Guardando artículo:', data);
    setShowModal(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Package}
        title="Catálogo de Artículos"
        subtitle="Gestión de productos, stock y movimientos — ERP"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('gestion') },
          { label: '+ Nuevo Artículo', primary: true, onClick: () => { setSelectedProduct(null); setShowModal(true); } },
        ]}
      />

      {/* Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '0 28px' }}>
          {[
            { id: 'articulos' as ViewTab,    label: '📦 Artículos' },
            { id: 'stock' as ViewTab,        label: '📊 Stock' },
            { id: 'movimientos' as ViewTab,  label: '🔄 Movimientos' },
            { id: 'alertas' as ViewTab,      label: `⚠️ Alertas (${lowStock.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '14px 18px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tab === t.id ? ORANGE : '#6B7280', fontWeight: tab === t.id ? '700' : '500', fontSize: '0.875rem', borderBottom: tab === t.id ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '24px 28px', maxWidth: '1300px' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Artículos',    value: PRODUCTS.length.toString(),           Icon: Package,     color: '#111827' },
              { label: 'Valor en Stock',     value: `$${totalValue.toLocaleString('es', { maximumFractionDigits: 0 })}`, Icon: BarChart2, color: '#16A34A' },
              { label: 'Bajo Mínimo',        value: lowStock.length.toString(),           Icon: TrendingDown, color: '#D97706' },
              { label: 'Sin Stock',          value: outOfStock.length.toString(),         Icon: AlertTriangle, color: '#DC2626' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', border: `1px solid ${s.color}22`, borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</span>
                  <s.Icon size={15} color={s.color} />
                </div>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── ARTÍCULOS ── */}
          {tab === 'articulos' && (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} size={14} color="#9CA3AF" />
                  <input type="text" placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', backgroundColor: '#FFF' }}>
                  {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <button style={{ padding: '9px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFF', color: '#374151', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Upload size={13} /> Importar
                </button>
                <button style={{ padding: '9px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFF', color: '#374151', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Download size={13} /> Exportar
                </button>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['SKU', 'Nombre', 'Categoría', 'Precio', 'Costo', 'Stock', 'Margen', 'Estado', ''].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const margin = ((p.price - p.cost) / p.price * 100).toFixed(0);
                      const stockOk = p.stock > p.minStock;
                      const outStock = p.stock === 0;
                      return (
                        <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B7280' }}>{p.sku}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{p.name}</span>
                            {p.barcode && <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#9CA3AF', fontFamily: 'monospace' }}>{p.barcode}</p>}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: '0.8rem' }}>{p.category}</td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#111827', fontSize: '0.875rem' }}>${p.price.toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: '0.8rem' }}>${p.cost.toFixed(2)}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '700', color: outStock ? '#DC2626' : (!stockOk ? '#D97706' : '#111827'), fontSize: '0.875rem' }}>
                                {p.stock}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{p.unit}</span>
                              {!stockOk && <AlertTriangle size={12} color={outStock ? '#DC2626' : '#D97706'} />}
                            </div>
                            <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#9CA3AF' }}>min: {p.minStock}</p>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: parseInt(margin) > 35 ? '#16A34A' : '#D97706' }}>{margin}%</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: p.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: p.status === 'active' ? '#15803D' : '#6B7280' }}>
                              {p.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => { setSelectedProduct(p); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Edit2 size={13} /></button>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── STOCK ── */}
          {tab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {PRODUCTS.map(p => {
                const pct = Math.min((p.stock / Math.max(p.stock, p.minStock * 3)) * 100, 100);
                const color = p.stock === 0 ? '#DC2626' : p.stock <= p.minStock ? '#D97706' : '#16A34A';
                return (
                  <div key={p.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{p.name}</span>
                        <span style={{ marginLeft: '8px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#9CA3AF' }}>{p.sku}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: '800', color, fontSize: '1rem' }}>{p.stock}</span>
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginLeft: '3px' }}>{p.unit}</span>
                        {p.stock <= p.minStock && <span style={{ marginLeft: '6px', fontSize: '0.68rem', color, fontWeight: '700' }}>⚠️ bajo mínimo ({p.minStock})</span>}
                      </div>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#F3F4F6', borderRadius: '4px', height: '6px' }}>
                      <div style={{ height: '6px', borderRadius: '4px', backgroundColor: color, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MOVIMIENTOS ── */}
          {tab === 'movimientos' && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Nota', 'Usuario'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOVEMENTS.map((m, i) => {
                    const TYPE_CONF = {
                      entrada: { label: '↑ Entrada', color: '#15803D', bg: '#DCFCE7' },
                      salida:  { label: '↓ Salida',  color: '#DC2626', bg: '#FEE2E2' },
                      ajuste:  { label: '≈ Ajuste',  color: '#7C3AED', bg: '#EDE9FE' },
                    };
                    const tc = TYPE_CONF[m.type as keyof typeof TYPE_CONF];
                    return (
                      <tr key={m.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{m.date}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827', fontSize: '0.82rem' }}>{m.product}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: tc.bg, color: tc.color, fontSize: '0.72rem', fontWeight: '700' }}>{tc.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: m.qty > 0 ? '#15803D' : '#DC2626', fontSize: '0.875rem' }}>
                          {m.qty > 0 ? '+' : ''}{m.qty}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{m.note}</td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontSize: '0.8rem' }}>{m.user}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ALERTAS ── */}
          {tab === 'alertas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStock.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '50px', textAlign: 'center', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>✅</p>
                  <p style={{ margin: 0, fontWeight: '600' }}>Todo el stock está en orden</p>
                </div>
              ) : (
                lowStock.map(p => (
                  <div key={p.id} style={{ backgroundColor: p.stock === 0 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${p.stock === 0 ? '#FECACA' : '#FDE68A'}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <AlertTriangle size={20} color={p.stock === 0 ? '#DC2626' : '#D97706'} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{p.name}</p>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.78rem' }}>
                        SKU: {p.sku} · Stock actual: <strong style={{ color: p.stock === 0 ? '#DC2626' : '#D97706' }}>{p.stock}</strong> / Mínimo: {p.minStock}
                      </p>
                    </div>
                    <button style={{ padding: '8px 16px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem' }}>
                      Crear Orden de Compra
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct ? {
            name: selectedProduct.name,
            price: String(selectedProduct.price),
            category: selectedProduct.category,
            sku: selectedProduct.sku,
            barcode: selectedProduct.barcode,
            stock: String(selectedProduct.stock),
            minStock: String(selectedProduct.minStock),
            cost: String(selectedProduct.cost),
          } : null}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}