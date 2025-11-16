#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Genera task-definition.json desde task-definition.template.json usando variables del .env

.DESCRIPTION
    Este script lee las variables de entorno desde el archivo .env,
    y reemplaza los placeholders ${VAR_NAME} en el template con sus valores reales.

.EXAMPLE
    .\generate-task-definition.ps1
#>

param(
    [string]$EnvFile = "$PSScriptRoot\.env",
    [string]$TemplateFile = "$PSScriptRoot\task-definition.template.json",
    [string]$OutputFile = "$PSScriptRoot\task-definition.json"
)

Write-Host "Generando task-definition.json desde .env" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo .env
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: No se encontro el archivo .env en: $EnvFile" -ForegroundColor Red
    Write-Host "   Por favor, crea el archivo .env a partir de .env.example" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe el template
if (-not (Test-Path $TemplateFile)) {
    Write-Host "Error: No se encontro el archivo template en: $TemplateFile" -ForegroundColor Red
    exit 1
}

Write-Host "Leyendo variables desde: $EnvFile" -ForegroundColor Green

# Leer el archivo .env y crear un hashtable con las variables
$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    
    # Ignorar líneas vacías y comentarios
    if ($line -and -not $line.StartsWith('#')) {
        # Separar por el primer = encontrado
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            
            # Remover comillas si existen
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            
            $envVars[$key] = $value
        }
    }
}

Write-Host "Se encontraron $($envVars.Count) variables de entorno" -ForegroundColor Green
Write-Host ""

# Verificar que existen las variables críticas de SMTP
$criticalVars = @('SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD')
$missingVars = @()

foreach ($var in $criticalVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "Advertencia: Faltan las siguientes variables criticas en .env:" -ForegroundColor Yellow
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "   Las credenciales de SMTP (Brevo) no están configuradas." -ForegroundColor Yellow
    Write-Host "   El task definition se generará, pero las notificaciones por email no funcionarán." -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "¿Deseas continuar de todas formas? (s/N)"
    if ($continue -ne 's' -and $continue -ne 'S') {
        Write-Host "Operacion cancelada" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Generando task-definition.json..." -ForegroundColor Cyan

# Leer el contenido del template
$templateContent = Get-Content $TemplateFile -Raw

# Reemplazar todos los placeholders ${VAR_NAME} con sus valores
foreach ($key in $envVars.Keys) {
    $placeholder = "`${$key}"
    $value = $envVars[$key]
    $templateContent = $templateContent -replace [regex]::Escape($placeholder), $value
}

# Guardar el resultado
$templateContent | Set-Content $OutputFile -Encoding UTF8

Write-Host "Archivo generado exitosamente: $OutputFile" -ForegroundColor Green
Write-Host ""

# Mostrar las variables SMTP que se configuraron (ocultando la contraseña)
Write-Host "Configuracion SMTP aplicada:" -ForegroundColor Cyan
Write-Host "   SMTP_HOST: $($envVars['SMTP_HOST'])" -ForegroundColor White
Write-Host "   SMTP_PORT: $($envVars['SMTP_PORT'])" -ForegroundColor White
Write-Host "   SMTP_EMAIL: $($envVars['SMTP_EMAIL'])" -ForegroundColor White
if ($envVars['SMTP_PASSWORD']) {
    $passwordMasked = $envVars['SMTP_PASSWORD'].Substring(0, [Math]::Min(10, $envVars['SMTP_PASSWORD'].Length)) + "..."
    Write-Host "   SMTP_PASSWORD: $passwordMasked" -ForegroundColor White
} else {
    Write-Host "   SMTP_PASSWORD: (no configurada)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Listo para deployment!" -ForegroundColor Green
