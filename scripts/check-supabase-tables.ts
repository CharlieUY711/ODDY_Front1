/**
 * Script para listar las tablas existentes en Supabase
 * Uso: npx tsx scripts/check-supabase-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../src/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Necesitamos usar service_role_key para consultar el schema
// Por ahora usamos anon key, pero para listar tablas necesitamos service_role
const supabase = createClient(supabaseUrl, publicAnonKey);

async function listTables() {
  console.log('🔍 Consultando tablas en Supabase...\n');
  console.log(`📡 URL: ${supabaseUrl}\n`);

  try {
    // Intentar consultar información del schema usando una query SQL
    // Nota: Esto requiere permisos de service_role o RLS configurado
    
    // Método 1: Intentar consultar información_schema (requiere service_role)
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.log('⚠️  No se pudo acceder a information_schema directamente');
      console.log('   Esto es normal con anon key. Necesitamos service_role_key.\n');
    } else {
      console.log('✅ Tablas encontradas:');
      schemaData?.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
      return;
    }

    // Método 2: Intentar consultar tablas conocidas
    console.log('🔍 Probando tablas conocidas del proyecto...\n');
    
    const knownTables = [
      'personas_75638143',
      'organizaciones_75638143',
      'roles_contextuales_75638143',
      'pedidos_75638143',
      'metodos_pago_75638143',
      'metodos_envio_75638143',
      'kv_store_75638143',
      'productos_market_75638143',
      'productos_secondhand_75638143',
      'departamentos_75638143',
      'vendedores_75638143',
      'preguntas_productos_75638143',
      'ratings_vendedores_75638143',
    ];

    const existingTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0); // Solo verificar si existe, no traer datos

        if (error) {
          // Verificar si el error es porque la tabla no existe
          if (error.code === 'PGRST116' || 
              error.message.includes('does not exist') ||
              error.message.includes('schema cache') ||
              error.message.includes('Could not find the table')) {
            missingTables.push(tableName);
          } else {
            // Otro tipo de error (RLS, permisos, etc.), pero la tabla existe
            console.log(`   ⚠️  ${tableName}: ${error.message}`);
            existingTables.push(tableName);
          }
        } else {
          existingTables.push(tableName);
        }
      } catch (e: any) {
        if (e?.message?.includes('schema cache') || e?.message?.includes('Could not find')) {
          missingTables.push(tableName);
        } else {
          console.log(`   ⚠️  ${tableName}: ${e?.message || e}`);
          missingTables.push(tableName);
        }
      }
    }

    console.log('✅ Tablas EXISTENTES:');
    existingTables.forEach(t => console.log(`   ✓ ${t}`));
    
    console.log('\n❌ Tablas FALTANTES:');
    missingTables.forEach(t => console.log(`   ✗ ${t}`));

    console.log('\n💡 Para ver TODAS las tablas, necesitas:');
    console.log('   1. Service Role Key de Supabase');
    console.log('   2. O revisar manualmente en: https://supabase.com/dashboard/project/' + projectId + '/editor');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listTables();
