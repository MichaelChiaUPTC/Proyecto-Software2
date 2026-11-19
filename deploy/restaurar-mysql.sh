#!/usr/bin/env bash
# Restaura un respaldo .sql.gz sobre la base (REEMPLAZA los datos actuales).
# Uso: deploy/restaurar-mysql.sh <archivo.sql.gz> [--si]     (sin --si pide confirmacion)
set -euo pipefail
# shellcheck source=_comun.sh
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
necesita_env

archivo="${1:-}"
[ -f "$archivo" ] || { echo "Uso: $0 <archivo.sql.gz> [--si]" >&2; exit 1; }
gzip -t "$archivo"
if [ "${2:-}" != "--si" ]; then
  read -r -p "Esto reemplaza la base actual con $archivo. Escribe SI para continuar: " r
  [ "$r" = "SI" ] || { echo "Cancelado."; exit 1; }
fi

echo "Deteniendo la API..."
dc stop api
# shellcheck disable=SC2016 # la variable se expande dentro del contenedor
gunzip -c "$archivo" | dc exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
echo "Iniciando la API..."
dc start api
echo "Restauracion completa desde $archivo"
