/* =====================================================
   Hook para cargar productos desde la API
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { useState, useEffect } from 'react';
import { 
  fetchProductosMarket, 
  fetchProductosSecondHand,
  type ProductoMarket,
  type ProductoSecondHand 
} from '../services/productosApi';
import { fetchDepartamentos, type Departamento } from '../services/departamentosApi';

// Tipos del componente (compatibilidad)
export interface MktProduct {
  id: number;
  img: string;
  d: string;
  n: string;
  p: string;
  o: string | null;
  b: string | null;
  bt: string;
  desc: string;
  r: number;
  rv: number;
  q: string;
  vids?: string[];
  publishedDate?: string;
}

export interface ShProduct {
  id: number;
  img: string;
  d: string;
  n: string;
  p: string;
  og: string;
  c: number;
  desc: string;
  r: number;
  rv: number;
  q: string;
  vids?: string[];
  publishedDate?: string;
}

// Transformar ProductoMarket a MktProduct
function transformMarketProduct(p: ProductoMarket, deptColors: Record<string, string>): MktProduct {
  const precio = p.precio ? `$${p.precio.toLocaleString('es-UY')}` : '$0';
  const precioOriginal = p.precio_original ? `$${p.precio_original.toLocaleString('es-UY')}` : null;
  const descuento = precioOriginal && p.precio_original && p.precio
    ? Math.round(((p.precio_original - p.precio) / p.precio_original) * 100)
    : null;
  const badge = descuento ? `-${descuento}%` : p.badge || null;
  
  return {
    id: parseInt(p.id.replace(/-/g, '').substring(0, 8), 16) || Math.random() * 1000000, // Convertir UUID a número
    img: p.imagen_principal || '',
    d: p.departamento_nombre || p.departamento?.nombre || 'Sin categoría',
    n: p.nombre,
    p: precio,
    o: precioOriginal,
    b: badge,
    bt: p.badge_color || '',
    desc: p.descripcion || '',
    r: p.rating || 0,
    rv: p.rating_count || 0,
    q: '', // Se cargará desde preguntas
    vids: p.videos || [],
    publishedDate: p.published_date ? new Date(p.published_date).toLocaleDateString('es-UY') : undefined,
  };
}

// Transformar ProductoSecondHand a ShProduct
function transformSecondHandProduct(p: ProductoSecondHand, deptColors: Record<string, string>): ShProduct {
  const precio = p.precio ? `$${p.precio.toLocaleString('es-UY')}` : '$0';
  const precioOriginal = p.precio_original ? `Nuevo $${p.precio_original.toLocaleString('es-UY')}` : '';
  const condicionMap: Record<string, number> = {
    'Excelente': 5,
    'Muy bueno': 4,
    'Bueno': 3,
    'Regular': 2,
    'Aceptable': 1,
  };
  
  return {
    id: parseInt(p.id.replace(/-/g, '').substring(0, 8), 16) || Math.random() * 1000000,
    img: p.imagen_principal || '',
    d: p.departamento_nombre || p.departamento?.nombre || 'Sin categoría',
    n: `${p.nombre}${p.condicion ? ` · ${p.condicion}` : ''}`,
    p: precio,
    og: precioOriginal,
    c: p.condicion ? condicionMap[p.condicion] || 3 : 3,
    desc: p.descripcion || '',
    r: p.rating || 0,
    rv: p.rating_count || 0,
    q: '',
    vids: p.videos || [],
    publishedDate: p.published_date ? new Date(p.published_date).toLocaleDateString('es-UY') : undefined,
  };
}

export function useProductos() {
  const [productosMarket, setProductosMarket] = useState<MktProduct[]>([]);
  const [productosSecondHand, setProductosSecondHand] = useState<ShProduct[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptColors, setDeptColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Cargar departamentos primero
        const depts = await fetchDepartamentos(true);
        setDepartamentos(depts);
        
        // Crear mapa de colores de departamentos
        const colors: Record<string, string> = {};
        depts.forEach(dept => {
          colors[dept.nombre] = dept.color || '#C8C4BE';
        });
        setDeptColors(colors);

        // Cargar productos
        const [market, secondhand] = await Promise.all([
          fetchProductosMarket({ estado: 'activo', limit: 100 }),
          fetchProductosSecondHand({ estado: 'activo', limit: 100 }),
        ]);

        // Transformar productos
        setProductosMarket(market.map(p => transformMarketProduct(p, colors)));
        setProductosSecondHand(secondhand.map(p => transformSecondHandProduct(p, colors)));

      } catch (err) {
        console.error('Error cargando productos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        // Mantener arrays vacíos en caso de error
        setProductosMarket([]);
        setProductosSecondHand([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    productosMarket,
    productosSecondHand,
    departamentos,
    deptColors,
    loading,
    error,
  };
}
