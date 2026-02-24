# Cómo desplegar las Edge Functions

## Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/yomgqobfmgatavnbtvdz/functions

2. Para cada función nueva, necesitas:
   - Crear una nueva Edge Function desde el dashboard
   - O usar el CLI de Supabase (ver Opción 2)

## Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref yomgqobfmgatavnbtvdz

# Desplegar todas las funciones
supabase functions deploy make-server-75638143
```

## Opción 3: Desplegar manualmente

Las Edge Functions están en `supabase/functions/server/` y se exponen a través de `index.tsx`.

**Nota importante**: Las funciones nuevas (`productos.tsx`, `departamentos.tsx`, `preguntas.tsx`, `ratings.tsx`) ya están importadas en `index.tsx`, pero necesitas desplegar la función principal `make-server-75638143` para que estén disponibles.

## Verificar que funcionan

Después de desplegar, puedes probar los endpoints:

```bash
# Health check
curl https://yomgqobfmgatavnbtvdz.supabase.co/functions/v1/make-server-75638143/health

# Listar departamentos
curl https://yomgqobfmgatavnbtvdz.supabase.co/functions/v1/make-server-75638143/departamentos \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Endpoints disponibles después del deploy:

- `GET /make-server-75638143/productos/market` - Listar productos Market
- `GET /make-server-75638143/productos/secondhand` - Listar productos Second Hand
- `GET /make-server-75638143/departamentos` - Listar departamentos
- `GET /make-server-75638143/preguntas` - Listar preguntas
- `GET /make-server-75638143/ratings` - Listar ratings

(Ver archivos individuales para todos los endpoints)
