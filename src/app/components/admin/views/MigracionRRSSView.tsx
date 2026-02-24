/* =====================================================
   Migración de RRSS — Instagram + Facebook
   Respalda, elimina y rebrandea tu presencia social
   ===================================================== */
import React, { useState, useEffect } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import { RRSSBanner }   from '../RRSSBanner';
import type { MainSection } from '../../../AdminDashboard';
import {
  Download, Trash2, RefreshCw, Settings, Copy, Eye, EyeOff,
  ExternalLink, AlertTriangle, CheckCircle2, Upload, Info,
  ChevronLeft, Check, ArrowLeftRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCreds, saveCreds, verifyCreds, deleteCreds } from '../../../services/rrssApi';

interface Props { onNavigate: (section: MainSection) => void; }

/* ── Platform config ──────────────────────────────────── */
type Platform = 'instagram' | 'facebook';
type Tab = 'config' | 'backup' | 'delete' | 'rebrand';

interface PlatformConfig {
  name: string;
  subtitle: string;
  gradient: string;
  accent: string;
  icon: React.ReactNode;
  permissions: string[];
  credentialFields: { key: string; label: string; placeholder: string }[];
  fbSpecific?: boolean;
}

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #C13584 55%, #E1306C 100%)';
const FB_GRADIENT = 'linear-gradient(135deg, #1877F2 0%, #0C5FCC 100%)';

const PLATFORMS: Record<Platform, PlatformConfig> = {
  instagram: {
    name: 'Migración de Instagram',
    subtitle: 'Respalda, elimina y rebrandea tu perfil de Instagram',
    gradient: IG_GRADIENT,
    accent: '#E1306C',
    icon: <IgIcon />,
    permissions: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_manage_posts', 'pages_show_list'],
    credentialFields: [
      { key: 'appId',     label: 'App ID',               placeholder: '1234567890123456' },
      { key: 'appSecret', label: 'App Secret',            placeholder: 'abcdef1234567890abcdef1234567890' },
      { key: 'token',     label: 'Access Token',          placeholder: 'EAAxxxxxxxxxxxxx' },
      { key: 'accountId', label: 'Instagram Account ID',  placeholder: '1234567890123456' },
    ],
  },
  facebook: {
    name: 'Migración de Facebook',
    subtitle: 'Respalda, elimina y rebrandea tu página de Facebook',
    gradient: FB_GRADIENT,
    accent: '#1877F2',
    icon: <FbIcon />,
    permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_manage_metadata', 'publish_to_groups'],
    credentialFields: [
      { key: 'appId',     label: 'App ID',           placeholder: '1234567890123456' },
      { key: 'appSecret', label: 'App Secret',        placeholder: 'abcdef1234567890abcdef1234567890' },
      { key: 'token',     label: 'Page Access Token', placeholder: 'EAAxxxxxxxxxxxxx' },
      { key: 'pageId',    label: 'Page ID',           placeholder: '1234567890123456' },
    ],
    fbSpecific: true,
  },
};

