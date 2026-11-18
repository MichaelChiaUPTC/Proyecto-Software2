#!/usr/bin/env bash
# Volcado comprimido de la base (con fecha) y rotacion de BACKUP_DIAS dias (7 por omision).
# Cron diario a las 03:00 (hora de la VM):
#   0 3 * * * /home/ubuntu/proyecto-software-II/deploy/backup-mysql.sh >> /var/log/uptc-backup.log 2>&1
set -euo pipefail
# shellcheck source=_comun.sh
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
necesita_env

dir="$(leer_env BACKUP_DIR)"; dir="${dir:-./backups}"
case "$dir" in /*) ;; *) dir="$DEPLOY_DIR/$dir" ;; esac
dias="$(leer_env BACKUP_DIAS)"; dias="${dias:-7}"
mkdir -p "$dir"

archivo="$dir/uptc-$(date +%Y%m%d-%H%M%S).sql.gz"
# La clave de root se lee dentro del contenedor: no aparece en la linea de comandos del host.
# shellcheck disable=SC2016 # las variables se expanden dentro del contenedor
dc exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' \
  | gzip > "$archivo.tmp"
# gzip -t detecta un volcado truncado antes de dar el respaldo por bueno
gzip -t "$archivo.tmp"
mv "$archivo.tmp" "$archivo"
find "$dir" -maxdepth 1 -name 'uptc-*.sql.gz' -mtime "+$dias" -delete
echo "$(date -Is) respaldo: $archivo ($(du -h "$archivo" | cut -f1))"
