/* =====================================================
   Componente de Diseño: Tarjeta 2 de Second Hand (expandida)
   Extraído de OddyStorefront para uso en módulo Diseño
   ===================================================== */

import React from 'react';
import '../../../styles/oddy.css';

const separatePrice = (price: string) => {
  if (!price) return price;
  const dollarIndex = price.indexOf('$');
  if (dollarIndex !== -1) {
    const before = price.substring(0, dollarIndex).trim();
    const after = price.substring(dollarIndex + 1).trim();
    return <>{before ? before + ' ' : ''}$ {after}</>;
  }
  return price;
};

const DEPT_COLORS: Record<string, string> = {
  'Celulares': '#F5DEB3',
};

const IconCart = () => <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;

// Producto de ejemplo
const exampleProduct = {
  id: 10,
  img: 'https://images.unsplash.com/photo-1635425730507-26c324aadbc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  d: 'Celulares',
  n: 'iPhone 13 128GB · Muy bueno',
  p: '$11.500',
  og: 'Nuevo $18.000',
  desc: 'Batería 91% (verificado). Sin rayones en pantalla ni cuerpo. Con caja original, cargador y funda.',
  r: 4.8,
  rv: 12,
  publishedDate: '16/01/2025',
};

export function TarjetaSecondHand2() {
  return (
    <div className="oddy-card-slot" style={{ width: '200px', height: '300px' }}>
      <div className="oddy-sc">
        <div className="oddy-eb">
          <img className="oddy-ghost-img" src={exampleProduct.img} alt="" aria-hidden="true" />
          <div className="oddy-eb-content">
            {/* Miniaturas */}
            <div className="oddy-panel-miniatures" style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              {[exampleProduct.img, null, null, null, null].map((img, idx) => (
                <div key={idx} style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: idx === 0 ? '2px solid #6BB87A' : '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: img ? 1 : 0.3, backgroundColor: img ? 'transparent' : 'rgba(255,255,255,0.1)' }}>
                  {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
              ))}
            </div>
            {/* Barra de color del departamento */}
            <div style={{ width: 'calc(100% + 16px)', height: '10px', backgroundColor: DEPT_COLORS[exampleProduct.d] || '#C8C4BE', marginLeft: '-8px', marginRight: '-8px', marginBottom: '12px' }}></div>
            {/* Información igual a la primera tarjeta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                <div className="oddy-cdept">{exampleProduct.d}</div>
                {exampleProduct.og && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 400, color: 'var(--muted)', textDecoration: 'line-through' }}>{separatePrice(exampleProduct.og)}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                <div className="oddy-cname">{exampleProduct.n}</div>
                <div className="oddy-cprice" style={{ flexShrink: 0, textAlign: 'right' }}>{separatePrice(exampleProduct.p)}</div>
              </div>
            </div>
            <div className="oddy-panel-desc">{exampleProduct.desc}</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '5px', width: '100%' }}>
              <button className="oddy-panel-btn-white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700 }}>{exampleProduct.r.toFixed(1)}</span>
              </button>
              <button className="oddy-panel-btn-white" style={{ flexDirection: 'column', gap: '2px', padding: '5px 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, lineHeight: '1.2' }}>{exampleProduct.rv} visitas</span>
                <span style={{ fontSize: '8px', fontWeight: 400, color: 'var(--muted)', lineHeight: '1.2' }}>{exampleProduct.publishedDate}</span>
              </button>
              <button className="oddy-fb-add" style={{ background: '#6BB87A', flex: 2 }}>
                <IconCart />Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
