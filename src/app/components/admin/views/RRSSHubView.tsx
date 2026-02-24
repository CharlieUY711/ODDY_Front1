/* =====================================================
   RRSSHubView — Hub Central de Redes Sociales
   Centro de comando completo para Meta Business Suite
   Charlie Marketplace Builder v1.5
   ===================================================== */
import React, { useState, useEffect } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import {
  Share2, BarChart2, ArrowLeftRight, Monitor, Zap, Calendar,
  BookOpen, CheckCircle, Settings, Rocket, Star, HelpCircle,
  Facebook, Instagram, MessageCircle, Wrench, ExternalLink,
  ChevronRight, AlertCircle, Loader,
} from 'lucide-react';
import { getStatus, type AllStatus, type PlatformStatus } from '../../../services/rrssApi';

const ORANGE   = '#FF6835';
const FB_BLUE  = '#1877F2';
const IG_PINK  = '#E1306C';
const WA_GREEN = '#25D366';

interface Props { onNavigate: (s: MainSection) => void; }

/* ── Platform status chip ── */
function PlatformChip({ icon: Icon, platform, status, statusColor, onClick }: {
  icon: React.ElementType; platform: string; status: string; statusColor: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        flex: 1, padding: '12px 16px', borderRadius: '10px',
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)', cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s', textAlign: 'left',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.2)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.12)')}
    >
      <Icon size={16} color='#fff' />
      <div>
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{platform}</p>
        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{status}</p>
      </div>
    </button>
  );
}

/* ── Main tool card (Herramientas Principales) ── */
interface MainCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  features: string[];
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  onClick: () => void;
}
function MainToolCard({ icon: Icon, iconBg, iconColor, title, description, badge, badgeColor, badgeBg, features, statusLabel, statusColor, statusBg, onClick }: MainCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff', borderRadius: '14px',
        border: '1px solid #E5E7EB', overflow: 'hidden',
        cursor: 'pointer', transition: 'all 0.18s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      {/* Badge strip */}
      <div style={{ height: '3px', backgroundColor: iconColor }} />

      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={iconColor} />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: badgeColor, backgroundColor: badgeBg, padding: '3px 8px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {badge}
        </span>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <h3 style={{ margin: '0 0 5px', fontSize: '1rem', fontWeight: '900', color: '#111827' }}>{title}</h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.77rem', color: '#6B7280', lineHeight: 1.5 }}>{description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <CheckCircle size={13} color='#10B981' />
              <span style={{ fontSize: '0.77rem', color: '#374151' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '14px 20px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ width: '100%', padding: '9px', borderRadius: '8px', backgroundColor: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <CheckCircle size={14} color={statusColor} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: statusColor }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Additional tool card (Herramientas Adicionales) ── */
interface AdditionalCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  onClick?: () => void;
}
function AdditionalCard({ icon: Icon, iconBg, iconColor, title, description, statusLabel, statusColor, statusBg, onClick }: AdditionalCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff', borderRadius: '12px',
        border: '1px solid #E5E7EB', padding: '18px',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
    >
      <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
        <Icon size={18} color={iconColor} />
      </div>
      <p style={{ margin: '0 0 3px', fontSize: '0.88rem', fontWeight: '800', color: '#111827' }}>{title}</p>
      <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#6B7280', lineHeight: 1.4 }}>{description}</p>
      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: statusColor, backgroundColor: statusBg, padding: '3px 9px', borderRadius: '5px' }}>
        {statusLabel}
      </span>
    </div>
  );
}

