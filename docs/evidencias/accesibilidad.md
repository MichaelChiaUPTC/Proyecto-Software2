# Reporte de accesibilidad (RNF-07)

- **Fecha:** 18 de noviembre de 2026 a las 9:31 a. m.
- **Equipo:** Chia · Windows_NT 10.0.26300 · Node v24.19.0
- **Herramienta:** axe-core 4.14.1 (@axe-core/playwright) sobre Chromium (Playwright)
- **Criterios:** wcag2a, wcag2aa, wcag21a, wcag21aa (WCAG 2.1 niveles A y AA)
- **Alcance:** 22 vistas/estados, cada una en tema claro y oscuro (44 análisis). Estudiante, docente, administrador y acceso, contra el backend real.

## Resumen

| Impacto | Violaciones (vista × tema) |
|---|---|
| critical | 0 |
| serious | 0 |
| moderate | 0 |
| minor | 0 |
| **Total** | **0** |

**No hay violaciones críticas ni serias** en las vistas auditadas.

## Violaciones por vista

axe no reportó ninguna violación automática en ninguna de las vistas.

## Violaciones encontradas en la primera auditoría y corregidas

La primera pasada (antes de corregir) encontró 62 violaciones críticas o serias en 5 reglas; se corrigieron todas en el frontend:

| Regla | Impacto | Dónde | Causa | Corrección |
|---|---|---|---|---|
| `aria-valid-attr-value` (4.1.2) | crítica | Pestañas (ejercicio, login) | `aria-controls` apuntaba a paneles que no existen en el DOM | Se quitó `aria-controls` de `Tabs` |
| `label-content-name-mismatch` (2.5.3) | seria | Logo de la barra lateral (todas las vistas) | El nombre accesible «lógica UPTC, ir al inicio» no contenía el texto visible («lógica» y «UPTC» sin espacio entre los `span`) | Espacio entre los dos `span` del logo |
| `definition-list` / `dlitem` (1.3.1) | seria | Módulos (tarjeta destacada) y Panel docente | `div` anidados y `p` dentro de `dl` | Se aplanó la estructura `dt`/`dd`; la nota pasó a ser un `dd` |
| `color-contrast` (1.4.3) | seria | Comentarios en bloques de código (tema claro) | `#66767a` sobre `#f1f4f4`: 4,3:1 (< 4,5:1) | Color `--code-com` a `#5a6a6e` |

## Vistas auditadas

- Login · Ingresar
- Login · Crear cuenta (con errores)
- Estudiante · Inicio
- Estudiante · Módulos
- Estudiante · Detalle de módulo
- Estudiante · Lección
- Estudiante · Lista de ejercicios
- Estudiante · Ejercicio (inicial)
- Estudiante · Ejercicio (fallo, botón de IA)
- Estudiante · Ejercicio (pista de la IA)
- Estudiante · Ejercicio (correcto)
- Estudiante · Progreso
- Estudiante · Insignias
- Estudiante · Perfil
- Docente · Panel
- Docente · Contenido
- Docente · Ejercicios
- Docente · Editor de ejercicio
- Docente · Reportes
- Admin · Usuarios
- Admin · Crear usuario (modal con errores)
- Admin · Desactivar usuario (modal)

## Alcance y limitaciones

- axe detecta solo una parte de los problemas de accesibilidad (se suele citar entre un 30 % y un 40 %). Esto no sustituye la revisión manual con teclado y lector de pantalla (NVDA/VoiceOver), que queda como tarea manual.
- No se audita el modo demostración (datos locales): es la misma interfaz que el modo API.
- Se ejecuta con `reducedMotion: reduce` para que las animaciones de entrada no falseen el cálculo de contraste.

Regenerar: `cd e2e && npm run test:a11y` (con la API y el frontend como indica `e2e/README` / `scripts/evidencias.ps1`).
