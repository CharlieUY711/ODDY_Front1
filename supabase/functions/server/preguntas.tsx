import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import {
  isValidUUID,
  sanitizeString,
  validatePagination,
  checkRateLimit,
  getClientIP,
  logSecurityEvent,
} from "./utils/validation.tsx";

const preguntas = new Hono();

const getSupabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

const errMsg = (e: unknown): string =>
  e instanceof Error
    ? e.message
    : typeof e === "object" && e !== null && "message" in e
    ? String((e as { message: unknown }).message)
    : JSON.stringify(e);

// GET /preguntas — listar preguntas (con filtros)
preguntas.get("/", async (c) => {
  try {
    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`preguntas-${clientIP}`, 100, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/preguntas', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const { producto_id, producto_tipo, limit: lim, offset: off } = c.req.query();

    // Validar paginación
    const pagination = validatePagination(lim, off);

    // Validar UUIDs
    if (producto_id && !isValidUUID(producto_id)) {
      logSecurityEvent('invalid_input', { field: 'producto_id', value: producto_id });
      return c.json({ error: "producto_id inválido" }, 400);
    }

    // Validar tipo
    if (producto_tipo && !["market", "secondhand"].includes(producto_tipo)) {
      return c.json({ error: "producto_tipo debe ser 'market' o 'secondhand'" }, 400);
    }

    let query = supabase
      .from("preguntas_productos_75638143")
      .select("*")
      .order("fecha", { ascending: false });

    if (producto_id) query = query.eq("producto_id", producto_id);
    if (producto_tipo) query = query.eq("producto_tipo", producto_tipo);
    query = query.limit(pagination.limit);
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ data });
  } catch (error) {
    console.log("Error listando preguntas:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/preguntas', error: errMsg(error) });
    return c.json({ error: `Error listando preguntas: ${errMsg(error)}` }, 500);
  }
});

// GET /preguntas/:id
preguntas.get("/:id", async (c) => {
  try {
    const preguntaId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(preguntaId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: preguntaId });
      return c.json({ error: "ID de pregunta inválido" }, 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("preguntas_productos_75638143")
      .select("*")
      .eq("id", preguntaId)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Pregunta no encontrada" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error obteniendo pregunta:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/preguntas/:id', error: errMsg(error) });
    return c.json({ error: `Error obteniendo pregunta: ${errMsg(error)}` }, 500);
  }
});

// POST /preguntas — crear pregunta
preguntas.post("/", async (c) => {
  try {
    // Rate limiting más estricto para creación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`preguntas-create-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/preguntas POST', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validaciones robustas
    if (!body.producto_id || !isValidUUID(body.producto_id)) {
      logSecurityEvent('invalid_input', { field: 'producto_id', value: body.producto_id });
      return c.json({ error: "producto_id es requerido y debe ser un UUID válido" }, 400);
    }

    if (!body.producto_tipo || !["market", "secondhand"].includes(body.producto_tipo)) {
      return c.json({ error: "producto_tipo es requerido y debe ser 'market' o 'secondhand'" }, 400);
    }

    if (!body.pregunta || typeof body.pregunta !== 'string' || body.pregunta.trim().length === 0) {
      logSecurityEvent('invalid_input', { field: 'pregunta', value: body.pregunta });
      return c.json({ error: "pregunta es requerida y debe ser un string válido" }, 400);
    }

    // Validar longitud máxima
    if (body.pregunta.length > 1000) {
      return c.json({ error: "La pregunta no puede exceder 1000 caracteres" }, 400);
    }

    // Sanitizar strings
    const pregunta = sanitizeString(body.pregunta, 1000);
    const respuesta = body.respuesta ? sanitizeString(body.respuesta, 2000) : null;

    // Validar usuario_id si se proporciona
    if (body.usuario_id && !isValidUUID(body.usuario_id)) {
      return c.json({ error: "usuario_id inválido" }, 400);
    }

    const payload = {
      producto_id: body.producto_id,
      producto_tipo: body.producto_tipo,
      pregunta,
      respuesta,
      usuario_id: body.usuario_id || null,
      fecha: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("preguntas_productos_75638143")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return c.json({ data }, 201);
  } catch (error) {
    console.log("Error creando pregunta:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/preguntas POST', error: errMsg(error) });
    return c.json({ error: `Error creando pregunta: ${errMsg(error)}` }, 500);
  }
});

// PUT /preguntas/:id — actualizar pregunta (responder)
preguntas.put("/:id", async (c) => {
  try {
    const preguntaId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(preguntaId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: preguntaId });
      return c.json({ error: "ID de pregunta inválido" }, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`preguntas-update-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/preguntas PUT', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validar respuesta si se proporciona
    if (body.respuesta !== undefined) {
      if (typeof body.respuesta !== 'string' || body.respuesta.trim().length === 0) {
        return c.json({ error: "respuesta debe ser un string válido" }, 400);
      }
      if (body.respuesta.length > 2000) {
        return c.json({ error: "La respuesta no puede exceder 2000 caracteres" }, 400);
      }
    }

    // Sanitizar respuesta
    const updateData: Record<string, unknown> = {};
    if (body.respuesta !== undefined) {
      updateData.respuesta = sanitizeString(body.respuesta, 2000);
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("preguntas_productos_75638143")
      .update(updateData)
      .eq("id", preguntaId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Pregunta no encontrada" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error actualizando pregunta:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/preguntas PUT', error: errMsg(error) });
    return c.json({ error: `Error actualizando pregunta: ${errMsg(error)}` }, 500);
  }
});

// DELETE /preguntas/:id — eliminar pregunta
preguntas.delete("/:id", async (c) => {
  try {
    const preguntaId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(preguntaId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: preguntaId });
      return c.json({ error: "ID de pregunta inválido" }, 400);
    }

    // Rate limiting más estricto para eliminación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`preguntas-delete-${clientIP}`, 5, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/preguntas DELETE', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    
    // Verificar que la pregunta existe antes de eliminar
    const { data: existing } = await supabase
      .from("preguntas_productos_75638143")
      .select("id")
      .eq("id", preguntaId)
      .single();

    if (!existing) {
      return c.json({ error: "Pregunta no encontrada" }, 404);
    }

    const { error } = await supabase
      .from("preguntas_productos_75638143")
      .delete()
      .eq("id", preguntaId);

    if (error) throw error;
    logSecurityEvent('error', { endpoint: '/preguntas DELETE', action: 'deleted', preguntaId });
    return c.json({ success: true });
  } catch (error) {
    console.log("Error eliminando pregunta:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/preguntas DELETE', error: errMsg(error) });
    return c.json({ error: `Error eliminando pregunta: ${errMsg(error)}` }, 500);
  }
});

export { preguntas };
