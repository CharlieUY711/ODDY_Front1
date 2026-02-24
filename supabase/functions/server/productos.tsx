import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import {
  isValidUUID,
  sanitizeString,
  isValidPrice,
  isValidURL,
  isValidURLArray,
  isValidEstado,
  validatePagination,
  validateOrderBy,
  validateOrderDir,
  checkRateLimit,
  getClientIP,
  logSecurityEvent,
} from "./utils/validation.tsx";

const productos = new Hono();

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

// Estados permitidos
const ESTADOS_PERMITIDOS = ['activo', 'inactivo', 'vendido', 'agotado'];
const ORDER_BY_ALLOWED = ['created_at', 'precio', 'nombre', 'rating', 'visitas'];

// ── PRODUCTOS MARKET ────────────────────────────────────────────────

// GET /productos-market — listar productos Market
productos.get("/market", async (c) => {
  try {
    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-market-${clientIP}`, 100, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/market', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const {
      departamento_id,
      vendedor_id,
      estado,
      search,
      limit: lim,
      offset: off,
      order_by = "created_at",
      order_dir = "desc",
    } = c.req.query();

    // Validar y sanitizar inputs
    const pagination = validatePagination(lim, off);
    const orderBy = validateOrderBy(order_by || "created_at", ORDER_BY_ALLOWED);
    const orderDir = validateOrderDir(order_dir || "desc");

    // Validar UUIDs
    if (departamento_id && !isValidUUID(departamento_id)) {
      logSecurityEvent('invalid_input', { field: 'departamento_id', value: departamento_id });
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (vendedor_id && !isValidUUID(vendedor_id)) {
      logSecurityEvent('invalid_input', { field: 'vendedor_id', value: vendedor_id });
      return c.json({ error: "vendedor_id inválido" }, 400);
    }

    // Validar estado
    if (estado && !isValidEstado(estado, ESTADOS_PERMITIDOS)) {
      logSecurityEvent('invalid_input', { field: 'estado', value: estado });
      return c.json({ error: "estado inválido" }, 400);
    }

    // Sanitizar búsqueda
    const sanitizedSearch = search ? sanitizeString(search, 100) : undefined;

    let query = supabase
      .from("productos_market_75638143")
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio, total_ratings)
      `)
      .order(orderBy, { ascending: orderDir === "asc" });

    if (departamento_id) query = query.eq("departamento_id", departamento_id);
    if (vendedor_id) query = query.eq("vendedor_id", vendedor_id);
    if (estado) query = query.eq("estado", estado);
    if (sanitizedSearch) {
      query = query.or(`nombre.ilike.%${sanitizedSearch}%,descripcion.ilike.%${sanitizedSearch}%`);
    }
    query = query.limit(pagination.limit);
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ data });
  } catch (error) {
    console.log("Error listando productos market:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/market', error: errMsg(error) });
    return c.json({ error: `Error listando productos: ${errMsg(error)}` }, 500);
  }
});

