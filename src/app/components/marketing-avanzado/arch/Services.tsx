import { CodeBlock } from '../CodeBlock'

const CODE_RESOLVER = `// ── ProbabilisticResolver ─────────────────────────────────
// domain/services/ProbabilisticResolver.ts
// ⭐ NUNCA usar Math.random(). Siempre crypto.randomInt.

import { randomInt } from 'crypto' // Node.js built-in

class ProbabilisticResolver {

  resolve(rewards: Reward[], remainingBudget: Money): Reward | null {

    // ── Paso 1: filtrar elegibles (stock + presupuesto) ──
    const eligible = rewards.filter(r =>
      this.hasStock(r) && isAffordable(r.cost_estimate, remainingBudget)
    )

    if (eligible.length === 0) return null

    // ── Paso 2: construir tabla de pesos acumulados ──────
    const totalWeight = eligible.reduce((sum, r) => sum + r.probability_weight, 0)

    // ── Paso 3: roll seguro con crypto.randomInt ─────────
    //   randomInt(min, max) → entero en [min, max)
    //   es criptográficamente seguro, sin sesgos de floating point
    const roll = randomInt(0, totalWeight)

    // ── Paso 4: recorrer tabla → O(n), suficiente para ──
    //   casos reales (max ~20 premios por campaña)
    let cursor = 0
    for (const reward of eligible) {
      cursor += reward.probability_weight
      if (roll < cursor) return reward
    }

    // Nunca debería llegar aquí, pero por seguridad:
    return eligible[eligible.length - 1]
  }

  // Inyectar reglas dinámicas ANTES de resolver
  // (A/B testing, horario, historial del usuario, etc.)
  applyDynamicRules(
    rewards: Reward[],
    context: ResolutionContext
  ): Reward[] {
    return this.ruleEngine.apply(rewards, context)
    // Ejemplo de reglas:
    // - Si es primera compra → boost en peso del premio premium
    // - Entre 12:00-13:00 → flash sale, doblar pesos
    // - Variante A/B → filtrar premios por cohort
  }

  private hasStock(reward: Reward): boolean {
    return reward.stock_limit === null ||
           reward.stock_consumed < reward.stock_limit
  }
}`

const CODE_ELIGIBILITY = `// ── EligibilityService ────────────────────────────────────
// domain/services/EligibilityService.ts

interface EligibilityResult {
  eligible:        boolean
  reason?:         EligibilityFailReason
  remainingBudget?: Money
  activation?:     Activation   // si ya activó antes
}

type EligibilityFailReason =
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_INACTIVE'
  | 'CAMPAIGN_OUT_OF_RANGE'
  | 'BUDGET_EXHAUSTED'
  | 'DAILY_LIMIT_REACHED'
  | 'ALREADY_ACTIVATED'
  | 'RULE_FAILED'

class EligibilityService {

  async check(
    userId:     string,
    campaignId: string,
    context:    RequestContext
  ): Promise<EligibilityResult> {

    const campaign = await this.campaignRepo.findById(campaignId)
    if (!campaign) return fail('CAMPAIGN_NOT_FOUND')

    // 1. Estado de la campaña
    if (campaign.status !== 'active')
      return fail('CAMPAIGN_INACTIVE')

    // 2. Rango de fechas
    const now = new Date()
    if (now < campaign.start_at || now > campaign.end_at)
      return fail('CAMPAIGN_OUT_OF_RANGE')

    // 3. Presupuesto total disponible
    const remaining = subtract(campaign.budget_limit, campaign.budget_consumed)
    if (remaining.amount <= 0)
      return fail('BUDGET_EXHAUSTED')

    // 4. Límite diario (suma de cost_estimate de hoy)
    const todayConsumed = await this.activationRepo.sumCostToday(campaignId)
    if (todayConsumed.amount >= campaign.daily_limit.amount)
      return fail('DAILY_LIMIT_REACHED')

    // 5. Idempotencia: 1 activación por usuario/campaña
    const existing = await this.activationRepo
      .findByUserAndCampaign(userId, campaignId)
    if (existing)
      return fail('ALREADY_ACTIVATED', { activation: existing })

    // 6. Reglas de elegibilidad dinámicas
    const userCtx = await this.userService.getContext(userId)
    for (const rule of campaign.eligibility_rules) {
      if (!this.evaluateRule(rule, userCtx))
        return fail('RULE_FAILED', { rule })
    }

    return { eligible: true, remainingBudget: remaining }
  }

  private evaluateRule(rule: EligibilityRule, ctx: UserContext): boolean {
    const fieldValue = get(ctx, rule.field)
    switch (rule.operator) {
      case 'eq':     return fieldValue === rule.value
      case 'gt':     return fieldValue > (rule.value as number)
      case 'lt':     return fieldValue < (rule.value as number)
      case 'in':     return (rule.value as unknown[]).includes(fieldValue)
      case 'not_in': return !(rule.value as unknown[]).includes(fieldValue)
      default:       return false
    }
  }
}`

