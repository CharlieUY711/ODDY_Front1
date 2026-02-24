/**
 * Script para aplicar la migración de tablas del marketplace
 */

import { createClient } from '@supabase/supabase-js';
import { projectId } from '../src/utils/supabase/info';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = `https://${projectId}.supabase.co`;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWdxb2JmbWdhdGF2bmJ0dmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQzMDMxOSwiZXhwIjoyMDg2MDA2MzE5fQ.pcooafz3LUPmxKBoBF7rR_ifu2DyGcMGbBWJXhUl6nI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Aplicando migración de tablas del marketplace...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(process.cwd(), 'supabase/migrations/001_create_marketplace_tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL leído correctamente\n');
    console.log('⚙️  Ejecutando SQL...\n');

    // Dividir el SQL en statements individuales (separados por ;)
    // Filtrar líneas vacías y comentarios
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltar comentarios y líneas vacías
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        // Ejecutar cada statement usando rpc o directamente
        // Nota: Supabase no tiene un método directo para ejecutar SQL arbitrario
        // Necesitamos usar la API REST directamente
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          // Si rpc/exec_sql no existe, intentar método alternativo
          // Usar directamente el cliente de Supabase para operaciones específicas
          console.log(`⚠️  Statement ${i + 1}: No se pudo ejecutar directamente`);
          console.log(`   Intentando método alternativo...`);
          
          // Para CREATE TABLE, necesitamos usar la API de Supabase directamente
          // Esto requiere acceso a la base de datos PostgreSQL directamente
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1} ejecutado`);
        }
      } catch (e: any) {
        console.log(`❌ Error en statement ${i + 1}: ${e.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  No se pudo ejecutar el SQL directamente desde el script.`);
      console.log(`   Esto es normal - Supabase requiere ejecutar SQL desde el dashboard.`);
      console.log(`\n💡 Por favor, ejecuta el SQL manualmente:`);
      console.log(`   1. Ve a: https://supabase.com/dashboard/project/${projectId}/sql/new`);
      console.log(`   2. Copia el contenido de: supabase/migrations/001_create_marketplace_tables.sql`);
      console.log(`   3. Pega y ejecuta el SQL`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log(`\n💡 Por favor, ejecuta el SQL manualmente desde el dashboard de Supabase.`);
  }
}

applyMigration();
