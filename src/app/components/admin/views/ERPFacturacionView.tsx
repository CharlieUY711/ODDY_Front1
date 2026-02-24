import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { Plus, Search, Eye, Printer, Download, X, Receipt, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';

type TabType = 'facturas' | 'tickets' | 'nueva';

interface InvoiceItem { description: string; qty: number; price: number; }
interface Invoice {
  id: string; number: string; date: string; dueDate: string;
  customer: string; customerDoc: string; items: InvoiceItem[];
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  type: 'factura' | 'ticket' | 'nota-credito';
  paymentMethod: string;
}

const INVOICES: Invoice[] = [
  { id: '1', number: 'FAC-2026-0001', date: '2026-02-19', dueDate: '2026-03-05', customer: 'Ana García', customerDoc: 'CI: 1.234.567-8', items: [{ description: 'iPhone 14 128GB', qty: 1, price: 899.99 }], status: 'paid', type: 'factura', paymentMethod: 'Tarjeta' },
  { id: '2', number: 'FAC-2026-0002', date: '2026-02-18', dueDate: '2026-03-04', customer: 'Carlos Martín', customerDoc: 'CI: 2.345.678-9', items: [{ description: 'AirPods Pro', qty: 2, price: 249.99 }, { description: 'Cargador 65W', qty: 1, price: 35.00 }], status: 'pending', type: 'factura', paymentMethod: 'Efectivo' },
  { id: '3', number: 'TKT-2026-0045', date: '2026-02-19', dueDate: '2026-02-19', customer: 'Consumidor Final', customerDoc: '—', items: [{ description: 'Café Molido 500g', qty: 3, price: 8.50 }], status: 'paid', type: 'ticket', paymentMethod: 'Efectivo' },
  { id: '4', number: 'FAC-2026-0003', date: '2026-02-15', dueDate: '2026-02-25', customer: 'María López', customerDoc: 'CI: 3.456.789-0', items: [{ description: 'Silla Ergonómica', qty: 1, price: 349.00 }], status: 'overdue', type: 'factura', paymentMethod: 'Transferencia' },
  { id: '5', number: 'TKT-2026-0046', date: '2026-02-19', dueDate: '2026-02-19', customer: 'Consumidor Final', customerDoc: '—', items: [{ description: 'Pelota Nike', qty: 1, price: 45.00 }, { description: 'Café Molido', qty: 2, price: 8.50 }], status: 'paid', type: 'ticket', paymentMethod: 'Tarjeta' },
];

const STATUS_MAP = {
  paid:      { label: 'Pagada',    bg: '#DCFCE7', color: '#15803D', Icon: CheckCircle2 },
  pending:   { label: 'Pendiente', bg: '#FEF3C7', color: '#B45309', Icon: Clock },
  overdue:   { label: 'Vencida',   bg: '#FEE2E2', color: '#DC2626', Icon: AlertCircle },
  cancelled: { label: 'Anulada',   bg: '#F3F4F6', color: '#6B7280', Icon: X },
};

const TAX_RATE = 0.22;

interface NewInvoice {
  type: 'factura' | 'ticket'; customer: string; customerDoc: string;
  paymentMethod: string; items: InvoiceItem[];
}

export function ERPFacturacionView({ onNavigate }: Props) {
  const [tab, setTab] = useState<TabType>('facturas');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [newInv, setNewInv] = useState<NewInvoice>({
    type: 'factura', customer: '', customerDoc: '', paymentMethod: 'Efectivo',
    items: [{ description: '', qty: 1, price: 0 }],
  });

  const totalBilled = INVOICES.filter(i => i.status === 'paid').reduce((s, inv) => s + inv.items.reduce((a, it) => a + it.qty * it.price, 0), 0);
  const pending = INVOICES.filter(i => i.status === 'pending');
  const overdue = INVOICES.filter(i => i.status === 'overdue');

  const filtered = INVOICES.filter(i => {
    if (tab === 'tickets' && i.type !== 'ticket') return false;
    if (tab === 'facturas' && i.type === 'ticket') return false;
    if (search && !i.customer.toLowerCase().includes(search.toLowerCase()) && !i.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const invSubtotal = newInv.items.reduce((s, it) => s + it.qty * it.price, 0);
  const invTax = invSubtotal * TAX_RATE;
  const invTotal = invSubtotal + invTax;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={Receipt}
        title="Facturación"
        subtitle="Emisión de facturas, tickets y notas de crédito — ERP"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('gestion') },
          { label: '+ Nueva Factura', primary: true, onClick: () => setTab('nueva') },
        ]}
      />

      {/* Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '0 28px' }}>
          {[
            { id: 'facturas' as TabType, label: '🧾 Facturas' },
            { id: 'tickets'  as TabType, label: '🎫 Tickets' },
            { id: 'nueva'    as TabType, label: '✏️ Nueva Factura/Ticket' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '14px 18px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tab === t.id ? ORANGE : '#6B7280', fontWeight: tab === t.id ? '700' : '500', fontSize: '0.875rem', borderBottom: tab === t.id ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA' }}>
        <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Facturado (pagado)', value: `$${totalBilled.toLocaleString('es', { maximumFractionDigits: 0 })}`, color: '#16A34A' },
              { label: 'Pendientes de cobro', value: `${pending.length}`, color: '#D97706' },
              { label: 'Vencidas',            value: `${overdue.length}`, color: '#DC2626' },
              { label: 'Total emitidas',      value: INVOICES.length.toString(), color: '#111827' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#6B7280' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── FACTURAS / TICKETS list ── */}
          {(tab === 'facturas' || tab === 'tickets') && (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} size={14} color="#9CA3AF" />
                  <input type="text" placeholder="Buscar por cliente o número..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setTab('nueva')} style={{ padding: '9px 16px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={14} /> Nueva
                </button>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {['Número', 'Cliente', 'Total', 'Vencimiento', 'Método', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv, i) => {
                      const total = inv.items.reduce((s, it) => s + it.qty * it.price, 0);
                      const st = STATUS_MAP[inv.status];
                      return (
                        <tr key={inv.id} style={{ borderTop: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B7280' }}>{inv.number}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{inv.customer}</p>
                            <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>{inv.customerDoc}</p>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>
                            ${total.toFixed(2)}
                            <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#9CA3AF' }}>+ IVA ${(total * TAX_RATE).toFixed(2)}</p>
                          </td>
                          <td style={{ padding: '12px 14px', color: inv.status === 'overdue' ? '#DC2626' : '#6B7280', fontSize: '0.8rem', fontWeight: inv.status === 'overdue' ? '700' : '400' }}>{inv.dueDate}</td>
                          <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: '0.8rem' }}>{inv.paymentMethod}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: '20px', backgroundColor: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <st.Icon size={10} /> {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => setPreview(inv)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '3px' }}><Eye size={14} /></button>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '3px' }}><Printer size={14} /></button>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '3px' }}><Download size={14} /></button>
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

          {/* ── NUEVA FACTURA/TICKET ── */}
          {tab === 'nueva' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Type selector */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Tipo de comprobante</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['factura', 'ticket'].map(type => (
                      <button key={type} onClick={() => setNewInv(p => ({ ...p, type: type as any }))}
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `2px solid ${newInv.type === type ? ORANGE : '#E5E7EB'}`, backgroundColor: newInv.type === type ? '#FFF4EC' : '#FFF', cursor: 'pointer', fontWeight: '700', color: newInv.type === type ? ORANGE : '#374151', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {type === 'factura' ? <FileText size={15} /> : <Receipt size={15} />}
                        {type === 'factura' ? 'Factura' : 'Ticket'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Cliente</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Nombre del cliente', key: 'customer', ph: newInv.type === 'ticket' ? 'Consumidor Final' : 'Ana García' },
                      { label: 'CI / RUC', key: 'customerDoc', ph: newInv.type === 'ticket' ? '—' : 'CI: 1.234.567-8' },
                    ].map(({ label, key, ph }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{label}</label>
                        <input type="text" placeholder={ph} value={(newInv as any)[key]} onChange={e => setNewInv(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Artículos</h4>
                    <button onClick={() => setNewInv(p => ({ ...p, items: [...p.items, { description: '', qty: 1, price: 0 }] }))}
                      style={{ padding: '5px 12px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '8px', marginBottom: '6px' }}>
                    {['Descripción', 'Cant.', 'Precio', ''].map(h => (
                      <span key={h} style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {newInv.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input type="text" placeholder="Descripción del artículo" value={item.description}
                        onChange={e => { const it = [...newInv.items]; it[idx].description = e.target.value; setNewInv(p => ({ ...p, items: it })); }}
                        style={{ padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '0.82rem', outline: 'none' }} />
                      <input type="number" value={item.qty} min={1}
                        onChange={e => { const it = [...newInv.items]; it[idx].qty = +e.target.value; setNewInv(p => ({ ...p, items: it })); }}
                        style={{ padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '0.82rem', outline: 'none' }} />
                      <input type="number" value={item.price} step={0.01}
                        onChange={e => { const it = [...newInv.items]; it[idx].price = +e.target.value; setNewInv(p => ({ ...p, items: it })); }}
                        style={{ padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '0.82rem', outline: 'none' }} />
                      <button onClick={() => setNewInv(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Payment method */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 12px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Método de pago</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Efectivo', 'Tarjeta', 'Transferencia', 'Mercado Pago', 'Cuenta Corriente'].map(m => (
                      <button key={m} onClick={() => setNewInv(p => ({ ...p, paymentMethod: m }))}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${newInv.paymentMethod === m ? ORANGE : '#E5E7EB'}`, backgroundColor: newInv.paymentMethod === m ? '#FFF4EC' : '#FFF', color: newInv.paymentMethod === m ? ORANGE : '#374151', fontWeight: newInv.paymentMethod === m ? '700' : '500', cursor: 'pointer', fontSize: '0.78rem' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary sidebar */}
              <div>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', position: 'sticky', top: '24px' }}>
                  <h4 style={{ margin: '0 0 16px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>Resumen</h4>
                  <div style={{ marginBottom: '16px' }}>
                    {newInv.items.filter(it => it.description).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                        <span style={{ color: '#374151' }}>{it.qty}x {it.description || '—'}</span>
                        <span style={{ fontWeight: '600', color: '#111827' }}>${(it.qty * it.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    {[
                      { label: 'Subtotal', value: `$${invSubtotal.toFixed(2)}` },
                      { label: 'IVA (22%)', value: `$${invTax.toFixed(2)}` },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: '#6B7280' }}>
                        <span>{r.label}</span><span>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                      <span style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>TOTAL</span>
                      <span style={{ fontWeight: '900', color: ORANGE, fontSize: '1.1rem' }}>${invTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={{ padding: '12px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Emitir {newInv.type === 'factura' ? 'Factura' : 'Ticket'}
                    </button>
                    <button style={{ padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Printer size={14} /> Imprimir ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setPreview(null)}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '28px', width: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: '#111827' }}>🧾 {preview.number}</h2>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div style={{ borderBottom: '2px dashed #E5E7EB', paddingBottom: '12px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{preview.customer}</p>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.75rem' }}>{preview.customerDoc} · {preview.date}</p>
            </div>
            {preview.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ color: '#374151' }}>{it.qty}x {it.description}</span>
                <span style={{ fontWeight: '600' }}>${(it.qty * it.price).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '2px dashed #E5E7EB', paddingTop: '12px', marginTop: '12px' }}>
              {(() => {
                const sub = preview.items.reduce((s, it) => s + it.qty * it.price, 0);
                const tax = sub * TAX_RATE;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6B7280', marginBottom: '4px' }}><span>Subtotal</span><span>${sub.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6B7280', marginBottom: '8px' }}><span>IVA 22%</span><span>${tax.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', color: ORANGE, fontSize: '1rem' }}><span>TOTAL</span><span>${(sub + tax).toFixed(2)}</span></div>
                  </>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.82rem' }}>
                <Printer size={13} /> Imprimir
              </button>
              <button style={{ flex: 1, padding: '10px', backgroundColor: ORANGE, color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.82rem' }}>
                <Download size={13} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}