const CODE_TOKEN_SERVICE = `// ── TokenService ──────────────────────────────────────────
// domain/services/TokenService.ts

import { createHmac, timingSafeEqual } from 'crypto'

class TokenService {

  sign(activation: Activation, reward: Reward): string {
    const exp = Math.floor(activation.expires_at.getTime() / 1000)

    const payload: BenefitToken = {
      jti:         activation.id,
      sub:         activation.user_id,
      campaign_id: activation.campaign_id,
      reward_id:   reward.id,
      reward_type: reward.type,
      value:       reward.value,
      iat:         Math.floor(Date.now() / 1000),
      exp,
      sig:         '', // se rellena abajo
    }

    // Firma solo los campos críticos → compacta y eficiente
    const sigInput = [payload.jti, payload.sub, payload.reward_id, payload.exp].join('.')
    payload.sig = this.hmac(sigInput)

    return Buffer.from(JSON.stringify(payload)).toString('base64url')
  }

  verify(token: string): BenefitToken | null {
    try {
      const raw     = Buffer.from(token, 'base64url').toString('utf-8')
      const payload = JSON.parse(raw) as BenefitToken

      // 1. Expiración
      if (Math.floor(Date.now() / 1000) > payload.exp) return null

      // 2. Firma → timingSafeEqual previene timing attacks
      const sigInput  = [payload.jti, payload.sub, payload.reward_id, payload.exp].join('.')
      const expected  = this.hmac(sigInput)
      const isValid   = timingSafeEqual(
        Buffer.from(payload.sig),
        Buffer.from(expected)
      )
      if (!isValid) return null

      // 3. Revocación (Redis)
      const isRevoked = await this.cache.get(\`revoked:\${payload.jti}\`)
      if (isRevoked) return null

      return payload
    } catch {
      return null // cualquier error → token inválido
    }
  }

  async revoke(activationId: string): Promise<void> {
    // TTL = 90 días → cubre tokens de larga vigencia
    await this.cache.set(\`revoked:\${activationId}\`, '1', { ttl: 90 * 24 * 3600 })
  }

  private hmac(input: string): string {
    return createHmac('sha256', process.env.BENEFIT_TOKEN_SECRET!)
      .update(input)
      .digest('hex')
  }
}`

const CODE_CART = `// ── CartAdapter ───────────────────────────────────────────
// infrastructure/cart/CartAdapter.ts
// Implementa ICartPort del dominio → adapta al carrito propio del e-commerce

class CartAdapter implements ICartPort {

  async applyBenefit(orderId: string, token: string): Promise<CartResult> {

    // 1. Verificar token (firma + expiración + no revocado)
    const payload = await this.tokenService.verify(token)
    if (!payload) throw new InvalidTokenError('Token inválido o expirado')

    // 2. Verificar que la activación esté en estado 'resolved'
    const activation = await this.activationRepo.findById(payload.jti)
    if (activation.status !== 'resolved')
      throw new BenefitAlreadyUsedError()

    // 3. Aplicar según tipo de premio
    let result: CartResult
    switch (payload.reward_type) {
      case 'percentage':
        result = await this.cart.applyPercentageDiscount(
          orderId, payload.value as number
        )
        break

      case 'credit':
        result = await this.cart.applyCredit(orderId, {
          amount:   payload.value as number,
          currency: 'UYU',
        })
        break

      case 'product':
        result = await this.cart.addProduct(orderId, {
          sku:      payload.value as string,
          quantity: 1,
          price:    0,        // producto gratis
        })
        break

      case 'access':
        result = await this.cart.grantAccess(orderId, payload.value as string)
        break
    }

    // 4. Actualizar estado de la activación
    await this.activationRepo.markApplied(activation.id, orderId)
    await this.logger.audit('BENEFIT_APPLIED', payload.sub, { orderId, token: payload.jti })

    return result
  }

  async onOrderConfirmed(orderId: string, activationId: string): Promise<void> {
    await this.activationRepo.markConverted(activationId, orderId)
    await this.logger.audit('BENEFIT_CONVERTED', 'system', { orderId, activationId })
    await this.eventBus.publish(new BenefitConvertedEvent({ activationId, orderId }))
  }
}`

