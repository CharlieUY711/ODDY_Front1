/* =====================================================
   MetaMapVerification — KYC al cierre de compra
   Se activa cuando el carrito tiene productos +18
   Nivel 1: UI/UX completo + hooks para SDK real
   =====================================================
   Para conectar el SDK real de MetaMap:
   1. Agregar en index.html:
      <script src="https://websdk.getmati.com/v2/index.js"></script>
   2. Reemplazar la simulación por:
      window.MetamapSdk.show({
        clientId: METAMAP_CLIENT_ID,
        flowId:   METAMAP_FLOW_ID,
        metadata: { userId, orderNumber },
      });
   ===================================================== */
import React, { useState, useEffect } from 'react';
import { Shield, Camera, FileText, CheckCircle, X, Loader, Lock, AlertTriangle, ChevronRight, Smartphone } from 'lucide-react';

const ORANGE = '#FF6835';

interface Props {
  isOpen: boolean;
  orderNumber: string;
  restrictedItems: string[];         // nombres de productos +18 en el carrito
  onVerified: () => void;
  onClose: () => void;
}

type KycStep = 'intro' | 'document' | 'selfie' | 'processing' | 'success' | 'error';

interface StepConfig {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}

const STEPS: Record<KycStep, StepConfig> = {
  intro:      { icon: Shield,      title: 'Verificación de identidad',       subtitle: 'Requerida para productos con restricción de edad', color: ORANGE     },
  document:   { icon: FileText,    title: 'Documento de identidad',           subtitle: 'DNI, Cédula, Pasaporte o Licencia',              color: '#3B82F6'  },
  selfie:     { icon: Camera,      title: 'Verificación facial',              subtitle: 'Selfie con detección de vida',                   color: '#8B5CF6'  },
  processing: { icon: Loader,      title: 'Verificando...',                   subtitle: 'MetaMap está procesando tu identidad',           color: '#F59E0B'  },
  success:    { icon: CheckCircle, title: '¡Identidad verificada!',           subtitle: 'Podés completar tu compra',                      color: '#10B981'  },
  error:      { icon: AlertTriangle,'title': 'Verificación fallida',          subtitle: 'No pudimos confirmar tu identidad',              color: '#EF4444'  },
};

