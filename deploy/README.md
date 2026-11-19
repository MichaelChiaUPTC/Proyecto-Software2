# Despliegue en una VM (Oracle Cloud Always Free + DuckDNS + Vercel)

Todo lo automatizable está en esta carpeta. Tú solo creas la cuenta, la VM y el dominio, llenas un archivo y corres dos scripts. Probado en local (Docker Desktop); la VM real no se ha probado todavía.

```
Navegador ──HTTPS──> Vercel (frontend, VITE_API_URL)
Navegador ──HTTPS /api──> Caddy ──> api ──> mysql
                                     └──> socket-proxy ──> /var/run/docker.sock ──> contenedor efímero del corrector
```

| Archivo | Para qué |
|---|---|
| `docker-compose.prod.yml`, `Caddyfile` | Caddy (HTTPS automático), API, MySQL, proxy del socket; n8n y seed opcionales |
| `.env.prod.example` | Todas las variables, comentadas |
| `instalar-vm.sh` | Una vez por VM: Docker, firewall, imagen del corrector, `deploy/.env` con secretos |
| `desplegar.sh` | Cada despliegue: `git pull`, build, `up`, migraciones, salud (`--seed`, `--sin-pull`) |
| `backup-mysql.sh`, `restaurar-mysql.sh` | Respaldo diario comprimido (7 días) y restauración |
| `duckdns.sh` | Mantiene la IP en DuckDNS |

## 1. Crear la VM (Oracle Cloud)

1. Crea la cuenta en cloud.oracle.com (pide tarjeta solo para verificar).
2. Compute → Instances → Create: imagen **Ubuntu 22.04/24.04**, forma **VM.Standard.A1.Flex** (ARM, hasta 4 OCPU / 24 GB; con 1 OCPU y 6 GB sobra). Sube tu clave SSH pública.
3. **Abre los puertos en la nube**: Networking → Virtual Cloud Networks → tu VCN → Security Lists → Default → *Add Ingress Rules*: origen `0.0.0.0/0`, TCP, puertos `80` y `443` (dos reglas). Sin esto Let's Encrypt no puede validar el dominio.
4. Reserva la IP pública (Instance → Attached VNIC → IPv4 → *Reserved public IP*) para que no cambie.
5. Conéctate: `ssh ubuntu@<ip-publica>`.

## 2. Dominio gratuito (DuckDNS)

1. Entra a https://www.duckdns.org con tu cuenta de Google/GitHub, crea un subdominio (p. ej. `uptc-python` → `uptc-python.duckdns.org`) y pon la IP pública de la VM.
2. Copia tu **token** (arriba en la página).

## 3. Instalar en la VM

```bash
git clone https://github.com/<tu-usuario>/<repo>.git proyecto-software-II
cd proyecto-software-II
bash deploy/instalar-vm.sh        # instala Docker, abre 80/443 en iptables, descarga python:3.12-alpine y crea deploy/.env
exit                              # vuelve a entrar por SSH para que el grupo docker tenga efecto
nano deploy/.env                  # completa lo que falta (ver abajo)
```

`instalar-vm.sh` es idempotente (puedes repetirlo). Genera `JWT_SECRET`, `MYSQL_ROOT_PASSWORD` y `DB_PASSWORD` con `openssl rand`. Tú completas en `deploy/.env`:

- `DOMAIN` = `uptc-python.duckdns.org` (sin `https://`), `ACME_EMAIL` = tu correo.
- `CORS_ORIGIN` = la URL exacta de Vercel (paso 5), p. ej. `https://uptc-python.vercel.app`, sin barra final. Si aún no la tienes, déjala temporal y corrígela después (`bash deploy/desplegar.sh --sin-pull`).
- `DUCKDNS_SUBDOMAIN` y `DUCKDNS_TOKEN`.
- Opcional: `AI_PROVIDER` y su clave (Gemini o Claude).

> **Reglas iptables de Oracle.** Las imágenes Ubuntu de Oracle traen una regla `REJECT` en `INPUT` que bloquea todo salvo SSH. El script ejecuta, por cada puerto 80 y 443, `sudo iptables -I INPUT 1 -p tcp --dport <p> -j ACCEPT` (si no existe) y luego `sudo netfilter-persistent save` para que sobreviva a un reinicio. Si algún día no llega tráfico: `sudo iptables -L INPUT -n --line-numbers` y confirma que 80 y 443 están antes del `REJECT`.

DuckDNS automático (cada 5 minutos):

```bash
crontab -e
*/5 * * * * /home/ubuntu/proyecto-software-II/deploy/duckdns.sh >> /home/ubuntu/duckdns.log 2>&1
```

## 4. Desplegar

```bash
bash deploy/desplegar.sh --seed
```

- La **primera vez** usa `--seed`: carga los módulos, lecciones y ejercicios del curso. **También crea tres usuarios demo con la clave `Demo1234`** (`estudiante@`, `docente@`, `admin@uptc.edu.co`). Entra como admin y cambia sus datos o desactiva las cuentas que no uses (o crea tu admin real y desactiva las demo). El seed **nunca** corre solo; las siguientes veces ejecuta `bash deploy/desplegar.sh` sin `--seed`.
- Cada despliegue: `git pull --ff-only`, `docker compose build`, `up -d --wait` (espera los healthchecks), migraciones y una comprobación final de `https://<dominio>/api/health`.
- La primera vez Caddy tarda unos segundos en obtener el certificado. Si falla, `docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs caddy` (causas típicas: puerto 80/443 cerrado en la VCN, DuckDNS con otra IP).

## 5. Frontend en Vercel

