/* =====================================================
   Utilidades de Validación y Seguridad
   Charlie Marketplace Builder v1.5
   ===================================================== */

// ── Validación de UUID ─────────────────────────────────────────────────
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ── Sanitización de strings ────────────────────────────────────────────
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  // Remover caracteres peligrosos y limitar longitud
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim()
    .substring(0, maxLength);
}

// ── Validación de email ────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ── Validación de precio ───────────────────────────────────────────────
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && price < 100000000; // Max 100 millones
}

// ── Validación de rating ──────────────────────────────────────────────
export function isValidRating(rating: number): boolean {
  return typeof rating === 'number' && rating >= 0 && rating <= 5;
}

// ── Validación de URL ──────────────────────────────────────────────────
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// ── Validación de JSON array de URLs ───────────────────────────────────
export function isValidURLArray(urls: unknown): boolean {
  if (!Array.isArray(urls)) return false;
  return urls.every(url => typeof url === 'string' && isValidURL(url));
}

// ── Validación de estado ───────────────────────────────────────────────
export function isValidEstado(estado: string, allowed: string[]): boolean {
  return typeof estado === 'string' && allowed.includes(estado);
}

// ── Validación de departamento ────────────────────────────────────────────
export function isValidDepartamento(nombre: string): boolean {
  const allowed = [
    'Celulares', 'Electro', 'Hogar', 'Mascotas', 'Moda', 'Deporte',
    'Almacén', 'Motos', 'Limpieza', 'Salud', 'Ferretería', 'Librería',
    'Bebés', 'Gaming', 'Jardín', 'Autos', 'Belleza', 'Delivery'
  ];
  return allowed.includes(nombre);
}

// ── Validación de condición (Second Hand) ─────────────────────────────
export function isValidCondicion(condicion: string): boolean {
  const allowed = ['Excelente', 'Muy bueno', 'Bueno', 'Regular', 'Aceptable'];
  return allowed.includes(condicion);
}

// ── Rate limiting simple (en memoria) ──────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// ── Obtener IP del request ────────────────────────────────────────────
export function getClientIP(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
         c.req.header('x-real-ip') ||
         'unknown';
}

// ── Validación de paginación ───────────────────────────────────────────
export function validatePagination(limit?: string, offset?: string): { limit: number; offset: number } {
  const lim = limit ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100) : 50;
  const off = offset ? Math.max(parseInt(offset, 10) || 0, 0) : 0;
  return { limit: lim, offset: off };
}

// ── Validación de ordenamiento ────────────────────────────────────────
export function validateOrderBy(orderBy: string, allowed: string[]): string {
  return allowed.includes(orderBy) ? orderBy : allowed[0];
}

export function validateOrderDir(orderDir: string): 'asc' | 'desc' {
  return orderDir === 'asc' ? 'asc' : 'desc';
}

// ── Logging de seguridad ───────────────────────────────────────────────
export function logSecurityEvent(
  type: 'unauthorized' | 'invalid_input' | 'rate_limit' | 'error',
  details: Record<string, unknown>
): void {
  console.log(`[SECURITY] ${type.toUpperCase()}:`, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...details,
  }));
}
