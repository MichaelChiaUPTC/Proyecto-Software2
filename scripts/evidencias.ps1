# Regenera TODOS los reportes de docs/evidencias/ con datos reales de la máquina que lo ejecuta:
#   estaticas.md  (ESLint + tsc + npm audit)      cobertura.md (Vitest, backend y frontend)
#   metricas.md   (LOC, complejidad, puntos de función, CK)
#   e2e.md + accesibilidad.md + capturas/ (Playwright + axe)      carga.md (k6 en Docker)
# Requisitos: Docker Desktop y Node 24. Levanta docker compose si la API no responde.
# Uso:  powershell -File scripts/evidencias.ps1 [-Omitir carga,e2e,cobertura,estaticas,metricas] [-DuracionCarga 3m]
#       (o `npm run evidence` en la raíz)
param(
  [string[]]$Omitir = @(),
  [string]$DuracionCarga = '3m'
)
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$resultado = [ordered]@{}

function Paso($nombre, [scriptblock]$accion) {
  if ($Omitir -contains $nombre) { $resultado[$nombre] = 'omitido'; return }
  Write-Host "`n=== $nombre ===" -ForegroundColor Cyan
  & $accion
  $resultado[$nombre] = if ($LASTEXITCODE -eq 0) { 'ok' } else { "FALLA (código $LASTEXITCODE)" }
}

# --- Entorno: API y MySQL en docker compose, con el seed cargado
function Api-Responde { try { (Invoke-RestMethod 'http://localhost:3000/api/health' -TimeoutSec 3).status -eq 'ok' } catch { $false } }
if (-not (Api-Responde)) {
  Write-Host 'La API no responde: docker compose up -d --build ...'
  docker compose up -d --build
  for ($i = 0; $i -lt 40 -and -not (Api-Responde); $i++) { Start-Sleep 3 }
  if (-not (Api-Responde)) { throw 'La API no levantó en 2 minutos.' }
}
try {
  Invoke-RestMethod 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"docente@uptc.edu.co","password":"Demo1234"}' | Out-Null
} catch {
  Write-Host 'Faltan los usuarios demo: npm run seed ...'
  Push-Location backend; npm run seed; Pop-Location
}
docker pull python:3.12-alpine | Out-Null   # imagen del corrector (pruebas del DockerRunner y envíos del E2E/carga)

Paso 'estaticas' { node scripts/informes.mjs estaticas }
Paso 'cobertura' { node scripts/informes.mjs cobertura }
Paso 'metricas' { node scripts/metricas.mjs }   # lee los reportes de cobertura recién generados
Paso 'e2e' {
  Push-Location e2e
  if (-not (Test-Path node_modules)) { npm install }
  npx playwright install chromium | Out-Null
  npx playwright test
  $codigo = $LASTEXITCODE
  Pop-Location
  node scripts/informes.mjs e2e
  $global:LASTEXITCODE = $codigo
}
Paso 'carga' { powershell -File perf/ejecutar-carga.ps1 -Duracion $DuracionCarga }

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
$resultado.GetEnumerator() | ForEach-Object { Write-Host ('{0,-12} {1}' -f $_.Key, $_.Value) }
Write-Host 'Reportes en docs/evidencias/ (índice: docs/evidencias/README.md)'
if ($resultado.Values | Where-Object { $_ -like 'FALLA*' }) { exit 1 }
