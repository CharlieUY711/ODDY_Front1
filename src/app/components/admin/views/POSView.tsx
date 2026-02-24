/**
 * POSView — Punto de Venta
 * ════════════════════════
 * Terminal estilo caja de supermercado.
 * Touch-first: diseñado para escalar a app móvil.
 * Layout: panel izquierdo (productos) + panel derecho (ticket + cobro)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, CreditCard,
  Banknote, QrCode, BookUser, ChevronRight, Check, Printer,
  RefreshCw, User, Tag, Package, Zap, Clock, ReceiptText,
  ScanLine, ChevronDown, ArrowLeft, Percent, CircleDollarSign,
} from 'lucide-react';
import type { MainSection } from '../../../AdminDashboard';

const ORANGE = '#FF6835';
const ORANGE_LIGHT = 'rgba(255,104,53,0.10)';

/* ═══════════════════════════════════════════════
   DATOS MOCK
═══════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'all',       label: 'Todos',       emoji: '🔢' },
  { id: 'alimentos', label: 'Alimentos',   emoji: '🥫' },
  { id: 'bebidas',   label: 'Bebidas',     emoji: '🥤' },
  { id: 'limpieza',  label: 'Limpieza',    emoji: '🧹' },
  { id: 'higiene',   label: 'Higiene',     emoji: '🧴' },
  { id: 'frescos',   label: 'Frescos',     emoji: '🥩' },
  { id: 'lacteos',   label: 'Lácteos',     emoji: '🥛' },
  { id: 'panaderia', label: 'Panadería',   emoji: '🥖' },
];

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  tax: number; // % IVA
  emoji: string;
  stock: number;
}

const PRODUCTS: Product[] = [
  { id: 'p1',  code: '7890001', name: 'Arroz Largo Fino 1kg',      category: 'alimentos', price: 89,   unit: 'kg',  tax: 10, emoji: '🍚', stock: 48 },
  { id: 'p2',  code: '7890002', name: 'Aceite Girasol 900ml',      category: 'alimentos', price: 125,  unit: 'u',   tax: 10, emoji: '🫙', stock: 32 },
  { id: 'p3',  code: '7890003', name: 'Fideos Spaghetti 500g',     category: 'alimentos', price: 62,   unit: 'u',   tax: 10, emoji: '🍝', stock: 60 },
  { id: 'p4',  code: '7890004', name: 'Harina 000 1kg',            category: 'alimentos', price: 55,   unit: 'u',   tax: 10, emoji: '🌾', stock: 25 },
  { id: 'p5',  code: '7890005', name: 'Azúcar Blanca 1kg',         category: 'alimentos', price: 70,   unit: 'u',   tax: 10, emoji: '🍬', stock: 40 },
  { id: 'p6',  code: '7890006', name: 'Coca Cola 2.25L',           category: 'bebidas',   price: 135,  unit: 'u',   tax: 22, emoji: '🥤', stock: 55 },
  { id: 'p7',  code: '7890007', name: 'Agua Mineral 500ml',        category: 'bebidas',   price: 38,   unit: 'u',   tax: 22, emoji: '💧', stock: 120 },
  { id: 'p8',  code: '7890008', name: 'Jugo Naranja 1L',           category: 'bebidas',   price: 95,   unit: 'u',   tax: 22, emoji: '🍊', stock: 30 },
  { id: 'p9',  code: '7890009', name: 'Cerveza Lata 473ml',        category: 'bebidas',   price: 88,   unit: 'u',   tax: 22, emoji: '🍺', stock: 80 },
  { id: 'p10', code: '7890010', name: 'Detergente Limón 750ml',    category: 'limpieza',  price: 98,   unit: 'u',   tax: 22, emoji: '🧴', stock: 22 },
  { id: 'p11', code: '7890011', name: 'Lavandina 1L',              category: 'limpieza',  price: 45,   unit: 'u',   tax: 22, emoji: '🪣', stock: 35 },
  { id: 'p12', code: '7890012', name: 'Jabón en Polvo 800g',       category: 'limpieza',  price: 215,  unit: 'u',   tax: 22, emoji: '🧺', stock: 18 },
  { id: 'p13', code: '7890013', name: 'Shampoo 400ml',             category: 'higiene',   price: 185,  unit: 'u',   tax: 22, emoji: '🧴', stock: 12 },
  { id: 'p14', code: '7890014', name: 'Papel Higiénico x4',        category: 'higiene',   price: 120,  unit: 'u',   tax: 22, emoji: '🧻', stock: 50 },
  { id: 'p15', code: '7890015', name: 'Desodorante Roll-On',       category: 'higiene',   price: 145,  unit: 'u',   tax: 22, emoji: '🧼', stock: 20 },
  { id: 'p16', code: '7890016', name: 'Pollo Entero kg',           category: 'frescos',   price: 195,  unit: 'kg',  tax: 10, emoji: '🍗', stock: 15 },
  { id: 'p17', code: '7890017', name: 'Carne Picada kg',           category: 'frescos',   price: 380,  unit: 'kg',  tax: 10, emoji: '🥩', stock: 8  },
  { id: 'p18', code: '7890018', name: 'Milanesa de Ternera kg',    category: 'frescos',   price: 450,  unit: 'kg',  tax: 10, emoji: '🍖', stock: 6  },
  { id: 'p19', code: '7890019', name: 'Leche Entera 1L',           category: 'lacteos',   price: 72,   unit: 'u',   tax: 0,  emoji: '🥛', stock: 90 },
  { id: 'p20', code: '7890020', name: 'Yogur Natural 190g',        category: 'lacteos',   price: 58,   unit: 'u',   tax: 0,  emoji: '🫙', stock: 45 },
  { id: 'p21', code: '7890021', name: 'Queso Dambo kg',            category: 'lacteos',   price: 520,  unit: 'kg',  tax: 0,  emoji: '🧀', stock: 5  },
  { id: 'p22', code: '7890022', name: 'Manteca 200g',              category: 'lacteos',   price: 110,  unit: 'u',   tax: 0,  emoji: '🧈', stock: 28 },
  { id: 'p23', code: '7890023', name: 'Pan Lactal 500g',           category: 'panaderia', price: 95,   unit: 'u',   tax: 0,  emoji: '🍞', stock: 20 },
  { id: 'p24', code: '7890024', name: 'Medialunas x6',             category: 'panaderia', price: 85,   unit: 'u',   tax: 0,  emoji: '🥐', stock: 15 },
];

const PAYMENT_METHODS = [
  { id: 'efectivo',  label: 'Efectivo',       icon: Banknote,         color: '#10B981' },
  { id: 'tarjeta',   label: 'Tarjeta',         icon: CreditCard,       color: '#3B82F6' },
  { id: 'qr',        label: 'QR / Transfer',   icon: QrCode,           color: '#8B5CF6' },
  { id: 'cuenta',    label: 'Cuenta Cte.',      icon: BookUser,         color: ORANGE    },
];

/* ═══════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════ */

