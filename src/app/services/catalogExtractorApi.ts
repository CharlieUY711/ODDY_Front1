/* =====================================================
   Catalog Extractor API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-75638143/catalog-extractor`;
const HEADERS = {
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface ExtractCatalogResponse {
  ok: boolean;
  products?: Record<string, unknown>[];
  error?: string;
}

/**
 * Extrae productos de un catálogo (URL, PDF o imagen) usando Claude Vision API
 * @param input - URL string o File
 * @param mode - 'url' para URLs, 'file' para archivos
 * @returns Array de productos extraídos
 */
export async function extractCatalog(input: string | File, mode: 'url' | 'file' = 'file'): Promise<ExtractCatalogResponse> {
  try {
    const formData = new FormData();
    
    if (mode === 'url') {
      formData.append('mode', 'url');
      formData.append('url', input as string);
    } else {
      formData.append('mode', 'file');
      formData.append('file', input as File);
    }

    const res = await fetch(BASE, {
      method: 'POST',
      headers: HEADERS,
      body: formData,
    });

    const data = await res.json() as ExtractCatalogResponse;
    
    if (!res.ok) {
      return { ok: false, error: data.error || `Error ${res.status}: ${res.statusText}` };
    }

    return data;
  } catch (err) {
    console.error('Catalog Extractor API error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
