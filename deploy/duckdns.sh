#!/usr/bin/env bash
# Actualiza la IP de tu subdominio en DuckDNS (usa la IP publica desde la que se ejecuta).
# Cron (cada 5 min):  */5 * * * * /home/ubuntu/proyecto-software-II/deploy/duckdns.sh >> /var/log/duckdns.log 2>&1
set -euo pipefail
# shellcheck source=_comun.sh
source "$(dirname "${BASH_SOURCE[0]}")/_comun.sh"
necesita_env

sub="$(leer_env DUCKDNS_SUBDOMAIN)"
token="$(leer_env DUCKDNS_TOKEN)"
[ -n "$sub" ] && [ -n "$token" ] || { echo "Define DUCKDNS_SUBDOMAIN y DUCKDNS_TOKEN en $ENV_FILE" >&2; exit 1; }

# ip vacia = DuckDNS toma la IP de origen de la peticion
resp="$(curl -fsS --max-time 20 "https://www.duckdns.org/update?domains=${sub}&token=${token}&ip=")"
echo "$(date -Is) DuckDNS ${sub}: ${resp}"
[ "$resp" = "OK" ] || exit 1
