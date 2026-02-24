/* =====================================================
   Carrito API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/carrito`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ── Types ────────────────────────────────────────────────────────────
export interface CarritoItem {
  id: string;
  usuario_id?: string;
  sesion_id?: string;
  producto_id: string;
  producto_tipo: 'market' | 'secondhand';
  cantidad: number;
  precio_unitario: number;
  created_at?: string;
  updated_at?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { ...HEADERS };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  // Nota: X-Session-Id se envía como query param temporalmente hasta que se redepliegue con CORS actualizado
  // headers['X-Session-Id'] = sesionId; // Comentado temporalmente por CORS
  
  return headers;
}

function getSessionId(): string {
  let sesionId = localStorage.getItem('sesion_id');
  if (!sesionId) {
    sesionId = crypto.randomUUID();
    localStorage.setItem('sesion_id', sesionId);
  }
  return sesionId;
}

// ── Carrito Operations ──────────────────────────────────────────────────

// Fallback a localStorage si la API no está disponible
function getCarritoLocal(): CarritoItem[] {
  try {
    const stored = localStorage.getItem('carrito_local');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error leyendo carrito local:', e);
  }
  return [];
}

function saveCarritoLocal(items: CarritoItem[]): void {
  try {
    localStorage.setItem('carrito_local', JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando carrito local:', e);
  }
}

export async function getCarrito(): Promise<CarritoItem[]> {
  try {
    const headers = await getAuthHeaders();
    const sesionId = getSessionId();
    // Enviar sesion_id como query param temporalmente por CORS
    const res = await fetch(`${BASE}?sesion_id=${encodeURIComponent(sesionId)}`, { headers });
    
    // Verificar si la respuesta es OK
    if (!res.ok) {
      // Si es 404, usar localStorage como fallback
      if (res.status === 404) {
        console.warn('API de carrito no disponible (404), usando localStorage');
        return getCarritoLocal();
      }
      const text = await res.text();
      console.error('Error HTTP:', res.status, text);
      // Si es otro error, también usar localStorage
      return getCarritoLocal();
    }
    
    // Verificar content-type
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Respuesta no es JSON:', contentType, text.substring(0, 200));
      return getCarritoLocal();
    }
    
    const json = await res.json();
    if (json.error) {
      console.warn('Error en respuesta API:', json.error);
      return getCarritoLocal();
    }
    const items = json.data || [];
    // Sincronizar con localStorage como backup
    saveCarritoLocal(items);
    return items;
  } catch (error) {
    console.warn('Error obteniendo carrito de API, usando localStorage:', error);
    return getCarritoLocal();
  }
}

export async function agregarAlCarrito(
  producto_id: string,
  producto_tipo: 'market' | 'secondhand',
  cantidad: number = 1,
  precio_unitario: number
): Promise<CarritoItem> {
  // Crear item local primero
  const sesionId = getSessionId();
  const newItem: CarritoItem = {
    id: crypto.randomUUID(),
    sesion_id: sesionId,
    producto_id,
    producto_tipo,
    cantidad,
    precio_unitario,
    created_at: new Date().toISOString(),
  };
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE}?sesion_id=${encodeURIComponent(sesionId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        producto_id,
        producto_tipo,
        cantidad,
        precio_unitario,
      }),
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const item = json.data;
      // Actualizar localStorage
      const local = getCarritoLocal();
      const updated = local.filter(i => !(i.producto_id === producto_id && i.producto_tipo === producto_tipo));
      updated.push(item);
      saveCarritoLocal(updated);
      return item;
    } else {
      // Si falla, usar localStorage
      console.warn('API no disponible, guardando en localStorage');
      const local = getCarritoLocal();
      const existing = local.find(i => i.producto_id === producto_id && i.producto_tipo === producto_tipo);
      if (existing) {
        existing.cantidad += cantidad;
        existing.precio_unitario = precio_unitario;
      } else {
        local.push(newItem);
      }
      saveCarritoLocal(local);
      return existing || newItem;
    }
  } catch (error) {
    console.warn('Error agregando al carrito en API, usando localStorage:', error);
    // Guardar en localStorage como fallback
    const local = getCarritoLocal();
    const existing = local.find(i => i.producto_id === producto_id && i.producto_tipo === producto_tipo);
    if (existing) {
      existing.cantidad += cantidad;
      existing.precio_unitario = precio_unitario;
    } else {
      local.push(newItem);
    }
    saveCarritoLocal(local);
    return existing || newItem;
  }
}

export async function actualizarItemCarrito(
  itemId: string,
  cantidad: number
): Promise<CarritoItem> {
  try {
    const headers = await getAuthHeaders();
    const sesionId = getSessionId();
    const res = await fetch(`${BASE}/${itemId}?sesion_id=${encodeURIComponent(sesionId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ cantidad }),
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const item = json.data;
      // Actualizar localStorage
      const local = getCarritoLocal();
      const updated = local.map(i => i.id === itemId ? item : i);
      saveCarritoLocal(updated);
      return item;
    } else {
      // Fallback a localStorage
      const local = getCarritoLocal();
      const item = local.find(i => i.id === itemId);
      if (item) {
        item.cantidad = cantidad;
        saveCarritoLocal(local);
        return item;
      }
      throw new Error('Item no encontrado');
    }
  } catch (error) {
    console.warn('Error actualizando carrito en API, usando localStorage:', error);
    // Fallback a localStorage
    const local = getCarritoLocal();
    const item = local.find(i => i.id === itemId);
    if (item) {
      item.cantidad = cantidad;
      saveCarritoLocal(local);
      return item;
    }
    throw error;
  }
}

export async function eliminarItemCarrito(itemId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const sesionId = getSessionId();
    const res = await fetch(`${BASE}/${itemId}?sesion_id=${encodeURIComponent(sesionId)}`, {
      method: 'DELETE',
      headers,
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    }
    
    // Actualizar localStorage siempre
    const local = getCarritoLocal();
    const updated = local.filter(i => i.id !== itemId);
    saveCarritoLocal(updated);
  } catch (error) {
    console.warn('Error eliminando del carrito en API, usando localStorage:', error);
    // Fallback a localStorage
    const local = getCarritoLocal();
    const updated = local.filter(i => i.id !== itemId);
    saveCarritoLocal(updated);
  }
}

export async function vaciarCarrito(): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const sesionId = getSessionId();
    const res = await fetch(`${BASE}?sesion_id=${encodeURIComponent(sesionId)}`, {
      method: 'DELETE',
      headers,
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    }
    
    // Limpiar localStorage siempre
    saveCarritoLocal([]);
  } catch (error) {
    console.warn('Error vaciando carrito en API, usando localStorage:', error);
    // Fallback a localStorage
    saveCarritoLocal([]);
  }
}
