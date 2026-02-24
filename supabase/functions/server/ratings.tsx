import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import {
  isValidUUID,
  isValidRating,
  sanitizeString,
  validatePagination,
  validateOrderBy,
  validateOrderDir,
  checkRateLimit,
  getClientIP,
  logSecurityEvent,
} from "./utils/validation.tsx";

const ratings = new Hono();

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

const ORDER_BY_ALLOWED = ['fecha', 'rating'];

// GET /ratings — listar ratings (con filtros)
ratings.get("/", async (c) => {
  try {
    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ratings-${clientIP}`, 100, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/ratings', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const { vendedor_id, limit: lim, offset: off, order_by = "fecha", order_dir = "desc" } = c.req.query();

    // Validar paginación
    const pagination = validatePagination(lim, off);
    const orderBy = validateOrderBy(order_by || "fecha", ORDER_BY_ALLOWED);
    const orderDir = validateOrderDir(order_dir || "desc");

    // Validar UUIDs
    if (vendedor_id && !isValidUUID(vendedor_id)) {
      logSecurityEvent('invalid_input', { field: 'vendedor_id', value: vendedor_id });
      return c.json({ error: "vendedor_id inválido" }, 400);
    }

    let query = supabase
      .from("ratings_vendedores_75638143")
      .select("*")
      .order(orderBy, { ascending: orderDir === "asc" });

    if (vendedor_id) query = query.eq("vendedor_id", vendedor_id);
    query = query.limit(pagination.limit);
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ data });
  } catch (error) {
    console.log("Error listando ratings:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/ratings', error: errMsg(error) });
    return c.json({ error: `Error listando ratings: ${errMsg(error)}` }, 500);
  }
});

// GET /ratings/:id
ratings.get("/:id", async (c) => {
  try {
    const ratingId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(ratingId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: ratingId });
      return c.json({ error: "ID de rating inválido" }, 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ratings_vendedores_75638143")
      .select("*")
      .eq("id", ratingId)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Rating no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error obteniendo rating:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/ratings/:id', error: errMsg(error) });
    return c.json({ error: `Error obteniendo rating: ${errMsg(error)}` }, 500);
  }
});

// POST /ratings — crear rating
ratings.post("/", async (c) => {
  try {
    // Rate limiting más estricto para creación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ratings-create-${clientIP}`, 10, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/ratings POST', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validaciones robustas
    if (!body.vendedor_id || !isValidUUID(body.vendedor_id)) {
      logSecurityEvent('invalid_input', { field: 'vendedor_id', value: body.vendedor_id });
      return c.json({ error: "vendedor_id es requerido y debe ser un UUID válido" }, 400);
    }

    if (body.rating === undefined || !isValidRating(body.rating)) {
      logSecurityEvent('invalid_input', { field: 'rating', value: body.rating });
      return c.json({ error: "rating es requerido y debe estar entre 0 y 5" }, 400);
    }

    // Validar UUIDs opcionales
    if (body.usuario_id && !isValidUUID(body.usuario_id)) {
      return c.json({ error: "usuario_id inválido" }, 400);
    }
    if (body.producto_id && !isValidUUID(body.producto_id)) {
      return c.json({ error: "producto_id inválido" }, 400);
    }

    // Validar tipo de producto si se proporciona
    if (body.producto_tipo && !["market", "secondhand"].includes(body.producto_tipo)) {
      return c.json({ error: "producto_tipo debe ser 'market' o 'secondhand'" }, 400);
    }

    // Sanitizar comentario
    const comentario = body.comentario ? sanitizeString(body.comentario, 1000) : null;

    const payload = {
      vendedor_id: body.vendedor_id,
      rating: Number(body.rating),
      comentario,
      usuario_id: body.usuario_id || null,
      producto_id: body.producto_id || null,
      producto_tipo: body.producto_tipo || null,
      fecha: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("ratings_vendedores_75638143")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    
    // El trigger actualizará automáticamente el rating del vendedor
    return c.json({ data }, 201);
  } catch (error) {
    console.log("Error creando rating:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/ratings POST', error: errMsg(error) });
    return c.json({ error: `Error creando rating: ${errMsg(error)}` }, 500);
  }
});

// PUT /ratings/:id — actualizar rating
ratings.put("/:id", async (c) => {
  try {
    const ratingId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(ratingId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: ratingId });
      return c.json({ error: "ID de rating inválido" }, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ratings-update-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/ratings PUT', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validar rating si se proporciona
    if (body.rating !== undefined && !isValidRating(body.rating)) {
      return c.json({ error: "rating debe estar entre 0 y 5" }, 400);
    }

    // Sanitizar comentario
    const updateData: Record<string, unknown> = {};
    if (body.rating !== undefined) updateData.rating = Number(body.rating);
    if (body.comentario !== undefined) {
      updateData.comentario = body.comentario ? sanitizeString(body.comentario, 1000) : null;
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ratings_vendedores_75638143")
      .update(updateData)
      .eq("id", ratingId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Rating no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error actualizando rating:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/ratings PUT', error: errMsg(error) });
    return c.json({ error: `Error actualizando rating: ${errMsg(error)}` }, 500);
  }
});

// DELETE /ratings/:id — eliminar rating
ratings.delete("/:id", async (c) => {
  try {
    const ratingId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(ratingId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: ratingId });
      return c.json({ error: "ID de rating inválido" }, 400);
    }

    // Rate limiting más estricto para eliminación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ratings-delete-${clientIP}`, 5, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/ratings DELETE', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    
    // Verificar que el rating existe antes de eliminar
    const { data: existing } = await supabase
      .from("ratings_vendedores_75638143")
      .select("id")
      .eq("id", ratingId)
      .single();

    if (!existing) {
      return c.json({ error: "Rating no encontrado" }, 404);
    }

    const { error } = await supabase
      .from("ratings_vendedores_75638143")
      .delete()
      .eq("id", ratingId);

    if (error) throw error;
    logSecurityEvent('error', { endpoint: '/ratings DELETE', action: 'deleted', ratingId });
    return c.json({ success: true });
  } catch (error) {
    console.log("Error eliminando rating:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/ratings DELETE', error: errMsg(error) });
    return c.json({ error: `Error eliminando rating: ${errMsg(error)}` }, 500);
  }
});

export { ratings };
