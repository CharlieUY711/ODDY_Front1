/**
 * Script para verificar que las tablas se crearon correctamente
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

async function verifyTables() {
  console.log('🔍 Verificando que las tablas se crearon correctamente...\n');

  const tablesToCheck = [
    { name: 'departamentos_75638143', description: 'Departamentos/Categorías' },
    { name: 'vendedores_75638143', description: 'Vendedores' },
    { name: 'productos_market_75638143', description: 'Productos Market' },
    { name: 'productos_secondhand_75638143', description: 'Productos Second Hand' },
    { name: 'preguntas_productos_75638143', description: 'Preguntas sobre Productos' },
    { name: 'ratings_vendedores_75638143', description: 'Ratings de Vendedores' },
  ];

  let allSuccess = true;

  for (const { name, description } of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(name)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${name} - ${description}`);
        console.log(`   Error: ${error.message}`);
        allSuccess = false;
      } else {
        console.log(`✅ ${name} - ${description}`);
        
        // Si hay datos, mostrar estructura
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columnas (${columns.length}): ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
        } else {
          // Tabla vacía, intentar inferir estructura desde el schema
          console.log(`   ✓ Tabla creada (vacía)`);
        }
      }
    } catch (e: any) {
      console.log(`❌ ${name} - ${description}`);
      console.log(`   Error: ${e?.message || 'Error desconocido'}`);
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allSuccess) {
    console.log('✅ ¡Todas las tablas se crearon correctamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Crear Edge Functions para productos (CRUD)');
    console.log('   2. Crear servicios en el frontend');
    console.log('   3. Conectar el storefront con las APIs');
  } else {
    console.log('⚠️  Algunas tablas no se pudieron verificar');
    console.log('   Revisa los errores arriba');
  }
}

verifyTables();
