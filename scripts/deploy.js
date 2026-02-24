#!/usr/bin/env node
/**
 * Script de deploy automático
 * Uso: pnpm deploy "mensaje del commit"
 * O: node scripts/deploy.js "mensaje del commit"
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Obtener mensaje del commit desde argumentos o pedirlo
const commitMessage = process.argv[2] || 'Actualización automática';

function deploy() {
  try {
    console.log('🔄 Verificando cambios...\n');
    
    // Verificar si hay cambios
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (!status.trim()) {
      console.log('✅ No hay cambios para commitear');
      return;
    }

    console.log('📦 Agregando cambios...');
    execSync('git add .', { stdio: 'inherit' });

    console.log(`💾 Creando commit: "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

    console.log('🚀 Enviando a GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });

    console.log('\n✅ Deploy completado exitosamente!');
    console.log('📡 Vercel detectará los cambios y hará deploy automático\n');
  } catch (error) {
    console.error('\n❌ Error durante el deploy:', error.message);
    process.exit(1);
  }
}

deploy();
