/**
 * Script para listar TODAS las tablas en Supabase usando Service Role Key
 * Uso: npx tsx scripts/list-all-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import { projectId } from '../src/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
// Service Role Key (temporal, solo para consultas)
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWdxb2JmbWdhdGF2bmJ0dmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQzMDMxOSwiZXhwIjoyMDg2MDA2MzE5fQ.pcooafz3LUPmxKBoBF7rR_ifu2DyGcMGbBWJXhUl6nI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAllTables() {
  console.log('🔍 Listando TODAS las tablas en Supabase...\n');
  console.log(`📡 URL: ${supabaseUrl}\n`);

  try {
    // Consultar information_schema para obtener todas las tablas
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    if (error) {
      // Si RPC no funciona, intentar método alternativo
      console.log('⚠️  RPC no disponible, usando método alternativo...\n');
      
      // Intentar consultar tablas conocidas y verificar estructura
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

      const foundTables: Array<{name: string, columns: string[]}> = [];

      for (const tableName of knownTables) {
        try {
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!tableError && data !== null) {
            // La tabla existe, obtener sus columnas
            const columns = data.length > 0 
              ? Object.keys(data[0])
              : [];
            
            foundTables.push({ name: tableName, columns });
            console.log(`✅ ${tableName}`);
            if (columns.length > 0) {
              console.log(`   Columnas: ${columns.join(', ')}`);
            } else {
              console.log(`   ⚠️  Tabla vacía - no se pueden inferir columnas`);
            }
          }
        } catch (e: any) {
          if (!e?.message?.includes('schema cache') && !e?.message?.includes('Could not find')) {
            console.log(`⚠️  ${tableName}: ${e?.message || 'Error desconocido'}`);
          }
        }
      }

      // Intentar descubrir otras tablas consultando directamente
      console.log('\n🔍 Intentando descubrir otras tablas...\n');
      
      // Método: intentar consultar información de columnas desde information_schema
      const { data: columnsData, error: colsError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type')
        .eq('table_schema', 'public')
        .order('table_name, ordinal_position');

      if (!colsError && columnsData) {
        const tablesMap = new Map<string, string[]>();
        
        columnsData.forEach((row: any) => {
          const tableName = row.table_name;
          const columnName = row.column_name;
          const dataType = row.data_type;
          
          if (!tablesMap.has(tableName)) {
            tablesMap.set(tableName, []);
          }
          tablesMap.get(tableName)!.push(`${columnName} (${dataType})`);
        });

        console.log('\n📊 TODAS LAS TABLAS ENCONTRADAS:\n');
        tablesMap.forEach((columns, tableName) => {
          console.log(`📋 ${tableName}`);
          console.log(`   Columnas (${columns.length}):`);
          columns.forEach(col => console.log(`      • ${col}`));
          console.log('');
        });

        // Verificar tablas necesarias para el marketplace
        console.log('\n🔍 VERIFICACIÓN DE TABLAS NECESARIAS:\n');
        const requiredTables = {
          'productos_market_75638143': 'Productos nuevos (Market)',
          'productos_secondhand_75638143': 'Productos usados (Second Hand)',
          'departamentos_75638143': 'Categorías/Departamentos',
          'vendedores_75638143': 'Vendedores',
          'preguntas_productos_75638143': 'Preguntas sobre productos',
          'ratings_vendedores_75638143': 'Calificaciones de vendedores',
        };

        Object.entries(requiredTables).forEach(([tableName, description]) => {
          if (tablesMap.has(tableName)) {
            console.log(`✅ ${tableName} - ${description}`);
          } else {
            console.log(`❌ ${tableName} - ${description} - FALTA CREAR`);
          }
        });

      } else {
        console.log('⚠️  No se pudo acceder a information_schema.columns');
        console.log('   Tablas encontradas con método alternativo:');
        foundTables.forEach(t => {
          console.log(`   ✅ ${t.name}`);
        });
      }

    } else if (tables) {
      console.log('📊 Tablas encontradas:\n');
      tables.forEach((table: any) => {
        console.log(`   • ${table.table_name} (${table.table_type})`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

listAllTables();
