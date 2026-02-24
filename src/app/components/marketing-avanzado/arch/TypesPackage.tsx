import { useState } from 'react'
import { CodeBlock } from '../CodeBlock'

const CODE_PKG_JSON = `{
  "name": "@oddy/activation-engine-types",
  "version": "1.0.0",
  "description": "Shared TypeScript interfaces for Activation Engine",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types":   "./dist/index.d.ts"
    },
    "./models":  "./dist/models/index.d.ts",
    "./ports":   "./dist/ports/index.d.ts",
    "./events":  "./dist/events/index.d.ts"
  },
  "files": ["dist"],
  "scripts": {
    "build":   "tsup src/index.ts --format esm,cjs --dts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup":       "^8.0.0",
    "typescript": "^5.4.0"
  }
}`

const CODE_INDEX = `// src/index.ts — barrel export principal
// Importar solo lo que necesitás:
// import type { Campaign, Reward } from '@oddy/activation-engine-types'
// import type { ICartPort }        from '@oddy/activation-engine-types/ports'

// ── Modelos de dominio ────────────────────────────────────
export type {
  Money,
  MechanicType,
  CampaignStatus,
  EligibilityRule,
  Campaign,
} from './models/Campaign'

export type {
  RewardType,
  Reward,
} from './models/Reward'

export type {
  ActivationStatus,
  AuditEntry,
  Activation,
} from './models/Activation'

export type {
  BenefitToken,
} from './models/BenefitToken'

// ── DTOs (Application layer) ──────────────────────────────
export type {
  ActivationRequest,
  ActivationResult,
} from './dto/ActivationRequest'

// ── Ports (interfaces hacia infraestructura) ──────────────
export type {
  ICartPort,
  CartResult,
} from './ports/ICartPort'

export type {
  ICachePort,
  LockToken,
} from './ports/ICachePort'

export type {
  IEventBusPort,
  DomainEvent,
} from './ports/IEventBusPort'

// ── Errores de dominio ────────────────────────────────────
export {
  DomainError,
  IneligibleError,
  TooManyRequestsError,
  InvalidTokenError,
  BenefitAlreadyUsedError,
  ConcurrentActivationError,
  EligibilityFailReason,
} from './errors/DomainErrors'`

const CODE_MODELS_CAMPAIGN = `// src/models/Campaign.ts
export type MechanicType =
  | 'wheel' | 'scratch_card' | 'coupon' | 'direct' | 'ab_test'

export type CampaignStatus =
  | 'draft' | 'active' | 'paused' | 'ended'

export interface EligibilityRule {
  field:    string
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in'
  value:    unknown
}

export interface Money {
  readonly amount:   number
  readonly currency: string
}

export interface Campaign {
  id:                string
  name:              string
  mechanic:          MechanicType
  status:            CampaignStatus
  start_at:          Date
  end_at:            Date
  budget_limit:      Money
  daily_limit:       Money
  budget_consumed:   Money
  eligibility_rules: EligibilityRule[]
  rewards:           Reward[]      // import circular resuelto via index.ts
  ab_variant?:       string
  metadata:          Record<string, unknown>
  created_at:        Date
  updated_at:        Date
}`

const CODE_ERRORS = `// src/errors/DomainErrors.ts
// Errores tipados → el frontend puede reaccionar a cada uno

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export enum EligibilityFailReason {
  CAMPAIGN_NOT_FOUND    = 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_INACTIVE     = 'CAMPAIGN_INACTIVE',
  CAMPAIGN_OUT_OF_RANGE = 'CAMPAIGN_OUT_OF_RANGE',
  BUDGET_EXHAUSTED      = 'BUDGET_EXHAUSTED',
  DAILY_LIMIT_REACHED   = 'DAILY_LIMIT_REACHED',
  ALREADY_ACTIVATED     = 'ALREADY_ACTIVATED',
  RULE_FAILED           = 'RULE_FAILED',
}

export class IneligibleError extends DomainError {
  constructor(
    public readonly reason: EligibilityFailReason,
    public readonly extra?: Record<string, unknown>
  ) {
    super(\`User is not eligible: \${reason}\`, 'INELIGIBLE')
  }
}

export class TooManyRequestsError extends DomainError {
  constructor() { super('Rate limit exceeded', 'TOO_MANY_REQUESTS') }
}

export class InvalidTokenError extends DomainError {
  constructor(detail?: string) { super(detail ?? 'Invalid token', 'INVALID_TOKEN') }
}

export class BenefitAlreadyUsedError extends DomainError {
  constructor() { super('Benefit already applied or expired', 'BENEFIT_ALREADY_USED') }
}

export class ConcurrentActivationError extends DomainError {
  constructor() { super('Concurrent activation detected', 'CONCURRENT_ACTIVATION') }
}`