const CODE_EXPIRATION = `// ── ExpirationJob ─────────────────────────────────────────
// infrastructure/jobs/ExpirationJob.ts
// Cron cada 5 minutos. Libera recursos de activaciones vencidas.

class ExpirationJob {

  @Cron('*/5 * * * *')
  async run(): Promise<void> {

    // Buscar activaciones en estado 'resolved' cuyo expires_at ya pasó
    const expired = await this.activationRepo.findExpired()

    this.logger.info(\`ExpirationJob: \${expired.length} activaciones a expirar\`)

    for (const activation of expired) {

      // Transacción atómica: liberar todo o nada
      await this.db.transaction(async (trx) => {

        // 1. Liberar stock del premio
        if (activation.reward_id) {
          await this.rewardRepo.atomicDecrementStock(
            activation.reward_id, { trx }
          )

          // 2. Liberar presupuesto consumido
          const reward = await this.rewardRepo.findById(activation.reward_id)
          await this.campaignRepo.atomicSubtractCost(
            activation.campaign_id, reward.cost_estimate, { trx }
          )
        }

        // 3. Revocar token en Redis (evita uso tardío)
        if (activation.token) {
          await this.tokenService.revoke(activation.id)
        }

        // 4. Marcar como expirada en DB
        await this.activationRepo.markExpired(activation.id, { trx })
      })

      // 5. Emitir evento de dominio
      await this.eventBus.publish(new BenefitExpiredEvent({
        activation_id: activation.id,
        user_id:       activation.user_id,
        campaign_id:   activation.campaign_id,
      }))

      await this.logger.audit('BENEFIT_EXPIRED', 'system', {
        activation_id: activation.id,
      })
    }
  }
}`

export function Services() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⚙ Servicios
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Servicios principales</h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Los 5 servicios críticos del motor. Cada uno tiene una responsabilidad única y bien definida.
        </p>
      </div>

      <ServiceSection
        num="01"
        title="ProbabilisticResolver"
        file="domain/services/ProbabilisticResolver.ts"
        color="#10B981"
        desc="Resuelve qué premio gana un usuario usando weighted random seguro. Filtra por stock y presupuesto antes de sortear. Soporta reglas dinámicas para A/B testing."
      >
        <CodeBlock code={CODE_RESOLVER} badge="Domain Service" badgeColor="#10B981" />
      </ServiceSection>

      <ServiceSection
        num="02"
        title="EligibilityService"
        file="domain/services/EligibilityService.ts"
        color="#6366F1"
        desc="Valida que el usuario pueda activar: campaña activa, fechas, presupuesto, límite diario, 1 por usuario y reglas dinámicas. Retorna el presupuesto restante para el resolver."
      >
        <CodeBlock code={CODE_ELIGIBILITY} badge="Domain Service" badgeColor="#6366F1" />
      </ServiceSection>

      <ServiceSection
        num="03"
        title="TokenService"
        file="domain/services/TokenService.ts"
        color="#F59E0B"
        desc="Firma, verifica y revoca tokens de beneficio. Usa HMAC-SHA256 con timingSafeEqual para prevenir timing attacks. Revocación en O(1) via Redis."
      >
        <CodeBlock code={CODE_TOKEN_SERVICE} badge="Domain Service" badgeColor="#F59E0B" />
      </ServiceSection>

      <ServiceSection
        num="04"
        title="CartAdapter"
        file="infrastructure/cart/CartAdapter.ts"
        color="#3B82F6"
        desc="Adapta el motor al carrito del e-commerce. Implementa ICartPort del dominio. Maneja los 4 tipos de premio: porcentaje, crédito, producto y acceso."
      >
        <CodeBlock code={CODE_CART} badge="Infra Adapter" badgeColor="#3B82F6" />
      </ServiceSection>

      <ServiceSection
        num="05"
        title="ExpirationJob"
        file="infrastructure/jobs/ExpirationJob.ts"
        color="#8B5CF6"
        desc="Job cron cada 5 min. Libera stock, presupuesto y revoca tokens de activaciones vencidas. Usa transacciones atómicas para garantizar consistencia."
      >
        <CodeBlock code={CODE_EXPIRATION} badge="Infra Job" badgeColor="#8B5CF6" />
      </ServiceSection>
    </div>
  )
}

function ServiceSection({ num, title, file, color, desc, children }: {
  num: string
  title: string
  file: string
  color: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #21262D' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
        <div style={{
          fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#30363D',
          minWidth: 24, paddingTop: 3
        }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color, margin: 0 }}>{title}</h3>
            <span style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace' }}>{file}</span>
          </div>
          <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.6, margin: '6px 0 0' }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
