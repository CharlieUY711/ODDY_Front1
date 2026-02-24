/* =====================================================
   AuthRegistroView — Módulo de Registro y Login
   Configuración + Vista Previa + Test de autenticación
   ===================================================== */
import React, { useState } from 'react';
import {
  LogIn, UserPlus, KeyRound, Eye, EyeOff, Shield, Mail,
  Chrome, Facebook, Github, Check, Settings, Smartphone,
  Lock, AlertCircle, ChevronRight, Users, Activity,
} from 'lucide-react';
import type { MainSection } from '../../../AdminDashboard';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Props { onNavigate: (s: MainSection) => void; }

const ORANGE = '#FF6835';
const sb = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

type AuthScreen = 'login' | 'register' | 'reset';
type Tab = 'preview' | 'config' | 'test';

const PROVIDER_COLORS: Record<string, string> = {
  google:   '#EA4335',
  facebook: '#1877F2',
  github:   '#24292E',
};

export function AuthRegistroView({ onNavigate }: Props) {
  const [tab, setTab]           = useState<Tab>('preview');
  const [screen, setScreen]     = useState<AuthScreen>('login');
  const [showPass, setShowPass] = useState(false);

  // Providers config
  const [emailEnabled, setEmailEnabled]   = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [fbEnabled, setFbEnabled]         = useState(false);
  const [ghEnabled, setGhEnabled]         = useState(false);

  // Password rules
  const [minLen, setMinLen]         = useState(8);
  const [requireUpper, setUpper]    = useState(true);
  const [requireNumber, setNumber]  = useState(true);
  const [requireSymbol, setSymbol]  = useState(false);

  // Branding
  const [appName, setAppName]           = useState('Mi Aplicación');
  const [accentColor, setAccentColor]   = useState(ORANGE);
  const [logoText, setLogoText]         = useState('MA');

  // Test auth
  const [testEmail, setTestEmail]     = useState('');
  const [testPass, setTestPass]       = useState('');
  const [testName, setTestName]       = useState('');
  const [testMode, setTestMode]       = useState<'login' | 'register'>('login');
  const [testResult, setTestResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleTestAuth = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      if (testMode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email: testEmail, password: testPass });
        if (error) throw error;
        setTestResult({ ok: true, msg: '✅ Login exitoso con Supabase Auth' });
      } else {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-75638143/auth/signup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ email: testEmail, password: testPass, name: testName }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrar');
        setTestResult({ ok: true, msg: '✅ Usuario creado exitosamente' });
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: `❌ ${e.message}` });
    } finally {
      setTestLoading(false);
    }
  };

  // ── Preview component ──────────────────────────────────────────────────────
  const AuthPreviewCard = () => (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '32px 28px',
      width: '340px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      border: '1px solid #F3F4F6',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          backgroundColor: accentColor,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '10px',
        }}>
          {logoText}
        </div>
        <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#111' }}>{appName}</p>
        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9CA3AF' }}>
          {screen === 'login' ? 'Ingresá a tu cuenta' : screen === 'register' ? 'Creá tu cuenta' : 'Recuperar contraseña'}
        </p>
      </div>

      {/* Social buttons */}
      {screen !== 'reset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {googleEnabled && (
            <button style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              border: '1.5px solid #E5E7EB', backgroundColor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.82rem', fontWeight: '600', color: '#374151', cursor: 'pointer',
            }}>
              <Chrome size={15} color={PROVIDER_COLORS.google} /> Continuar con Google
            </button>
          )}
          {fbEnabled && (
            <button style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              border: '1.5px solid #E5E7EB', backgroundColor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.82rem', fontWeight: '600', color: '#374151', cursor: 'pointer',
            }}>
              <Facebook size={15} color={PROVIDER_COLORS.facebook} /> Continuar con Facebook
            </button>
          )}
          {ghEnabled && (
            <button style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              border: '1.5px solid #E5E7EB', backgroundColor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.82rem', fontWeight: '600', color: '#374151', cursor: 'pointer',
            }}>
              <Github size={15} color={PROVIDER_COLORS.github} /> Continuar con GitHub
            </button>
          )}
          {emailEnabled && (googleEnabled || fbEnabled || ghEnabled) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
              <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>o con email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            </div>
          )}
        </div>
      )}

      {/* Form fields */}
      {emailEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {screen === 'register' && (
            <input placeholder="Nombre completo" style={{
              padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB',
              fontSize: '0.82rem', color: '#374151', outline: 'none',
            }} />
          )}
          <input placeholder="correo@ejemplo.com" type="email" style={{
            padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB',
            fontSize: '0.82rem', color: '#374151', outline: 'none',
          }} />
          {screen !== 'reset' && (
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Contraseña"
                type={showPass ? 'text' : 'password'}
                style={{
                  width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px',
                  border: '1.5px solid #E5E7EB', fontSize: '0.82rem',
                  color: '#374151', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                {showPass ? <EyeOff size={14} color="#9CA3AF" /> : <Eye size={14} color="#9CA3AF" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <button style={{
        width: '100%', padding: '10px', borderRadius: '9px', border: 'none',
        backgroundColor: accentColor, color: '#fff',
        fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', marginBottom: '14px',
      }}>
        {screen === 'login' ? 'Ingresar' : screen === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
      </button>

      {/* Links */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
        {screen === 'login' && (
          <>
            <button onClick={() => setScreen('reset')} style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
              ¿Olvidaste tu contraseña?
            </button>
            <p style={{ margin: '6px 0 0' }}>
              ¿No tenés cuenta?{' '}
              <button onClick={() => setScreen('register')} style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
                Registrate
              </button>
            </p>
          </>
        )}
        {screen === 'register' && (
          <p style={{ margin: 0 }}>
            ¿Ya tenés cuenta?{' '}
            <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>
              Ingresá
            </button>
          </p>
        )}
        {screen === 'reset' && (
          <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
            ← Volver al login
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>

      {/* Top Bar */}
      <div style={{
        height: '56px', flexShrink: 0, backgroundColor: '#fff',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
      }}>
        <LogIn size={20} color={ORANGE} />
        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111' }}>
          Registro y Login
        </h1>
        <span style={{ fontSize: '0.7rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
          Supabase Auth
        </span>
        <div style={{ flex: 1 }} />
        {(['preview', 'config', 'test'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: '600',
            backgroundColor: tab === t ? ORANGE : 'transparent',
            color: tab === t ? '#fff' : '#6B7280',
          }}>
            {t === 'preview' ? '👁 Vista Previa' : t === 'config' ? '⚙️ Configuración' : '🧪 Test'}
          </button>
        ))}
      </div>

      {/* ── PREVIEW ── */}
      {tab === 'preview' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Screen selector */}
          <div style={{
            width: '200px', flexShrink: 0, backgroundColor: '#fff',
            borderRight: '1px solid #E5E7EB', padding: '20px 14px',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pantallas
            </p>
            {([
              { id: 'login',    label: 'Iniciar Sesión',      icon: LogIn    },
              { id: 'register', label: 'Crear Cuenta',        icon: UserPlus },
              { id: 'reset',    label: 'Recuperar Contraseña', icon: KeyRound },
            ] as const).map(s => (
              <button key={s.id} onClick={() => setScreen(s.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: screen === s.id ? `${ORANGE}15` : 'transparent',
                color: screen === s.id ? ORANGE : '#374151',
                fontSize: '0.8rem', fontWeight: screen === s.id ? '700' : '500',
                marginBottom: '4px',
              }}>
                <s.icon size={14} /> {s.label}
              </button>
            ))}

            <div style={{ marginTop: '24px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
                Providers activos
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {emailEnabled  && <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color={ORANGE} /> Email/Password</div>}
                {googleEnabled && <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><Chrome size={12} color={PROVIDER_COLORS.google} /> Google</div>}
                {fbEnabled     && <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><Facebook size={12} color={PROVIDER_COLORS.facebook} /> Facebook</div>}
                {ghEnabled     && <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><Github size={12} color={PROVIDER_COLORS.github} /> GitHub</div>}
              </div>
            </div>
          </div>

          {/* Preview area */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#F1F5F9', overflowY: 'auto', padding: '40px',
          }}>
            <AuthPreviewCard />
          </div>
        </div>
      )}

      {/* ── CONFIG ── */}
      {tab === 'config' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Branding */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h2 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: '700', color: '#111' }}>🎨 Branding</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre de la app</label>
                  <input value={appName} onChange={e => setAppName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #E5E7EB', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Logo (texto)</label>
                  <input value={logoText} onChange={e => setLogoText(e.target.value.slice(0,3))} maxLength={3} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #E5E7EB', fontSize: '0.82rem', boxSizing: 'border-box', fontWeight: '700' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Color principal</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1.5px solid #E5E7EB', cursor: 'pointer', padding: '2px' }} />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Providers */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h2 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: '700', color: '#111' }}>🔐 Providers de autenticación</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'email',   label: 'Email / Password', icon: Mail,     color: '#374151',                   val: emailEnabled,   set: setEmailEnabled   },
                  { key: 'google',  label: 'Google OAuth',     icon: Chrome,   color: PROVIDER_COLORS.google,      val: googleEnabled,  set: setGoogleEnabled  },
                  { key: 'facebook',label: 'Facebook OAuth',   icon: Facebook, color: PROVIDER_COLORS.facebook,    val: fbEnabled,      set: setFbEnabled      },
                  { key: 'github',  label: 'GitHub OAuth',     icon: Github,   color: PROVIDER_COLORS.github,      val: ghEnabled,      set: setGhEnabled      },
                ].map(p => (
                  <div key={p.key} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    border: `1.5px solid ${p.val ? '#D1FAE5' : '#E5E7EB'}`,
                    backgroundColor: p.val ? '#F0FDF4' : '#FAFAFA',
                  }}>
                    <p.icon size={18} color={p.color} />
                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>{p.label}</span>
                    <button onClick={() => p.set(!p.val)} style={{
                      width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      backgroundColor: p.val ? '#22C55E' : '#D1D5DB', position: 'relative', transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff',
                        position: 'absolute', top: '3px', transition: 'all 0.2s',
                        left: p.val ? '23px' : '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Password rules */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #E5E7EB' }}>
              <h2 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: '700', color: '#111' }}>🔒 Reglas de contraseña</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Longitud mínima: <b>{minLen}</b>
                  </label>
                  <input type="range" min={6} max={20} value={minLen} onChange={e => setMinLen(+e.target.value)}
                    style={{ width: '100%', accentColor: ORANGE }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  {[
                    { label: 'Mayúsculas requeridas', val: requireUpper,  set: setUpper  },
                    { label: 'Números requeridos',    val: requireNumber, set: setNumber },
                    { label: 'Símbolos requeridos',   val: requireSymbol, set: setSymbol },
                  ].map(r => (
                    <label key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>
                      <input type="checkbox" checked={r.val} onChange={e => r.set(e.target.checked)}
                        style={{ accentColor: ORANGE, width: '15px', height: '15px' }} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST ── */}
      {tab === 'test' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '28px', border: '1px solid #E5E7EB' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '700', color: '#111' }}>🧪 Test de Autenticación</h2>
              <p style={{ margin: '0 0 20px', fontSize: '0.78rem', color: '#6B7280' }}>
                Prueba el flujo de auth conectado a Supabase real
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['login', 'register'] as const).map(m => (
                  <button key={m} onClick={() => setTestMode(m)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    backgroundColor: testMode === m ? ORANGE : '#F3F4F6',
                    color: testMode === m ? '#fff' : '#6B7280',
                    fontSize: '0.82rem', fontWeight: '600',
                  }}>
                    {m === 'login' ? 'Iniciar Sesión' : 'Registrar Usuario'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {testMode === 'register' && (
                  <input placeholder="Nombre completo" value={testName} onChange={e => setTestName(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '0.85rem', outline: 'none' }} />
                )}
                <input placeholder="correo@ejemplo.com" type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '0.85rem', outline: 'none' }} />
                <input placeholder="Contraseña" type="password" value={testPass} onChange={e => setTestPass(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '0.85rem', outline: 'none' }} />
                <button onClick={handleTestAuth} disabled={testLoading || !testEmail || !testPass} style={{
                  padding: '11px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  backgroundColor: ORANGE, color: '#fff', fontSize: '0.88rem', fontWeight: '700',
                  opacity: testLoading || !testEmail || !testPass ? 0.6 : 1,
                }}>
                  {testLoading ? 'Procesando...' : testMode === 'login' ? 'Probar Login' : 'Probar Registro'}
                </button>
              </div>

              {testResult && (
                <div style={{
                  marginTop: '16px', padding: '12px 14px', borderRadius: '9px',
                  backgroundColor: testResult.ok ? '#F0FDF4' : '#FEF2F2',
                  border: `1.5px solid ${testResult.ok ? '#86EFAC' : '#FCA5A5'}`,
                  fontSize: '0.82rem', color: testResult.ok ? '#166534' : '#991B1B',
                  fontWeight: '600',
                }}>
                  {testResult.msg}
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', backgroundColor: '#FFF7ED', borderRadius: '12px', padding: '16px 18px', border: '1.5px solid #FED7AA' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <AlertCircle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400E', lineHeight: '1.5' }}>
                  Para OAuth (Google, Facebook, GitHub), activar los providers en el dashboard de Supabase → Authentication → Providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
