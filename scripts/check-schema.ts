/**
 * Script para verificar el schema y buscar tablas
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

async function checkSchema() {
  console.log('🔍 Verificando schema de Supabase...\n');

  // Intentar diferentes variaciones de nombres de tablas
  const tableVariations = [
    // Con sufijo
    'personas_75638143',
    'organizaciones_75638143',
    'pedidos_75638143',
    // Sin sufijo
    'personas',
    'organizaciones',
    'pedidos',
    // Otras posibles variaciones
    'productos',
    'productos_market',
    'productos_secondhand',
    'departamentos',
    'categorias',
  ];

  console.log('📊 Probando diferentes nombres de tablas:\n');
  
  for (const tableName of tableVariations) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (!error) {
        console.log(`✅ ${tableName} - EXISTE`);
        // Intentar obtener estructura
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          console.log(`   Columnas (${columns.length}): ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
        }
      } else {
        // Solo mostrar errores que no sean "no encontrada"
        if (!error.message.includes('schema cache') && !error.message.includes('Could not find')) {
          console.log(`⚠️  ${tableName}: ${error.message}`);
        }
      }
    } catch (e) {
      // Ignorar errores silenciosamente
    }
  }

  // Intentar usar REST API directamente para listar tablas
  console.log('\n🔍 Intentando consultar vía REST API...\n');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('Respuesta del endpoint raíz:', text.substring(0, 200));
    }
  } catch (e) {
    console.log('No se pudo consultar endpoint raíz');
  }

  console.log('\n💡 Conclusión:');
  console.log('   Las tablas probablemente no existen o tienen nombres diferentes.');
  console.log('   Necesitamos crearlas con los scripts SQL apropiados.');
}

checkSchema();
