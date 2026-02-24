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

const ordenes = new Hono();

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
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || null;
    } catch {
      // Si falla, usar sesión
    }
  }
  
  const sesionId = c.req.query("sesion_id") || c.req.header("X-Session-Id");
  
  return { userId, sesionId };
};

// GET /ordenes — listar órdenes del usuario
ordenes.get("/", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ordenes-get-${clientIP}`, 60, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);

    if (!userId && !sesionId) {
      return c.json({ data: [] });
    }

    let query = supabase
      .from("ordenes_75638143")
      .select(`
        *,
        items:orden_items_75638143(*)
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("usuario_id", userId);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return c.json({ data: data || [] });
  } catch (error) {
    console.error("Error obteniendo órdenes:", errMsg(error));
    return c.json({ error: `Error obteniendo órdenes: ${errMsg(error)}` }, 500);
  }
});

// GET /ordenes/:id — obtener una orden específica
ordenes.get("/:id", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ordenes-get-id-${clientIP}`, 60, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);
    const ordenId = c.req.param("id");

    if (!isValidUUID(ordenId)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    let query = supabase
      .from("ordenes_75638143")
      .select(`
        *,
        items:orden_items_75638143(*)
      `)
      .eq("id", ordenId)
      .single();

    if (userId) {
      query = query.eq("usuario_id", userId);
    } else if (sesionId) {
      query = query.eq("sesion_id", sesionId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    if (!data) {
      return c.json({ error: "Orden no encontrada" }, 404);
    }
    
    return c.json({ data });
  } catch (error) {
    console.error("Error obteniendo orden:", errMsg(error));
    return c.json({ error: `Error obteniendo orden: ${errMsg(error)}` }, 500);
  }
});

// POST /ordenes — crear una nueva orden desde el carrito
ordenes.post("/", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ordenes-post-${clientIP}`, 10, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const { userId, sesionId } = getUserIdOrSession(c);
    const body = await c.req.json();

    const {
      nombre_completo,
      email,
      telefono,
      direccion,
      ciudad,
      codigo_postal,
      pais = "Uruguay",
      notas,
      metodo_pago,
      envio = 0,
    } = body;

    // Validaciones
    if (!nombre_completo || nombre_completo.trim().length < 2) {
      return c.json({ error: "nombre_completo es requerido" }, 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: "email inválido" }, 400);
    }
    if (!direccion || direccion.trim().length < 5) {
      return c.json({ error: "direccion es requerida" }, 400);
    }
    if (!ciudad || ciudad.trim().length < 2) {
      return c.json({ error: "ciudad es requerida" }, 400);
    }

    // Obtener items del carrito
    let carritoQuery = supabase.from("carrito_75638143").select("*");
    
    if (userId) {
      carritoQuery = carritoQuery.eq("usuario_id", userId).is("sesion_id", null);
    } else if (sesionId) {
      carritoQuery = carritoQuery.eq("sesion_id", sesionId).is("usuario_id", null);
    } else {
      return c.json({ error: "Se requiere usuario_id o sesion_id" }, 400);
    }

    const { data: carritoItems, error: carritoError } = await carritoQuery;
    
    if (carritoError) throw carritoError;
    if (!carritoItems || carritoItems.length === 0) {
      return c.json({ error: "El carrito está vacío" }, 400);
    }

    // Calcular totales
    let subtotal = 0;
    const itemsParaOrden: any[] = [];

    for (const item of carritoItems) {
      // Verificar que el producto sigue existiendo y está activo
      const tablaProducto = item.producto_tipo === "market" 
        ? "productos_market_75638143" 
        : "productos_secondhand_75638143";
      
      const { data: producto, error: productoError } = await supabase
        .from(tablaProducto)
        .select("id, nombre, imagen_principal, precio, estado")
        .eq("id", item.producto_id)
        .single();

      if (productoError || !producto) {
        return c.json({ error: `Producto ${item.producto_id} no encontrado` }, 404);
      }
      if (producto.estado !== "activo") {
        return c.json({ error: `Producto ${producto.nombre} no está disponible` }, 400);
      }

      const itemSubtotal = item.cantidad * item.precio_unitario;
      subtotal += itemSubtotal;

      itemsParaOrden.push({
        producto_id: item.producto_id,
        producto_tipo: item.producto_tipo,
        nombre_producto: producto.nombre,
        imagen_producto: producto.imagen_principal,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: itemSubtotal,
      });
    }

    const impuestos = subtotal * 0.22; // IVA 22% (ajustar según país)
    const total = subtotal + impuestos + (envio || 0);

    // Crear la orden
    const nuevaOrden: any = {
      usuario_id: userId || null,
      sesion_id: sesionId || null,
      estado: "pendiente",
      subtotal,
      impuestos,
      envio: envio || 0,
      total,
      metodo_pago: metodo_pago || null,
      estado_pago: "pendiente",
      nombre_completo: sanitizeString(nombre_completo, 200),
      email: sanitizeString(email, 200),
      telefono: telefono ? sanitizeString(telefono, 50) : null,
      direccion: sanitizeString(direccion, 500),
      ciudad: sanitizeString(ciudad, 100),
      codigo_postal: codigo_postal ? sanitizeString(codigo_postal, 20) : null,
      pais: sanitizeString(pais, 100),
      notas: notas ? sanitizeString(notas, 1000) : null,
    };

    const { data: orden, error: ordenError } = await supabase
      .from("ordenes_75638143")
      .insert(nuevaOrden)
      .select()
      .single();

    if (ordenError) throw ordenError;

    // Crear items de la orden
    const itemsConOrdenId = itemsParaOrden.map(item => ({
      ...item,
      orden_id: orden.id,
    }));

    const { error: itemsError } = await supabase
      .from("orden_items_75638143")
      .insert(itemsConOrdenId);

    if (itemsError) throw itemsError;

    // Vaciar el carrito
    let deleteQuery = supabase.from("carrito_75638143").delete();
    if (userId) {
      deleteQuery = deleteQuery.eq("usuario_id", userId);
    } else if (sesionId) {
      deleteQuery = deleteQuery.eq("sesion_id", sesionId);
    }
    await deleteQuery;

    // Obtener la orden completa con items
    const { data: ordenCompleta, error: fetchError } = await supabase
      .from("ordenes_75638143")
      .select(`
        *,
        items:orden_items_75638143(*)
      `)
      .eq("id", orden.id)
      .single();

    if (fetchError) throw fetchError;

    return c.json({ data: ordenCompleta }, 201);
  } catch (error) {
    console.error("Error creando orden:", errMsg(error));
    return c.json({ error: `Error creando orden: ${errMsg(error)}` }, 500);
  }
});

