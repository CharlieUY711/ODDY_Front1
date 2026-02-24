/* =====================================================
   Componente de Diseño: Barra 2 (Departamentos)
   Extraído de OddyStorefront para uso en módulo Diseño
   ===================================================== */

import React, { useState } from 'react';
import '../../../styles/oddy.css';

const DEPTS = [
  '⚡ Electro','👗 Moda','🏠 Hogar','🛒 Almacén','🐾 Mascotas','🏍️ Motos',
  '🧼 Limpieza','💊 Salud','⚽ Deporte','📱 Celulares','🔧 Ferretería','📚 Librería',
  '🍼 Bebés','🎮 Gaming','🌿 Jardín','🚗 Autos','💄 Belleza','🍕 Delivery',
];

const DEPT_COLORS: Record<string, string> = {
  'Electro': '#DDA0DD',
  'Moda': '#FFB6C1',
  'Hogar': '#FFDAB9',
  'Almacén': '#FFF8DC',
  'Mascotas': '#FA8072',
  'Motos': '#AFEEEE',
  'Limpieza': '#FFE4E1',
  'Salud': '#B0E0E6',
  'Deporte': '#D8BFD8',
  'Celulares': '#F5DEB3',
  'Ferretería': '#F0FFF0',
  'Librería': '#FFFDD0',
  'Bebés': '#E0B0FF',
  'Gaming': '#E6E6FA',
  'Jardín': '#FF7F50',
  'Autos': '#DDA0DD',
  'Belleza': '#FFB6C1',
  'Delivery': '#FFDAB9',
};

export function Barra2Departamentos({ isSH = false }: { isSH?: boolean }) {
  const [activeDept, setActiveDept] = useState(0);

  return (
    <div data-sh={isSH ? 'true' : 'false'}>
      <div className="oddy-dstrip">
        {DEPTS.map((d, i) => {
          const [emoji, ...rest] = d.split(' ');
          const deptName = rest.join(' ');
          const deptColor = DEPT_COLORS[deptName] || (activeDept === i ? (isSH ? '#6BB87A' : '#FF6835') : undefined);
          return (
            <div 
              key={i} 
              className={`oddy-dchip${activeDept === i ? ' on' : ''}`} 
              onClick={() => setActiveDept(i)}
              style={activeDept === i && deptColor ? {
                background: deptColor,
                borderColor: deptColor,
                color: '#000'
              } : undefined}
            >
              <em>{emoji}</em>{deptName}
            </div>
          );
        })}
      </div>
    </div>
  );
}
