# Script para reescribir el historial de Git y cambiar autores de commits
# Uso: .\scripts\rewrite-authors.ps1

Write-Host "⚠️  ADVERTENCIA: Este script reescribirá el historial de Git" -ForegroundColor Yellow
Write-Host "Esto requiere un force push y puede afectar a otros colaboradores`n" -ForegroundColor Yellow

# Mapeo de autores antiguos a nuevos
$authorMap = @{
    "Tu Nombre" = "CharlieUY711 <cvaralla@gmail.com>"
    "Carlos Varalla" = "CharlieUY711 <cvaralla@gmail.com>"
    # Agregar más mapeos aquí si es necesario
}

Write-Host "Mapeo de autores:" -ForegroundColor Cyan
foreach ($old in $authorMap.Keys) {
    Write-Host "  $old -> $($authorMap[$old])" -ForegroundColor Gray
}

Write-Host "`n¿Continuar? (S/N): " -ForegroundColor Yellow -NoNewline
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operación cancelada" -ForegroundColor Red
    exit 0
}

# Crear el script de filtro para git filter-branch
$filterScript = @"
#!/bin/sh
"@

foreach ($oldAuthor in $authorMap.Keys) {
    $newAuthor = $authorMap[$oldAuthor]
    $name = $newAuthor.Split('<')[0].Trim()
    $email = $newAuthor.Split('<')[1].TrimEnd('>')
    
    $filterScript += @"

if [ "`$GIT_AUTHOR_NAME" = "$oldAuthor" ]; then
    export GIT_AUTHOR_NAME="$name"
    export GIT_AUTHOR_EMAIL="$email"
fi
if [ "`$GIT_COMMITTER_NAME" = "$oldAuthor" ]; then
    export GIT_COMMITTER_NAME="$name"
    export GIT_COMMITTER_EMAIL="$email"
fi
"@
}

# Guardar el script temporal
$tempScript = Join-Path $env:TEMP "git-filter-author.sh"
$filterScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

Write-Host "`n🔄 Reescribiendo historial..." -ForegroundColor Cyan

# Ejecutar git filter-branch
try {
    git filter-branch -f --env-filter "`"$tempScript`"" --tag-name-filter cat -- --branches --tags
    
    Write-Host "`n✅ Historial reescrito exitosamente" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANTE: Ahora debes hacer un force push:" -ForegroundColor Yellow
    Write-Host "   git push origin main --force" -ForegroundColor White
    Write-Host "`n⚠️  ADVERTENCIA: El force push sobrescribirá el historial remoto" -ForegroundColor Red
    Write-Host "   Asegúrate de que nadie más esté trabajando en el repositorio`n" -ForegroundColor Red
    
} catch {
    Write-Host "`n❌ Error durante la reescritura: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar script temporal
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}
