/* =====================================================
   AgeGateModal — Verificación de edad (soft check)
   Se activa al intentar acceder a un departamento +18
   ===================================================== */
import React, { useState } from 'react';
import { Lock, Shield, AlertTriangle, CheckCircle, X } from 'lucide-react';

const ORANGE = '#FF6835';

interface Props {
  isOpen: boolean;
  categoryName: string;
  categoryEmoji?: string;
  onVerified: () => void;       // edad OK → permite acceso
  onBlocked: () => void;        // menor de edad → bloquea y cierra
}

type GateState = 'ask' | 'verified' | 'blocked';

function calcAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
}

const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const currentYear = new Date().getFullYear();
const YEARS  = Array.from({ length: 100 }, (_, i) => currentYear - i);

export function AgeGateModal({ isOpen, categoryName, categoryEmoji = '🔞', onVerified, onBlocked }: Props) {
  const [state, setState]   = useState<GateState>('ask');
  const [day,   setDay]     = useState('');
  const [month, setMonth]   = useState('');
  const [year,  setYear]    = useState('');
  const [error, setError]   = useState('');

  if (!isOpen) return null;

  const selectStyle: React.CSSProperties = {
    flex: 1, padding: '12px 10px', borderRadius: '10px',
    border: `1.5px solid ${error ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '0.9rem', color: '#111827', backgroundColor: '#F9FAFB',
    outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%236B7280\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    paddingRight: '28px',
  };

  const handleVerify = () => {
    if (!day || !month || !year) { setError('Completá tu fecha de nacimiento'); return; }
    setError('');
    const age = calcAge(parseInt(day), parseInt(month), parseInt(year));
    if (age < 18) {
      setState('blocked');
      // Guardar bloqueo en sessionStorage para no volver a preguntar en esta sesión
      sessionStorage.setItem('charlie-age-blocked', JSON.stringify({ blocked: true, ts: Date.now() }));
    } else {
      setState('verified');
      sessionStorage.setItem('charlie-age-gate', JSON.stringify({
        verified: true, age, ts: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24hs
      }));
      setTimeout(() => { onVerified(); resetState(); }, 1200);
    }
  };

  const resetState = () => { setState('ask'); setDay(''); setMonth(''); setYear(''); setError(''); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'ageGateIn 0.25s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: state === 'blocked'  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' :
                       state === 'verified' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                       `linear-gradient(135deg, ${ORANGE} 0%, #ff8c42 100%)`,
          padding: '28px 28px 24px',
          textAlign: 'center',
          transition: 'background 0.4s',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px', lineHeight: 1 }}>
            {state === 'blocked' ? '🚫' : state === 'verified' ? '✅' : categoryEmoji}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
            {state === 'blocked'  ? 'Acceso restringido' :
             state === 'verified' ? '¡Bienvenido!' :
             'Verificación de edad'}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
            {state === 'blocked'  ? 'No tenés la edad mínima requerida' :
             state === 'verified' ? 'Edad verificada correctamente' :
             `"${categoryName}" requiere ser mayor de 18 años`}
          </p>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '28px' }}>

          {/* ── Ask state ── */}
          {state === 'ask' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px 14px', backgroundColor: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA' }}>
                <Shield size={15} color={ORANGE} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#92400E', lineHeight: 1.4 }}>
                  Esta sección contiene contenido para adultos. Tu privacidad está protegida.
                </p>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', color: '#1A1A2E' }}>
                ¿Cuándo naciste?
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: error ? '8px' : '20px' }}>
                <select value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
                  <option value="">Día</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...selectStyle, flex: 1.6 }}>
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} style={{ ...selectStyle, flex: 1.4 }}>
                  <option value="">Año</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <AlertTriangle size={13} color='#EF4444' />
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#EF4444' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleVerify}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: ORANGE, border: 'none',
                  borderRadius: '12px', color: '#fff',
                  fontSize: '0.95rem', fontWeight: '800',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                Verificar mi edad
              </button>

              <p style={{ margin: '14px 0 0', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5 }}>
                No guardamos ni compartimos tu fecha de nacimiento.
                Solo verificamos que sos mayor de 18 años.
              </p>
            </>
          )}

          {/* ── Verified state ── */}
          {state === 'verified' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <CheckCircle size={52} color='#10B981' style={{ margin: '0 auto 14px' }} />
              <p style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                ¡Todo en orden!
              </p>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#6B7280' }}>
                Podés navegar en <strong>{categoryName}</strong> sin restricciones.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>
                Redirigiendo...
              </p>
            </div>
          )}

          {/* ── Blocked state ── */}
          {state === 'blocked' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Lock size={48} color='#EF4444' style={{ margin: '0 auto 14px' }} />
              <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                No podés acceder a esta sección
              </p>
              <p style={{ margin: '0 0 24px', fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.5 }}>
                El contenido de <strong>{categoryName}</strong> es exclusivo para
                personas mayores de 18 años.
              </p>
              <button
                onClick={() => { resetState(); onBlocked(); }}
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
                  borderRadius: '12px', color: '#374151',
                  fontSize: '0.9rem', fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Entendido — volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ageGateIn {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Helper: verifica si la sesión tiene la edad OK ── */
export function isAgeVerified(): boolean {
  try {
    const raw = sessionStorage.getItem('charlie-age-gate');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.verified) return false;
    if (Date.now() > data.expires) { sessionStorage.removeItem('charlie-age-gate'); return false; }
    return true;
  } catch { return false; }
}