interface CartItem {
  product: Product;
  qty: number;
  discount: number; // % descuento por ítem
}

type PaymentMethodId = 'efectivo' | 'tarjeta' | 'qr' | 'cuenta';
type Screen = 'pos' | 'receipt';

interface Props { onNavigate: (s: MainSection) => void; }

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */

const fmt = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ═══════════════════════════════════════════════
   SUB-COMPONENTES
═══════════════════════════════════════════════ */

function Kbd({
  label, onPress, color, flex, fontSize,
}: { label: string; onPress: () => void; color?: string; flex?: number; fontSize?: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        flex: flex ?? 1,
        padding: '14px 4px',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        backgroundColor: pressed ? '#F3F4F6' : '#FFFFFF',
        color: color ?? '#111827',
        fontSize: fontSize ?? '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'background 0.08s',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */

export function POSView({ onNavigate }: Props) {
  const [screen, setScreen] = useState<Screen>('pos');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [numBuffer, setNumBuffer] = useState('');
  const [numMode, setNumMode] = useState<'qty' | 'discount' | 'cash'>('qty');
  const [time, setTime] = useState(new Date());
  const [lastTicket, setLastTicket] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [ticketNo, setTicketNo] = useState(1001);
  const [customerName, setCustomerName] = useState('');
  const [showCustomer, setShowCustomer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reloj en tiempo real
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Productos filtrados
  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.includes(q);
    return matchCat && matchQ;
  });

  // ── Totales ──
  const subtotal = cart.reduce((acc, item) => {
    const linePrice = item.product.price * item.qty;
    return acc + linePrice * (1 - item.discount / 100);
  }, 0);
  const discountAmt = subtotal * (globalDiscount / 100);
  const taxBase = subtotal - discountAmt;
  const totalFinal = taxBase;
  const change = paymentMethod === 'efectivo'
    ? Math.max(0, parseFloat(cashReceived || '0') - totalFinal)
    : 0;

  // ── Agregar al carrito ──
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1, discount: 0 }];
    });
    setSelectedItemId(product.id);
    setNumBuffer('');
    setNumMode('qty');
  };

  // ── Teclado numérico ──
  const handleNum = (val: string) => {
    if (numMode === 'cash') {
      setCashReceived(prev => {
        if (val === '.' && prev.includes('.')) return prev;
        if (val === '⌫') return prev.slice(0, -1);
        if (val === 'C') return '';
        return prev + val;
      });
      return;
    }
    if (!selectedItemId) return;
    setNumBuffer(prev => {
      if (val === '⌫') return prev.slice(0, -1);
      if (val === 'C') return '';
      if (val === '.' && prev.includes('.')) return prev;
      return prev + val;
    });
  };

  const applyBuffer = () => {
    if (!selectedItemId || !numBuffer) return;
    const n = parseFloat(numBuffer);
    if (isNaN(n) || n <= 0) return;
    setCart(prev => prev.map(i => {
      if (i.product.id !== selectedItemId) return i;
      if (numMode === 'qty') return { ...i, qty: n };
      if (numMode === 'discount') return { ...i, discount: Math.min(n, 100) };
      return i;
    }));
    setNumBuffer('');
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // ── Cobrar ──
  const handleCobrar = () => {
    if (cart.length === 0) return;
    setLastTicket([...cart]);
    setLastTotal(totalFinal);
    setScreen('receipt');
  };

  // ── Nueva venta ──
  const newSale = () => {
    setCart([]);
    setSelectedItemId(null);
    setGlobalDiscount(0);
    setCashReceived('');
    setNumBuffer('');
    setTicketNo(n => n + 1);
    setCustomerName('');
    setScreen('pos');
  };

  const selectedItem = cart.find(i => i.product.id === selectedItemId);

  /* ═══ PANTALLA: RECIBO ═══ */
  if (screen === 'receipt') {
    const method = PAYMENT_METHODS.find(m => m.id === paymentMethod)!;
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundColor: '#F8F9FA', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 28px', backgroundColor: '#fff',
          borderBottom: '1px solid #E9ECEF',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReceiptText size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1A1A2E' }}>
              Venta Completada ✓
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6C757D' }}>
              Ticket #{ticketNo} · {time.toLocaleString('es-UY')}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={newSale}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
                color: '#fff', fontWeight: '800', fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Plus size={16} /> Nueva Venta
            </button>
          </div>
        </div>

        {/* Ticket imprimible */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 420, backgroundColor: '#fff', borderRadius: 16,
            border: '1px solid #E9ECEF', padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            {/* Encabezado ticket */}
            <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed #D1D5DB' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <ReceiptText size={24} color="#fff" />
              </div>
              <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: '#111' }}>CHARLIE MARKETPLACE</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>Punto de Venta · Caja #1</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                {time.toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', fontWeight: '700', color: '#111' }}>TICKET #{ticketNo}</p>
              {customerName && (
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>Cliente: {customerName}</p>
              )}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 20 }}>
              {lastTicket.map((item, i) => {
                const line = item.product.price * item.qty * (1 - item.discount / 100);
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #F3F4F6',
                    alignItems: 'flex-start', gap: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '600', color: '#111' }}>
                        {item.product.emoji} {item.product.name}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: '#9CA3AF' }}>
                        {item.qty} {item.product.unit} × ${fmt(item.product.price)}
                        {item.discount > 0 && ` (−${item.discount}%)`}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#111', whiteSpace: 'nowrap' }}>
                      ${fmt(line)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Totales */}
            <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: 16, marginBottom: 20 }}>
              {globalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Descuento general ({globalDiscount}%)</span>
                  <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: '700' }}>−${fmt(subtotal * globalDiscount / 100)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#111' }}>TOTAL</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '900', color: ORANGE }}>${fmt(lastTotal)}</span>
              </div>
            </div>

            {/* Pago */}
            <div style={{
              backgroundColor: `${method.color}10`, borderRadius: 10,
              border: `1px solid ${method.color}30`, padding: '12px 16px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <method.icon size={16} color={method.color} />
                <span style={{ fontWeight: '700', color: method.color, fontSize: '0.85rem' }}>
                  {method.label}
                </span>
              </div>
              {paymentMethod === 'efectivo' && parseFloat(cashReceived) > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>
                    Recibido: ${fmt(parseFloat(cashReceived))} · Vuelto: <strong>${fmt(change)}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Pie */}
            <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px dashed #D1D5DB' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>¡Gracias por su compra!</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#D1D5DB' }}>www.charliemarketplace.com</p>
            </div>

            {/* Botón imprimir */}
            <button
              onClick={() => window.print()}
              style={{
                marginTop: 20, width: '100%', padding: '11px',
                border: '1.5px solid #E5E7EB', borderRadius: 10,
                backgroundColor: '#F9FAFB', color: '#374151',
                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              <Printer size={15} /> Imprimir Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ PANTALLA: POS PRINCIPAL ═══ */
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      backgroundColor: '#F0F2F5', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height: 56, backgroundColor: '#1A1A2E',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
        flexShrink: 0,
      }}>
        <button
          onClick={() => onNavigate('gestion')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.78rem', fontWeight: '600', padding: '4px 8px', borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          <ArrowLeft size={14} /> Gestión
        </button>

        <div style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)' }} />

        {/* Logo + nombre */}
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ScanLine size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem' }}>
          POS Terminal
        </span>
        <span style={{
          fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: 6,
          backgroundColor: ORANGE_LIGHT, color: ORANGE, border: `1px solid ${ORANGE}40`,
        }}>
          Caja #1
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
            <User size={13} />
            <span>Operador</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
            <Clock size={13} />
            <span>{time.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: '700',
            backgroundColor: '#10B98120', color: '#10B981', border: '1px solid #10B98140',
          }}>
            ● EN LÍNEA
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>

        {/* ══════════════ PANEL IZQUIERDO: Productos ══════════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backgroundColor: '#F0F2F5', borderRight: '1px solid #E5E7EB',
        }}>

          {/* Search bar */}
          <div style={{ padding: '14px 16px 10px', backgroundColor: '#fff', borderBottom: '1px solid #E9ECEF' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: '#F3F4F6', borderRadius: 12, padding: '10px 14px',
              border: '1.5px solid transparent',
            }}
              onFocus={() => {}}
            >
              <Search size={16} color="#9CA3AF" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto o código de barras…"
                style={{
                  flex: 1, border: 'none', background: 'none', outline: 'none',
                  fontSize: '0.88rem', color: '#111827',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={14} color="#9CA3AF" />
                </button>
              )}
              <div style={{ width: 1, height: 18, backgroundColor: '#D1D5DB' }} />
              <ScanLine size={16} color={ORANGE} style={{ cursor: 'pointer' }} title="Escanear código" />
            </div>
          </div>

          {/* Category pills */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 16px',
            overflowX: 'auto', backgroundColor: '#fff',
            borderBottom: '1px solid #E9ECEF', flexShrink: 0,
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  backgroundColor: category === cat.id ? ORANGE : '#F3F4F6',
                  color: category === cat.id ? '#fff' : '#374151',
                  fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.12s', flexShrink: 0,
                }}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: '700' }}>Sin resultados</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 10,
              }}>
                {filtered.map(product => {
                  const inCart = cart.find(i => i.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      style={{
                        backgroundColor: '#fff', border: inCart ? `2px solid ${ORANGE}` : '1.5px solid #E5E7EB',
                        borderRadius: 12, padding: '12px 10px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.12s',
                        boxShadow: inCart ? `0 0 0 3px ${ORANGE}20` : '0 1px 4px rgba(0,0,0,0.05)',
                        position: 'relative',
                      }}
                      onMouseEnter={e => {
                        if (!inCart) (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        if (!inCart) (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Badge cantidad si está en carrito */}
                      {inCart && (
                        <div style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: ORANGE, color: '#fff',
                          fontSize: '0.65rem', fontWeight: '800',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {inCart.qty}
                        </div>
                      )}
                      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{product.emoji}</div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: '700', color: '#111827', lineHeight: 1.3 }}>
                        {product.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 6 }}>
                        {product.code}
                      </p>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: ORANGE }}>
                        ${fmt(product.price)}
                        <span style={{ fontSize: '0.62rem', fontWeight: '500', color: '#9CA3AF', marginLeft: 3 }}>/{product.unit}</span>
                      </p>
                      {product.stock <= 10 && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.62rem', color: '#F59E0B', fontWeight: '700' }}>
                          ⚠ Stock: {product.stock}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ PANEL DERECHO: Ticket + Cobro ══════════════ */}
        <div style={{
          width: 420, display: 'flex', flexDirection: 'column',
          backgroundColor: '#fff', overflow: 'hidden', flexShrink: 0,
        }}>

          {/* Header del ticket */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #E9ECEF',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ShoppingCart size={18} color={ORANGE} />
            <span style={{ fontWeight: '800', color: '#111827', flex: 1 }}>
              Ticket #{ticketNo}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: '600' }}>
              {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
            </span>
            {cart.length > 0 && (
              <button
                onClick={() => { setCart([]); setSelectedItemId(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 4 }}
                title="Vaciar carrito"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Cliente */}
          <div style={{ borderBottom: '1px solid #E9ECEF' }}>
            {showCustomer ? (
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <User size={14} color="#9CA3AF" />
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente…"
                  autoFocus
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: '0.82rem', color: '#111827',
                  }}
                />
                <button onClick={() => setShowCustomer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Check size={14} color={ORANGE} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomer(true)}
                style={{
                  width: '100%', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: customerName ? '#111827' : '#9CA3AF',
                  fontSize: '0.78rem', fontWeight: customerName ? '700' : '500',
                  textAlign: 'left',
                }}
              >
                <User size={13} color={customerName ? ORANGE : '#9CA3AF'} />
                {customerName || 'Cliente anónimo — Toca para asignar'}
                <ChevronDown size={12} style={{ marginLeft: 'auto', color: '#9CA3AF' }} />
              </button>
            )}
          </div>

          {/* Lista de items */}
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#D1D5DB' }}>
                <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '600' }}>Carrito vacío</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.72rem' }}>Seleccioná productos</p>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {cart.map(item => {
                  const lineTotal = item.product.price * item.qty * (1 - item.discount / 100);
                  const isSelected = selectedItemId === item.product.id;
                  return (
                    <div
                      key={item.product.id}
                      onClick={() => { setSelectedItemId(item.product.id); setNumBuffer(''); setNumMode('qty'); }}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: isSelected ? `${ORANGE}08` : 'transparent',
                        borderLeft: isSelected ? `3px solid ${ORANGE}` : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 0.1s',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.product.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.product.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            {/* Qty controls */}
                            <button
                              onClick={e => { e.stopPropagation(); setCart(p => p.map(i => i.product.id === item.product.id ? { ...i, qty: Math.max(0.5, i.qty - 1) } : i)); }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={11} color="#374151" />
                            </button>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', minWidth: 28, textAlign: 'center', color: '#111' }}>
                              {item.qty}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); setCart(p => p.map(i => i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i)); }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={11} color="#374151" />
                            </button>
                            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                              × ${fmt(item.product.price)}
                            </span>
                            {item.discount > 0 && (
                              <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#EF4444', backgroundColor: '#FEF2F2', padding: '1px 5px', borderRadius: 4 }}>
                                −{item.discount}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#111' }}>
                            ${fmt(lineTotal)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); removeItem(item.product.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#EF4444', padding: 0, opacity: 0.6 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Teclado numérico ── */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #E9ECEF', backgroundColor: '#F9FAFB' }}>
            {/* Modo selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {(['qty', 'discount', 'cash'] as const).map(mode => {
                const icons = { qty: <Tag size={11} />, discount: <Percent size={11} />, cash: <Banknote size={11} /> };
                const labels = { qty: 'Cantidad', discount: 'Desc. ítem', cash: 'Efectivo' };
                return (
                  <button
                    key={mode}
                    onClick={() => { setNumMode(mode); setNumBuffer(''); }}
                    style={{
                      flex: 1, padding: '5px 4px', borderRadius: 7,
                      border: numMode === mode ? `1.5px solid ${ORANGE}` : '1.5px solid #E5E7EB',
                      backgroundColor: numMode === mode ? ORANGE_LIGHT : '#fff',
                      color: numMode === mode ? ORANGE : '#6B7280',
                      fontWeight: '700', fontSize: '0.65rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    }}
                  >
                    {icons[mode]} {labels[mode]}
                  </button>
                );
              })}
            </div>

            {/* Display */}
            <div style={{
              backgroundColor: '#1A1A2E', borderRadius: 8,
              padding: '8px 14px', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                {numMode === 'qty' ? 'CANT.' : numMode === 'discount' ? 'DESC. %' : 'EFECTIVO $'}
                {numMode !== 'cash' && selectedItem ? ` · ${selectedItem.product.name.slice(0, 20)}` : ''}
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#fff', letterSpacing: '0.05em' }}>
                {numMode === 'cash'
                  ? (cashReceived || '0.00')
                  : (numBuffer || (numMode === 'qty' ? (selectedItem?.qty ?? '—') : (selectedItem?.discount ?? '0')))}
              </span>
            </div>

            {/* Grid de teclas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {['7','8','9','4','5','6','1','2','3'].map(n => (
                <Kbd key={n} label={n} onPress={() => handleNum(n)} />
              ))}
              <Kbd label="." onPress={() => handleNum('.')} color="#9CA3AF" />
              <Kbd label="0" onPress={() => handleNum('0')} />
              <Kbd label="⌫" onPress={() => handleNum('⌫')} color="#EF4444" />
              <Kbd label="C" onPress={() => handleNum('C')} color="#9CA3AF" />
              <Kbd label="✓" onPress={applyBuffer} color={ORANGE} flex={2} fontSize="1rem" />
            </div>
          </div>

          {/* ── Totales ── */}
          <div style={{ padding: '12px 16px', borderTop: '2px solid #E9ECEF', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Subtotal</span>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#111' }}>${fmt(subtotal)}</span>
            </div>

            {/* Descuento global */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Desc. general</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      onClick={() => setGlobalDiscount(d)}
                      style={{
                        padding: '2px 6px', borderRadius: 5, border: 'none',
                        backgroundColor: globalDiscount === d ? ORANGE : '#F3F4F6',
                        color: globalDiscount === d ? '#fff' : '#6B7280',
                        fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>
              {globalDiscount > 0 && (
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#EF4444' }}>
                  −${fmt(discountAmt)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '2px solid #E9ECEF' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111' }}>TOTAL</span>
              <span style={{ fontSize: '1.6rem', fontWeight: '900', color: ORANGE }}>${fmt(totalFinal)}</span>
            </div>
          </div>

          {/* ── Método de pago ── */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #E9ECEF', backgroundColor: '#F9FAFB' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as PaymentMethodId)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 9,
                    border: paymentMethod === m.id ? `2px solid ${m.color}` : '1.5px solid #E5E7EB',
                    backgroundColor: paymentMethod === m.id ? `${m.color}12` : '#fff',
                    color: paymentMethod === m.id ? m.color : '#9CA3AF',
                    cursor: 'pointer', transition: 'all 0.12s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <m.icon size={16} />
                  <span style={{ fontSize: '0.58rem', fontWeight: '700', lineHeight: 1 }}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Vuelto si es efectivo */}
            {paymentMethod === 'efectivo' && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', whiteSpace: 'nowrap' }}>Recibido $</span>
                <div style={{
                  flex: 1, backgroundColor: '#fff', border: '1.5px solid #E5E7EB',
                  borderRadius: 8, padding: '5px 10px', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#111' }}>
                    {cashReceived || '—'}
                  </span>
                  {cashReceived && parseFloat(cashReceived) > totalFinal && (
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10B981' }}>
                      Vuelto: ${fmt(change)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setNumMode('cash'); setCashReceived(fmt(totalFinal).replace(',', '').replace('.', '')); }}
                  style={{
                    padding: '5px 8px', borderRadius: 7,
                    border: '1px solid #E5E7EB', backgroundColor: '#fff',
                    fontSize: '0.65rem', fontWeight: '700', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Exacto
                </button>
              </div>
            )}
          </div>

          {/* ── Botón COBRAR ── */}
          <div style={{ padding: '12px 14px', borderTop: '2px solid #E9ECEF' }}>
            <button
              onClick={handleCobrar}
              disabled={cart.length === 0}
              style={{
                width: '100%', padding: '16px',
                borderRadius: 14, border: 'none',
                background: cart.length > 0
                  ? `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`
                  : '#E5E7EB',
                color: cart.length > 0 ? '#fff' : '#9CA3AF',
                fontSize: '1.05rem', fontWeight: '900', cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.03em', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: cart.length > 0 ? `0 4px 20px ${ORANGE}50` : 'none',
              }}
              onMouseEnter={e => { if (cart.length > 0) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <CircleDollarSign size={20} />
              COBRAR ${fmt(totalFinal)}
              <ChevronRight size={18} />
            </button>
          </div>

        </div>{/* fin panel derecho */}
      </div>{/* fin body */}
    </div>
  );
}
