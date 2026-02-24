# Cómo aplicar la migración de tablas

## Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/yomgqobfmgatavnbtvdz/sql/new

2. Copia el contenido del archivo `supabase/migrations/001_create_marketplace_tables.sql`

3. Pega el SQL en el editor

4. Haz clic en "Run" para ejecutar la migración

5. Verifica que las tablas se crearon correctamente en: https://supabase.com/dashboard/project/yomgqobfmgatavnbtvdz/editor

## Opción 2: Usando Supabase CLI (si lo tienes instalado)

```bash
supabase db push
```

## Tablas que se crearán:

1. ✅ `departamentos_75638143` - Categorías/Departamentos
2. ✅ `vendedores_75638143` - Vendedores
3. ✅ `productos_market_75638143` - Productos nuevos (Market)
4. ✅ `productos_secondhand_75638143` - Productos usados (Second Hand)
5. ✅ `preguntas_productos_75638143` - Preguntas sobre productos
6. ✅ `ratings_vendedores_75638143` - Calificaciones de vendedores

## Después de crear las tablas:

1. Configurar RLS (Row Level Security) si es necesario
2. Agregar datos de ejemplo (departamentos, vendedores)
3. Crear las Edge Functions para productos
4. Conectar el frontend con las APIs