// GET /productos-market/:id — obtener un producto Market
productos.get("/market/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("productos_market_75638143")
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio, total_ratings)
      `)
      .eq("id", productId)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Producto no encontrado" }, 404);

    // Incrementar contador de visitas (solo si está activo)
    if (data.estado === 'activo') {
      await supabase
        .from("productos_market_75638143")
        .update({ visitas: (data.visitas || 0) + 1 })
        .eq("id", productId);
    }

    return c.json({ data });
  } catch (error) {
    console.log("Error obteniendo producto market:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/market/:id', error: errMsg(error) });
    return c.json({ error: `Error obteniendo producto: ${errMsg(error)}` }, 500);
  }
});

// POST /productos-market — crear producto Market
productos.post("/market", async (c) => {
  try {
    // Rate limiting más estricto para creación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-market-create-${clientIP}`, 10, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/market POST', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validaciones robustas
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      logSecurityEvent('invalid_input', { field: 'nombre', value: body.nombre });
      return c.json({ error: "El nombre es requerido y debe ser un string válido" }, 400);
    }

    if (!body.precio || !isValidPrice(body.precio)) {
      logSecurityEvent('invalid_input', { field: 'precio', value: body.precio });
      return c.json({ error: "El precio es requerido y debe ser un número positivo" }, 400);
    }

    if (!body.imagen_principal || !isValidURL(body.imagen_principal)) {
      logSecurityEvent('invalid_input', { field: 'imagen_principal', value: body.imagen_principal });
      return c.json({ error: "La imagen principal es requerida y debe ser una URL válida" }, 400);
    }

    // Validar precio_original si existe
    if (body.precio_original !== undefined && body.precio_original !== null) {
      if (!isValidPrice(body.precio_original) || body.precio_original < body.precio) {
        return c.json({ error: "precio_original debe ser mayor o igual a precio" }, 400);
      }
    }

    // Validar UUIDs
    if (body.departamento_id && !isValidUUID(body.departamento_id)) {
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (body.vendedor_id && !isValidUUID(body.vendedor_id)) {
      return c.json({ error: "vendedor_id inválido" }, 400);
    }

    // Validar estado
    if (body.estado && !isValidEstado(body.estado, ESTADOS_PERMITIDOS)) {
      return c.json({ error: "estado inválido" }, 400);
    }

    // Validar arrays de URLs
    if (body.imagenes && !isValidURLArray(body.imagenes)) {
      return c.json({ error: "imagenes debe ser un array de URLs válidas" }, 400);
    }
    if (body.videos && !isValidURLArray(body.videos)) {
      return c.json({ error: "videos debe ser un array de URLs válidas" }, 400);
    }

    // Sanitizar strings
    const nombre = sanitizeString(body.nombre, 200);
    const descripcion = body.descripcion ? sanitizeString(body.descripcion, 2000) : null;

    // Si hay departamento_id, obtener el nombre para cache
    let departamento_nombre = body.departamento_nombre;
    if (body.departamento_id) {
      const { data: dept } = await supabase
        .from("departamentos_75638143")
        .select("nombre")
        .eq("id", body.departamento_id)
        .single();
      if (dept) departamento_nombre = dept.nombre;
    }

    const payload = {
      nombre,
      descripcion,
      precio: Number(body.precio),
      precio_original: body.precio_original ? Number(body.precio_original) : null,
      departamento_id: body.departamento_id || null,
      departamento_nombre: departamento_nombre || null,
      imagen_principal: body.imagen_principal,
      imagenes: Array.isArray(body.imagenes) ? body.imagenes : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      vendedor_id: body.vendedor_id || null,
      estado: body.estado || "activo",
      badge: body.badge ? sanitizeString(body.badge, 50) : null,
      badge_color: body.badge_color ? sanitizeString(body.badge_color, 20) : null,
      rating: 0,
      rating_count: 0,
      visitas: 0,
    };

    const { data, error } = await supabase
      .from("productos_market_75638143")
      .insert(payload)
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio)
      `)
      .single();

    if (error) throw error;
    return c.json({ data }, 201);
  } catch (error) {
    console.log("Error creando producto market:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/market POST', error: errMsg(error) });
    return c.json({ error: `Error creando producto: ${errMsg(error)}` }, 500);
  }
});

// PUT /productos-market/:id — actualizar producto Market
productos.put("/market/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-market-update-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/market PUT', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validar campos si se proporcionan
    if (body.nombre !== undefined && (typeof body.nombre !== 'string' || body.nombre.trim().length === 0)) {
      return c.json({ error: "nombre debe ser un string válido" }, 400);
    }
    if (body.precio !== undefined && !isValidPrice(body.precio)) {
      return c.json({ error: "precio debe ser un número positivo" }, 400);
    }
    if (body.imagen_principal !== undefined && !isValidURL(body.imagen_principal)) {
      return c.json({ error: "imagen_principal debe ser una URL válida" }, 400);
    }
    if (body.precio_original !== undefined && body.precio_original !== null) {
      const precioActual = body.precio !== undefined ? body.precio : (await supabase.from("productos_market_75638143").select("precio").eq("id", productId).single()).data?.precio;
      if (!isValidPrice(body.precio_original) || (precioActual && body.precio_original < precioActual)) {
        return c.json({ error: "precio_original debe ser mayor o igual a precio" }, 400);
      }
    }
    if (body.departamento_id !== undefined && body.departamento_id !== null && !isValidUUID(body.departamento_id)) {
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (body.vendedor_id !== undefined && body.vendedor_id !== null && !isValidUUID(body.vendedor_id)) {
      return c.json({ error: "vendedor_id inválido" }, 400);
    }
    if (body.estado !== undefined && !isValidEstado(body.estado, ESTADOS_PERMITIDOS)) {
      return c.json({ error: "estado inválido" }, 400);
    }
    if (body.imagenes !== undefined && !isValidURLArray(body.imagenes)) {
      return c.json({ error: "imagenes debe ser un array de URLs válidas" }, 400);
    }
    if (body.videos !== undefined && !isValidURLArray(body.videos)) {
      return c.json({ error: "videos debe ser un array de URLs válidas" }, 400);
    }

    // Sanitizar strings
    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = sanitizeString(body.nombre, 200);
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion ? sanitizeString(body.descripcion, 2000) : null;
    if (body.precio !== undefined) updateData.precio = Number(body.precio);
    if (body.precio_original !== undefined) updateData.precio_original = body.precio_original ? Number(body.precio_original) : null;
    if (body.imagen_principal !== undefined) updateData.imagen_principal = body.imagen_principal;
    if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
    if (body.videos !== undefined) updateData.videos = body.videos;
    if (body.departamento_id !== undefined) updateData.departamento_id = body.departamento_id;
    if (body.vendedor_id !== undefined) updateData.vendedor_id = body.vendedor_id;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.badge !== undefined) updateData.badge = body.badge ? sanitizeString(body.badge, 50) : null;
    if (body.badge_color !== undefined) updateData.badge_color = body.badge_color ? sanitizeString(body.badge_color, 20) : null;

    // Si cambia el departamento, actualizar el cache
    if (body.departamento_id) {
      const { data: dept } = await supabase
        .from("departamentos_75638143")
        .select("nombre")
        .eq("id", body.departamento_id)
        .single();
      if (dept) updateData.departamento_nombre = dept.nombre;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("productos_market_75638143")
      .update(updateData)
      .eq("id", productId)
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio)
      `)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Producto no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error actualizando producto market:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/market PUT', error: errMsg(error) });
    return c.json({ error: `Error actualizando producto: ${errMsg(error)}` }, 500);
  }
});

