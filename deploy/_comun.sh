# shellcheck shell=bash
# Funciones comunes de los scripts de deploy/ (se carga con `source`, no se ejecuta).
# Variables opcionales: ENV_FILE (por omision deploy/.env) y COMPOSE_PROJECT_NAME (por omision uptc-prod).
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/.env}"

dc() {
  docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/docker-compose.prod.yml" "$@"
}

# Lee VAR de ENV_FILE sin ejecutarlo (los valores pueden tener caracteres raros).
leer_env() {
  { grep -E "^$1=" "$ENV_FILE" || true; } | tail -n1 | cut -d= -f2-
}

necesita_env() {
  [ -f "$ENV_FILE" ] || { echo "Falta $ENV_FILE. Corre deploy/instalar-vm.sh primero." >&2; exit 1; }
}
