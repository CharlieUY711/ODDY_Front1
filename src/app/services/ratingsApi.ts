/* =====================================================
   Ratings API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/ratings`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface Rating {
  id: string;
  vendedor_id: string;
  usuario_id?: string;
  rating: number; // 0-5
  comentario?: string;
  producto_id?: string;
  producto_tipo?: 'market' | 'secondhand';
  fecha?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RatingsFilters {
  vendedor_id?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export async function fetchRatings(filters?: RatingsFilters): Promise<Rating[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.vendedor_id) params.set('vendedor_id', filters.vendedor_id);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    if (filters?.order_by) params.set('order_by', filters.order_by);
    if (filters?.order_dir) params.set('order_dir', filters.order_dir);

    const res = await fetch(`${BASE}?${params}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
}

export async function fetchRatingById(id: string): Promise<Rating | null> {
  try {
    const res = await fetch(`${BASE}/${id}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || null;
  } catch (error) {
    console.error('Error fetching rating:', error);
    throw error;
  }
}

export async function createRating(rating: Partial<Rating>): Promise<Rating> {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(rating),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error creating rating:', error);
    throw error;
  }
}

export async function updateRating(id: string, rating: Partial<Rating>): Promise<Rating> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(rating),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error updating rating:', error);
    throw error;
  }
}

export async function deleteRating(id: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
}
