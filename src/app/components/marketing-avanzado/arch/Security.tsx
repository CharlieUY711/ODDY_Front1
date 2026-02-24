import { CodeBlock } from '../CodeBlock'

const CODE_RATE_LIMIT = `// ── Rate Limiter (Sliding Window con Redis) ───────────────
// infrastructure/http/middleware/RateLimiter.ts

const SLIDING_WINDOW_LUA = \`
  local key    = KEYS[1]
  local now    = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit  = tonumber(ARGV[3])

  -- Eliminar entradas fuera de la ventana
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

  -- Contar entradas actuales
  local count = redis.call('ZCARD', key)

  if count < limit then
    -- Agregar timestamp actual (score = timestamp, member = timestamp+random)
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return count + 1
  end

  return limit + 1  -- señal de límite superado
\`

async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const key    = \`ratelimit:activate:\${req.ip}\`
  const now    = Date.now()
  const window = 60_000  // 1 minuto en ms
  const limit  = 5       // 5 activaciones por minuto por IP

  const count = await redis.eval(
    SLIDING_WINDOW_LUA, 1, key,
    now.toString(), window.toString(), limit.toString()
  )

  if (Number(count) > limit) {
    res.set('Retry-After', '60')
    res.status(429).json({
      error:       'TOO_MANY_REQUESTS',
      retry_after: 60,
    })
    return
  }

  next()
}`

const CODE_IDEMPOTENCY = `// ── Idempotencia ─────────────────────────────────────────
// Garantía de exactamente-una-vez a nivel de aplicación Y base de datos

// Nivel 1: Cache (respuesta rápida para retries)
const idempKey = hmacSha256(\`\${userId}:\${campaignId}\`, IDEM_SECRET)
const cached   = await cache.get(\`idem:\${idempKey}\`)
if (cached) return JSON.parse(cached)  // sin tocar DB

// Nivel 2: DB constraint (último recurso)
// En la tabla 'activations':
//
// CREATE UNIQUE INDEX idx_activation_idempotency
//   ON activations (idempotency_key)
//
// Si hay INSERT con key duplicada → retorna el registro existente
// Nunca lanza error al cliente: es transparente

// Nivel 3: Lock distribuido (previene race conditions)
const lock = await redlock.acquire([\`lock:activation:\${userId}:\${campaignId}\`], 5000)
// → si otro proceso tiene el lock, falla inmediatamente
// → garantiza serialización de activaciones concurrentes del mismo usuario`

const CODE_AUDIT = `// ── Audit Log ────────────────────────────────────────────
// shared/logger/AuditLogger.ts
// Append-only. Nunca update, nunca delete.

class AuditLogger {
  async audit(
    event:    string,
    actor:    string,    // user_id o 'system'
    metadata: Record<string, unknown>
  ): Promise<void> {

    const entry: AuditEntry = {
      id:        uuidv7(),
      timestamp: new Date(),
      event,
      actor,
      metadata,
      // Hash del contenido para detectar manipulación
      integrity: sha256(JSON.stringify({ event, actor, metadata })),
    }

    // Escribe en tabla de auditoría (solo INSERT, nunca UPDATE/DELETE)
    await this.auditRepo.insert(entry)

    // También en structured logs para Datadog/CloudWatch
    this.structuredLogger.info({ type: 'AUDIT', ...entry })
  }
}

// Eventos auditados:
// ACTIVATION_REQUESTED   → ip, user_agent, campaign_id
// ACTIVATION_RESOLVED    → reward_id, mechanic
// BENEFIT_APPLIED        → order_id, token_jti
// BENEFIT_CONVERTED      → order_id, amount
// BENEFIT_EXPIRED        → activation_id
// RATE_LIMIT_HIT         → ip, count
// INVALID_TOKEN_ATTEMPT  → ip, token_hash`

