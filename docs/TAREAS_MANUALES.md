# Tareas manuales

Lo que no se puede automatizar desde el código. Marca con `[x]` a medida que avances.
Plan general: [PLAN_DE_ACCION.md](PLAN_DE_ACCION.md).

## A. Infraestructura y cuentas (necesarias para la Fase 7)
- [ ] Crear cuenta en un proveedor con VM gratuita (Oracle Cloud Always Free recomendado: ARM 4 vCPU / 24 GB). Requiere tarjeta para verificación.
- [ ] Crear la VM Ubuntu, abrir puertos 80 y 443, instalar Docker (`curl -fsSL https://get.docker.com | sh`).
- [ ] Conseguir dominio gratuito (DuckDNS o similar) apuntando a la IP de la VM.
- [ ] Cuenta SMTP para correos de n8n (Gmail con contraseña de aplicación, o Brevo gratis).
- [ ] Configurar en Vercel la variable `VITE_API_URL=https://<tu-dominio>/api` y redeploy.
- [ ] Generar secretos reales (`JWT_SECRET`, contraseña de MySQL) y ponerlos en el `.env` de la VM. **Nunca** subirlos a GitHub.
- [ ] **Clave de IA (Fase 3b):** entrar a https://aistudio.google.com con tu cuenta de Google → "Get API key" → crear clave (gratis, sin tarjeta). Ponerla en `.env` (raíz, para docker compose) y/o `backend/.env` como `GEMINI_API_KEY=...` y `AI_PROVIDER=gemini` (opcional `GEMINI_MODEL`; verificar el nombre vigente en https://aistudio.google.com/docs/models), y reconstruir la API: `docker compose up -d --build api`. No pegarla en el chat ni subirla a GitHub. (Alternativa: `AI_PROVIDER=claude` + `ANTHROPIC_API_KEY=...` de console.anthropic.com, requiere recargar créditos; modelo `ANTHROPIC_MODEL`, por omisión `claude-haiku-5-5`.)
- [ ] Dónde guardar backups externos (Google Drive / bucket gratuito) y probar una restauración una vez.

## B. Validación con personas
- [ ] **Prueba de usabilidad (10.2):** 5 estudiantes de Programación Básica usan la app con el formato de usabilidad del docente; registrar tiempos, errores y SUS.
- [ ] Confirmar con el docente/coordinación el número real de estudiantes (el documento asume 150 usuarios, 60 concurrentes, 30 envíos/min) y ajustar 8.1.2.
- [ ] Validar con el docente (Product Owner) cada incremento: dejar acta o pantallazo por sprint (evidencia Scrum).
- [ ] Revisar y corregir el contenido de lecciones y ejercicios (los textos actuales son de ejemplo).

## C. Documento IW
- [ ] Pasar al documento los borradores de `Segundo Corte Faltantes/` (8.10, 9.1, 9.2.2–9.2.3, 9.5–9.7, 10.1–10.9) y unificarlos con lo que genere el código.
- [ ] Redactar 8.4–8.9 con base en la arquitectura implementada (hexagonal, DDD, outbox, cliente-servidor).
- [ ] Rehacer figuras: descomposición modular (Fig. 1), MER físico (Fig. 2), diagrama de clases (Fig. 4), despliegue (Fig. 6). Los diagramas Mermaid de `docs/diagramas.md` sirven de fuente.
- [ ] Actualizar 5.2: `leccion.contenido` pasa de TEXT Markdown a JSON de bloques.
- [ ] Llenar 11.x con los datos de `docs/evidencias/` (los cálculos y la interpretación son tuyos).
- [ ] Secciones 12 (mantenimiento), 13 (calidad), 16 (conclusiones), 17 (bibliografía APA), 18 (infografía).
- [ ] Decidir si el estado del arte necesita 20 referencias (hoy tiene 10).
- [ ] Eliminar el "Anexo A. Decisiones de consolidación" y revisar el límite de 25 páginas.
- [ ] Corregir el glosario de `plataforma_educativa_uptc.md` (dice Angular) o descartar ese archivo viejo.

## D. Entregables complementarios
- [ ] Manual de usuario: tomar pantallazos de cada pantalla y pegarlos en `docs/manual-usuario.md` (el texto lo deja el plan).
- [ ] Publicar el manual de programador (link en 9.7): GitHub Pages o el propio README del repo.
- [ ] Video del aplicativo (recorrido estudiante → docente → admin, 3–5 min).
- [ ] Ponencia / diapositivas.
- [ ] Artículo del proyecto.
- [ ] Registrar en el documento las fechas de trabajo del repositorio (9.6): `git log --date=short --format="%ad %s"`.

## E. Repositorio
- [ ] En GitHub: proteger la rama `main` (requerir PR + CI verde) y agregar a tu compañero como colaborador.
- [ ] Revisar y aprobar cada PR de fase antes de hacer merge.

## F. Fase 0–1 (backend y CI)
- [ ] Antes de cualquier despliegue: cambiar las contraseñas demo (`Demo1234`) o no ejecutar `npm run seed` en producción; crear el admin real desde la BD o con un seed propio.
- [ ] Revisar en GitHub (Actions) que el workflow `CI` corre en verde la primera vez que se haga push (usa un service container MySQL y Node 24).
- [ ] Copiar `.env.example` a `.env` en la raíz y en `backend/` y definir un `JWT_SECRET` propio (no se versionan).

## G. Fase 3 (motor de corrección y gamificación)
- [ ] En cada máquina que corra la API (tu PC, la VM): `docker pull python:3.12-alpine` (la imagen no se descarga sola al corregir).
- [ ] En la VM de producción (Linux): poner `DOCKER_GID=$(stat -c %g /var/run/docker.sock)` en el `.env`. Evaluar aislar el motor (ver "Riesgos" en la bitácora de la Fase 3) antes de abrirlo a más usuarios.
- [ ] Revisar con el docente las **reglas de pista** de los ejercicios: algunas del contenido de ejemplo están al revés (p. ej. "Cuadrado de un número" exige que aparezca `print(`). Por eso el backend todavía no las usa en los mensajes.
- [ ] Revisar los casos de prueba (visibles/ocultos) de cada ejercicio con el docente; hoy son visibles los que coinciden con un ejemplo del enunciado.
- [ ] Decidir si un ejercicio que imprime en vez de devolver (`print(20)` en lugar de `return 20`) debe aprobar: hoy aprueba si lo impreso coincide con la salida esperada.

