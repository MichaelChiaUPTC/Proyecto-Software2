# Automatizaciones con n8n

Dos workflows que mandan correos a partir de los datos de la plataforma. n8n no arranca por defecto: está en el perfil `automatizacion` de `docker-compose.yml`.

| Archivo | Cuándo corre | Qué hace |
|---|---|---|
| `insignia-obtenida.json` | cada minuto | Lee de `evento_outbox` los eventos `InsigniaObtenida` con `procesado IS NULL`, envía un correo al estudiante y marca el evento como procesado (`procesado = NOW()`). Si el envío falla, el evento queda pendiente y se reintenta. |
| `resumen-semanal.json` | lunes 7:00 (America/Bogota) | Consulta el resumen de los últimos 7 días por grupo (estudiantes, activos, intentos, aprobados, éxito) y lo envía a cada docente activo. |

## Puesta en marcha
1. `docker compose up -d` (MySQL y API) y luego `docker compose --profile automatizacion up -d n8n`. Editor: http://localhost:5678 (crea el usuario propietario la primera vez).
2. **Credenciales** (Credentials → Create):
   - *MySQL* con nombre `MySQL UPTC`: host `mysql`, puerto `3306`, base `uptc`, usuario y contraseña del `.env` (`DB_USER` / `DB_PASSWORD`, por omisión `uptc` / `uptc_dev`). El usuario necesita `SELECT` en todo y `UPDATE` en `evento_outbox`.
   - *SMTP* con nombre `SMTP UPTC`: el servidor del correo que enviará (p. ej. Gmail con contraseña de aplicación, `smtp.gmail.com`, puerto 465 con SSL; o Brevo).
3. **Importar**: Workflows → Import from File → cada JSON de esta carpeta. (Por terminal: `docker compose exec n8n n8n import:workflow --input=/workflows/insignia-obtenida.json`; la carpeta está montada en `/workflows`.)
4. En cada workflow abre los nodos MySQL y de correo y elige las credenciales creadas (los JSON traen nombres de referencia, no secretos). Cambia el remitente (`fromEmail`) por una dirección que tu SMTP permita.
5. Prueba con *Execute workflow* y, si todo está bien, activa el interruptor *Active*.

## Notas
- La primera vez que se active `insignia-obtenida` enviará correo por **todas** las insignias ya registradas sin procesar. Si no lo quieres, antes ejecuta `UPDATE evento_outbox SET procesado = NOW() WHERE tipo = 'InsigniaObtenida' AND procesado IS NULL;`.
- La API no toca los eventos `InsigniaObtenida`: son solo para n8n (el procesador interno consume `IntentoAprobado` y `LeccionCompletada`).
- Lotes de 50 correos por ejecución en `insignia-obtenida`.
- Los workflows se escribieron a mano con nodos estándar (Schedule Trigger, MySQL, Send Email, Code) y sus consultas se probaron contra el MySQL del proyecto, pero no se importaron en una instancia de n8n. Si alguna versión de n8n rechaza un parámetro, vuelve a armar ese nodo en el editor y exporta de nuevo el JSON.