const CODE_USAGE_BACKEND = `// Backend (NestJS / Express) — importa los tipos del paquete
import type {
  Campaign,
  Reward,
  ActivationRequest,
  ActivationResult,
} from '@oddy/activation-engine-types'

import {
  IneligibleError,
  TooManyRequestsError,
  EligibilityFailReason,
} from '@oddy/activation-engine-types'

// El backend implementa los Ports usando las interfaces:
import type { ICartPort } from '@oddy/activation-engine-types/ports'

class CartAdapter implements ICartPort {
  async applyBenefit(orderId: string, token: string): CartResult {
    // implementación concreta aquí
  }
}`

const CODE_USAGE_FRONTEND = `// Frontend (React / Next.js) — solo tipos, zero runtime overhead
import type { ActivationResult, RewardType } from '@oddy/activation-engine-types'

// Los tipos no se incluyen en el bundle (son solo import type)
// El frontend solo ve el RESULTADO, nunca los pesos ni la lógica

interface WheelProps {
  onSpin: () => Promise<ActivationResult>
}

function WheelUI({ onSpin }: WheelProps) {
  const [result, setResult] = useState<ActivationResult | null>(null)

  const handleSpin = async () => {
    // La UI llama al backend → recibe solo el resultado final
    // NUNCA recibe los probability_weights de los premios
    const res = await onSpin()
    setResult(res)
    animateWheel(res)   // usa res.reward_type y res.has_reward para la animación
  }
}`

const CODE_TSCONFIG = `// tsconfig.json del paquete
{
  "compilerOptions": {
    "target":            "ES2020",
    "module":            "ESNext",
    "moduleResolution":  "bundler",
    "declaration":       true,
    "declarationMap":    true,
    "strict":            true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "outDir":            "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}`

const PACKAGE_STRUCTURE = [
  { name: '@oddy/activation-engine-types/', dir: true, color: '#6366F1' },
  { name: '  src/', dir: true, color: '#6366F1' },
  { name: '    index.ts', note: 'barrel — re-exporta todo' },
  { name: '    models/', dir: true, color: '#10B981' },
  { name: '      Campaign.ts', note: 'Money, EligibilityRule, Campaign' },
  { name: '      Reward.ts', note: 'RewardType, Reward' },
  { name: '      Activation.ts', note: 'ActivationStatus, AuditEntry, Activation' },
  { name: '      BenefitToken.ts', note: 'BenefitToken (payload firmado)' },
  { name: '    dto/', dir: true, color: '#3B82F6' },
  { name: '      ActivationRequest.ts', note: 'Input y Output del caso de uso' },
  { name: '    ports/', dir: true, color: '#F59E0B' },
  { name: '      ICartPort.ts', note: 'applyBenefit, onOrderConfirmed' },
  { name: '      ICachePort.ts', note: 'get, set, incr, lock/unlock' },
  { name: '      IEventBusPort.ts', note: 'publish<T extends DomainEvent>' },
  { name: '    errors/', dir: true, color: '#EF4444' },
  { name: '      DomainErrors.ts', note: 'IneligibleError, TooManyRequestsError…' },
  { name: '  package.json', note: 'tsup build · exports map · no runtime deps' },
  { name: '  tsconfig.json', note: 'strict + noUncheckedIndexedAccess' },
]

const TABS = [
  { id: 'structure', label: 'Estructura' },
  { id: 'pkg',       label: 'package.json' },
  { id: 'index',     label: 'index.ts' },
  { id: 'models',    label: 'Modelos' },
  { id: 'errors',    label: 'Errores' },
  { id: 'backend',   label: 'Uso Backend' },
  { id: 'frontend',  label: 'Uso Frontend' },
  { id: 'tsconfig',  label: 'tsconfig' },
]

