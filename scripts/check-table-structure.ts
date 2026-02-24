/**
 * Script para verificar la estructura de las tablas de productos
 * Uso: npx tsx scripts/check-table-structure.ts
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../src/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de tablas de productos...\n');

  const tablesToCheck = [
    'productos_market_75638143',
    'productos_secondhand_75638143',
    'departamentos_75638143',
    'vendedores_75638143',
    'preguntas_productos_75638143',
    'ratings_vendedores_75638143',
  ];

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Tabla: ${tableName}`);
    console.log('─'.repeat(50));
    
    try {
      // Intentar obtener un registro para ver la estructura
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        console.log('   ✅ Estructura (basada en primer registro):');
        const firstRow = data[0];
        Object.keys(firstRow).forEach(key => {
          const value = firstRow[key];
          const type = typeof value;
          const example = value !== null && value !== undefined 
            ? (typeof value === 'string' && value.length > 30 
                ? value.substring(0, 30) + '...' 
                : String(value))
            : 'null';
          console.log(`      • ${key}: ${type} (ej: ${example})`);
        });
      } else {
        console.log('   ⚠️  Tabla vacía - no se puede inferir estructura');
        // Intentar insertar un registro de prueba (solo si es seguro)
        console.log('   💡 La tabla existe pero está vacía');
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e}`);
    }
  }

  console.log('\n💡 Para ver la estructura completa, revisa en:');
  console.log(`   https://supabase.com/dashboard/project/${projectId}/editor`);
}

checkTableStructure();
