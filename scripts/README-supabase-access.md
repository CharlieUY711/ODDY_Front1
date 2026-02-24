# Cómo obtener el Service Role Key de Supabase

## Pasos:

1. Ve a: https://supabase.com/dashboard/project/yomgqobfmgatavnbtvdz/settings/api

2. En la sección "Project API keys", encontrarás:
   - **anon public** key (ya lo tenemos)
   - **service_role** key (este es el que necesitamos)

3. El service_role key está marcado como "secret" y tiene permisos completos

4. **⚠️ IMPORTANTE**: Este key es muy poderoso, solo úsalo para:
   - Listar tablas
   - Ver estructura de tablas
   - No lo compartas públicamente

5. Una vez que lo tengas, puedes:
   - Compartirlo temporalmente aquí
   - O agregarlo como variable de entorno en el proyecto

## Alternativa: Revisar tablas manualmente

Si prefieres no compartir el service_role key:

1. Ve a: https://supabase.com/dashboard/project/yomgqobfmgatavnbtvdz/editor
2. En el panel izquierdo verás todas las tablas
3. Puedes compartirme un screenshot o lista de las tablas que ves

## Tablas que necesitamos verificar:

- ✅ `personas_75638143` (ya existe según Edge Functions)
- ✅ `organizaciones_75638143` (ya existe)
- ✅ `pedidos_75638143` (ya existe)
- ❓ `productos_market_75638143` (necesitamos verificar)
- ❓ `productos_secondhand_75638143` (necesitamos verificar)
- ❓ `departamentos_75638143` (necesitamos verificar)
- ❓ `vendedores_75638143` (necesitamos verificar)
- ❓ `preguntas_productos_75638143` (necesitamos verificar)
- ❓ `ratings_vendedores_75638143` (necesitamos verificar)
