import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import {
  isValidUUID,
  sanitizeString,
  isValidPrice,
  checkRateLimit,
  getClientIP,
  logSecurityEvent,
} from "./utils/validation.tsx";

const carrito = new Hono();

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

// Helper para obtener usuario o sesión
const getUserIdOrSession = (c: any) => {
  const authHeader = c.req.header("Authorization");
  let userId: string | null = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // Intentar decodificar el token JWT para obtener el user_id
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || null;
    } catch {
      // Si falla, usar sesión
    }
  }
  
  const sesionId = c.req.query("sesion_id") || c.req.header("X-Session-Id");
  
  return { userId, sesionId };
};

// GET /carrito — obtener items del carrito
carrito.get("/", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`carrito-get-${clientIP}`, 60, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);

    if (!userId && !sesionId) {
      return c.json({ data: [] }); // Carrito vacío si no hay usuario ni sesión
    }

    let query = supabase.from("carrito_75638143").select("*");
    
    if (userId) {
      query = query.eq("usuario_id", userId).is("sesion_id", null);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId).is("usuario_id", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) throw error;
    return c.json({ data: data || [] });
  } catch (error) {
    console.error("Error obteniendo carrito:", errMsg(error));
    return c.json({ error: `Error obteniendo carrito: ${errMsg(error)}` }, 500);
  }
});

// POST /carrito — agregar item al carrito
carrito.post("/", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`carrito-post-${clientIP}`, 30, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);
    const body = await c.req.json();

    const { producto_id, producto_tipo, cantidad = 1, precio_unitario } = body;

    // Validaciones
    if (!producto_id || !isValidUUID(producto_id)) {
      return c.json({ error: "producto_id inválido" }, 400);
    }
    if (!producto_tipo || !["market", "secondhand"].includes(producto_tipo)) {
      return c.json({ error: "producto_tipo debe ser 'market' o 'secondhand'" }, 400);
    }
    if (!cantidad || cantidad < 1) {
      return c.json({ error: "cantidad debe ser mayor a 0" }, 400);
    }
    if (!precio_unitario || !isValidPrice(precio_unitario)) {
      return c.json({ error: "precio_unitario inválido" }, 400);
    }

    // Verificar que el producto existe y está activo
    const tablaProducto = producto_tipo === "market" 
      ? "productos_market_75638143" 
      : "productos_secondhand_75638143";
    
    const { data: producto, error: productoError } = await supabase
      .from(tablaProducto)
      .select("id, precio, estado")
      .eq("id", producto_id)
      .single();

    if (productoError || !producto) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }
    if (producto.estado !== "activo") {
      return c.json({ error: "Producto no disponible" }, 400);
    }

    // Verificar si ya existe en el carrito
    let existingQuery = supabase
      .from("carrito_75638143")
      .select("*")
      .eq("producto_id", producto_id)
      .eq("producto_tipo", producto_tipo);

    if (userId) {
      existingQuery = existingQuery.eq("usuario_id", userId).is("sesion_id", null);
    } else if (sesionId) {
      existingQuery = existingQuery.eq("sesion_id", sesionId).is("usuario_id", null);
    } else {
      return c.json({ error: "Se requiere usuario_id o sesion_id" }, 400);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      // Actualizar cantidad
      const nuevaCantidad = existing.cantidad + cantidad;
      const { data: updated, error: updateError } = await supabase
        .from("carrito_75638143")
        .update({ cantidad: nuevaCantidad, precio_unitario })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return c.json({ data: updated });
    } else {
      // Crear nuevo item
      const newItem: any = {
        producto_id,
        producto_tipo,
        cantidad,
        precio_unitario,
      };

      if (userId) {
        newItem.usuario_id = userId;
      } else {
        newItem.sesion_id = sesionId;
      }

      const { data: created, error: createError } = await supabase
        .from("carrito_75638143")
        .insert(newItem)
        .select()
        .single();

      if (createError) throw createError;
      return c.json({ data: created }, 201);
    }
  } catch (error) {
    console.error("Error agregando al carrito:", errMsg(error));
    return c.json({ error: `Error agregando al carrito: ${errMsg(error)}` }, 500);
  }
});

// PUT /carrito/:id — actualizar item del carrito
carrito.put("/:id", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`carrito-put-${clientIP}`, 30, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);
    const itemId = c.req.param("id");
    const body = await c.req.json();

    if (!isValidUUID(itemId)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const { cantidad } = body;
    if (cantidad !== undefined && (cantidad < 1 || !Number.isInteger(cantidad))) {
      return c.json({ error: "cantidad debe ser un entero mayor a 0" }, 400);
    }

    // Verificar que el item pertenece al usuario/sesión
    let query = supabase
      .from("carrito_75638143")
      .select("*")
      .eq("id", itemId);

    if (userId) {
      query = query.eq("usuario_id", userId);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId);
    } else {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: existing } = await query.single();
    if (!existing) {
      return c.json({ error: "Item no encontrado" }, 404);
    }

    // Actualizar
    const updates: any = {};
    if (cantidad !== undefined) updates.cantidad = cantidad;

    const { data: updated, error: updateError } = await supabase
      .from("carrito_75638143")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) throw updateError;
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error actualizando carrito:", errMsg(error));
    return c.json({ error: `Error actualizando carrito: ${errMsg(error)}` }, 500);
  }
});

// DELETE /carrito/:id — eliminar item del carrito
carrito.delete("/:id", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`carrito-delete-${clientIP}`, 30, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);
    const itemId = c.req.param("id");

    if (!isValidUUID(itemId)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    // Verificar que el item pertenece al usuario/sesión
    let query = supabase
      .from("carrito_75638143")
      .select("*")
      .eq("id", itemId);

    if (userId) {
      query = query.eq("usuario_id", userId);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId);
    } else {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: existing } = await query.single();
    if (!existing) {
      return c.json({ error: "Item no encontrado" }, 404);
    }

    const { error: deleteError } = await supabase
      .from("carrito_75638143")
      .delete()
      .eq("id", itemId);

    if (deleteError) throw deleteError;
    return c.json({ message: "Item eliminado" });
  } catch (error) {
    console.error("Error eliminando del carrito:", errMsg(error));
    return c.json({ error: `Error eliminando del carrito: ${errMsg(error)}` }, 500);
  }
});

// DELETE /carrito — vaciar carrito
carrito.delete("/", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`carrito-clear-${clientIP}`, 10, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);

    if (!userId && !sesionId) {
      return c.json({ message: "Carrito ya está vacío" });
    }

    let query = supabase.from("carrito_75638143").delete();

    if (userId) {
      query = query.eq("usuario_id", userId);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId);
    }

    const { error } = await query;
    if (error) throw error;
    return c.json({ message: "Carrito vaciado" });
  } catch (error) {
    console.error("Error vaciando carrito:", errMsg(error));
    return c.json({ error: `Error vaciando carrito: ${errMsg(error)}` }, 500);
  }
});

export default carrito;
