/**
 * 💰 Generador de Presupuestos
 * Ítems editables · IVA · Descuentos · Multi-moneda · Export PDF
 */
import React, { useState, useCallback } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import { Plus, Trash2, Download, FileText, RefreshCw } from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

type Currency = 'UYU' | 'USD' | 'EUR' | 'ARS';
type Status = 'draft' | 'sent' | 'approved' | 'rejected';

interface QuoteItem {
  id: string; description: string; qty: number;
  unitPrice: number; discount: number;
}

interface Client { name: string; company: string; email: string; phone: string; }

const CURRENCIES: { id: Currency; symbol: string; label: string }[] = [
  { id: 'UYU', symbol: '$U', label: 'Peso Uruguayo' },
  { id: 'USD', symbol: 'US$', label: 'Dólar Americano' },
  { id: 'EUR', symbol: '€',  label: 'Euro' },
  { id: 'ARS', symbol: '$',  label: 'Peso Argentino' },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Borrador',  color: '#9CA3AF', bg: '#F3F4F6' },
  sent:     { label: 'Enviado',   color: '#3B82F6', bg: '#EFF6FF' },
  approved: { label: 'Aprobado',  color: '#10B981', bg: '#D1FAE5' },
  rejected: { label: 'Rechazado', color: '#EF4444', bg: '#FEF2F2' },
};

function newItem(): QuoteItem {
  return { id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`, description: '', qty: 1, unitPrice: 0, discount: 0 };
}

function fmt(n: number, symbol: string) {
  return `${symbol} ${n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({
  quoteNumber, currency, setCurrency,
  iva, setIva, globalDiscount, setGlobalDiscount,
  status, setStatus, validDays, setValidDays,
  client, setClient,
}: {
  quoteNumber: string; currency: Currency; setCurrency: (c: Currency) => void;
  iva: number; setIva: (n: number) => void;
  globalDiscount: number; setGlobalDiscount: (n: number) => void;
  status: Status; setStatus: (s: Status) => void;
  validDays: number; setValidDays: (n: number) => void;
  client: Client; setClient: (c: Client) => void;
}) {
  const cur = CURRENCIES.find(c => c.id === currency)!;
  return (
    <div style={{ padding: '10px 12px', overflowY: 'auto', height: '100%' }}>
      {/* Doc info */}
      <p style={sLabel}>Documento</p>
      <div style={{ marginBottom: 8, padding: '8px 10px', backgroundColor: '#FFFBEB', borderRadius: 7, border: '1px solid #FDE68A' }}>
        <div style={{ fontSize: '0.65rem', color: '#92400E', fontWeight: '700' }}>Nº {quoteNumber}</div>
        <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>

      <p style={sLabel}>Estado</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {(Object.keys(STATUS_META) as Status[]).map(s => {
          const m = STATUS_META[s];
          return (
            <button key={s} onClick={() => setStatus(s)}
              style={{ padding: '3px 8px', borderRadius: 5, border: `1.5px solid ${status === s ? m.color : '#E5E7EB'}`, backgroundColor: status === s ? m.bg : '#fff', color: status === s ? m.color : '#9CA3AF', cursor: 'pointer', fontSize: '0.63rem', fontWeight: '700' }}>
              {m.label}
            </button>
          );
        })}
      </div>

      <p style={sLabel}>Validez (días)</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <button onClick={() => setValidDays(Math.max(1, validDays - 5))} style={cntBtn}>−</button>
        <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.85rem', minWidth: 24, textAlign: 'center' }}>{validDays}</span>
        <button onClick={() => setValidDays(validDays + 5)} style={cntBtn}>+</button>
        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>días</span>
      </div>

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '10px 0' }} />

      {/* Cliente */}
      <p style={sLabel}>Cliente</p>
      {(['name', 'company', 'email', 'phone'] as (keyof Client)[]).map(k => (
        <input key={k} value={client[k]}
          onChange={e => setClient({ ...client, [k]: e.target.value })}
          placeholder={{ name: 'Nombre', company: 'Empresa', email: 'Email', phone: 'Teléfono' }[k]}
          style={inputSt}
        />
      ))}

      <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '10px 0' }} />

      {/* Condiciones */}
      <p style={sLabel}>Moneda</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {CURRENCIES.map(c => (
          <button key={c.id} onClick={() => setCurrency(c.id)}
            style={{ padding: '3px 8px', borderRadius: 5, border: `1.5px solid ${currency === c.id ? '#F59E0B' : '#E5E7EB'}`, backgroundColor: currency === c.id ? '#FFFBEB' : '#fff', color: currency === c.id ? '#92400E' : '#374151', cursor: 'pointer', fontSize: '0.63rem', fontWeight: '700' }}>
            {c.symbol} {c.id}
          </button>
        ))}
      </div>

      <p style={sLabel}>IVA %</p>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[0, 10, 22].map(v => (
          <button key={v} onClick={() => setIva(v)}
            style={{ flex: 1, padding: '4px', borderRadius: 5, border: `1.5px solid ${iva === v ? '#10B981' : '#E5E7EB'}`, backgroundColor: iva === v ? '#D1FAE5' : '#fff', color: iva === v ? '#10B981' : '#374151', cursor: 'pointer', fontSize: '0.68rem', fontWeight: '700' }}>
            {v}%
          </button>
        ))}
      </div>

      <p style={sLabel}>Dto. global %</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <input type="number" min={0} max={100} value={globalDiscount}
          onChange={e => setGlobalDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
          style={{ ...inputSt, width: 60, marginBottom: 0, textAlign: 'center', fontWeight: '700', color: '#F59E0B' }} />
        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>% sobre subtotal</span>
      </div>
    </div>
  );
}

