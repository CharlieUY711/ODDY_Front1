/* =====================================================
   Preguntas API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/preguntas`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface Pregunta {
  id: string;
  producto_id: string;
  producto_tipo: 'market' | 'secondhand';
  pregunta: string;
  respuesta?: string;
  usuario_id?: string;
  fecha?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreguntasFilters {
  producto_id?: string;
  producto_tipo?: 'market' | 'secondhand';
  limit?: number;
  offset?: number;
}

export async function fetchPreguntas(filters?: PreguntasFilters): Promise<Pregunta[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.producto_id) params.set('producto_id', filters.producto_id);
    if (filters?.producto_tipo) params.set('producto_tipo', filters.producto_tipo);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));

    const res = await fetch(`${BASE}?${params}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error('Error fetching preguntas:', error);
    throw error;
  }
}

export async function fetchPreguntaById(id: string): Promise<Pregunta | null> {
  try {
    const res = await fetch(`${BASE}/${id}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || null;
  } catch (error) {
    console.error('Error fetching pregunta:', error);
    throw error;
  }
}

export async function createPregunta(pregunta: Partial<Pregunta>): Promise<Pregunta> {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(pregunta),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error creating pregunta:', error);
    throw error;
  }
}

export async function updatePregunta(id: string, pregunta: Partial<Pregunta>): Promise<Pregunta> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(pregunta),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error updating pregunta:', error);
    throw error;
  }
}

export async function deletePregunta(id: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
  } catch (error) {
    console.error('Error deleting pregunta:', error);
    throw error;
  }
}
