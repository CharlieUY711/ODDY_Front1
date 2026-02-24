/* =====================================================
   Departamentos API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-75638143/departamentos`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface Departamento {
  id: string;
  nombre: string;
  color: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function fetchDepartamentos(activo?: boolean, search?: string): Promise<Departamento[]> {
  try {
    const params = new URLSearchParams();
    if (activo !== undefined) params.set('activo', String(activo));
    if (search) params.set('search', search);

    const res = await fetch(`${BASE}?${params}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  } catch (error) {
    console.error('Error fetching departamentos:', error);
    throw error;
  }
}

export async function fetchDepartamentoById(id: string): Promise<Departamento | null> {
  try {
    const res = await fetch(`${BASE}/${id}`, { headers: HEADERS });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || null;
  } catch (error) {
    console.error('Error fetching departamento:', error);
    throw error;
  }
}

export async function createDepartamento(departamento: Partial<Departamento>): Promise<Departamento> {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(departamento),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error creating departamento:', error);
    throw error;
  }
}

export async function updateDepartamento(id: string, departamento: Partial<Departamento>): Promise<Departamento> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(departamento),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (error) {
    console.error('Error updating departamento:', error);
    throw error;
  }
}

export async function deleteDepartamento(id: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
  } catch (error) {
    console.error('Error deleting departamento:', error);
    throw error;
  }
}
