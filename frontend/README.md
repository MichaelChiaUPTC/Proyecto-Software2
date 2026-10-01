# Lógica UPTC · Frontend

Frontend (React + TypeScript + Vite) de la plataforma de práctica de programación básica. Sin backend: todo corre con datos mock y estado local persistido en `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

**Demo:** cualquier correo `@uptc.edu.co` con contraseña de 6+ caracteres. Si el correo empieza por `docente` entra como docente. Menú de la barra lateral → Configuración: tema claro/oscuro y restablecer datos.

## Estructura
- `src/components/{ui,layout,learning,exercises,progress,achievements}` componentes reutilizables
- `src/pages/{auth,student,teacher}` pantallas · `src/layouts` estructura de la app
- `src/services/api.ts` **capa de servicios**: cada función es el punto a reemplazar por una llamada HTTP
- `src/services/stores.ts` estado local que simula la base de datos · `src/mocks` datos de ejemplo
- `src/utils/evaluate.ts` evaluador simulado de ejercicios (reglas por regex); en producción lo hará el backend
- `src/styles/tokens.css` sistema de diseño (color, tipografía, espaciado, claro/oscuro)