/* ── Main export ── */
export function RRSSHubView({ onNavigate }: Props) {
  const [platformStatus, setPlatformStatus] = useState<AllStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStatus(true);
    getStatus().then(s => {
      if (!cancelled) { setPlatformStatus(s); setLoadingStatus(false); }
    });
    return () => { cancelled = true; };
  }, []);

  /* Derive chip props from real status */
  function chipProps(p: PlatformStatus | undefined): { status: string; dot: string } {
    if (!p) return { status: 'Cargando…', dot: 'rgba(255,255,255,0.5)' };
    if (p.status === 'connected')    return { status: `✓ ${p.accountName ?? 'Conectado'}`, dot: '#4ADE80' };
    if (p.status === 'pending')      return { status: 'Sin verificar', dot: '#FCD34D' };
    if (p.status === 'coming_soon')  return { status: 'Próximamente', dot: '#94A3B8' };
    return { status: 'Sin credenciales', dot: '#F87171' };
  }

  const igChip = chipProps(platformStatus?.instagram);
  const fbChip = chipProps(platformStatus?.facebook);

  const mainTools: MainCardProps[] = [
    {
      icon: BarChart2, iconBg: `${ORANGE}15`, iconColor: ORANGE,
      title: 'Dashboard Unificado',
      description: 'Monitoreo en tiempo real de todas tus redes sociales',
      badge: 'Más usado', badgeColor: '#D97706', badgeBg: '#FEF3C7',
      features: ['Monitor de tokens en vivo', 'Estadísticas centralizadas', 'Renovación automática', 'Verificación de permisos'],
      statusLabel: 'Activo', statusColor: '#059669', statusBg: '#D1FAE5',
      onClick: () => onNavigate('meta-business'),
    },
    {
      icon: ArrowLeftRight, iconBg: '#EFF6FF', iconColor: FB_BLUE,
      title: 'Migración RRSS',
      description: 'Backup, eliminación y rebranding completo',
      badge: 'Crítico', badgeColor: '#EF4444', badgeBg: '#FEE2E2',
      features: ['Backup completo de contenido', 'Eliminación masiva segura', 'Rebranding automático', 'Export de datos'],
      statusLabel: 'Activo', statusColor: '#059669', statusBg: '#D1FAE5',
      onClick: () => onNavigate('migracion-rrss'),
    },
    {
      icon: Share2, iconBg: `${IG_PINK}18`, iconColor: IG_PINK,
      title: 'Centro Operativo',
      description: 'Gestión unificada de Facebook, Instagram y WhatsApp',
      badge: 'Nuevo', badgeColor: '#2563EB', badgeBg: '#DBEAFE',
      features: ['Panel unificado de gestión', 'Calendario de contenido', 'Gestión por plataforma', 'Vista consolidada'],
      statusLabel: 'Activo', statusColor: '#059669', statusBg: '#D1FAE5',
      onClick: () => onNavigate('redes-sociales'),
    },
  ];

  const additionalTools: AdditionalCardProps[] = [
    {
      icon: Zap, iconBg: '#E0F2FE', iconColor: '#0284C7',
      title: 'Publicador Unificado',
      description: 'Publicá en Instagram y Facebook simultáneamente',
      statusLabel: '⏳ Próximamente', statusColor: '#D97706', statusBg: '#FEF9C3',
    },
    {
      icon: BarChart2, iconBg: '#FEF3C7', iconColor: '#D97706',
      title: 'Analytics',
      description: 'Estadísticas avanzadas y reportes',
      statusLabel: '⏳ Próximamente', statusColor: '#D97706', statusBg: '#FEF9C3',
    },
    {
      icon: Calendar, iconBg: '#FDF2F8', iconColor: '#C026D3',
      title: 'Calendario Social',
      description: 'Planificación y programación de contenido',
      statusLabel: '↗ En Centro Operativo', statusColor: '#7C3AED', statusBg: '#F5F3FF',
      onClick: () => onNavigate('redes-sociales'),
    },
    {
      icon: BookOpen, iconBg: '#E0F2FE', iconColor: '#0284C7',
      title: 'Documentación',
      description: 'Guías completas y tutoriales',
      statusLabel: '✓ Disponible', statusColor: '#059669', statusBg: '#D1FAE5',
      onClick: () => onNavigate('documentacion'),
    },
  ];

  const guiaRapida = [
    {
      icon: Rocket, color: ORANGE,
      title: 'Primeros Pasos',
      items: [
        'Configura tus credenciales de Meta API',
        'Verifica las conexiones en Dashboard',
        'Explorá el Centro Operativo',
        'Hacé un backup de seguridad',
      ],
      links: false,
    },
    {
      icon: Star, color: '#F59E0B',
      title: 'Funciones Destacadas',
      items: [
        'Backup automático antes de cambios',
        'Monitoreo de tokens 24/7',
        'Vista unificada multi-plataforma',
        'Documentación integrada',
      ],
      links: false,
    },
    {
      icon: HelpCircle, color: '#3B82F6',
      title: '¿Necesitas ayuda?',
      items: [
        'Revisá la documentación integrada',
        'Consultá el troubleshooting',
        'Verificá el estado en Dashboard',
        'Contactá soporte técnico',
      ],
      links: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>

      <OrangeHeader
        icon={Share2}
        title="Redes Sociales"
        subtitle="Gestión y administración"
        actions={[
          { label: '← Volver', onClick: () => onNavigate('marketing') },
          { label: 'Volver a la tienda' },
        ]}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Banner de estado de plataformas ── */}
        <div style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 60%, #1877F2 100%)', padding: '16px 32px' }}>
          {/* Platform status row */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <PlatformChip icon={Facebook}     platform="Facebook"     status={loadingStatus ? '…' : fbChip.status} statusColor={FB_BLUE}  onClick={() => onNavigate('migracion-rrss')} />
            <PlatformChip icon={Instagram}    platform="Instagram"    status={loadingStatus ? '…' : igChip.status} statusColor={IG_PINK}  onClick={() => onNavigate('migracion-rrss')} />
            <PlatformChip icon={MessageCircle} platform="WhatsApp"    status="Próximamente"  statusColor={WA_GREEN} />
            <PlatformChip icon={Wrench}       platform="Herramientas" status="6 disponibles" statusColor='#fff' />
          </div>
          {!loadingStatus && platformStatus && (
            platformStatus.instagram.status !== 'connected' || platformStatus.facebook.status !== 'connected'
          ) && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.3)' }}>
              <AlertCircle size={14} color="#FCD34D" />
              <span style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 600 }}>
                Credenciales pendientes — configurá tu API en{' '}
                <button onClick={() => onNavigate('migracion-rrss')}
                  style={{ background: 'none', border: 'none', color: '#FCD34D', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '12px' }}>
                  Migración RRSS → Configuración
                </button>
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '32px 32px 48px', maxWidth: '1200px' }}>

          {/* ── Herramientas Principales ── */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Zap size={18} color={ORANGE} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#111827' }}>Herramientas Principales</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
              {mainTools.map(tool => (
                <MainToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>

          {/* ── Herramientas Adicionales ── */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Settings size={18} color='#6B7280' />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#111827' }}>Herramientas Adicionales</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {additionalTools.map(tool => (
                <AdditionalCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>

          {/* ── Guía Rápida ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <BookOpen size={18} color='#2563EB' />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#111827' }}>Guía Rápida</h3>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                {guiaRapida.map(col => (
                  <div key={col.title}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <col.icon size={16} color={col.color} />
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: '#111827' }}>{col.title}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {col.items.map(item => (
                        <p
                          key={item}
                          style={{ margin: 0, fontSize: '0.78rem', color: col.links ? '#2563EB' : '#6B7280', cursor: col.links ? 'pointer' : 'default', textDecoration: col.links ? 'underline' : 'none', lineHeight: 1.4 }}
                        >
                          {col.links ? `→ ${item}` : `${item}`}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA banner */}
            <div style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 100%)', borderRadius: '14px', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '900', color: '#fff' }}>¿Listo para comenzar?</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>Empezá monitoreando el estado de tus conexiones en el Dashboard Unificado</p>
              </div>
              <button
                onClick={() => onNavigate('meta-business')}
                style={{ padding: '12px 24px', backgroundColor: '#fff', color: '#5B21B6', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '24px', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                Ir al Dashboard <ChevronRight size={15} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}