// DELETE /productos-market/:id — eliminar producto Market
productos.delete("/market/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    // Rate limiting más estricto para eliminación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-market-delete-${clientIP}`, 5, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/market DELETE', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    
    // Verificar que el producto existe antes de eliminar
    const { data: existing } = await supabase
      .from("productos_market_75638143")
      .select("id")
      .eq("id", productId)
      .single();

    if (!existing) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    const { error } = await supabase
      .from("productos_market_75638143")
      .delete()
      .eq("id", productId);

    if (error) throw error;
    logSecurityEvent('error', { endpoint: '/market DELETE', action: 'deleted', productId });
    return c.json({ success: true });
  } catch (error) {
    console.log("Error eliminando producto market:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/market DELETE', error: errMsg(error) });
    return c.json({ error: `Error eliminando producto: ${errMsg(error)}` }, 500);
  }
});

// ── PRODUCTOS SECOND HAND ───────────────────────────────────────────

// GET /productos-secondhand — listar productos Second Hand
productos.get("/secondhand", async (c) => {
  try {
    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-sh-${clientIP}`, 100, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/secondhand', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const {
      departamento_id,
      vendedor_id,
      estado,
      search,
      limit: lim,
      offset: off,
      order_by = "created_at",
      order_dir = "desc",
    } = c.req.query();

    // Validar y sanitizar inputs
    const pagination = validatePagination(lim, off);
    const orderBy = validateOrderBy(order_by || "created_at", ORDER_BY_ALLOWED);
    const orderDir = validateOrderDir(order_dir || "desc");

    // Validar UUIDs
    if (departamento_id && !isValidUUID(departamento_id)) {
      logSecurityEvent('invalid_input', { field: 'departamento_id', value: departamento_id });
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (vendedor_id && !isValidUUID(vendedor_id)) {
      logSecurityEvent('invalid_input', { field: 'vendedor_id', value: vendedor_id });
      return c.json({ error: "vendedor_id inválido" }, 400);
    }

    // Validar estado
    if (estado && !isValidEstado(estado, ESTADOS_PERMITIDOS)) {
      logSecurityEvent('invalid_input', { field: 'estado', value: estado });
      return c.json({ error: "estado inválido" }, 400);
    }

    // Sanitizar búsqueda
    const sanitizedSearch = search ? sanitizeString(search, 100) : undefined;

    let query = supabase
      .from("productos_secondhand_75638143")
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio, total_ratings)
      `)
      .order(orderBy, { ascending: orderDir === "asc" });

    if (departamento_id) query = query.eq("departamento_id", departamento_id);
    if (vendedor_id) query = query.eq("vendedor_id", vendedor_id);
    if (estado) query = query.eq("estado", estado);
    if (sanitizedSearch) {
      query = query.or(`nombre.ilike.%${sanitizedSearch}%,descripcion.ilike.%${sanitizedSearch}%`);
    }
    query = query.limit(pagination.limit);
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return c.json({ data });
  } catch (error) {
    console.log("Error listando productos secondhand:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/secondhand', error: errMsg(error) });
    return c.json({ error: `Error listando productos: ${errMsg(error)}` }, 500);
  }
});

