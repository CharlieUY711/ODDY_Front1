import { useState } from 'react'

interface TreeNode {
  name: string
  type: 'dir' | 'file'
  color?: string
  desc?: string
  children?: TreeNode[]
}

const TREE: TreeNode[] = [
  {
    name: 'activation-engine/', type: 'dir', color: '#6366F1',
    children: [
      {
        name: 'domain/', type: 'dir', color: '#10B981', desc: 'Núcleo sin dependencias externas',
        children: [
          {
            name: 'models/', type: 'dir', color: '#10B981',
            children: [
              { name: 'Campaign.ts', type: 'file', desc: 'Entidad Campaign + EligibilityRule' },
              { name: 'Reward.ts', type: 'file', desc: 'Entidad Reward con probability_weight' },
              { name: 'Activation.ts', type: 'file', desc: 'Entidad Activation + AuditEntry' },
              { name: 'BenefitToken.ts', type: 'file', desc: 'Value Object del token firmado' },
              { name: 'Money.ts', type: 'file', desc: 'Value Object inmutable en centavos' },
            ]
          },
          {
            name: 'repositories/', type: 'dir', color: '#10B981',
            children: [
              { name: 'ICampaignRepository.ts', type: 'file', desc: 'Puerto → infra implementa' },
              { name: 'IRewardRepository.ts', type: 'file', desc: 'Incluye atomicIncrementStock' },
              { name: 'IActivationRepository.ts', type: 'file', desc: 'findByUserAndCampaign, markExpired' },
            ]
          },
          {
            name: 'services/', type: 'dir', color: '#10B981',
            children: [
              { name: 'EligibilityService.ts', type: 'file', desc: 'Valida elegibilidad de usuario' },
              { name: 'ProbabilisticResolver.ts', type: 'file', desc: '⭐ Resolución segura con crypto.randomInt' },
              { name: 'TokenService.ts', type: 'file', desc: 'HMAC-SHA256 sign/verify/revoke' },
            ]
          },
          {
            name: 'events/', type: 'dir', color: '#10B981',
            children: [
              { name: 'ActivationRequested.ts', type: 'file' },
              { name: 'RewardResolved.ts', type: 'file' },
              { name: 'BenefitExpired.ts', type: 'file' },
              { name: 'BenefitConverted.ts', type: 'file' },
            ]
          },
        ]
      },
      {
        name: 'application/', type: 'dir', color: '#3B82F6', desc: 'Orquesta el dominio',
        children: [
          {
            name: 'use-cases/', type: 'dir', color: '#3B82F6',
            children: [
              { name: 'RequestActivation.ts', type: 'file', desc: '⭐ Caso de uso principal (10 pasos)' },
              { name: 'ApplyBenefit.ts', type: 'file', desc: 'Aplica token al carrito' },
              { name: 'ExpireBenefit.ts', type: 'file', desc: 'Expiración manual o programada' },
            ]
          },
          {
            name: 'dto/', type: 'dir', color: '#3B82F6',
            children: [
              { name: 'ActivationRequest.ts', type: 'file', desc: 'userId, campaignId, ip, userAgent' },
              { name: 'ActivationResult.ts', type: 'file', desc: 'has_reward, token, expires_at, mechanic' },
            ]
          },
          {
            name: 'ports/', type: 'dir', color: '#3B82F6', desc: 'Interfaces hacia infraestructura',
            children: [
              { name: 'ICartPort.ts', type: 'file', desc: 'applyBenefit, onOrderConfirmed' },
              { name: 'ICachePort.ts', type: 'file', desc: 'get, set, incr, acquireLock, releaseLock' },
              { name: 'IEventBusPort.ts', type: 'file', desc: 'publish(event): Promise<void>' },
            ]
          },
        ]
      },
      {
        name: 'infrastructure/', type: 'dir', color: '#F59E0B', desc: 'Implementa Ports',
        children: [
          {
            name: 'persistence/', type: 'dir', color: '#F59E0B',
            children: [
              { name: 'CampaignRepository.ts', type: 'file', desc: 'PostgreSQL + SELECT FOR UPDATE' },
              { name: 'RewardRepository.ts', type: 'file', desc: 'UPDATE stock_consumed = stock_consumed + 1' },
              { name: 'ActivationRepository.ts', type: 'file', desc: 'Particionado por campaign_id' },
            ]
          },
          {
            name: 'cache/', type: 'dir', color: '#F59E0B',
            children: [
              { name: 'RedisCache.ts', type: 'file', desc: 'SET/GET/INCR + Redlock para distributed lock' },
            ]
          },
          {
            name: 'http/', type: 'dir', color: '#F59E0B',
            children: [
              { name: 'ActivationController.ts', type: 'file', desc: 'POST /activate, POST /apply-benefit' },
              {
                name: 'middleware/', type: 'dir', color: '#F59E0B',
                children: [
                  { name: 'RateLimiter.ts', type: 'file', desc: 'Sliding window por IP (5 req/min)' },
                  { name: 'Auth.ts', type: 'file', desc: 'Verifica JWT de sesión del usuario' },
                ]
              }
            ]
          },
          {
            name: 'jobs/', type: 'dir', color: '#F59E0B',
            children: [
              { name: 'ExpirationJob.ts', type: 'file', desc: 'Cron cada 5 min · libera stock + presupuesto' },
            ]
          },
          {
            name: 'cart/', type: 'dir', color: '#F59E0B',
            children: [
              { name: 'CartAdapter.ts', type: 'file', desc: 'Adapta al carrito existente del e-commerce' },
            ]
          },
        ]
      },
      {
        name: 'shared/', type: 'dir', color: '#8B5CF6', desc: 'Utilidades transversales',
        children: [
          {
            name: 'crypto/', type: 'dir', color: '#8B5CF6',
            children: [
              { name: 'SecureRandom.ts', type: 'file', desc: 'Wrapper de crypto.randomInt' },
              { name: 'Hmac.ts', type: 'file', desc: 'hmacSha256, timingSafeEqual' },
            ]
          },
          {
            name: 'money/', type: 'dir', color: '#8B5CF6',
            children: [
              { name: 'Money.ts', type: 'file', desc: 'add, subtract, isAffordable' },
            ]
          },
          {
            name: 'logger/', type: 'dir', color: '#8B5CF6',
            children: [
              { name: 'AuditLogger.ts', type: 'file', desc: 'audit(event, actor, meta) → inmutable' },
            ]
          },
        ]
      },
    ]
  }
]

