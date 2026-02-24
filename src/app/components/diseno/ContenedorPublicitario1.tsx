/* =====================================================
   Componente de Diseño: Contenedor Publicitario 1
   (Hero con frase y carrusel)
   Extraído de OddyStorefront para uso en módulo Diseño
   ===================================================== */

import React, { useRef, useEffect } from 'react';
import '../../../styles/oddy.css';

// Datos de ejemplo
const IMG_IPHONE = 'https://images.unsplash.com/photo-1635425730507-26c324aadbc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
const IMG_MACBOOK = 'https://images.unsplash.com/photo-1574529395396-21637c4cf5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
const IMG_BIKE = 'https://images.unsplash.com/photo-1571081790807-6933479d240f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
const IMG_SONY = 'https://images.unsplash.com/photo-1764557159396-419b85356035?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
const IMG_WEIGHTS = 'https://images.unsplash.com/photo-1710746904729-f3ad9f682bb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';
const IMG_CHAIR = 'https://images.unsplash.com/photo-1528045535275-50e5d46dbae8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';

const SH = [
  { id: 10, img: IMG_IPHONE, n: 'iPhone 13 128GB' },
  { id: 11, img: IMG_MACBOOK, n: 'MacBook Air M1' },
  { id: 12, img: IMG_BIKE, n: 'Bicicleta mtb Rod 29' },
  { id: 13, img: IMG_SONY, n: 'Sony WH-1000XM4' },
  { id: 14, img: IMG_WEIGHTS, n: 'Pesas ajustables 20kg' },
  { id: 15, img: IMG_CHAIR, n: 'Sillón reclinable' },
];

const MP = [
  { id: 1, img: 'https://images.unsplash.com/photo-1574682592200-948fd815c4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', n: 'Funda iPhone 15' },
  { id: 2, img: 'https://images.unsplash.com/photo-1762553159827-7a5d2167b55d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', n: 'Auriculares TWS' },
  { id: 3, img: 'https://images.unsplash.com/photo-1768875845344-5663fa9acf15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', n: 'Set organizadores' },
];

export function ContenedorPublicitario1({ isSH = false }: { isSH?: boolean }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Animación del carrusel infinito
  useEffect(() => {
    if (!carouselRef.current) return;
    
    const carousel = carouselRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;
    
    const itemsPerSet = isSH ? MP.length : SH.length;
    const itemWidth = 70;
    const gap = 8;
    const setWidth = itemsPerSet * (itemWidth + gap);
    
    const animate = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= setWidth) {
        scrollPosition = 0;
      }
      carousel.scrollLeft = scrollPosition;
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isSH]);

  const products = isSH ? MP : SH;

  return (
    <div data-sh={isSH ? 'true' : 'false'}>
      <div className="oddy-hero">
        <div className="oddy-hero-in">
          {!isSH && (
            <p className="oddy-hsub" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(32px, 8vw, 48px)', lineHeight: '1.1', marginBottom: '16px', maxWidth: '90%', color: '#333' }}>
              Todo lo que necesitas lo <span style={{ color: '#FF6835' }}>encontras</span> en Oddy Market. Ya encontraste donde <span style={{ color: '#6BB87A' }}>vender</span> aquello que ya no necesitas.
            </p>
          )}
          {isSH && (
            <p className="oddy-hsub" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(32px, 8vw, 48px)', lineHeight: '1.1', marginBottom: '16px', maxWidth: '90%', color: '#333' }}>
              Aquí podrás <span style={{ color: '#6BB87A' }}>vender</span> lo que ya no necesitas y podrás <span style={{ color: '#FF6835' }}>comprar</span>, lo que no encontrabas.
            </p>
          )}
        </div>
        <div ref={carouselRef} className="oddy-hstats" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start', padding: '0 0 10px 0', overflowX: 'hidden', scrollbarWidth: 'none', WebkitScrollbar: { display: 'none' }, width: '100%', marginLeft: '-18px', marginRight: '-18px', paddingLeft: '18px', paddingRight: '18px' }}>
          {Array(10).fill(null).flatMap(() => products).map((p, idx) => (
            <div key={`${p.id}-${idx}`} style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '1.5px solid rgba(255,255,255,0.3)',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img 
                src={p.img} 
                alt={p.n}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
