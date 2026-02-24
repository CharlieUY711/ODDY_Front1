/* =====================================================
   Catalog Extractor — Extracción de productos desde catálogos
   Usa Claude Vision API para extraer datos estructurados
   Soporta: URL (ScreenshotOne) y archivos (PDF/imagen)
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { Hono } from "npm:hono";

export const catalogExtractor = new Hono();

const SYSTEM_PROMPT = `Sos un experto en extracción de datos de catálogos de productos para eCommerce.
Analizás imágenes de catálogos (páginas web, PDFs, fotos) y extraés TODOS los productos visibles.

REGLAS:
1. Extraé TODOS los productos sin excepción.
2. Las columnas deben ser CONSISTENTES en todos los productos. Si un campo no existe para un producto, usá null.
3. Nombres de columnas: sin espacios, en español, snake_case (ej: precio_uy, nombre, categoria).
4. Valores: solo strings o números. Sin objetos anidados.
5. Para páginas web: extraé nombre, precio, categoría, marca, descripción corta, URL de imagen si está visible, disponibilidad.
6. No inventes datos. Si no podés leer un valor con certeza, usá null.
7. Los precios deben incluir la moneda si está visible (ej: "$1.200" o "USD 45").

CRÍTICO - FORMATO DE RESPUESTA:
Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido. 
NO incluyas texto antes del JSON, texto después del JSON, explicaciones, comentarios, markdown o saltos de línea antes o después del JSON.

Tu respuesta debe empezar EXACTAMENTE con { y terminar EXACTAMENTE con }.

Formato exacto (copiá esto exactamente, solo cambiando los valores):
{"products":[{"nombre":"...","precio":"...","categoria":"...","marca":"...","descripcion":"..."}]}`;

/* ── Screenshot via ScreenshotOne ───────────────────────────────────────── */
async function takeScreenshot(url: string, apiKey: string): Promise<string> {
  const params = new URLSearchParams({
    access_key: apiKey,
    url: url,
    full_page: "true",          // captura toda la página con scroll
    format: "png",
    viewport_width: "1440",
    viewport_height: "900",
    device_scale_factor: "1",
    delay: "2",                 // espera 2s para que cargue JS
    block_ads: "true",
    block_cookie_banners: "true", // ignora banners de cookies
  });

  const screenshotUrl = `https://api.screenshotone.com/take?${params}`;
  const res = await fetch(screenshotUrl);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ScreenshotOne error ${res.status}: ${text.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const binary = Array.from(buffer, byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/* ── Llamada a Claude Vision ────────────────────────────────────────────── */
async function callClaude(base64Images: string[], anthropicKey: string): Promise<Record<string, unknown>[]> {
  const imageContent = base64Images.map((b64) => ({
    type: "image",
    source: { type: "base64", media_type: "image/png", data: b64 },
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: "Extraé todos los productos visibles. Respondé ÚNICAMENTE con el JSON, sin texto adicional, sin markdown, sin explicaciones. El JSON debe empezar con { y terminar con }." },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API ${res.status}: ${(err as { error?: { message?: string } })?.error?.message || "error desconocido"}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text?: string }> };
  const text = data.content.find((b) => b.type === "text")?.text || "";
  
  // Limpiar markdown code blocks y espacios iniciales
  let cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .replace(/^\s+/, "") // Eliminar espacios al inicio
    .trim();
  
  // Buscar el JSON válido - encontrar el primer { y el último } balanceado
  let firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error("No se encontró JSON en la respuesta de Claude");
  }
  
  // Encontrar el último } que cierra el objeto principal contando llaves balanceadas
  let braceCount = 0;
  let lastBrace = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = firstBrace; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
  }
  
  if (lastBrace === -1) {
    // Si no encontramos el cierre balanceado, usar el último }
    lastBrace = cleaned.lastIndexOf('}');
  }
  
  if (lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("JSON no balanceado en la respuesta de Claude");
  }
  
  // Extraer solo el JSON válido
  let clean = cleaned.substring(firstBrace, lastBrace + 1);
  
  // Limpiar caracteres de control invisibles pero mantener el JSON válido
  // Solo eliminar caracteres que definitivamente no son parte de JSON válido
  clean = clean
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Eliminar caracteres de control
    .trim();
  
  // Asegurar que empiece con { y termine con }
  if (!clean.startsWith('{')) {
    const firstBraceInClean = clean.indexOf('{');
    if (firstBraceInClean !== -1) {
      clean = clean.substring(firstBraceInClean);
    }
  }
  
  if (!clean.endsWith('}')) {
    const lastBraceInClean = clean.lastIndexOf('}');
    if (lastBraceInClean !== -1) {
      clean = clean.substring(0, lastBraceInClean + 1);
    }
  }
  
  // DEBUG: Log temporal para ver qué está devolviendo Claude
  console.log("=== DEBUG Claude Response ===");
  console.log("Texto original (primeros 500 chars):", text.substring(0, 500));
  console.log("Texto limpiado (primeros 500 chars):", cleaned.substring(0, 500));
  console.log("JSON extraído (primeros 500 chars):", clean.substring(0, 500));
  console.log("Primeros 20 caracteres del JSON:", clean.substring(0, 20));
  console.log("Últimos 20 caracteres del JSON:", clean.substring(Math.max(0, clean.length - 20)));
  
  try {
    // Intentar parsear directamente
    const parsed = JSON.parse(clean) as { products?: Record<string, unknown>[] };
    if (parsed.products && Array.isArray(parsed.products)) {
      return parsed.products;
    }
    // Si no tiene products, intentar como array directo
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (parseErr) {
    console.log("=== ERROR en parsing ===");
    console.log("Error:", parseErr);
    console.log("JSON que falló (primeros 200 chars):", clean.substring(0, 200));
    console.log("JSON que falló (últimos 200 chars):", clean.substring(Math.max(0, clean.length - 200)));
    
    // Si falla, intentar extraer solo el objeto JSON más interno
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { products?: Record<string, unknown>[] };
        if (parsed.products && Array.isArray(parsed.products)) {
          return parsed.products;
        }
      } catch {
        // Continuar con las estrategias de fallback
      }
    }
    // Intentar múltiples estrategias de extracción
    const strategies = [
      // Estrategia 1: Buscar el objeto JSON más grande
      () => {
        const matches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (matches) {
          return matches.sort((a, b) => b.length - a.length)[0]; // El más largo
        }
        return null;
      },
      // Estrategia 2: Buscar entre las primeras llaves
      () => {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          return text.substring(firstBrace, lastBrace + 1);
        }
        return null;
      },
      // Estrategia 3: Buscar productos específicamente
      () => {
        const productsMatch = text.match(/"products"\s*:\s*\[[\s\S]*?\]/);
        if (productsMatch) {
          return `{${productsMatch[0]}}`;
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      try {
        const extracted = strategy();
        if (extracted) {
          const parsed = JSON.parse(extracted) as { products?: Record<string, unknown>[] };
          if (parsed.products) {
            return parsed.products;
          }
        }
      } catch {
        // Continuar con la siguiente estrategia
      }
    }
    
    // Si todas las estrategias fallan, lanzar error con contexto
    throw new Error(
      `Respuesta de Claude no es JSON válido. ` +
      `Error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}. ` +
      `Primeros 300 chars del texto: ${text.substring(0, 300)}`
    );
  }
}

/* ────────────────────────────────────────────────────
   POST /catalog-extractor
   Recibe URL o archivo (PDF/imagen) y extrae productos usando Claude Vision
   ──────────────────────────────────────────────────── */
catalogExtractor.post("/", async (c) => {
  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const screenshotKey = Deno.env.get("SCREENSHOTONE_API_KEY");

    if (!anthropicKey) {
      return c.json({ ok: false, error: "ANTHROPIC_API_KEY no configurada en el servidor." }, 500);
    }

    const formData = await c.req.formData();
    const mode = formData.get("mode") as string || "file";

    let base64Images: string[] = [];

    // ── Modo URL ──────────────────────────────────────────────────────────────
    if (mode === "url") {
      const targetUrl = formData.get("url") as string;
      if (!targetUrl) {
        return c.json({ ok: false, error: "No se recibió URL." }, 400);
      }
      if (!screenshotKey) {
        return c.json({ 
          ok: false, 
          error: "SCREENSHOTONE_API_KEY no configurada. Creá una cuenta gratis en screenshotone.com" 
        }, 500);
      }

      const b64 = await takeScreenshot(targetUrl, screenshotKey);
      base64Images = [b64];
    }

    // ── Modo archivo ──────────────────────────────────────────────────────────
    else {
      const file = formData.get("file") as File | null;
      if (!file) {
        return c.json({ ok: false, error: "No se recibió archivo." }, 400);
      }

      const mimeType = file.type;
      const isImage = mimeType.startsWith("image/");
      const isPDF = mimeType === "application/pdf";

      if (!isImage && !isPDF) {
        return c.json({ ok: false, error: "Formato no soportado. Usá PDF, PNG, JPG o WEBP." }, 400);
      }

      if (isImage) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const binary = Array.from(buffer, byte => String.fromCharCode(byte)).join('');
        base64Images = [btoa(binary)];
      } else if (isPDF) {
        // Para PDFs, el cliente debe convertirlos a imágenes antes de enviarlos
        // Esto se maneja en el componente CatalogExtractorWorkspace
        return c.json({ 
          ok: false, 
          error: "Los PDFs deben convertirse a imágenes en el cliente antes de enviarlos. Por favor, convierte el PDF a PNG/JPG primero." 
        }, 400);
      }
    }

    const products = await callClaude(base64Images, anthropicKey);
    return c.json({ ok: true, products });

  } catch (err) {
    return c.json({ 
      ok: false, 
      error: err instanceof Error ? err.message : "Error interno al procesar el catálogo." 
    }, 500);
  }
});
