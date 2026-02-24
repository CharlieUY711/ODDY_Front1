/**
 * Script para verificar tablas directamente usando Service Role Key
 */

import { createClient } from '@supabase/supabase-js';
import { projectId } from '../src/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWdxb2JmbWdhdGF2bmJ0dmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQzMDMxOSwiZXhwIjoyMDg2MDA2MzE5fQ.pcooafz3LUPmxKBoBF7rR_ifu2DyGcMGbBWJXhUl6nI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  console.log('🔍 Verificando tablas en Supabase...\n');

  // Tablas que sabemos que existen (por las Edge Functions)
  const existingTables = [
    'personas_75638143',
    'organizaciones_75638143',
    'roles_contextuales_75638143',
    'pedidos_75638143',
    'metodos_pago_75638143',
    'metodos_envio_75638143',
    'kv_store_75638143',
  ];

  // Tablas necesarias para el marketplace
  const marketplaceTables = [
    'productos_market_75638143',
    'productos_secondhand_75638143',
    'departamentos_75638143',
    'vendedores_75638143',
    'preguntas_productos_75638143',
    'ratings_vendedores_75638143',
  ];

  console.log('📊 TABLAS EXISTENTES (del sistema):\n');
  for (const tableName of existingTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        const columns = data && data.length > 0 
          ? Object.keys(data[0])
          : [];
        console.log(`✅ ${tableName}`);
        if (columns.length > 0) {
          console.log(`   Columnas: ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
        }
      }
    } catch (e: any) {
      console.log(`❌ ${tableName}: ${e?.message || 'Error'}`);
    }
  }

  console.log('\n📊 TABLAS PARA MARKETPLACE:\n');
  for (const tableName of marketplaceTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('Could not find')) {
          console.log(`❌ ${tableName}: NO EXISTE`);
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`);
        }
      } else {
        const columns = data && data.length > 0 
          ? Object.keys(data[0])
          : [];
        console.log(`✅ ${tableName} - EXISTE`);
        if (columns.length > 0) {
          console.log(`   Columnas (${columns.length}):`);
          columns.forEach(col => {
            const value = data[0][col];
            const type = typeof value;
            console.log(`      • ${col}: ${type}${value !== null ? ` (ej: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''})` : ' (null)'}`);
          });
        } else {
          console.log(`   ⚠️  Tabla vacía - estructura no inferible`);
        }
      }
    } catch (e: any) {
      console.log(`❌ ${tableName}: ${e?.message || 'Error desconocido'}`);
    }
  }

  console.log('\n💡 Resumen:');
  console.log('   - Si una tabla muestra "NO EXISTE", necesitamos crearla');
  console.log('   - Si muestra columnas, podemos verificar si tiene los campos necesarios');
}

checkTables();
