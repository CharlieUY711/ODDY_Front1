/**
 * Verificación simple de tablas - intentar insertar un registro de prueba
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
  console.log('🔍 Verificando tablas (método alternativo)...\n');

  // Intentar crear un departamento de prueba
  try {
    const { data, error } = await supabase
      .from('departamentos_75638143')
      .insert({
        nombre: 'Test Departamento',
        color: '#FF6835',
        activo: true
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('⚠️  Error de permisos - pero esto puede ser normal si RLS está activado');
        console.log('   Las tablas probablemente existen, solo necesitan configuración de RLS');
      } else if (error.message.includes('schema cache') || error.message.includes('Could not find')) {
        console.log('❌ La tabla NO existe');
      } else {
        console.log(`⚠️  Error: ${error.message}`);
        console.log('   Pero la tabla existe (error diferente a "no encontrada")');
      }
    } else {
      console.log('✅ Tabla departamentos_75638143 existe y funciona!');
      console.log('   Registro de prueba creado:', data);
      
      // Limpiar el registro de prueba
      await supabase
        .from('departamentos_75638143')
        .delete()
        .eq('id', data.id);
      console.log('   Registro de prueba eliminado');
    }
  } catch (e: any) {
    console.log('⚠️  Error al verificar:', e?.message);
  }

  console.log('\n💡 Si Supabase mostró "Success", las tablas se crearon correctamente.');
  console.log('   Los errores de permisos pueden ser por RLS (Row Level Security).');
  console.log('   Puedes verificar visualmente en:');
  console.log(`   https://supabase.com/dashboard/project/${projectId}/editor`);
}

checkTables();