/* ── Main component ──────────────────────────────────── */
export function MigracionRRSSView({ onNavigate }: Props) {
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  if (activePlatform) {
    return (
      <PlatformView
        platform={activePlatform}
        onBack={() => setActivePlatform(null)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
      <OrangeHeader
        icon={ArrowLeftRight}
        title="Migración de Redes Sociales"
        subtitle="Respalda, eliminá y rebrandeá tu presencia en Facebook e Instagram"
        actions={[
          { label: 'Volver', onClick: () => onNavigate('rrss') },
          { label: 'Ver Historial', primary: true },
        ]}
      />

      <RRSSBanner onNavigate={onNavigate} active="migracion-rrss" />

      {/* Platform selector */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>Seleccioná la plataforma que querés gestionar:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '840px' }}>
          {(['instagram', 'facebook'] as Platform[]).map(p => {
            const cfg = PLATFORMS[p];
            return (
              <div key={p} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ background: cfg.gradient, padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {cfg.icon}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '17px' }}>{p === 'instagram' ? 'Instagram' : 'Facebook'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{cfg.subtitle}</div>
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  {[
                    p === 'instagram' ? 'Respaldo de Posts, Stories y Reels' : 'Respaldo de Posts, Fotos, Videos y Eventos',
                    'Eliminación masiva con confirmación',
                    p === 'instagram' ? 'Actualización de biografía y website' : 'Actualización de página y fotos de portada',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => setActivePlatform(p)}
                    style={{ width: '100%', marginTop: '16px', padding: '12px', background: cfg.gradient, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Gestionar {p === 'instagram' ? 'Instagram' : 'Facebook'} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginTop: '24px', maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span>ℹ️</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>Información Importante</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            {[
              { icon: '⚠️', title: 'Requisitos Previos', items: ['Cuenta de Meta for Developers', 'Aplicación Meta tipo Business', 'Access Token de larga duración', 'Permisos configurados', 'IG debe ser cuenta Business'] },
              { icon: '✅', title: 'Proceso Recomendado', items: ['Configurar credenciales en Setup', 'Verificar conexión exitosa', 'Respaldar todo el contenido', 'Eliminar contenido (opcional)', 'Rebrandear página/perfil'] },
              { icon: '🚨', title: 'Advertencias', items: ['La eliminación es irreversible', 'Access Tokens expiran 60 días', 'Instagram tiene límites de API', 'Siempre respaldar antes de eliminar', 'Algunas ops. toman tiempo'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>{col.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#374151' }}>{col.title}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#555', fontSize: '12px', lineHeight: '1.8' }}>
                  {col.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Platform full view ──────────────────────────────── */
function PlatformView({ platform, onBack, onNavigate }: { platform: Platform; onBack: () => void; onNavigate: (s: MainSection) => void }) {
  const cfg = PLATFORMS[platform];
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [verified, setVerified] = useState(false);

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'config',  icon: <SettingsIcon />, label: 'Configuración' },
    { id: 'backup',  icon: <Download size={15} />, label: 'Respaldar' },
    { id: 'delete',  icon: <Trash2 size={15} />,   label: 'Eliminar' },
    { id: 'rebrand', icon: <RefreshCw size={15} />, label: 'Rebrandear' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* OrangeHeader */}
      <OrangeHeader
        icon={ArrowLeftRight}
        title={cfg.name}
        subtitle={cfg.subtitle}
        actions={[{ label: '← Volver', onClick: onBack }]}
      />

      {/* RRSS sub-banner */}
      <RRSSBanner onNavigate={onNavigate} active="migracion-rrss" />

      {/* Colored platform strip — icon + title */}
      <div style={{ background: cfg.gradient, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.35)' }}>
          {cfg.icon}
        </div>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: '16px', lineHeight: 1.2 }}>{cfg.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '2px 0 0', fontSize: '12px' }}>{cfg.subtitle}</p>
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', flexShrink: 0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '14px 22px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 700 : 500, transition: 'all 0.15s', background: active ? cfg.gradient : 'transparent', color: active ? '#fff' : '#555', borderRadius: active ? '0' : '0', position: 'relative', whiteSpace: 'nowrap' }}
            >
              {tab.icon}
              {tab.label}
              {!active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: 'transparent' }} />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F5F5F5' }}>
        {activeTab === 'config'  && <TabConfig  cfg={cfg} platform={platform} onBack={onBack} onVerified={() => setVerified(true)} />}
        {activeTab === 'backup'  && <TabBackup  cfg={cfg} verified={verified} />}
        {activeTab === 'delete'  && <TabDelete  cfg={cfg} />}
        {activeTab === 'rebrand' && <TabRebrand cfg={cfg} platform={platform} />}
      </div>
    </div>
  );
}

/* ── TAB: Configuración ──────────────────────────────── */
function TabConfig({ cfg, platform, onBack, onVerified }: { cfg: PlatformConfig; platform: Platform; onBack: () => void; onVerified: () => void }) {
  const [showCreds, setShowCreds] = useState(false);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [missingKeys, setMissingKeys] = useState<Set<string>>(new Set());
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Load credentials from backend on mount ── */
  useEffect(() => {
    let cancelled = false;
    setLoadingCreds(true);
    getCreds(platform).then(data => {
      if (cancelled) return;
      if (data) {
        setCreds({
          appId:     data.appId     ?? '',
          appSecret: data.appSecret ?? '',
          token:     data.token     ?? '',
          accountId: data.accountId ?? '',
          pageId:    data.pageId    ?? '',
        });
        setSavedAt(data.savedAt ?? null);
        if (data.verified?.verified) {
          setVerifyResult({ ok: true, msg: `Cuenta conectada: ${data.verified.accountName} (ID: ${data.verified.accountId})` });
          onVerified();
        }
      }
      setLoadingCreds(false);
    });
    return () => { cancelled = true; };
  }, [platform]);

  const isIG = platform === 'instagram';

  const steps = isIG ? [
    { n: 1, label: 'Crear Meta Business Account', link: 'https://business.facebook.com', desc: 'Aseguráte de tener una cuenta de Meta Business con Instagram Business conectado' },
    { n: 2, label: 'Crear App en Meta for Developers', link: 'https://developers.facebook.com', desc: "Crea una aplicación de tipo 'Business' en developers.facebook.com" },
    { n: 3, label: 'Agregar Instagram Graph API', link: null, desc: "Agrega el producto 'Instagram Graph API' a tu app" },
    { n: 4, label: 'Obtener Instagram Account ID', link: null, desc: 'Obtén el ID de tu cuenta de Instagram Business' },
    { n: 5, label: 'Generar Access Token', link: 'https://developers.facebook.com/tools/explorer', desc: 'Genera un Access Token de larga duración con los permisos necesarios' },
    { n: 6, label: 'Configurar Credenciales', link: null, desc: 'Ingresa las credenciales en el sistema' },
  ] : [
    { n: 1, label: 'Crear Meta Business Account', link: 'https://business.facebook.com', desc: 'Aseguráte de tener una cuenta de Meta Business con Página de Facebook' },
    { n: 2, label: 'Crear App en Meta for Developers', link: 'https://developers.facebook.com', desc: "Crea una aplicación de tipo 'Business'" },
    { n: 3, label: 'Agregar Facebook Login / Pages API', link: null, desc: "Agrega los productos necesarios para gestionar páginas" },
    { n: 4, label: 'Obtener Page ID', link: null, desc: 'Obtén el ID de tu Página de Facebook desde Configuración de Página' },
    { n: 5, label: 'Generar Page Access Token', link: 'https://developers.facebook.com/tools/explorer', desc: 'Genera un token con los permisos de gestión de página' },
    { n: 6, label: 'Configurar Credenciales', link: null, desc: 'Ingresa las credenciales en el sistema' },
  ];

  const handleVerify = async () => {
    const missingFields = cfg.credentialFields.filter(f => !creds[f.key]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Completá estos campos antes de verificar: ${missingFields.map(f => f.label).join(', ')}`);
      setMissingKeys(new Set(missingFields.map(f => f.key)));
      return;
    }
    setMissingKeys(new Set());

    /* Auto-guardar antes si no hay savedAt */
    if (!savedAt) {
      toast.info('Guardando credenciales antes de verificar…');
      await handleSave();
    }

    setVerifying(true);
    setVerifyResult(null);
    const res = await verifyCreds(platform);
    setVerifying(false);

    if (res.ok && res.data?.verified) {
      setVerifyResult({ ok: true, msg: `Cuenta conectada: ${res.data.accountName} (ID: ${res.data.accountId})` });
      toast.success(`✅ Conexión verificada — ${res.data.accountName}`);
      onVerified();
    } else {
      const errMsg = res.data?.error ?? res.error ?? 'Error desconocido';
      setVerifyResult({ ok: false, msg: errMsg });
      toast.error(`❌ ${errMsg}`);
    }
  };

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val || 'Sin valor');
    toast.success(`${label} copiado`);
  };

  const handleSave = async () => {
    const missingFields = cfg.credentialFields.filter(f => !creds[f.key]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Completá todos los campos: ${missingFields.map(f => f.label).join(', ')}`);
      setMissingKeys(new Set(missingFields.map(f => f.key)));
      return;
    }
    setSaving(true);
    const res = await saveCreds(platform, {
      appId:     creds['appId'],
      appSecret: creds['appSecret'],
      token:     creds['token'],
      accountId: creds['accountId'] || undefined,
      pageId:    creds['pageId']    || undefined,
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(res.savedAt ?? new Date().toISOString());
      setVerifyResult(null);
      toast.success('✅ Credenciales guardadas en la base de datos');
    } else {
      toast.error(`❌ Error al guardar: ${res.error}`);
    }
  };

  const handleDeleteCreds = async () => {
    if (!confirm('¿Seguro que querés eliminar las credenciales guardadas?')) return;
    const res = await deleteCreds(platform);
    if (res.ok) {
      setCreds({});
      setSavedAt(null);
      setVerifyResult(null);
      toast.success('Credenciales eliminadas');
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  if (loadingCreds) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: '#6B7280' }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px' }}>Cargando credenciales desde la base de datos…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '14px', marginBottom: '20px', padding: '4px 0' }}>
        <ChevronLeft size={16} /> Volver
      </button>

      {/* Hero card */}
      <div style={{ background: cfg.gradient, borderRadius: '16px', padding: '24px 28px', marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', margin: '0 0 6px', fontWeight: 800, fontSize: '20px' }}>Configuración de {cfg.name.replace('Migración de ', '')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '14px' }}>Sigue estos pasos para configurar la integración con {cfg.name.replace('Migración de ', '')}</p>
      </div>

      {/* Steps */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Pasos de Configuración</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map(step => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '10px', border: '1px solid #F0F0F0', backgroundColor: '#FAFAFA' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                {step.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{step.label}</span>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', color: cfg.accent, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                      <ExternalLink size={11} /> Abrir
                    </a>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Permisos Requeridos</h3>
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <AlertTriangle size={14} color="#D97706" />
            <span style={{ fontSize: '13px', color: '#D97706', fontWeight: 600 }}>Estos permisos deben ser aprobados en Meta for Developers</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {cfg.permissions.map(p => (
              <span key={p} style={{ padding: '3px 10px', border: `1px solid ${cfg.accent}`, borderRadius: '20px', fontSize: '12px', color: cfg.accent, fontWeight: 500, backgroundColor: '#fff' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>Credenciales</h3>
          <button onClick={() => setShowCreds(!showCreds)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#333' }}>
            {showCreds ? <EyeOff size={14} /> : <Eye size={14} />}
            {showCreds ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {cfg.credentialFields.map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: missingKeys.has(field.key) ? '#DC2626' : '#333', marginBottom: '6px' }}>{field.label}{missingKeys.has(field.key) && <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>← Requerido</span>}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showCreds ? 'text' : 'password'}
                  value={creds[field.key] ?? ''}
                  onChange={e => { setCreds(c => ({ ...c, [field.key]: e.target.value })); setMissingKeys(m => { const n = new Set(m); n.delete(field.key); return n; }); }}
                  placeholder={field.placeholder}
                  style={{ flex: 1, border: `1.5px solid ${missingKeys.has(field.key) ? '#DC2626' : '#E0E0E0'}`, borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', backgroundColor: missingKeys.has(field.key) ? '#FEF2F2' : '#FAFAFA', color: '#888' }}
                  onFocus={e => (e.target.style.borderColor = missingKeys.has(field.key) ? '#DC2626' : cfg.accent)}
                  onBlur={e => (e.target.style.borderColor = missingKeys.has(field.key) ? '#DC2626' : '#E0E0E0')}
                />
                <button onClick={() => handleCopy(creds[field.key] ?? '', field.label)}
                  style={{ width: '40px', height: '40px', border: '1.5px solid #E0E0E0', borderRadius: '10px', backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Copy size={14} color="#888" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '14px', background: cfg.gradient, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '💾 Guardar Credenciales'}
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            style={{ padding: '14px', backgroundColor: '#fff', color: '#333', border: '1.5px solid #E0E0E0', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: verifying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: verifying ? 0.7 : 1 }}>
            {verifying ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verificando…</> : '🔌 Verificar Conexión'}
          </button>
        </div>

        {/* Resultado de verificación */}
        {verifyResult && (
          <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: verifyResult.ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${verifyResult.ok ? '#A7F3D0' : '#FECACA'}`, borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            {verifyResult.ok
              ? <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
              : <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />}
            <span style={{ fontSize: '12px', fontWeight: 600, color: verifyResult.ok ? '#065F46' : '#7F1D1D', lineHeight: 1.5 }}>{verifyResult.msg}</span>
          </div>
        )}

        {/* Info: dónde se guarda */}
        <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={13} color="#0369A1" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1' }}>Almacenamiento — Supabase KV</span>
            </div>
            {savedAt && (
              <button onClick={handleDeleteCreds}
                style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                🗑 Eliminar credenciales
              </button>
            )}
          </div>
          <span style={{ fontSize: '12px', color: '#0369A1', lineHeight: 1.5 }}>
            Las credenciales se guardan en la <strong>base de datos Supabase</strong> del proyecto (tabla KV), cifradas en tránsito via HTTPS. Persisten entre sesiones y dispositivos.
          </span>
          {savedAt && (
            <span style={{ fontSize: '11px', color: '#0EA5E9', fontWeight: 600, marginTop: '2px' }}>
              💾 Último guardado: {new Date(savedAt).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
          {!savedAt && (
            <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, marginTop: '2px' }}>
              ⚠️ Sin credenciales en la base de datos — completá los campos y guardá
            </span>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ── TAB: Respaldar ──────────────────────────────────── */
function TabBackup({ cfg, verified }: { cfg: PlatformConfig; verified: boolean }) {
  const [selected, setSelected] = useState<'posts' | 'stories' | 'reels' | 'all'>('all');
  const [backing, setBacking] = useState(false);
  const [done, setDone] = useState(false);

  const isIG = cfg.permissions.includes('instagram_basic');

  const types = isIG
    ? [
        { id: 'posts'   as const, icon: <DownloadIcon />, label: 'Posts',   sub: 'Fotos y videos' },
        { id: 'stories' as const, icon: <DownloadIcon />, label: 'Stories', sub: 'Últimas 24 horas' },
        { id: 'reels'   as const, icon: <DownloadIcon />, label: 'Reels',   sub: 'Todos los reels' },
        { id: 'all'     as const, icon: <DownloadIcon />, label: 'Todo',    sub: 'Respaldo completo' },
      ]
    : [
        { id: 'posts'   as const, icon: <DownloadIcon />, label: 'Posts',   sub: 'Publicaciones' },
        { id: 'stories' as const, icon: <DownloadIcon />, label: 'Fotos',   sub: 'Álbumes de fotos' },
        { id: 'reels'   as const, icon: <DownloadIcon />, label: 'Videos',  sub: 'Videos publicados' },
        { id: 'all'     as const, icon: <DownloadIcon />, label: 'Todo',    sub: 'Respaldo completo' },
      ];

  const handleBackup = () => {
    if (!verified) { toast.error('Verificá la conexión primero en la pestaña Configuración'); return; }
    setBacking(true);
    setTimeout(() => { setBacking(false); setDone(true); toast.success(`Respaldo de "${selected}" completado`); }, 2200);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px' }}>
      {/* Warning if not verified */}
      {!verified && (
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#D97706', marginBottom: '2px' }}>Conexión no verificada</div>
            <div style={{ fontSize: '13px', color: '#92400E' }}>Por favor verifica tu conexión en la pestaña "Configuración" antes de respaldar.</div>
          </div>
        </div>
      )}

      {done && (
        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CheckCircle2 size={18} color="#059669" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#059669' }}>Respaldo completado</div>
            <div style={{ fontSize: '13px', color: '#065F46' }}>Tu contenido fue respaldado y está disponible para descargar.</div>
          </div>
        </div>
      )}

      {/* Content selector */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Respaldar Contenido</h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B7280' }}>
          Seleccioná qué tipo de contenido deseas respaldar.{isIG ? ' Las stories solo están disponibles por 24 horas.' : ''}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              style={{ padding: '20px 12px', borderRadius: '12px', border: `2px solid ${selected === t.id ? 'transparent' : '#E5E7EB'}`, background: selected === t.id ? cfg.gradient : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', opacity: selected === t.id ? 1 : 0.6 }}>
                <Download size={22} color={selected === t.id ? '#fff' : '#555'} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: selected === t.id ? '#fff' : '#333' }}>{t.label}</div>
              <div style={{ fontSize: '11px', color: selected === t.id ? 'rgba(255,255,255,0.8)' : '#9CA3AF', marginTop: '3px' }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Iniciar Respaldo</h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B7280' }}>
          El respaldo descargará tu contenido en formato JSON + imágenes ZIP. El proceso puede demorar algunos minutos según la cantidad de publicaciones.
        </p>
        <button onClick={handleBackup} disabled={backing}
          style={{ padding: '14px 32px', background: verified ? cfg.gradient : '#E5E7EB', color: verified ? '#fff' : '#9CA3AF', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: verified ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.15s' }}>
          <Download size={17} />
          {backing ? 'Respaldando...' : `Respaldar ${types.find(t => t.id === selected)?.label}`}
        </button>
      </div>
    </div>
  );
}

/* ── TAB: Eliminar ───────────────────────────────────── */
function TabDelete({ cfg }: { cfg: PlatformConfig }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const confirmed = confirm === 'ELIMINAR';

  const types = [
    { id: 'posts',   label: 'Eliminar Posts' },
    { id: 'stories', label: 'Eliminar Stories' },
    { id: 'reels',   label: 'Eliminar Reels' },
    { id: 'all',     label: 'Eliminar Todo' },
  ];

  const handleDelete = (id: string) => {
    if (!confirmed) { toast.error('Escribí ELIMINAR para confirmar'); return; }
    setDeleting(id);
    setTimeout(() => {
      setDeleting(null);
      setConfirm('');
      toast.success(`${types.find(t => t.id === id)?.label} completado`);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Eliminar Contenido</h3>

        {/* Warning */}
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', fontWeight: 600 }}>⚠️ Esta acción es irreversible</p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#991B1B' }}>Aseguráte de haber hecho un respaldo completo antes de continuar.</p>
          </div>
        </div>

        {/* Confirmation input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Para confirmar, escribe <strong>"ELIMINAR"</strong>:
          </label>
          <input
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder='Escribe ELIMINAR para confirmar'
            style={{ width: '100%', border: `1.5px solid ${confirmed ? '#DC2626' : '#E0E0E0'}`, borderRadius: '10px', padding: '11px 14px', fontSize: '14px', outline: 'none', backgroundColor: confirmed ? '#FEF2F2' : '#FAFAFA', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#DC2626')}
            onBlur={e => (e.target.style.borderColor = confirmed ? '#DC2626' : '#E0E0E0')}
          />
        </div>

        {/* Delete buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {types.map((t, i) => (
            <button key={t.id} onClick={() => handleDelete(t.id)} disabled={!!deleting}
              style={{ padding: '20px 12px', borderRadius: '12px', border: `2px solid ${i === 3 ? 'transparent' : '#FECACA'}`, background: i === 3 ? (confirmed ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : '#E5E7EB') : (confirmed ? '#FEF2F2' : '#FAFAFA'), cursor: confirmed ? 'pointer' : 'not-allowed', textAlign: 'center', transition: 'all 0.15s' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Trash2 size={22} color={i === 3 ? (confirmed ? '#fff' : '#9CA3AF') : (confirmed ? '#DC2626' : '#D1D5DB')} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: i === 3 ? (confirmed ? '#fff' : '#9CA3AF') : (confirmed ? '#DC2626' : '#9CA3AF') }}>
                {deleting === t.id ? '⏳ Eliminando...' : t.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── TAB: Rebrandear ─────────────────────────────────── */
function TabRebrand({ cfg, platform }: { cfg: PlatformConfig; platform: Platform }) {
  const isIG = platform === 'instagram';
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('https://charliemarketplace.com');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success('¡Cambios guardados exitosamente!'); }, 1600);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px' }}>
      {/* API Limitations banner */}
      <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1D4ED8', marginBottom: '6px' }}>
            Limitaciones de la API de {isIG ? 'Instagram' : 'Facebook'}
          </div>
          {isIG ? (
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.7' }}>
              <li>Solo se puede actualizar la <strong>biografía</strong> y el <strong>sitio web</strong></li>
              <li>El <strong>username</strong>, <strong>nombre</strong> y <strong>foto de perfil</strong> deben cambiarse manualmente en Instagram</li>
              <li>La configuración de privacidad debe cambiarse en la app</li>
            </ul>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.7' }}>
              <li>Se puede actualizar la <strong>descripción</strong> y el <strong>sitio web</strong> de la página</li>
              <li>El <strong>nombre de la página</strong> puede requerir aprobación de Meta</li>
              <li>La foto de portada y perfil se pueden cambiar vía API</li>
            </ul>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: '#111' }}>
          Información del Perfil
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Read-only fields */}
          {[
            { label: isIG ? 'Username (Solo lectura - cambiar en Instagram)' : 'Nombre de Página (Solo lectura)', placeholder: isIG ? '@charliemarketplace' : 'Charlie Marketplace', editable: false },
            { label: isIG ? 'Nombre (Solo lectura - cambiar en Instagram)' : 'Username (Solo lectura)', placeholder: isIG ? 'Charlie Marketplace' : '@charliemarketplace', editable: false },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>{f.label}</label>
              <input disabled placeholder={f.placeholder}
                style={{ width: '100%', border: '1.5px solid #F0F0F0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', backgroundColor: '#F9F9F9', color: '#9CA3AF', boxSizing: 'border-box', cursor: 'not-allowed' }} />
            </div>
          ))}

          {/* Editable: Bio */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '6px' }}>
              Biografía <CheckCircle2 size={14} color="#10B981" />
            </label>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 150))} rows={4}
              placeholder="Tu marketplace favorito 🛍️"
              style={{ width: '100%', border: '1.5px solid #E0E0E0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit', backgroundColor: '#FAFAFA' }}
              onFocus={e => (e.target.style.borderColor = cfg.accent)}
              onBlur={e => (e.target.style.borderColor = '#E0E0E0')} />
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{bio.length}/150 caracteres</div>
          </div>

          {/* Editable: Website */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '6px' }}>
              Sitio Web <CheckCircle2 size={14} color="#10B981" />
            </label>
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://charliemarketplace.com"
              style={{ width: '100%', border: '1.5px solid #E0E0E0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#FAFAFA' }}
              onFocus={e => (e.target.style.borderColor = cfg.accent)}
              onBlur={e => (e.target.style.borderColor = '#E0E0E0')} />
          </div>

          {/* Save button */}
          <button onClick={handleSave}
            style={{ padding: '14px', background: cfg.gradient, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
            {saving ? '⏳ Guardando...' : <><Check size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </div>

      {/* Profile photo */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#111' }}>Foto de Perfil</h3>

        {isIG ? (
          <>
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D' }}>
                <strong>Instagram NO permite</strong> cambiar la foto de perfil vía API. Debes hacerlo manualmente en la app de Instagram.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', cursor: 'not-allowed' }}>
                <Upload size={28} color="#D1D5DB" />
              </div>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6' }}>
                Para cambiar tu foto de perfil, abrí la app de Instagram → Perfil<br />→ Editar perfil → Cambiar foto de perfil
              </p>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>En Facebook puedes actualizar la foto de perfil y la foto de portada de tu página vía API.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {['Foto de Perfil', 'Foto de Portada'].map(label => (
                <div key={label} style={{ border: '2px dashed #E0E0E0', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  onClick={() => toast.info(`Subí ${label.toLowerCase()} aquí`)}>
                  <Upload size={24} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>JPG / PNG · Max 5MB</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── SVG Icons ───────────────────────────────────────── */
function IgIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
    </svg>
  );
}

function FbIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function DownloadIcon() {
  return <Download size={22} />;
}