/* ── Documento simulation ── */
function DocumentStep({ onNext }: { onNext: () => void }) {
  const [uploaded, setUploaded] = useState<'none' | 'front' | 'both'>('none');
  const [simulating, setSimulating] = useState(false);

  const handleUpload = (side: 'front' | 'back') => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setUploaded(side === 'front' ? 'front' : 'both');
    }, 900);
  };

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5 }}>
        Tomá una foto clara de tu documento de identidad. Asegurate de que los datos sean legibles y esté dentro del marco.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {[
          { side: 'front' as const, label: 'Frente del documento', done: uploaded !== 'none', emoji: '🪪' },
          { side: 'back'  as const, label: 'Dorso del documento',   done: uploaded === 'both', emoji: '🔄' },
        ].map(({ side, label, done, emoji }) => (
          <button
            key={side}
            onClick={() => handleUpload(side)}
            disabled={simulating || (side === 'back' && uploaded === 'none')}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px 18px', borderRadius: '12px',
              border: `2px solid ${done ? '#10B981' : side === 'back' && uploaded === 'none' ? '#E5E7EB' : '#3B82F6'}`,
              backgroundColor: done ? '#F0FDF4' : side === 'back' && uploaded === 'none' ? '#F9FAFB' : '#EFF6FF',
              cursor: simulating || (side === 'back' && uploaded === 'none') ? 'not-allowed' : 'pointer',
              opacity: side === 'back' && uploaded === 'none' ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{done ? '✅' : emoji}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: '700', color: done ? '#059669' : '#111827' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>
                {done ? 'Cargado correctamente' : 'Click para simular carga'}
              </p>
            </div>
            {!done && !simulating && <Camera size={18} color='#6B7280' />}
            {simulating && <Loader size={18} color={ORANGE} style={{ animation: 'spin 1s linear infinite' }} />}
          </button>
        ))}
      </div>

      {/* Países soportados */}
      <div style={{ padding: '12px 14px', backgroundColor: '#F8F9FA', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Documentos aceptados
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['🇺🇾 Cédula UY', '🇦🇷 DNI AR', '🇲🇽 INE MX', '🇨🇱 RUT CL', '🇧🇷 RG BR', '🌐 Pasaporte'].map(doc => (
            <span key={doc} style={{ fontSize: '0.72rem', padding: '3px 9px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E5E7EB', color: '#374151' }}>
              {doc}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={uploaded !== 'both'}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          backgroundColor: uploaded === 'both' ? '#3B82F6' : '#E5E7EB',
          color: uploaded === 'both' ? '#fff' : '#9CA3AF',
          fontSize: '0.9rem', fontWeight: '800',
          cursor: uploaded === 'both' ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        Continuar con selfie →
      </button>
    </div>
  );
}

/* ── Selfie simulation ── */
function SelfieStep({ onNext }: { onNext: () => void }) {
  const [state, setState] = useState<'idle' | 'scanning' | 'done'>('idle');

  const handleScan = () => {
    setState('scanning');
    setTimeout(() => setState('done'), 2000);
  };

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5 }}>
        Vamos a tomar una selfie para comparar con tu documento. Asegurate de estar en un lugar bien iluminado.
      </p>

      {/* Cámara simulada */}
      <div style={{
        height: '200px', borderRadius: '14px', marginBottom: '20px',
        background: state === 'done'
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '12px', border: `2px solid ${state === 'done' ? '#10B981' : '#374151'}`,
        position: 'relative', overflow: 'hidden', cursor: state === 'idle' ? 'pointer' : 'default',
        transition: 'all 0.3s',
      }} onClick={state === 'idle' ? handleScan : undefined}>

        {state === 'scanning' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#8B5CF6', animation: 'scanLine 1.5s ease-in-out infinite', borderRadius: '2px' }} />
        )}

        {state === 'idle' && (
          <>
            <Camera size={40} color='rgba(255,255,255,0.4)' />
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Click para activar cámara</p>
          </>
        )}
        {state === 'scanning' && (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1s ease-in-out infinite' }}>
              <Camera size={32} color='#8B5CF6' />
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Detectando rostro...</p>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle size={48} color='#fff' />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: '800' }}>✓ Rostro detectado</p>
          </>
        )}
      </div>

      {/* Instrucciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { ok: state !== 'idle', text: 'Mirá directo a la cámara' },
          { ok: state !== 'idle', text: 'Buena iluminación frontal' },
          { ok: state === 'done', text: 'Liveness check completado' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: item.ok ? '#D1FAE5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '10px' }}>{item.ok ? '✓' : '·'}</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: item.ok ? '#059669' : '#9CA3AF' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={state !== 'done'}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          backgroundColor: state === 'done' ? '#8B5CF6' : '#E5E7EB',
          color: state === 'done' ? '#fff' : '#9CA3AF',
          fontSize: '0.9rem', fontWeight: '800',
          cursor: state === 'done' ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        Enviar verificación →
      </button>

      <style>{`
        @keyframes scanLine { 0%,100% { top: 0 } 50% { top: calc(100% - 3px) } }
        @keyframes pulse    { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
      `}</style>
    </div>
  );
}

/* ── Componente principal ── */
export function MetaMapVerification({ isOpen, orderNumber, restrictedItems, onVerified, onClose }: Props) {
  const [step, setStep] = useState<KycStep>('intro');

  useEffect(() => {
    if (!isOpen) setTimeout(() => setStep('intro'), 300);
  }, [isOpen]);

  const handleProcessing = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      // Guardar verificación MetaMap en localStorage (persiste 90 días)
      localStorage.setItem('charlie-metamap-kyc', JSON.stringify({
        verified: true, method: 'metamap', ts: Date.now(),
        expires: Date.now() + 90 * 24 * 60 * 60 * 1000,
        orderNumber,
      }));
      setTimeout(() => { onVerified(); setStep('intro'); }, 1600);
    }, 2400);
  };

  if (!isOpen) return null;

  const cfg = STEPS[step];
  const CfgIcon = cfg.icon;

  const progressSteps: { id: KycStep; label: string }[] = [
    { id: 'intro',    label: 'Inicio'    },
    { id: 'document', label: 'Documento' },
    { id: 'selfie',   label: 'Selfie'    },
    { id: 'success',  label: 'Listo'     },
  ];
  const progressIdx = progressSteps.findIndex(s => s.id === step);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 28px 100px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', animation: 'ageGateIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}cc 100%)`, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', transition: 'background 0.3s' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CfgIcon size={22} color='#fff' style={step === 'processing' ? { animation: 'spin 1s linear infinite' } : undefined} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#fff' }}>{cfg.title}</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{cfg.subtitle}</p>
          </div>
          {step === 'intro' && (
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={15} color='#fff' />
            </button>
          )}
        </div>

        {/* Progress bar */}
        {!['processing','success','error'].includes(step) && (
          <div style={{ display: 'flex', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {progressSteps.map((s, i) => {
              const done    = i < progressIdx;
              const current = i === progressIdx;
              return (
                <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', borderBottom: current ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: done ? '#10B981' : current ? ORANGE : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700', marginBottom: 4 }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: current ? ORANGE : done ? '#10B981' : '#9CA3AF', fontWeight: current ? '700' : '400' }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* MetaMap branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: '#F3F4F6', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
              <Shield size={13} color='#6B7280' />
              <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: '700' }}>Verificado por</span>
              <span style={{ fontSize: '0.78rem', color: '#1A1A2E', fontWeight: '900' }}>MetaMap</span>
            </div>
          </div>

          {/* Intro */}
          {step === 'intro' && (
            <>
              <div style={{ padding: '14px', backgroundColor: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: '700', color: '#92400E' }}>Productos con restricción de edad en tu carrito:</p>
                <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                  {restrictedItems.map(item => (
                    <li key={item} style={{ fontSize: '0.78rem', color: '#92400E', marginBottom: '2px' }}>🔞 {item}</li>
                  ))}
                </ul>
              </div>

              <p style={{ margin: '0 0 20px', fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.6 }}>
                Para completar la compra necesitamos verificar tu identidad de forma segura. Solo tomará 2 minutos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { icon: FileText,    text: 'Foto de tu documento de identidad' },
                  { icon: Camera,      text: 'Selfie con detección de vida'        },
                  { icon: Lock,        text: 'Datos encriptados y no almacenados'  },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: `${ORANGE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={ORANGE} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#374151' }}>{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('document')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: ORANGE, color: '#fff', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Shield size={16} /> Comenzar verificación
              </button>

              <p style={{ margin: '12px 0 0', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center' }}>
                Usamos MetaMap · Solo verificamos que sos mayor de 18 años
              </p>
            </>
          )}

          {step === 'document'   && <DocumentStep onNext={() => setStep('selfie')} />}
          {step === 'selfie'     && <SelfieStep   onNext={handleProcessing}        />}

          {/* Processing */}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `3px solid ${ORANGE}30` }}>
                <Loader size={36} color={ORANGE} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>Verificando tu identidad</p>
              <p style={{ margin: '0 0 24px', fontSize: '0.82rem', color: '#9CA3AF', lineHeight: 1.5 }}>MetaMap está comparando tu documento con la selfie. Esto tarda unos segundos...</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Analizando documento...', 'Comparando con selfie...', 'Validando edad...'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                    <Loader size={12} color={ORANGE} style={{ animation: `spin ${0.8 + i * 0.2}s linear infinite` }} />
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={64} color='#10B981' style={{ margin: '0 auto 20px' }} />
              <p style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '900', color: '#111827' }}>¡Identidad verificada!</p>
              <p style={{ margin: '0 0 20px', fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.5 }}>
                Tu verificación fue exitosa. Procesando tu pago...
              </p>
              <div style={{ padding: '12px 14px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #D1FAE5' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#059669' }}>
                  ✓ Verificación válida por 90 días · No necesitarás verificarte nuevamente
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin       { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes ageGateIn  { from { opacity: 0; transform: scale(0.94) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}

/* ── Helper: chequea si el KYC de MetaMap está vigente ── */
export function isMetamapVerified(): boolean {
  try {
    const raw = localStorage.getItem('charlie-metamap-kyc');
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d.verified) return false;
    if (Date.now() > d.expires) { localStorage.removeItem('charlie-metamap-kyc'); return false; }
    return true;
  } catch { return false; }
}
