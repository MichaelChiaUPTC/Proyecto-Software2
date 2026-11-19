#!/usr/bin/env bash
# Despliega o actualiza la aplicacion en la VM. Uso: deploy/desplegar.sh [--seed] [--sin-pull]
#   --seed      siembra el contenido inicial Y los usuarios demo (clave Demo1234). Solo la primera vez; cambia las claves.
#   --sin-pull  no hace git pull (despliega lo que hay en disco)
set -euo pipefail
# shellcheck source=_comun.sh
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
necesita_env

seed=0; pull=1
for a in "$@"; do
  case "$a" in
    --seed) seed=1 ;;
    --sin-pull) pull=0 ;;
    *) echo "Opcion desconocida: $a" >&2; exit 1 ;;
  esac
done

cd "$DEPLOY_DIR/.."
if [ "$pull" = 1 ]; then git pull --ff-only; fi

# La imagen del corrector debe existir en el host: la API no la descarga.
runner="$(leer_env RUNNER_IMAGE)"; runner="${runner:-python:3.12-alpine}"
docker image inspect "$runner" >/dev/null 2>&1 || docker pull "$runner"

echo "Construyendo y levantando..."
dc build api
dc up -d --wait --remove-orphans caddy api mysql socket-proxy

echo "Migraciones..."
# La API ya las corre al arrancar; aqui se repiten (son idempotentes) para dejar constancia y fallar fuerte.
dc exec -T api node dist/cli/migrate.js

if [ "$seed" = 1 ]; then
  echo "Sembrando contenido y usuarios demo (--seed)..."
  dc --profile seed run --rm seed
  echo "AVISO: existen usuarios demo con clave Demo1234. Cambia esas claves o desactivalos desde el panel de administracion."
fi

echo "Comprobando salud..."
dominio="$(leer_env DOMAIN)"
case "$dominio" in http://*|https://*) url="$dominio" ;; *) url="https://$dominio" ;; esac
# Con puertos distintos de 80/443 (pruebas locales) se puede forzar la URL con HEALTH_URL.
url="${HEALTH_URL:-$url}"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "$url/api/health" | grep -q '"status":"ok"'; then
    echo "OK: $url/api/health responde."
    dc ps
    exit 0
  fi
  sleep 5
done
echo "La salud no responde en $url/api/health. Revisa: docker compose logs caddy api" >&2
exit 1
