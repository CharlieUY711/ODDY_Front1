/* =====================================================
   Componente de Diseño: Barra 1 (Topbar con buscador)
   Extraído de OddyStorefront para uso en módulo Diseño
   ===================================================== */

import React from 'react';
import '../../../styles/oddy.css';

const IconHome = () => <svg className="oddy-nico" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
const IconSrchSm = () => <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconBell = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconBag = () => <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

export function Barra1Topbar({ isSH = false }: { isSH?: boolean }) {
  return (
    <div data-sh={isSH ? 'true' : 'false'}>
      <header className="oddy-tb">
        {/* ── LOGO ── */}
        <div className="oddy-logo-header">
          <svg viewBox="0 0 200 120" width="70" height="60" style={{ display: 'block' }}>
            <g fill="none" stroke={isSH ? '#FF6835' : '#00C4DC'} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 5)">
              <path d="M 100 10 L 130 25 L 130 55 L 100 70 L 70 55 L 70 25 Z" />
              <path d="M 70 55 L 100 70 L 100 100 L 70 115 L 40 100 L 40 70 Z" />
              <path d="M 130 55 L 160 70 L 160 100 L 130 115 L 100 100 L 100 70 Z" />
            </g>
          </svg>
          <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '32px', fontWeight: 'bold', color: isSH ? '#FF6835' : '#00C4DC', marginLeft: '0px', display: 'flex', alignItems: 'flex-end', paddingBottom: '10px', lineHeight: '1' }}>ODDY</span>
        </div>
        <div className="oddy-topbar-group">
          <IconHome />
          {isSH ? (
            <button className="oddy-secondhand-btn" onClick={() => {}}>MARKET</button>
          ) : (
            <button className="oddy-secondhand-btn oddy-secondhand-btn-green" onClick={() => {}}>Second Hand</button>
          )}
          <div className="oddy-srch" style={{ marginLeft: '20px' }}>
            <IconSrchSm />
            <input type="text" placeholder="encontra lo que buscas" />
          </div>
          <div className="oddy-bell-icon">
            <IconBell />
          </div>
          <div className="oddy-auth-buttons">
            <button className="oddy-auth-btn">Mi cuenta</button>
            <button className="oddy-auth-btn">Registro</button>
          </div>
          <div className="oddy-cart-icon">
            <IconBag />
          </div>
        </div>
      </header>
    </div>
  );
}
