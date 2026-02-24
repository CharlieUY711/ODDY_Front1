/* =====================================================
   Componente de Diseño: Tarjeta de artículo 1 de Market
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
  'Electro': '#DDA0DD',
  'Moda': '#FFB6C1',
  'Hogar': '#FFDAB9',
  'Celulares': '#F5DEB3',
};

// Producto de ejemplo
const exampleProduct = {
  id: 1,
  img: 'https://images.unsplash.com/photo-1574682592200-948fd815c4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  d: 'Celulares',
  n: 'Funda iPhone 15 silicona premium',
  p: '$472',
  o: '$590',
  r: 4.3,
};

export function TarjetaMarket1() {
  return (
    <div className="oddy-card-slot" style={{ width: '200px', height: '300px' }}>
      <div className="oddy-fc">
        <div className="oddy-fi">
          <div className="oddy-ff">
            <div className="oddy-cimg" style={{ borderBottomColor: DEPT_COLORS[exampleProduct.d] || '#C8C4BE' }}>
              <img src={exampleProduct.img} alt={exampleProduct.n} />
              <div style={{ position: 'absolute', top: '12px', left: '8px', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ color: i <= Math.round(exampleProduct.r) ? '#FFD700' : '#C8C4BE', fontSize: '12px' }}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="oddy-cbody">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', paddingTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                  <div className="oddy-cdept">{exampleProduct.d}</div>
                  {exampleProduct.o && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 400, color: 'var(--muted)', textDecoration: 'line-through' }}>{separatePrice(exampleProduct.o)}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                  <div className="oddy-cname">{exampleProduct.n}</div>
                  <div className="oddy-cprice" style={{ flexShrink: 0, textAlign: 'right' }}>{separatePrice(exampleProduct.p)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
