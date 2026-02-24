/**
 * 💳 Pasarela de Pagos
 * Procesadores locales Uruguay + Latam/Global
 */
import React, { useState } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { ExternalLink, Settings2, CheckCircle2, AlertCircle, Clock, Zap, Star, CreditCard } from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';

type Status = 'connected' | 'sandbox' | 'pending' | 'coming-soon';
type Region = 'uy' | 'latam' | 'global';
type ApiMode = 'api' | 'no-api' | 'redirect';

interface Provider {
  id: string; emoji: string; name: string;
  description: string; countries: string[];
  region: Region; apiMode: ApiMode; status: Status;
  badge?: string; category?: string;
  docsUrl?: string; recommended?: boolean;
}

const PROVIDERS: Provider[] = [
  // ── Uruguay ──────────────────────────────────────
  {
    id: 'plexo', emoji: '🔵', name: 'Plexo',
    description: 'Procesador de tarjetas para Uruguay. Visa, Mastercard, OCA, Creditel, Oca. Ideal para tiendas locales.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'api', status: 'sandbox',
    badge: 'Sandbox disponible', recommended: true,
    docsUrl: 'https://plexo.com.uy',
  },
  {
    id: 'oca-cards', emoji: '🟠', name: 'OCA Tarjetas',
    description: 'Tarjeta de crédito y débito OCA — segunda tarjeta más usada en Uruguay.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Integración vía Plexo', category: 'Incluida en Plexo',
  },
  {
    id: 'creditel', emoji: '🟡', name: 'Creditel',
    description: 'Financiera de crédito al consumo en Uruguay. Cobro en cuotas.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'no-api', status: 'pending',
    badge: 'Integración vía Plexo',
  },
  {
    id: 'abitab', emoji: '🔴', name: 'Abitab',
    description: 'Pago en agencias Abitab. Sin necesidad de tarjeta. Muy popular en Uruguay.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'redirect', status: 'pending',
    badge: 'Redirección a agencia',
  },
  {
    id: 'redpagos', emoji: '🟢', name: 'RedPagos',
    description: 'Red de cobranza en comercios. Alternativa a Abitab con cobertura nacional.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'redirect', status: 'pending',
    badge: 'Redirección a agencia',
  },
  {
    id: 'brou', emoji: '🔵', name: 'BROU e-Payments',
    description: 'Plataforma de pagos online del Banco República. Débito directo en cuenta.',
    countries: ['🇺🇾'], region: 'uy', apiMode: 'api', status: 'coming-soon',
    badge: 'Próximamente',
  },
  // ── Latam / Global ──────────────────────────────
  {
    id: 'mp', emoji: '💙', name: 'Mercado Pago',
    description: 'La pasarela de pagos más usada en Latinoamérica. Tarjetas, QR y transferencias.',
    countries: ['🇺🇾', '🇦🇷', '🇧🇷', '🇨🇱'], region: 'latam', apiMode: 'api', status: 'pending',
    docsUrl: 'https://www.mercadopago.com.uy/developers',
  },
  {
    id: 'paypal', emoji: '🌐', name: 'PayPal',
    description: 'Pagos internacionales. Ideal para ventas a compradores fuera de Latam.',
    countries: ['🌎'], region: 'global', apiMode: 'api', status: 'pending',
    docsUrl: 'https://developer.paypal.com',
  },
  {
    id: 'stripe', emoji: '💜', name: 'Stripe',
    description: 'Procesamiento de tarjetas global. Visa, Mastercard, Amex y wallets digitales.',
    countries: ['🌎'], region: 'global', apiMode: 'api', status: 'pending',
    docsUrl: 'https://stripe.com/docs',
  },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string; Icon: any }> = {
  connected:    { label: 'Conectada',   color: '#10B981', bg: '#D1FAE5', Icon: CheckCircle2 },
  sandbox:      { label: 'Sandbox',     color: '#F59E0B', bg: '#FEF3C7', Icon: AlertCircle  },
  pending:      { label: 'Sin conectar',color: '#9CA3AF', bg: '#F3F4F6', Icon: Clock        },
  'coming-soon':{ label: 'Próximamente',color: '#3B82F6', bg: '#DBEAFE', Icon: Zap          },
};

const API_LABEL: Record<ApiMode, { label: string; color: string; bg: string }> = {
  api:      { label: 'Con API',       color: '#10B981', bg: '#D1FAE5' },
  'no-api': { label: 'Vía pasarela',  color: '#8B5CF6', bg: '#EDE9FE' },
  redirect: { label: 'Redirección',   color: '#F59E0B', bg: '#FEF3C7' },
};

type Filter = 'all' | 'uy' | 'latam' | 'global';
type ApiFilter = 'all' | 'api' | 'no-api';