export function FolderStructure() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([
    'activation-engine/', 'domain/', 'application/', 'infrastructure/', 'shared/',
    'models/', 'services/', 'repositories/', 'use-cases/', 'ports/'
  ]))

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderNode = (node: TreeNode, depth = 0, parentPath = ''): React.ReactNode => {
    const key = parentPath + node.name
    const isExpanded = expanded.has(node.name) || expanded.has(key)
    const indent = depth * 16

    if (node.type === 'dir') {
      return (
        <div key={key}>
          <div
            onClick={() => toggle(node.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
              marginLeft: indent, transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1C2128')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 10, color: '#484F58', width: 12, textAlign: 'center', flexShrink: 0 }}>
              {isExpanded ? '▾' : '▸'}
            </span>
            <span style={{ fontSize: 13, color: node.color || '#8B949E', fontFamily: 'monospace', fontWeight: 600 }}>
              {node.name}
            </span>
            {node.desc && (
              <span style={{ fontSize: 10, color: '#484F58', marginLeft: 4 }}>← {node.desc}</span>
            )}
          </div>
          {isExpanded && node.children && (
            <div style={{ borderLeft: `1px solid #21262D`, marginLeft: indent + 14 }}>
              {node.children.map(child => renderNode(child, depth + 1, key))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={key} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', marginLeft: indent,
      }}>
        <span style={{ fontSize: 10, color: '#30363D', width: 12, textAlign: 'center', flexShrink: 0 }}>·</span>
        <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'monospace' }}>{node.name}</span>
        {node.desc && (
          <span style={{ fontSize: 10, color: '#484F58' }}>← {node.desc}</span>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6366F1', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊞ Estructura
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Carpetas del módulo</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Estructura DDD estricta. Click en carpeta para expandir/colapsar.
          Los archivos marcados con ⭐ son los más críticos del diseño.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#10B981', label: 'Domain' },
          { color: '#3B82F6', label: 'Application' },
          { color: '#F59E0B', label: 'Infrastructure' },
          { color: '#8B5CF6', label: 'Shared' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 11, color: '#8B949E' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{
        background: '#0D1117', border: '1px solid #30363D', borderRadius: 12,
        padding: '16px 8px', overflow: 'auto'
      }}>
        {TREE.map(node => renderNode(node))}
      </div>

      {/* Key files callout */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { file: 'ProbabilisticResolver.ts', note: 'Corazón del motor. crypto.randomInt + weighted table.', color: '#10B981' },
          { file: 'RequestActivation.ts', note: 'Orquestador. 10 pasos con lock distribuido.', color: '#3B82F6' },
          { file: 'TokenService.ts', note: 'HMAC-SHA256. timingSafeEqual para evitar timing attacks.', color: '#F59E0B' },
          { file: 'ExpirationJob.ts', note: 'Libera stock y presupuesto. Revoca tokens. Audita.', color: '#8B5CF6' },
        ].map(f => (
          <div key={f.file} style={{
            background: '#161B22', border: `1px solid ${f.color}33`,
            borderRadius: 8, padding: '10px 12px'
          }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: f.color, marginBottom: 4 }}>{f.file}</div>
            <div style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.4 }}>{f.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
