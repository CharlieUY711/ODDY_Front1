/**
 * Script para aplicar la migración usando la API de Supabase directamente
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const projectId = 'yomgqobfmgatavnbtvdz';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWdxb2JmbWdhdGF2bmJ0dmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQzMDMxOSwiZXhwIjoyMDg2MDA2MzE5fQ.pcooafz3LUPmxKBoBF7rR_ifu2DyGcMGbBWJXhUl6nI';
const supabaseUrl = `https://${projectId}.supabase.co`;

async function applyMigration() {
  console.log('🚀 Aplicando migración de tablas del marketplace...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(process.cwd(), 'supabase/migrations/001_create_marketplace_tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL leído correctamente\n');
    console.log('⚙️  Ejecutando SQL vía API de Supabase...\n');

    // Intentar ejecutar el SQL completo usando la API de Supabase
    // Usar el endpoint de PostgREST para ejecutar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ sql: sql })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migración aplicada exitosamente!');
      console.log('Resultado:', result);
    } else {
      const errorText = await response.text();
      console.log('⚠️  No se pudo ejecutar vía API REST');
      console.log('Error:', errorText);
      
      // Intentar método alternativo: usar la API de Management de Supabase
      console.log('\n💡 Intentando método alternativo...\n');
      
      // El SQL debe ejecutarse desde el dashboard de Supabase
      console.log('📋 Para aplicar la migración, por favor:');
      console.log(`   1. Abre: https://supabase.com/dashboard/project/${projectId}/sql/new`);
      console.log('   2. Copia el siguiente SQL:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      console.log('\n   3. Pega el SQL en el editor');
      console.log('   4. Haz clic en "Run" para ejecutar');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Por favor, ejecuta el SQL manualmente desde el dashboard.');
  }
}

applyMigration();