/* ── Canvas ─────────────────────────────────────────────────────────────── */
function QuoteCanvas({
  items, setItems, quoteNumber, currency, iva, globalDiscount, client, validDays, status
}: {
  items: QuoteItem[]; setItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  quoteNumber: string; currency: Currency; iva: number; globalDiscount: number;
  client: Client; validDays: number; status: Status;
}) {
  const cur = CURRENCIES.find(c => c.id === currency)!;
  const sm  = STATUS_META[status];

  const itemSubtotal  = (it: QuoteItem) => it.qty * it.unitPrice * (1 - it.discount / 100);
  const rawSub        = items.reduce((acc, it) => acc + itemSubtotal(it), 0);
  const discountAmt   = rawSub * globalDiscount / 100;
  const subtotal      = rawSub - discountAmt;
  const ivaAmt        = subtotal * iva / 100;
  const total         = subtotal + ivaAmt;

  const validDate = new Date();
  validDate.setDate(validDate.getDate() + validDays);

  const updateItem = (id: string, partial: Partial<QuoteItem>) =>
    setItems(p => p.map(it => it.id === id ? { ...it, ...partial } : it));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 44, backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
        <FileText size={14} color="#F59E0B" />
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151' }}>Presupuesto #{quoteNumber}</span>
        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: '700', backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', backgroundColor: '#F59E0B', color: '#fff', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>
          <Download size={12} /> Exportar PDF
        </button>
      </div>

      {/* A4 page */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#E5E7EB', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 680, backgroundColor: '#fff', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', padding: '48px 56px', position: 'relative' }}>

          {/* Accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: '#F59E0B', borderRadius: '4px 4px 0 0' }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #F3F4F6' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF6835' }}>Charlie</div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Marketplace Builder</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>PRESUPUESTO</div>
              <div style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: '700' }}>#{quoteNumber}</div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 4 }}>
                Fecha: {new Date().toLocaleDateString('es-UY')}<br />
                Válido hasta: {validDate.toLocaleDateString('es-UY')}
              </div>
            </div>
          </div>

          {/* Client */}
          {(client.name || client.company || client.email) && (
            <div style={{ marginBottom: 20, padding: '12px 14px', backgroundColor: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cliente</div>
              {client.name    && <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#111827' }}>{client.name}</div>}
              {client.company && <div style={{ fontSize: '0.78rem', color: '#374151' }}>{client.company}</div>}
              {client.email   && <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{client.email}</div>}
              {client.phone   && <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{client.phone}</div>}
            </div>
          )}

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                {['Descripción', 'Cant.', 'Precio unit.', 'Dto. %', 'Subtotal'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'right', fontSize: '0.65rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
                <th style={{ padding: '8px 4px', width: 28, borderBottom: '2px solid #E5E7EB' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '6px 10px' }}>
                    <input value={it.description} placeholder="Descripción del ítem..."
                      onChange={e => updateItem(it.id, { description: e.target.value })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.82rem', backgroundColor: 'transparent', color: '#111827' }} />
                  </td>
                  {(['qty', 'unitPrice', 'discount'] as const).map(field => (
                    <td key={field} style={{ padding: '6px 10px', textAlign: 'right' }}>
                      <input type="number" min={0} value={it[field]}
                        onChange={e => updateItem(it.id, { [field]: Number(e.target.value) })}
                        style={{ border: 'none', outline: 'none', width: field === 'discount' ? 40 : 70, textAlign: 'right', fontSize: '0.82rem', backgroundColor: 'transparent', color: '#374151', fontFamily: 'monospace' }} />
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700', color: '#111827', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {fmt(itemSubtotal(it), cur.symbol)}
                  </td>
                  <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                    <button onClick={() => setItems(p => p.filter(x => x.id !== it.id))}
                      style={{ border: 'none', background: 'none', color: '#E5E7EB', cursor: 'pointer', fontSize: '0.8rem', padding: 2, borderRadius: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#E5E7EB'; }}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add item */}
          <button onClick={() => setItems(p => [...p, newItem()])}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1.5px dashed #FDE68A', backgroundColor: '#FFFBEB', color: '#F59E0B', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700', marginBottom: 20 }}>
            <Plus size={12} /> Agregar ítem
          </button>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 280 }}>
              {[
                { label: 'Subtotal bruto', value: rawSub, color: '#374151' },
                ...(globalDiscount > 0 ? [{ label: `Descuento global (${globalDiscount}%)`, value: -discountAmt, color: '#EF4444' }] : []),
                { label: 'Subtotal', value: subtotal, color: '#374151' },
                ...(iva > 0 ? [{ label: `IVA (${iva}%)`, value: ivaAmt, color: '#6B7280' }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: '600', color: row.color, fontFamily: 'monospace' }}>{fmt(row.value, cur.symbol)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', borderTop: '2px solid #111827', marginTop: 2 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#111827' }}>TOTAL {cur.id}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>{fmt(total, cur.symbol)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: 'relative', marginTop: 32, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#D1D5DB' }}>
            <span>Generado con Charlie Marketplace Builder</span>
            <span>Válido por {validDays} días desde la emisión</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Properties Panel ───────────────────────────────────────────────────── */
function PropertiesPanel({ items, currency, iva, globalDiscount, status }: {
  items: QuoteItem[]; currency: Currency; iva: number; globalDiscount: number; status: Status;
}) {
  const cur = CURRENCIES.find(c => c.id === currency)!;
  const sm  = STATUS_META[status];

  const itemSub    = (it: QuoteItem) => it.qty * it.unitPrice * (1 - it.discount / 100);
  const rawSub     = items.reduce((acc, it) => acc + itemSub(it), 0);
  const discAmt    = rawSub * globalDiscount / 100;
  const subtotal   = rawSub - discAmt;
  const ivaAmt     = subtotal * iva / 100;
  const total      = subtotal + ivaAmt;

  return (
    <div>
      {/* Status */}
      <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 8, backgroundColor: sm.bg, border: `1px solid ${sm.color}30`, textAlign: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: sm.color }}>{sm.label}</span>
      </div>

      {/* Summary */}
      <p style={pLabel}>Resumen financiero</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {[
          { l: 'Ítems',          v: `${items.length}`,             mono: false },
          { l: 'Subtotal',       v: fmt(subtotal, cur.symbol),     mono: true  },
          { l: `IVA ${iva}%`,    v: fmt(ivaAmt, cur.symbol),       mono: true  },
          { l: `Dto. ${globalDiscount}%`, v: fmt(-discAmt, cur.symbol), mono: true },
        ].map(row => (
          <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#F9FAFB', borderRadius: 5 }}>
            <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{row.l}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#374151', fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.v}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ padding: '14px', backgroundColor: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: 10, textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>TOTAL {currency}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>{fmt(total, cur.symbol)}</div>
      </div>

      <button onClick={() => window.print()}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', backgroundColor: '#F59E0B', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Download size={13} /> Exportar PDF
      </button>
    </div>
  );
}

const sLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' };
const pLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' };
const inputSt: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: '0.76rem', outline: 'none', marginBottom: 6, boxSizing: 'border-box', color: '#374151', backgroundColor: '#fff' };
const cntBtn: React.CSSProperties = { width: 24, height: 24, borderRadius: 5, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* ── Main ────────────────────────────────────────────────────────────────── */
export function GenPresupuestosWorkspace({ onNavigate }: Props) {
  const [currency, setCurrency]           = useState<Currency>('UYU');
  const [iva, setIva]                     = useState(22);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [validDays, setValidDays]         = useState(30);
  const [status, setStatus]               = useState<Status>('draft');
  const [client, setClient]               = useState<Client>({ name: '', company: '', email: '', phone: '' });
  const [items, setItems]                 = useState<QuoteItem[]>([
    { ...newItem(), description: 'Servicio de consultoría', qty: 1, unitPrice: 5000 },
    { ...newItem(), description: 'Licencia anual software',  qty: 1, unitPrice: 12000 },
  ]);

  const quoteNumber = `PRE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  return (
    <WorkspaceShell
      toolId="gen-presupuestos"
      onNavigate={onNavigate}
      leftPanel={
        <LeftPanel
          quoteNumber={quoteNumber} currency={currency} setCurrency={setCurrency}
          iva={iva} setIva={setIva} globalDiscount={globalDiscount} setGlobalDiscount={setGlobalDiscount}
          status={status} setStatus={setStatus} validDays={validDays} setValidDays={setValidDays}
          client={client} setClient={setClient}
        />
      }
      canvas={
        <QuoteCanvas
          items={items} setItems={setItems} quoteNumber={quoteNumber}
          currency={currency} iva={iva} globalDiscount={globalDiscount}
          client={client} validDays={validDays} status={status}
        />
      }
      properties={
        <PropertiesPanel items={items} currency={currency} iva={iva} globalDiscount={globalDiscount} status={status} />
      }
      actions={
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', backgroundColor: '#F59E0B', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>
          <Download size={12} /> PDF
        </button>
      }
    />
  );
}