// GET /productos-secondhand/:id — obtener un producto Second Hand
productos.get("/secondhand/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("productos_secondhand_75638143")
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio, total_ratings)
      `)
      .eq("id", productId)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Producto no encontrado" }, 404);

    // Incrementar contador de visitas (solo si está activo)
    if (data.estado === 'activo') {
      await supabase
        .from("productos_secondhand_75638143")
        .update({ visitas: (data.visitas || 0) + 1 })
        .eq("id", productId);
    }

    return c.json({ data });
  } catch (error) {
    console.log("Error obteniendo producto secondhand:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/secondhand/:id', error: errMsg(error) });
    return c.json({ error: `Error obteniendo producto: ${errMsg(error)}` }, 500);
  }
});

// POST /productos-secondhand — crear producto Second Hand
productos.post("/secondhand", async (c) => {
  try {
    // Rate limiting más estricto para creación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-sh-create-${clientIP}`, 10, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/secondhand POST', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validaciones robustas (igual que Market)
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim().length === 0) {
      logSecurityEvent('invalid_input', { field: 'nombre', value: body.nombre });
      return c.json({ error: "El nombre es requerido y debe ser un string válido" }, 400);
    }

    if (!body.precio || !isValidPrice(body.precio)) {
      logSecurityEvent('invalid_input', { field: 'precio', value: body.precio });
      return c.json({ error: "El precio es requerido y debe ser un número positivo" }, 400);
    }

    if (!body.imagen_principal || !isValidURL(body.imagen_principal)) {
      logSecurityEvent('invalid_input', { field: 'imagen_principal', value: body.imagen_principal });
      return c.json({ error: "La imagen principal es requerida y debe ser una URL válida" }, 400);
    }

    // Validar precio_original si existe
    if (body.precio_original !== undefined && body.precio_original !== null) {
      if (!isValidPrice(body.precio_original) || body.precio_original < body.precio) {
        return c.json({ error: "precio_original debe ser mayor o igual a precio" }, 400);
      }
    }

    // Validar condición si existe
    if (body.condicion && !isValidCondicion(body.condicion)) {
      return c.json({ error: "condicion inválida. Valores permitidos: Excelente, Muy bueno, Bueno, Regular, Aceptable" }, 400);
    }

    // Validar UUIDs
    if (body.departamento_id && !isValidUUID(body.departamento_id)) {
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (body.vendedor_id && !isValidUUID(body.vendedor_id)) {
      return c.json({ error: "vendedor_id inválido" }, 400);
    }

    // Validar estado
    if (body.estado && !isValidEstado(body.estado, ESTADOS_PERMITIDOS)) {
      return c.json({ error: "estado inválido" }, 400);
    }

    // Validar arrays de URLs
    if (body.imagenes && !isValidURLArray(body.imagenes)) {
      return c.json({ error: "imagenes debe ser un array de URLs válidas" }, 400);
    }
    if (body.videos && !isValidURLArray(body.videos)) {
      return c.json({ error: "videos debe ser un array de URLs válidas" }, 400);
    }

    // Sanitizar strings
    const nombre = sanitizeString(body.nombre, 200);
    const descripcion = body.descripcion ? sanitizeString(body.descripcion, 2000) : null;
    const condicion = body.condicion ? sanitizeString(body.condicion, 50) : null;

    // Si hay departamento_id, obtener el nombre para cache
    let departamento_nombre = body.departamento_nombre;
    if (body.departamento_id) {
      const { data: dept } = await supabase
        .from("departamentos_75638143")
        .select("nombre")
        .eq("id", body.departamento_id)
        .single();
      if (dept) departamento_nombre = dept.nombre;
    }

    const payload = {
      nombre,
      descripcion,
      precio: Number(body.precio),
      precio_original: body.precio_original ? Number(body.precio_original) : null,
      departamento_id: body.departamento_id || null,
      departamento_nombre: departamento_nombre || null,
      imagen_principal: body.imagen_principal,
      imagenes: Array.isArray(body.imagenes) ? body.imagenes : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      vendedor_id: body.vendedor_id || null,
      estado: body.estado || "activo",
      condicion,
      rating: 0,
      rating_count: 0,
      visitas: 0,
    };

    const { data, error } = await supabase
      .from("productos_secondhand_75638143")
      .insert(payload)
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio)
      `)
      .single();

    if (error) throw error;
    return c.json({ data }, 201);
  } catch (error) {
    console.log("Error creando producto secondhand:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/secondhand POST', error: errMsg(error) });
    return c.json({ error: `Error creando producto: ${errMsg(error)}` }, 500);
  }
});

// PUT /productos-secondhand/:id — actualizar producto Second Hand
productos.put("/secondhand/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    // Rate limiting
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-sh-update-${clientIP}`, 20, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/secondhand PUT', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    const body = await c.req.json();

    // Validar campos si se proporcionan (igual que Market)
    if (body.nombre !== undefined && (typeof body.nombre !== 'string' || body.nombre.trim().length === 0)) {
      return c.json({ error: "nombre debe ser un string válido" }, 400);
    }
    if (body.precio !== undefined && !isValidPrice(body.precio)) {
      return c.json({ error: "precio debe ser un número positivo" }, 400);
    }
    if (body.imagen_principal !== undefined && !isValidURL(body.imagen_principal)) {
      return c.json({ error: "imagen_principal debe ser una URL válida" }, 400);
    }
    if (body.precio_original !== undefined && body.precio_original !== null) {
      const precioActual = body.precio !== undefined ? body.precio : (await supabase.from("productos_secondhand_75638143").select("precio").eq("id", productId).single()).data?.precio;
      if (!isValidPrice(body.precio_original) || (precioActual && body.precio_original < precioActual)) {
        return c.json({ error: "precio_original debe ser mayor o igual a precio" }, 400);
      }
    }
    if (body.condicion !== undefined && body.condicion !== null && !isValidCondicion(body.condicion)) {
      return c.json({ error: "condicion inválida" }, 400);
    }
    if (body.departamento_id !== undefined && body.departamento_id !== null && !isValidUUID(body.departamento_id)) {
      return c.json({ error: "departamento_id inválido" }, 400);
    }
    if (body.vendedor_id !== undefined && body.vendedor_id !== null && !isValidUUID(body.vendedor_id)) {
      return c.json({ error: "vendedor_id inválido" }, 400);
    }
    if (body.estado !== undefined && !isValidEstado(body.estado, ESTADOS_PERMITIDOS)) {
      return c.json({ error: "estado inválido" }, 400);
    }
    if (body.imagenes !== undefined && !isValidURLArray(body.imagenes)) {
      return c.json({ error: "imagenes debe ser un array de URLs válidas" }, 400);
    }
    if (body.videos !== undefined && !isValidURLArray(body.videos)) {
      return c.json({ error: "videos debe ser un array de URLs válidas" }, 400);
    }

    // Sanitizar strings
    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = sanitizeString(body.nombre, 200);
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion ? sanitizeString(body.descripcion, 2000) : null;
    if (body.precio !== undefined) updateData.precio = Number(body.precio);
    if (body.precio_original !== undefined) updateData.precio_original = body.precio_original ? Number(body.precio_original) : null;
    if (body.imagen_principal !== undefined) updateData.imagen_principal = body.imagen_principal;
    if (body.imagenes !== undefined) updateData.imagenes = body.imagenes;
    if (body.videos !== undefined) updateData.videos = body.videos;
    if (body.departamento_id !== undefined) updateData.departamento_id = body.departamento_id;
    if (body.vendedor_id !== undefined) updateData.vendedor_id = body.vendedor_id;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.condicion !== undefined) updateData.condicion = body.condicion ? sanitizeString(body.condicion, 50) : null;

    // Si cambia el departamento, actualizar el cache
    if (body.departamento_id) {
      const { data: dept } = await supabase
        .from("departamentos_75638143")
        .select("nombre")
        .eq("id", body.departamento_id)
        .single();
      if (dept) updateData.departamento_nombre = dept.nombre;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("productos_secondhand_75638143")
      .update(updateData)
      .eq("id", productId)
      .select(`
        *,
        departamento:departamentos_75638143(id, nombre, color),
        vendedor:vendedores_75638143(id, nombre, rating_promedio)
      `)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: "Producto no encontrado" }, 404);
    return c.json({ data });
  } catch (error) {
    console.log("Error actualizando producto secondhand:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/secondhand PUT', error: errMsg(error) });
    return c.json({ error: `Error actualizando producto: ${errMsg(error)}` }, 500);
  }
});