export function IntegracionesPagosView({ onNavigate }: Props) {
  const [regionFilter, setRegionFilter] = useState<Filter>('all');
  const [apiFilter, setApiFilter]       = useState<ApiFilter>('all');
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const filtered = PROVIDERS.filter(p => {
    const regionOk = regionFilter === 'all' || p.region === regionFilter || (regionFilter === 'latam' && p.region === 'global');
    const apiOk    = apiFilter === 'all' || (apiFilter === 'api' ? p.apiMode === 'api' : p.apiMode !== 'api');
    return regionOk && apiOk;
  });

  const connected = PROVIDERS.filter(p => p.status === 'connected').length;
  const sandbox   = PROVIDERS.filter(p => p.status === 'sandbox').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OrangeHeader
        icon={CreditCard}
        title="Pasarela de Pagos"
        subtitle="Cobros online — Uruguay first, expansión Latam progresiva"
        actions={[{ label: '← Integraciones', onClick: () => onNavigate('integraciones') }]}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: '#F8F9FA' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Proveedores', value: PROVIDERS.length, color: '#111827' },
            { label: 'Conectadas',  value: connected, color: '#10B981' },
            { label: 'Sandbox',     value: sandbox,   color: '#F59E0B' },
            { label: 'Uruguay 🇺🇾',  value: PROVIDERS.filter(p => p.region === 'uy').length, color: ORANGE },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '12px 16px',
              border: '1px solid #E5E7EB', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6B7280', alignSelf: 'center', marginRight: 4 }}>Región:</span>
          {(['all','uy','latam','global'] as Filter[]).map(f => (
            <button key={f} onClick={() => setRegionFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                backgroundColor: regionFilter === f ? ORANGE : '#fff',
                color: regionFilter === f ? '#fff' : '#374151',
                fontSize: '0.78rem', fontWeight: '600',
                border: `1.5px solid ${regionFilter === f ? ORANGE : '#E5E7EB'}`,
              }}
            >
              {{ all: 'Todos', uy: '🇺🇾 Uruguay', latam: '🌎 Latam', global: '🌐 Global' }[f]}
            </button>
          ))}
          <div style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', alignSelf: 'center', margin: '0 4px' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6B7280', alignSelf: 'center', marginRight: 4 }}>Integración:</span>
          {(['all','api','no-api'] as ApiFilter[]).map(f => (
            <button key={f} onClick={() => setApiFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                backgroundColor: apiFilter === f ? '#1F2937' : '#fff',
                color: apiFilter === f ? '#fff' : '#374151',
                fontSize: '0.78rem', fontWeight: '600',
                border: `1.5px solid ${apiFilter === f ? '#1F2937' : '#E5E7EB'}`,
              }}
            >
              {{ all: 'Todos', api: '⚡ Con API', 'no-api': '🔗 Sin API directo' }[f]}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const sm = STATUS_META[p.status];
            const am = API_LABEL[p.apiMode];
            const SIcon = sm.Icon;
            const isExp = expandedId === p.id;
            return (
              <div key={p.id} style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: p.recommended ? `1.5px solid ${ORANGE}` : '1px solid #E5E7EB',
                overflow: 'hidden', transition: 'box-shadow 0.15s',
                boxShadow: p.recommended ? `0 0 0 4px ${ORANGE}12` : 'none',
              }}>
                {/* accent */}
                <div style={{ height: 3, backgroundColor: sm.color }} />

                <div style={{ padding: '16px 18px' }}>
                  {/* header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      backgroundColor: '#F9FAFB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', flexShrink: 0,
                    }}>
                      {p.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>{p.name}</span>
                        {p.recommended && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', backgroundColor: `${ORANGE}18`, color: ORANGE, borderRadius: 4, fontSize: '0.62rem', fontWeight: '700' }}>
                            <Star size={9} fill={ORANGE} /> Recomendado UY
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                        {p.countries.map((c, i) => <span key={i} style={{ fontSize: '0.75rem' }}>{c}</span>)}
                        <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: '700', backgroundColor: am.bg, color: am.color }}>{am.label}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5 }}>{p.description}</p>

                  {p.badge && p.apiMode !== 'api' && (
                    <div style={{ marginBottom: 10, padding: '6px 10px', backgroundColor: '#F9FAFB', borderRadius: 7, fontSize: '0.72rem', color: '#6B7280' }}>
                      ℹ️ {p.badge}
                    </div>
                  )}

                  {/* Bottom row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', backgroundColor: sm.bg, color: sm.color, borderRadius: 20, fontSize: '0.7rem', fontWeight: '700' }}>
                      <SIcon size={11} /> {sm.label}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.docsUrl && (
                        <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontSize: '0.72rem', fontWeight: '600', textDecoration: 'none' }}>
                          <ExternalLink size={11} /> Docs
                        </a>
                      )}
                      {p.status !== 'coming-soon' && p.apiMode === 'api' && (
                        <button onClick={() => setExpandedId(isExp ? null : p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', backgroundColor: p.status === 'connected' ? '#F3F4F6' : ORANGE, color: p.status === 'connected' ? '#374151' : '#fff', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                          <Settings2 size={11} /> {p.status === 'connected' ? 'Config' : 'Conectar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded config */}
                  {isExp && (
                    <div style={{ marginTop: 14, padding: '14px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: '700', color: '#374151' }}>Credenciales API — {p.name}</p>
                      {['Public Key / Client ID', 'Secret Key / Access Token'].map((field, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field}</label>
                          <input type={i === 1 ? 'password' : 'text'} placeholder={`${field}...`}
                            style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 7, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                            onFocus={e => (e.target.style.borderColor = ORANGE)}
                            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                          />
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button style={{ flex: 1, padding: '8px', backgroundColor: ORANGE, color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                          Guardar y probar conexión
                        </button>
                        <button onClick={() => setExpandedId(null)}
                          style={{ padding: '8px 12px', backgroundColor: '#fff', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.78rem', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🔍</p>
            <p style={{ fontWeight: '600' }}>Sin resultados para ese filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}