// PUT /ordenes/:id — actualizar estado de una orden (solo admin)
ordenes.put("/:id", async (c) => {
  try {
    const clientIP = getClientIP(c);
    if (!checkRateLimit(`ordenes-put-${clientIP}`, 30, 60000)) {
      return c.json({ error: "Demasiadas solicitudes" }, 429);
    }

    const supabase = getSupabase();
    const ordenId = c.req.param("id");
    const body = await c.req.json();

    if (!isValidUUID(ordenId)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const { estado, estado_pago } = body;
    const updates: any = {};

    if (estado && ["pendiente", "confirmada", "en_proceso", "enviada", "entregada", "cancelada"].includes(estado)) {
      updates.estado = estado;
    }
    if (estado_pago && ["pendiente", "pagado", "reembolsado", "fallido"].includes(estado_pago)) {
      updates.estado_pago = estado_pago;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No hay campos válidos para actualizar" }, 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from("ordenes_75638143")
      .update(updates)
      .eq("id", ordenId)
      .select()
      .single();

    if (updateError) throw updateError;
    return c.json({ data: updated });
  } catch (error) {
    console.error("Error actualizando orden:", errMsg(error));
    return c.json({ error: `Error actualizando orden: ${errMsg(error)}` }, 500);
  }
});

export default ordenes;