export function TypesPackage() {
  const [tab, setTab] = useState('structure')

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6366F1', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⬡ Types Package
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          @oddy/activation-engine-types
        </h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Paquete npm privado con todas las interfaces TypeScript del dominio.
          Zero dependencias en runtime — solo tipos. Compartido entre backend y frontend
          sin exponer lógica de negocio.
        </p>

        {/* Key points */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: '0 deps runtime',     color: '#10B981' },
            { label: 'dual ESM + CJS',     color: '#3B82F6' },
            { label: 'strict TypeScript',  color: '#F59E0B' },
            { label: 'exports map',        color: '#8B5CF6' },
          ].map(b => (
            <span key={b.label} style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
              padding: '3px 10px', borderRadius: 20,
              background: b.color + '18', border: `1px solid ${b.color}44`,
              color: b.color,
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 16, flexWrap: 'wrap',
        borderBottom: '1px solid #21262D', paddingBottom: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 14px', fontSize: 11, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t.id ? '#E6EDF3' : '#8B949E',
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid #6366F1' : '2px solid transparent',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'structure' && (
        <div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, marginBottom: 12 }}>
            El paquete contiene solo interfaces y tipos. Ningún archivo importa librerías externas.
            Se publica en el registry npm privado de la organización (<code style={{ fontSize: 11, background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>@oddy</code>).
          </p>
          <div style={{
            background: '#0D1117', border: '1px solid #30363D',
            borderRadius: 10, padding: '16px 20px',
          }}>
            {PACKAGE_STRUCTURE.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '2px 0' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 12,
                  color: item.dir ? (item.color ?? '#8B949E') : '#8B949E',
                  fontWeight: item.dir ? 600 : 400,
                }}>{item.name}</span>
                {item.note && (
                  <span style={{ fontSize: 10, color: '#484F58' }}>← {item.note}</span>
                )}
              </div>
            ))}
          </div>

          {/* Versioning note */}
          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', marginBottom: 6 }}>
              Estrategia de versionado (SemVer estricto)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { bump: 'patch 1.0.x', when: 'Agregar campo opcional a una interfaz' },
                { bump: 'minor 1.x.0', when: 'Nueva interfaz o nuevo tipo exportado' },
                { bump: 'major x.0.0', when: 'Renombrar campo, cambiar tipo, remover export' },
              ].map(row => (
                <div key={row.bump} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <code style={{
                    fontSize: 10, background: '#161B22', padding: '1px 6px', borderRadius: 4,
                    color: '#A5B4FC', fontFamily: 'monospace', flexShrink: 0, minWidth: 80,
                  }}>{row.bump}</code>
                  <span style={{ fontSize: 11, color: '#8B949E' }}>{row.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'pkg'       && <CodeBlock code={CODE_PKG_JSON}       title="package.json"                badge="npm"      badgeColor="#EF4444" />}
      {tab === 'index'     && <CodeBlock code={CODE_INDEX}          title="src/index.ts"                badge="Barrel"   badgeColor="#6366F1" />}
      {tab === 'models'    && <CodeBlock code={CODE_MODELS_CAMPAIGN} title="src/models/Campaign.ts"     badge="Models"   badgeColor="#10B981" />}
      {tab === 'errors'    && <CodeBlock code={CODE_ERRORS}         title="src/errors/DomainErrors.ts"  badge="Errors"   badgeColor="#EF4444" />}
      {tab === 'backend'   && <CodeBlock code={CODE_USAGE_BACKEND}  title="Uso en backend (NestJS)"     badge="Backend"  badgeColor="#3B82F6" />}
      {tab === 'frontend'  && <CodeBlock code={CODE_USAGE_FRONTEND} title="Uso en frontend (React)"     badge="Frontend" badgeColor="#F59E0B" />}
      {tab === 'tsconfig'  && <CodeBlock code={CODE_TSCONFIG}       title="tsconfig.json"               badge="TS"       badgeColor="#8B5CF6" />}
    </div>
  )
}
