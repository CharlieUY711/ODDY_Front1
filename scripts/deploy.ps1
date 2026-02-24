# Script de deploy automático para PowerShell
# Uso: .\scripts\deploy.ps1 "mensaje del commit"
# O: pnpm deploy "mensaje del commit"

param(
    [string]$Message = "Actualización automática"
)

Write-Host "🔄 Verificando cambios...`n" -ForegroundColor Cyan

# Verificar si hay cambios
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No hay cambios para commitear" -ForegroundColor Green
    exit 0
}

Write-Host "📦 Agregando cambios..." -ForegroundColor Yellow
git add .

Write-Host "💾 Creando commit: `"$Message`"" -ForegroundColor Yellow
git commit -m $Message

Write-Host "🚀 Enviando a GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Deploy completado exitosamente!" -ForegroundColor Green
Write-Host "📡 Vercel detectará los cambios y hará deploy automático`n" -ForegroundColor Cyan
