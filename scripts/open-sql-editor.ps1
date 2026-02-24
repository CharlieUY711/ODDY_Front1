# Script para abrir el SQL Editor de Supabase
$projectId = "yomgqobfmgatavnbtvdz"
$sqlUrl = "https://supabase.com/dashboard/project/$projectId/sql/new"

Write-Host "Abriendo SQL Editor de Supabase..." -ForegroundColor Cyan
Write-Host "URL: $sqlUrl" -ForegroundColor Yellow
Write-Host ""

# Leer el archivo SQL
$sqlPath = Join-Path $PSScriptRoot "..\supabase\migrations\001_create_marketplace_tables.sql"
$sqlContent = Get-Content $sqlPath -Raw

Write-Host "SQL leido correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Instrucciones:" -ForegroundColor Cyan
Write-Host "  1. Se abrira el navegador con el SQL Editor" -ForegroundColor White
Write-Host "  2. Copia el SQL del archivo: $sqlPath" -ForegroundColor White
Write-Host "  3. Pega el SQL en el editor" -ForegroundColor White
Write-Host "  4. Haz clic en Run para ejecutar" -ForegroundColor White
Write-Host ""

# Abrir el navegador
Start-Process $sqlUrl

Write-Host "Navegador abierto. El SQL esta en: $sqlPath" -ForegroundColor Green