// DELETE /productos-secondhand/:id — eliminar producto Second Hand
productos.delete("/secondhand/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    
    // Validar UUID
    if (!isValidUUID(productId)) {
      logSecurityEvent('invalid_input', { field: 'id', value: productId });
      return c.json({ error: "ID de producto inválido" }, 400);
    }

    // Rate limiting más estricto para eliminación
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`productos-sh-delete-${clientIP}`, 5, 60000)) {
      logSecurityEvent('rate_limit', { endpoint: '/secondhand DELETE', ip: clientIP });
      return c.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, 429);
    }

    const supabase = getSupabase();
    
    // Verificar que el producto existe antes de eliminar
    const { data: existing } = await supabase
      .from("productos_secondhand_75638143")
      .select("id")
      .eq("id", productId)
      .single();

    if (!existing) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    const { error } = await supabase
      .from("productos_secondhand_75638143")
      .delete()
      .eq("id", productId);

    if (error) throw error;
    logSecurityEvent('error', { endpoint: '/secondhand DELETE', action: 'deleted', productId });
    return c.json({ success: true });
  } catch (error) {
    console.log("Error eliminando producto secondhand:", JSON.stringify(error));
    logSecurityEvent('error', { endpoint: '/secondhand DELETE', error: errMsg(error) });
    return c.json({ error: `Error eliminando producto: ${errMsg(error)}` }, 500);
  }
});

export { productos };
