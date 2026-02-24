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

const departamentos = new Hono();

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

// GET /departamentos — listar departamentos
departamentos.get("/", async (c) => {
  try {
    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`departamentos-${clientIP}`, 100, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/departamentos', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const { activo, search, limit: lim, offset: off } = c.req.query();

    // Validar paginación
    const pagination = validatePagination(lim, off);

    // Sanitizar búsqueda
    const sanitizedSearch = search ? sanitizeString(search, 100) : undefined;

    let query = supabase
      .from("departamentos_75638143")
      .select("*")
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (activo !== undefined) query = query.eq("activo", activo === "true");
    if (sanitizedSearch) query = query.ilike("nombre", `%${sanitizedSearch}%`);
    
    query = query.limit(pagination.limit);
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ data });
  } catch (error) {
    console.log("Error listando departamentos:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/departamentos', error: errMsg(error) });
    return c.json({ error: `Error listando departamentos: ${errMsg(error)}` }, 500);
  }
});

// GET /departamentos/:id
departamentos.get("/:id", async (c) => {
  try {
    const deptId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(deptId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: deptId });
      return c.json({ error: "ID de departamento inválido" }, 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("departamentos_75638143")
      .select("*")
      .eq("id", deptId)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Departamento no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error obteniendo departamento:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/departamentos/:id', error: errMsg(error) });
    return c.json({ error: `Error obteniendo departamento: ${errMsg(error)}` }, 500);
  }
});

// POST /departamentos — crear departamento
departamentos.post("/", async (c) => {
  try {
    // Rate limiting más estricto para creación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`departamentos-create-${clientIP}`, 10, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/departamentos POST', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validaciones robustas
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      logSecurityEvent('invalid_input', { field: 'nombre', value: body.nombre });
      return c.json({ error: "El nombre es requerido y debe ser un string válido" }, 400);
    }

    // Validar color (formato hex)
    if (body.color && !/^#[0-9A-F]{6}$/i.test(body.color)) {
      return c.json({ error: "El color debe ser un código hexadecimal válido (ej: #FF6835)" }, 400);
    }

    // Sanitizar strings
    const nombre = sanitizeString(body.nombre, 100);
    const icono = body.icono ? sanitizeString(body.icono, 200) : null;
    const color = body.color || "#C8C4BE";
    const orden = typeof body.orden === 'number' ? Math.max(0, body.orden) : 0;

    const payload = {
      nombre,
      icono,
      color,
      orden,
      activo: body.activo !== undefined ? Boolean(body.activo) : true,
    };

    const { data, error } = await supabase
      .from("departamentos_75638143")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return c.json({ data }, 201);
  } catch (error) {
    console.log("Error creando departamento:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/departamentos POST', error: errMsg(error) });
    return c.json({ error: `Error creando departamento: ${errMsg(error)}` }, 500);
  }
});

// PUT /departamentos/:id — actualizar departamento
departamentos.put("/:id", async (c) => {
  try {
    const deptId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(deptId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: deptId });
      return c.json({ error: "ID de departamento inválido" }, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`departamentos-update-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/departamentos PUT', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validar campos si se proporcionan
    if (body.nombre !== undefined && (typeof body.nombre !== 'string' || body.nombre.trim().length === 0)) {
      return c.json({ error: "nombre debe ser un string válido" }, 400);
    }
    if (body.color !== undefined && !/^#[0-9A-F]{6}$/i.test(body.color)) {
      return c.json({ error: "color debe ser un código hexadecimal válido" }, 400);
    }

    // Sanitizar strings
    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = sanitizeString(body.nombre, 100);
    if (body.icono !== undefined) updateData.icono = body.icono ? sanitizeString(body.icono, 200) : null;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.orden !== undefined) updateData.orden = typeof body.orden === 'number' ? Math.max(0, body.orden) : 0;
    if (body.activo !== undefined) updateData.activo = Boolean(body.activo);

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("departamentos_75638143")
      .update(updateData)
      .eq("id", deptId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Departamento no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error actualizando departamento:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/departamentos PUT', error: errMsg(error) });
    return c.json({ error: `Error actualizando departamento: ${errMsg(error)}` }, 500);
  }
});

// DELETE /departamentos/:id — eliminar departamento
departamentos.delete("/:id", async (c) => {
  try {
    const deptId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(deptId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: deptId });
      return c.json({ error: "ID de departamento inválido" }, 400);
    }

    // Rate limiting más estricto para eliminación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`departamentos-delete-${clientIP}`, 5, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/departamentos DELETE', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    
    // Verificar que el departamento existe antes de eliminar
    const { data: existing } = await supabase
      .from("departamentos_75638143")
      .select("id")
      .eq("id", deptId)
      .single();

    if (!existing) {
      return c.json({ error: "Departamento no encontrado" }, 404);
    }

    const { error } = await supabase
      .from("departamentos_75638143")
      .delete()
      .eq("id", deptId);

    if (error) throw error;
    logSecurityEvent('error', { endpoint: '/departamentos DELETE', action: 'deleted', deptId });
    return c.json({ success: true });
  } catch (error) {
    console.log("Error eliminando departamento:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/departamentos DELETE', error: errMsg(error) });
    return c.json({ error: `Error eliminando departamento: ${errMsg(error)}` }, 500);
  }
});

export { departamentos };
