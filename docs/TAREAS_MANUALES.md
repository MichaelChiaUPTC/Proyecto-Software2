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
- [x] Manual de usuario: redactado con capturas nítidas en `docs/manual/manual-usuario.md` (ver sección J para la revisión humana).
- [ ] Publicar el manual de programador (link en 9.7): el borrador está en `docs/manual/manual-programador.md` (y su PDF); falta decidir dónde se publica (GitHub Pages, el propio repo en GitHub o el PDF en Drive) y poner el link en el documento.
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

## H. Fase 4 (frontend conectado, reportes y n8n)
- [ ] Probar el recorrido en un navegador real contra el backend (no se pudo automatizar en esta fase): `docker compose up -d --build`, `cd backend && npm run seed`, `cd frontend && cp .env.example .env.local && npm run dev`. Registrarse, completar una lección, fallar y acertar un ejercicio, entrar como docente (reportes y CSV) y como admin (desactivar al estudiante).
- [ ] Abrir el CSV exportado en Excel. Si todo aparece en una sola columna (Excel en español usa `;` como separador), usar Datos → Desde texto/CSV, o pedir el cambio a `;`.
- [ ] n8n: definir `N8N_PORT` si el 5678 está ocupado, levantar `docker compose --profile automatizacion up -d n8n`, crear las credenciales **MySQL UPTC** y **SMTP UPTC**, importar `n8n/insignia-obtenida.json` y `n8n/resumen-semanal.json`, elegir las credenciales en cada nodo, cambiar el remitente, probar con *Execute workflow* y **activar** ambos workflows (detalle en `n8n/README.md`).
- [ ] Antes de activar `insignia-obtenida` por primera vez: decidir si se marcan como procesados los eventos viejos (si no, se envían todos de una vez).
- [ ] Vercel: mientras el backend no esté publicado, dejar `VITE_API_URL` sin definir (demo con mocks). Al publicar la API, definirla como `https://<dominio>/api` y redesplegar.
- [ ] Asignar el campo `grupo` a los estudiantes reales (hoy el registro los deja «Sin grupo» y no hay pantalla para editarlo): el reporte por grupo y el resumen semanal dependen de él.

## I. Fase 5 (pruebas y evidencia)
- [ ] Revisar las capturas de `docs/evidencias/capturas/` (44 imágenes, claro y oscuro): que no muestren datos que no quieras en el manual, y elegir cuáles van en `docs/manual-usuario.md`. Se regeneran con `cd e2e && npm run test:capturas`.
- [ ] Prueba de usabilidad real (10.2) con 5 estudiantes; las pruebas automáticas (E2E y axe) no la sustituyen.
- [ ] Revisión de accesibilidad a mano: recorrer login, ejercicio y administración solo con teclado y con un lector de pantalla (NVDA o VoiceOver). axe solo detecta una parte de los problemas.
- [ ] Interpretar `docs/evidencias/carga.md` para 8.1.2/RNF-03: la prueba se hizo en tu PC con todo en la misma máquina. Repetirla contra la VM de producción (Fase 7) con `BASE_URL` apuntando a ella antes de dar el RNF-03 por validado.
- [ ] Confirmar con el docente el número real de usuarios concurrentes: `perf/carga.js` toma `VUS`, `POOL`, `ENVIOS_POR_MIN` y `DOCENTES` por variable de entorno.
- [ ] En GitHub Actions: comprobar que el job `e2e` del CI corre en verde la primera vez (usa docker compose en `ubuntu-latest` y ajusta `DOCKER_GID`).
- [ ] Antes de entregar, correr `npm run evidence` en el equipo que se vaya a citar en el documento (cada reporte lleva fecha y equipo) y pasar las cifras a 10.x y 11.x.

## J. Fase 6 (métricas y manuales)
- [ ] **Revisar la redacción** de `docs/manual/manual-usuario.md` y `docs/manual/manual-programador.md`: tono, términos y nombres reales del curso. Buscar los avisos `> **Pendiente:**` y resolverlos: URL pública definitiva, canal de soporte (el manual dice «escribe a soporte» porque no hay recuperación automática de contraseña) y detalle del despliegue (Fase 7).
- [ ] **Probar el manual de usuario con una persona real** (idealmente un estudiante que no conozca la plataforma) siguiendo solo el texto; anotar dónde se pierde.
- [ ] **Revisar las capturas** de `docs/manual/img/` (30 imágenes, escala 2 y 3, tema claro, con datos de ejemplo). Se regeneran con `cd e2e && npm run manual`; ese comando **modifica los datos demo**: deja al estudiante demo con progreso (borra antes su actividad y su progreso) y crea y luego borra alumnos de ejemplo. No lo corras contra una base con datos reales. Quedó en la base de desarrollo un módulo de pruebas de fases anteriores («Módulo adaptador 2», código 10, con el ejercicio «Ej adaptador v2», en borrador) que no se pudo borrar desde aquí; las capturas lo ocultan, pero conviene borrarlo (`DELETE FROM modulo WHERE codigo = '10'`) porque el panel docente cuenta «8 de 10» módulos por su causa.
- [ ] **Regenerar los PDF** si cambias los manuales: `npm install` en la raíz y `npm run manuales` (necesita internet para dibujar los diagramas Mermaid). Los PDF están versionados para verlos en el celular; el manual de programador (9.7) y el de usuario son los dos archivos que se entregan.
- [ ] **Publicar el manual de programador** para el link de 9.7 (ver sección D) y decidir si el manual de usuario va como anexo (PDF) o como enlace.
- [ ] **Asignar pesos y complejidad de los puntos de función (11.2)**: `docs/evidencias/metricas.md`, sección 4, trae las 38 entradas, salidas y consultas, las 11 tablas y 3 interfaces externas con una **propuesta** de complejidad y de peso (pesos IFPUG estándar). Hay que confirmarla contando tipos de archivo referenciados (FTR) y campos (DET), llenar las columnas «del equipo», elegir el factor de ajuste (14 características) y calcular FP.
- [ ] **Interpretar las métricas (11.3 y 11.5)**: CK (WMC, DIT, NOC, CBO, RFC, LCOM) y complejidad ciclomática; decidir umbrales y qué hacer con las 4 funciones del backend y las 11 del frontend con CC > 10 (la más alta: `traducirError`, 24). Las definiciones de CBO, RFC y LCOM son aproximaciones calculadas sobre el código; confirmar que sirven para el documento.
- [ ] **Rehacer las figuras del documento IW** (Fig. 1, 2, 4 y 6) a partir de `docs/diagramas.md` (se pueden exportar en https://mermaid.live) y revisar que coincidan con lo que el documento describe. El diagrama de despliegue de producción es el objetivo de la Fase 7, no algo ya instalado.
- [ ] Antes de la entrega, correr `npm run evidence` (regenera también `metricas.md`) en el equipo que se vaya a citar.
