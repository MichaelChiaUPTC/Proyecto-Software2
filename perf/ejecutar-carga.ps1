# Ejecuta la prueba de carga con la imagen grafana/k6 (sin instalar k6), mide CPU y memoria de la API y de
# MySQL con `docker stats` mientras corre y genera docs/evidencias/carga.md.
# Requisitos: docker compose up -d --build (API en http://localhost:3000) y `cd backend && npm run seed`.
param(
  [string]$Duracion = '3m',
  [string]$ApiDesdeContenedor = 'http://host.docker.internal:3000/api'
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$res = Join-Path $PSScriptRoot 'resultados'
New-Item -ItemType Directory -Force $res | Out-Null
Remove-Item "$res\*" -Force -ErrorAction SilentlyContinue

docker pull grafana/k6 | Out-Null
$api = docker compose ps -q api
$mysql = docker compose ps -q mysql
if (-not $api -or -not $mysql) { throw 'Levanta primero: docker compose up -d --build' }

$inicio = Get-Date
$k6 = Start-Process -FilePath docker -PassThru -NoNewWindow -RedirectStandardOutput "$res\k6.txt" -RedirectStandardError "$res\k6.err.txt" -ArgumentList @(
  'run', '--rm', '-i', '-v', "`"${PSScriptRoot}:/scripts`"", '-e', "BASE_URL=$ApiDesdeContenedor", '-e', "DURACION=$Duracion",
  'grafana/k6', 'run', '--summary-export=/scripts/resultados/resumen.json', '/scripts/carga.js')

# Muestreo de consumo cada ~3 s mientras k6 corre (el registro de usuarios del setup también cuenta).
't,contenedor,cpu_pct,mem_mib' | Set-Content "$res\stats.csv"
while (-not $k6.HasExited) {
  $t = [int]((Get-Date) - $inicio).TotalSeconds
  foreach ($par in @(@('api', $api), @('mysql', $mysql))) {
    $linea = docker stats --no-stream --format '{{.CPUPerc}};{{.MemUsage}}' $par[1]
    if ($linea -match '^([\d.]+)%;([\d.]+)(MiB|GiB)') {
      $mem = [double]$Matches[2]; if ($Matches[3] -eq 'GiB') { $mem *= 1024 }
      "$t,$($par[0]),$($Matches[1]),$([math]::Round($mem, 1))" | Add-Content "$res\stats.csv"
    }
  }
}
$null = $k6.Handle # sin esto ExitCode queda vacío en Windows PowerShell 5.1
$k6.WaitForExit()
Get-Content "$res\k6.err.txt" -ErrorAction SilentlyContinue | Where-Object { $_ } | Select-Object -Last 5 | ForEach-Object { Write-Host $_ }

# Limpia los usuarios de carga (correos e2e-carga-*) y genera el informe.
$ErrorActionPreference = 'Continue'
Get-Content (Join-Path $raiz 'e2e/cleanup.sql') -Raw | docker compose exec -T -e MYSQL_PWD=uptc_dev mysql mysql -uuptc uptc 2>$null | Out-Null

node (Join-Path $PSScriptRoot 'informe.mjs') $Duracion
$codigo = $LASTEXITCODE
Write-Host "Informe: docs/evidencias/carga.md (código $codigo; 0 = umbrales cumplidos)"
exit $codigo
