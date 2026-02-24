/* =====================================================
   Productos API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/productos`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ── Types ────────────────────────────────────────────────────────────
export interface ProductoMarket {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_original?: number;
  departamento_id?: string;
  departamento_nombre?: string;
  imagen_principal: string;
  imagenes?: string[];
  videos?: string[];
  vendedor_id?: string;
  rating?: number;
  rating_count?: number;
  visitas?: number;
  estado?: 'activo' | 'inactivo' | 'vendido' | 'agotado';
  badge?: string;
  badge_color?: string;
  published_date?: string;
  created_at?: string;
  updated_at?: string;
  departamento?: {
    id: string;
    nombre: string;
    color: string;
  };
  vendedor?: {
    id: string;
    nombre: string;
    rating_promedio?: number;
    total_ratings?: number;
  };
}

export interface ProductoSecondHand {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_original?: number;
  departamento_id?: string;
  departamento_nombre?: string;
  imagen_principal: string;
  imagenes?: string[];
  videos?: string[];
  vendedor_id?: string;
  rating?: number;
  rating_count?: number;
  visitas?: number;
  estado?: 'activo' | 'inactivo' | 'vendido' | 'agotado';
  condicion?: string;
  published_date?: string;
  created_at?: string;
  updated_at?: string;
  departamento?: {
    id: string;
    nombre: string;
    color: string;
  };
  vendedor?: {
    id: string;
    nombre: string;
    rating_promedio?: number;
    total_ratings?: number;
  };
}

export interface ProductosFilters {
  departamento_id?: string;
  vendedor_id?: string;
  estado?: string;
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

// ── Market Products ───────────────────────────────────────────────────

export async function fetchProductosMarket(filters?: ProductosFilters): Promise<ProductoMarket[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.departamento_id) params.set('departamento_id', filters.departamento_id);
    if (filters?.vendedor_id) params.set('vendedor_id', filters.vendedor_id);
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    if (filters?.order_by) params.set('order_by', filters.order_by);
    if (filters?.order_dir) params.set('order_dir', filters.order_dir);

    const res = await fetch(`${BASE}/market?${params}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error('Error fetching productos market:', error);
    throw error;
  }
}

export async function fetchProductoMarketById(id: string): Promise<ProductoMarket | null> {
  try {
    const res = await fetch(`${BASE}/market/${id}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || null;
  } catch (error) {
    console.error('Error fetching producto market:', error);
    throw error;
  }
}

export async function createProductoMarket(producto: Partial<ProductoMarket>): Promise<ProductoMarket> {
  try {
    const res = await fetch(`${BASE}/market`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(producto),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error creating producto market:', error);
    throw error;
  }
}

export async function updateProductoMarket(id: string, producto: Partial<ProductoMarket>): Promise<ProductoMarket> {
  try {
    const res = await fetch(`${BASE}/market/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(producto),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error updating producto market:', error);
    throw error;
  }
}

export async function deleteProductoMarket(id: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/market/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
  } catch (error) {
    console.error('Error deleting producto market:', error);
    throw error;
  }
}

// ── Second Hand Products ──────────────────────────────────────────────

export async function fetchProductosSecondHand(filters?: ProductosFilters): Promise<ProductoSecondHand[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.departamento_id) params.set('departamento_id', filters.departamento_id);
    if (filters?.vendedor_id) params.set('vendedor_id', filters.vendedor_id);
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    if (filters?.order_by) params.set('order_by', filters.order_by);
    if (filters?.order_dir) params.set('order_dir', filters.order_dir);

    const res = await fetch(`${BASE}/secondhand?${params}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error('Error fetching productos secondhand:', error);
    throw error;
  }
}

export async function fetchProductoSecondHandById(id: string): Promise<ProductoSecondHand | null> {
  try {
    const res = await fetch(`${BASE}/secondhand/${id}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || null;
  } catch (error) {
    console.error('Error fetching producto secondhand:', error);
    throw error;
  }
}

export async function createProductoSecondHand(producto: Partial<ProductoSecondHand>): Promise<ProductoSecondHand> {
  try {
    const res = await fetch(`${BASE}/secondhand`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(producto),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error creating producto secondhand:', error);
    throw error;
  }
}

export async function updateProductoSecondHand(id: string, producto: Partial<ProductoSecondHand>): Promise<ProductoSecondHand> {
  try {
    const res = await fetch(`${BASE}/secondhand/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(producto),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error updating producto secondhand:', error);
    throw error;
  }
}

export async function deleteProductoSecondHand(id: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/secondhand/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
  } catch (error) {
    console.error('Error deleting producto secondhand:', error);
    throw error;
  }
}