1. vercel.com → *Add New Project* → importa el repositorio → **Root Directory: `frontend`** (Framework: Vite; Build `npm run build`, Output `dist`, ya detectados).
2. *Settings → Environment Variables*: `VITE_API_URL` = `https://uptc-python.duckdns.org/api` (Production). La variable se incrusta al compilar: **cada cambio exige redesplegar**. Sin ella la app queda en modo demostración con datos simulados.
3. Copia la URL que te da Vercel en `CORS_ORIGIN` de `deploy/.env` y aplica: `bash deploy/desplegar.sh --sin-pull`.
4. `frontend/vercel.json` ya trae la reescritura a `index.html` (rutas del SPA) y cabeceras de seguridad: CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS y caché larga para `/assets`. La CSP permite scripts propios y el hash del script de tema de `index.html`; `connect-src 'self' https:` deja llamar a tu API. **Si editas ese script inline**, recalcula el hash:

   ```bash
   node -e "const h=require('fs').readFileSync('frontend/dist/index.html','utf8');console.log('sha256-'+require('crypto').createHash('sha256').update(h.match(/<script>([\s\S]*?)<\/script>/)[1]).digest('base64'))"
   ```
   y reemplázalo en `script-src` de `frontend/vercel.json` (después de `npm run build` en `frontend/`). Un hash viejo se nota: la consola del navegador muestra «Refused to execute inline script».

## 6. Verificar

```bash
curl https://<dominio>/api/health            # {"status":"ok","db":"up"}
curl -I https://<dominio>/api/health          # cabeceras de Helmet y HTTPS válido
```

Después, en el navegador: abre la URL de Vercel → ingresa → completa un ejercicio (esto prueba CORS, JWT, MySQL y el corrector). Comprobaciones de seguridad rápidas:

```bash
nc -zv <ip-publica> 3306                      # debe fallar: MySQL no está publicado
nc -zv <ip-publica> 3000                      # debe fallar: la API solo se alcanza por Caddy
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps   # todo "healthy"
```

## 7. Backups

```bash
bash deploy/backup-mysql.sh                   # prueba manual → deploy/backups/uptc-AAAAMMDD-HHMMSS.sql.gz
crontab -e
0 3 * * * /home/ubuntu/proyecto-software-II/deploy/backup-mysql.sh >> /home/ubuntu/uptc-backup.log 2>&1
```

Conserva `BACKUP_DIAS` (7) días. **Guarda copias fuera de la VM** (Drive, un bucket gratuito, tu PC: `scp ubuntu@<ip>:proyecto-software-II/deploy/backups/uptc-*.sql.gz .`); un respaldo en la misma VM no sirve si se pierde la VM. Restaurar (reemplaza los datos actuales, detiene la API mientras tanto):

```bash
bash deploy/restaurar-mysql.sh deploy/backups/uptc-20261118-030000.sql.gz
```

Prueba una restauración al menos una vez antes de necesitarla.

## 8. n8n (opcional)

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml --profile automatizacion up -d n8n
ssh -L 5678:localhost:5678 ubuntu@<ip-publica>        # en tu PC; luego abre http://localhost:5678
```

n8n solo escucha en `127.0.0.1` de la VM, no está en Internet. Configura las credenciales (MySQL: host `mysql`, base `uptc`; SMTP) e importa los workflows desde `/workflows` como indica `n8n/README.md`.

## Seguridad: qué se hizo y qué no

- **Sin puertos de base ni API publicados**: solo Caddy escucha 80/443. MySQL y la API viven en redes internas.
- **Socket de Docker filtrado**: la API habla con `tecnativa/docker-socket-proxy` (`DOCKER_HOST=tcp://socket-proxy:2375`), que solo permite `CONTAINERS` + `POST` (lo que usa `docker run --rm -i`, `kill` y `rm -f`). Probado: crear/ejecutar/matar/borrar funcionan; `docker info`, `images`, `pull` y `volume ls` reciben 403. **Límite**: el proxy no mira el cuerpo de `create`, así que alguien que ya controle la API podría pedir un contenedor privilegiado. Es una mitigación, no aislamiento. Para aislar de verdad: corrector en otra VM (`DOCKER_HOST=tcp://…` con TLS o `ssh://`), Docker rootless/gVisor, o Judge0 tras el puerto `CodeRunner`.
- **Imagen del corrector**: debe estar descargada en la VM (`instalar-vm.sh` lo hace); el proxy no permite `pull`. Si cambias `RUNNER_IMAGE`, haz `docker pull` a mano.
- **IP real y límites**: `TRUST_PROXY=1` hace que el límite de intentos de login use la IP del cliente (la que Caddy agrega en `X-Forwarded-For`; Caddy descarta la que mande el cliente). Hay prueba automática en `backend/test/auth.test.ts`.
- **CORS** restringido a `CORS_ORIGIN` (obligatorio en producción). **Helmet** activo. Límites: 10 intentos fallidos de login por IP cada 15 min y 10 envíos por usuario por minuto.
- **Secretos** solo en `deploy/.env` (modo 600, ignorado por git).
- **Seed demo** solo con `--seed` explícito.
- **Pendiente de decidir**: copias fuera de la VM, rotación del `JWT_SECRET` (invalida sesiones), actualizaciones del sistema (`sudo apt upgrade`; `unattended-upgrades` recomendado).

## Probar en tu PC antes de la VM (opcional)

```bash
cp deploy/.env.prod.example /tmp/prod.env   # DOMAIN=http://localhost, HTTP_PORT=8088, HTTPS_PORT=8443, ACME_EMAIL, CORS_ORIGIN y secretos de prueba
ENV_FILE=/tmp/prod.env COMPOSE_PROJECT_NAME=uptc-prod-test HEALTH_URL=http://localhost:8088 bash deploy/desplegar.sh --sin-pull --seed
docker compose -p uptc-prod-test down -v        # limpia solo ese proyecto
```
