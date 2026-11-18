#!/usr/bin/env bash
# Prepara una VM Ubuntu (Oracle Cloud ARM64/AMD64) para correr la plataforma. Idempotente: se puede repetir.
# Uso (desde el repositorio clonado):  bash deploy/instalar-vm.sh
set -euo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDO=""; [ "$(id -u)" = 0 ] || SUDO="sudo"
USUARIO="${SUDO_USER:-$(id -un)}"

echo "== 1/5 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | $SUDO sh
fi
$SUDO systemctl enable --now docker
if ! id -nG "$USUARIO" | grep -qw docker; then
  $SUDO usermod -aG docker "$USUARIO"
  echo "   Agregado $USUARIO al grupo docker: cierra la sesion SSH y vuelve a entrar para usar docker sin sudo."
fi

echo "== 2/5 Firewall del sistema (las imagenes de Oracle traen reglas iptables que rechazan todo salvo SSH)"
# Ademas hay que abrir 80 y 443 en la VCN de Oracle (Security List); eso se hace en la consola web.
for p in 80 443; do
  $SUDO iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null || $SUDO iptables -I INPUT 1 -p tcp --dport "$p" -j ACCEPT
done
if ! command -v netfilter-persistent >/dev/null 2>&1; then
  $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
fi
$SUDO netfilter-persistent save # sin esto las reglas se pierden al reiniciar

echo "== 3/5 Imagen del corrector"
$SUDO docker pull python:3.12-alpine

echo "== 4/5 deploy/.env"
if [ -f "$DEPLOY_DIR/.env" ]; then
  echo "   Ya existe; no se toca."
else
  cp "$DEPLOY_DIR/.env.prod.example" "$DEPLOY_DIR/.env"
  chmod 600 "$DEPLOY_DIR/.env"
  for v in JWT_SECRET MYSQL_ROOT_PASSWORD DB_PASSWORD; do
    sed -i "s|^$v=.*|$v=$(openssl rand -hex 24)|" "$DEPLOY_DIR/.env"
  done
  echo "   Creado con secretos aleatorios."
fi

echo "== 5/5 Revision"
falta=""
for v in DOMAIN ACME_EMAIL CORS_ORIGIN; do
  valor="$(grep -E "^$v=" "$DEPLOY_DIR/.env" | cut -d= -f2- || true)"
  [ -n "$valor" ] || falta="$falta $v"
done
if [ -n "$falta" ]; then
  echo "   Falta completar en deploy/.env:$falta  (nano deploy/.env)"
fi
echo "   Siguiente: bash deploy/desplegar.sh --seed"
