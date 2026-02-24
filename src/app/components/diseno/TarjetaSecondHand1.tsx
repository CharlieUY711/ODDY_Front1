/* =====================================================
   Componente de Diseño: Tarjeta 1 de Second Hand
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
  'Electro': '#DDA0DD',
  'Deporte': '#D8BFD8',
};

// Producto de ejemplo
const exampleProduct = {
  id: 10,
  img: 'https://images.unsplash.com/photo-1635425730507-26c324aadbc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  d: 'Celulares',
  n: 'iPhone 13 128GB · Muy bueno',
  p: '$11.500',
  og: 'Nuevo $18.000',
  c: 4,
};

export function TarjetaSecondHand1() {
  return (
    <div className="oddy-card-slot" style={{ width: '200px', height: '300px' }}>
      <div className="oddy-sc">
        <div className="oddy-sf">
          <div className="oddy-simg" style={{ borderBottomColor: DEPT_COLORS[exampleProduct.d] || '#C8C4BE' }}>
            <img src={exampleProduct.img} alt={exampleProduct.n} />
            <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i <= exampleProduct.c ? '#6BB87A' : '#C8C4BE' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="oddy-ebody">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', paddingTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                <div className="oddy-cdept">{exampleProduct.d}</div>
                {exampleProduct.og && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 400, color: 'var(--muted)', textDecoration: 'line-through' }}>{separatePrice(exampleProduct.og)}</span>}
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
  );
}