const MEASURES = [
  {
    icon: '⚡',
    title: 'Rate Limit por IP',
    color: '#EF4444',
    points: [
      '5 activaciones por minuto por IP',
      'Sliding window (no fixed window)',
      'Responde 429 con Retry-After: 60',
      'Redis ZADD atómico via Lua script',
    ],
  },
  {
    icon: '🔑',
    title: 'Firma HMAC-SHA256',
    color: '#F59E0B',
    points: [
      'Token autónomo: sin consulta a DB para verificar',
      'timingSafeEqual previene timing attacks',
      'Secreto en env var, rotación periódica',
      'Revocación en Redis O(1)',
    ],
  },
  {
    icon: '🔒',
    title: 'Idempotencia triple',
    color: '#10B981',
    points: [
      'Cache: HMAC(userId+campaignId) → respuesta rápida',
      'Lock distribuido: Redlock 5s evita race condition',
      'DB: UNIQUE constraint como último recurso',
      'Double-check dentro del lock',
    ],
  },
  {
    icon: '🎲',
    title: 'Randomness seguro',
    color: '#6366F1',
    points: [
      'crypto.randomInt() de Node.js built-in',
      'Nunca Math.random() (predecible)',
      'Resultado 100% en backend, nunca en frontend',
      'No exponer pesos a la UI',
    ],
  },
  {
    icon: '📋',
    title: 'Auditoría completa',
    color: '#3B82F6',
    points: [
      'Append-only: nunca UPDATE/DELETE',
      'Hash de integridad por entrada',
      'Todos los eventos críticos logueados',
      'IP + user_agent en cada activación',
    ],
  },
  {
    icon: '🛡',
    title: 'Validación en cascada',
    color: '#8B5CF6',
    points: [
      'Auth middleware → rate limit → eligibility',
      'Verificar token antes de aplicar beneficio',
      'Estado del carrito verificado antes de aplicar',
      'Transacciones atómicas en reserve de stock',
    ],
  },
]

export function Security() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#EF4444', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⊕ Seguridad
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Seguridad & Antifraude</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Seis capas de protección. La ruleta es solo UI: el resultado siempre lo decide el backend.
        </p>
      </div>

      {/* Measure cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
        {MEASURES.map(m => (
          <div key={m.title} style={{
            background: '#161B22', border: `1px solid ${m.color}33`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.title}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 14 }}>
              {m.points.map(p => (
                <li key={p} style={{ fontSize: 11, color: '#8B949E', lineHeight: 1.6, marginBottom: 2 }}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#8B949E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8
      }}>
        <div style={{ width: 16, height: 1, background: '#30363D' }} />
        Implementación
        <div style={{ flex: 1, height: 1, background: '#30363D' }} />
      </div>

      <CodeBlock code={CODE_RATE_LIMIT} title="middleware/RateLimiter.ts — Sliding Window" badge="Redis Lua" badgeColor="#EF4444" />
      <CodeBlock code={CODE_IDEMPOTENCY} title="Garantía de exactamente-una-vez (3 niveles)" badge="Idempotencia" badgeColor="#10B981" />
      <CodeBlock code={CODE_AUDIT} title="shared/logger/AuditLogger.ts" badge="Audit" badgeColor="#3B82F6" />

      {/* Attack surface callout */}
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ⚠ Superficie de ataque principal
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { attack: 'Replay de token', mitigacion: 'Redis revocation + exp claim + estado en DB' },
            { attack: 'Race condition / doble activación', mitigacion: 'Redlock + double-check + UNIQUE constraint' },
            { attack: 'Fuerza bruta para ganar', mitigacion: 'Rate limit 5/min + resultado 100% en backend' },
            { attack: 'Manipular probabilidades', mitigacion: 'Pesos nunca expuestos a frontend, solo resultado final' },
            { attack: 'Inyección / token forjado', mitigacion: 'HMAC-SHA256 con secret + timingSafeEqual' },
          ].map(row => (
            <div key={row.attack} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, color: '#FCA5A5', fontFamily: 'monospace', flexShrink: 0, minWidth: 200 }}>
                {row.attack}
              </span>
              <span style={{ fontSize: 11, color: '#8B949E' }}>→ {row.mitigacion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
