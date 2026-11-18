# Diagramas (Mermaid)

Fuente para rehacer las figuras del documento IW: **Fig. 1** (descomposición modular), **Fig. 2** (MER físico), **Fig. 4** (clases del dominio) y **Fig. 6** (despliegue), más el diagrama de componentes y la secuencia del envío de un ejercicio. Todos están dibujados a partir del código real (`backend/src`, `backend/db/migrations`, `docker-compose.yml`).

Cómo verlos: GitHub y la mayoría de editores (VS Code con la extensión «Markdown Preview Mermaid Support») los dibujan directamente. Para exportar una figura como imagen: pegar el bloque en <https://mermaid.live> y descargar SVG o PNG. También salen dibujados en `manual-programador.pdf`.

> **Pendiente (equipo):** exportar las figuras e insertarlas en el documento IW con el estilo y la numeración que pida el docente. Si alguna figura pide más detalle (por ejemplo, todos los atributos del MER), ampliar el bloque correspondiente.

## Fig. 1. Descomposición modular (monolito modular hexagonal)

Cada módulo del backend tiene tres capas: `domain` (reglas y puertos, sin dependencias de infraestructura), `application` (casos de uso) e `infrastructure` (rutas HTTP, MySQL y adaptadores externos). Las flechas indican «usa».

```mermaid
flowchart TB
  subgraph FE["Frontend (React + Vite)"]
    UI["Páginas y componentes"] --> API_FE["services/api.ts<br/>(api.http.ts o api.mock.ts)"]
  end
  subgraph BE["Backend (Express 5, un solo proceso)"]
    direction TB
    USU["usuarios<br/>registro, login, administración"]
    CON["contenidos<br/>módulos, lecciones, ejercicios"]
    EVA["evaluacion<br/>corrección de envíos"]
    PRO["progreso<br/>avance, puntos, insignias, eventos"]
    PIS["pistas-ia<br/>pistas con IA y respaldo"]
    REP["reportes<br/>panel docente y CSV"]
    SH["shared<br/>config, db, errores, migrador"]
  end
  API_FE -->|"HTTP + JWT"| USU & CON & EVA & PRO & PIS & REP
  EVA --> CON
  EVA --> PRO
  PIS --> CON
  PRO --> CON
  REP --> PRO
  USU & CON & EVA & PRO & PIS & REP --> SH
  SH --> DB[("MySQL 8")]
  EVA -.->|"puerto CodeRunner"| DOCKER["Docker<br/>python:3.12-alpine"]
  PIS -.->|"puerto HintProvider"| IA["Gemini o Anthropic<br/>(opcional)"]
  N8N["n8n (opcional)"] -.->|"lee evento_outbox"| DB
  N8N -.-> SMTP["Servidor SMTP"]
```

## Componentes

```mermaid
flowchart LR
  Navegador["Navegador<br/>(estudiante, docente, admin)"]
  subgraph Cliente["Frontend estático"]
    SPA["SPA React<br/>build de Vite"]
  end
  subgraph Servidor["Servidor de aplicación"]
    direction TB
    Express["Express 5<br/>helmet, cors, JSON 100 kb"]
    Rutas["Routers por módulo<br/>validación con zod + JWT + roles"]
    Servicios["Servicios de aplicación"]
    Puertos["Puertos (interfaces)<br/>UsuarioRepo, ContenidoRepo, IntentoRepo,<br/>ProgresoRepo, ReporteRepo, PistaRepo,<br/>CodeRunner, HintProvider"]
    Adaptadores["Adaptadores<br/>Mysql*Repo, DockerRunner,<br/>GeminiHints, ClaudeHints"]
    Proc["ProcesadorEventos<br/>(mismo proceso)"]
  end
  Navegador --> SPA
  SPA -->|"fetch /api"| Express --> Rutas --> Servicios --> Puertos --> Adaptadores
  Servicios --> Proc
  Adaptadores --> MySQL[("MySQL")]
  Adaptadores --> Docker["Docker Engine"]
  Adaptadores --> IA["API de IA"]
  Proc --> MySQL
```

## Fig. 6. Despliegue

Lo que existe hoy es el entorno de desarrollo con `docker compose`. El despliegue en la VM (Nginx con TLS, backups, Vercel apuntando a la API) llega en la Fase 7: la segunda figura es el objetivo, no algo ya instalado.

```mermaid
flowchart TB
  subgraph PC["Equipo de desarrollo (Docker Desktop)"]
    direction TB
    Vite["Vite dev server<br/>:5173 (npm run dev)"]
    subgraph Compose["docker compose"]
      API["api (Node 24)<br/>:3000, usuario node"]
      MYSQL[("mysql:8<br/>:3306, volumen uptc_mysql_data")]
      N8N["n8n (perfil automatizacion)<br/>:5678, volumen uptc_n8n_data"]
    end
    SOCK["/var/run/docker.sock"]
    RUN["contenedor efímero python:3.12-alpine<br/>sin red, 128 MB, 0,5 CPU"]
  end
  Browser["Navegador"] --> Vite
  Vite -->|"VITE_API_URL"| API
  API --> MYSQL
  API -->|"monta el socket"| SOCK -->|"docker run --rm"| RUN
  N8N --> MYSQL
```

```mermaid
flowchart TB
  Usuario["Navegador"] -->|"HTTPS"| Vercel["Vercel<br/>frontend estático (VITE_API_URL)"]
  Usuario -->|"HTTPS /api"| Nginx
  subgraph VM["VM Ubuntu (Fase 7, pendiente)"]
    Nginx["Nginx + Let's Encrypt"] --> API["api"]
    API --> MYSQL[("MySQL")]
    API --> SOCK["Docker (idealmente en host separado)"]
    N8N["n8n"] --> MYSQL
    BK["Backup diario de MySQL"] -.-> MYSQL
  end
  N8N --> SMTP["SMTP"]
```

## Secuencia: envío de un ejercicio (con outbox)

`POST /api/exercises/:id/submissions`. El intento y el evento `IntentoAprobado` se guardan en **una sola transacción**; después, el procesador del mismo proceso consume el evento (y un temporizador lo hace de respaldo si el proceso cayó entre el commit y la llamada).

```mermaid
sequenceDiagram
  autonumber
  actor E as Estudiante
  participant F as Frontend
  participant R as Router
  participant S as EvaluacionService
  participant D as DockerRunner
  participant I as IntentoRepo
  participant P as ProcesadorEventos
  E->>F: Escribe código y pulsa «Ejecutar y enviar»
  F->>R: POST /exercises/:id/submissions
  R->>R: JWT, rol, límite 10/min, zod
  R->>S: enviar(usuario, ejercicio, code, pistas)
  S->>S: lee el ejercicio con sus casos ocultos
  S->>D: run(code, casos)
  D->>D: docker run --network none, 3 s
  D-->>S: resultado por caso
  S->>S: evaluar() construye el veredicto en español
  S->>P: marca(usuario)
  S->>I: registrar(intento)
  I->>I: transacción: intento + evento IntentoAprobado
  alt primera aprobación
    S->>P: procesarPendientes()
    P->>P: calcula insignias y emite InsigniaObtenida
    S->>P: nuevas(usuario, marca)
  end
  S-->>R: SubmitResult
  R-->>F: 200 JSON
  F-->>E: Retroalimentación, puntos e insignias
  Note over P: InsigniaObtenida queda pendiente para n8n
```

## Fig. 2. Modelo entidad-relación físico (MySQL 8)

Atributos principales; el detalle completo de columnas está en `backend/db/migrations/`. `evento_outbox` no tiene claves foráneas: su `payload` JSON referencia usuarios y ejercicios por id. La vista `v_progreso` (intentos y ejercicios resueltos por usuario y módulo) no se dibuja.

```mermaid
erDiagram
  usuario ||--o{ intento : "realiza"
  ejercicio ||--o{ intento : "recibe"
  modulo ||--o{ leccion : "contiene"
  leccion ||--o{ ejercicio : "tiene"
  ejercicio ||--o{ caso_prueba : "se valida con"
  usuario ||--o{ usuario_insignia : "obtiene"
  insignia ||--o{ usuario_insignia : "se otorga en"
  usuario ||--o{ leccion_completada : "completa"
  leccion ||--o{ leccion_completada : "es completada en"
  intento ||--o| pista_ia : "genera"
  usuario ||--o{ pista_ia : "pide"

  usuario {
    int id_usuario PK
    varchar nombre
    varchar correo UK
    char hash_contrasena
    enum rol "student, teacher, admin"
    boolean activo
    varchar programa
    tinyint semestre
    varchar grupo
    datetime fecha_creacion
  }
  modulo {
    int id_modulo PK
    varchar codigo UK
    varchar titulo
    varchar resumen
    smallint orden
    boolean publicado
  }
  leccion {
    int id_leccion PK
    int id_modulo FK
    varchar titulo
    json contenido "bloques"
    smallint minutos
    smallint orden "UK con id_modulo"
    boolean publicado
  }
  ejercicio {
    int id_ejercicio PK
    int id_leccion FK
    varchar titulo
    text enunciado
    enum dificultad "baja, media, alta"
    varchar lenguaje "python"
    text starter
    text solucion
    json pistas
    json ejemplos
    json restricciones
    json reglas
    smallint orden "UK con id_leccion"
    boolean publicado
  }
  caso_prueba {
    int id_caso PK
    int id_ejercicio FK
    text entrada "expresión Python"
    text salida_esperada
    boolean oculto
  }
  intento {
    bigint id_intento PK
    int id_usuario FK
    int id_ejercicio FK
    text codigo
    boolean resultado
    tinyint pistas_usadas
    text retroalimentacion
    json detalle "casos fallidos, uso interno"
    datetime fecha
  }
  insignia {
    int id_insignia PK
    varchar codigo UK
    varchar nombre
    varchar regla
    smallint objetivo
  }
  usuario_insignia {
    int id_usuario PK, FK
    int id_insignia PK, FK
    datetime fecha
  }
  leccion_completada {
    int id_usuario PK, FK
    int id_leccion PK, FK
    datetime fecha
  }
  pista_ia {
    bigint id_pista PK
    bigint id_intento FK, UK
    int id_usuario FK
    text texto
    enum fuente "ai, fallback"
    datetime fecha
  }
  evento_outbox {
    bigint id PK
    varchar tipo "IntentoAprobado, LeccionCompletada, InsigniaObtenida"
    json payload
    datetime creado
    datetime procesado "NULL = pendiente"
  }
```

## Fig. 4. Clases del dominio (puertos y servicios)

Se muestran los puertos (interfaces del dominio), los servicios de aplicación y los adaptadores. Las funciones puras del dominio (`evaluar`, reglas de insignias, `armarProgreso`) no son clases y no se dibujan aquí.

```mermaid
classDiagram
  direction LR
  class UsuarioRepo { <<interface>> }
  class Hasher { <<interface>> }
  class Tokens { <<interface>> }
  class AuthService { registrar() iniciarSesion() perfil() }
  class AdminService { listar() crear() actualizar() }
  class MysqlUsuarioRepo
  class BcryptHasher
  class JwtTokens
  AuthService --> UsuarioRepo
  AuthService --> Hasher
  AuthService --> Tokens
  AdminService --> UsuarioRepo
  AdminService --> Hasher
  MysqlUsuarioRepo ..|> UsuarioRepo
  BcryptHasher ..|> Hasher
  JwtTokens ..|> Tokens

  class ContenidoRepo { <<interface>> }
  class ContenidoService { modulos() leccion() ejercicio() todo() crearModulo() crearEjercicio() alternarPublicacion() mover() }
  class MysqlContenidoRepo
  ContenidoService --> ContenidoRepo
  MysqlContenidoRepo ..|> ContenidoRepo

  class CodeRunner { <<interface>> run() }
  class IntentoRepo { <<interface>> registrar() }
  class EvaluacionService { enviar() }
  class DockerRunner
  class FakeRunner
  class MysqlIntentoRepo
  EvaluacionService --> ContenidoRepo
  EvaluacionService --> CodeRunner
  EvaluacionService --> IntentoRepo
  EvaluacionService --> Gamificacion
  DockerRunner ..|> CodeRunner
  FakeRunner ..|> CodeRunner
  MysqlIntentoRepo ..|> IntentoRepo

  class Gamificacion { <<interface>> marca() procesarPendientes() nuevas() }
  class ProgresoRepo { <<interface>> snapshot() completarLeccion() procesarSiguiente() }
  class ProcesadorEventos { procesarPendientes() iniciarRespaldo() }
  class ProgresoService { completarLeccion() progreso() inicio() perfil() insignias() }
  class MysqlProgresoRepo
  ProcesadorEventos ..|> Gamificacion
  ProcesadorEventos --> ProgresoRepo
  ProgresoService --> ProgresoRepo
  ProgresoService --> ProcesadorEventos
  ProgresoService --> ContenidoRepo
  MysqlProgresoRepo ..|> ProgresoRepo

  class HintProvider { <<interface>> hint() }
  class PistaRepo { <<interface>> }
  class PistaService { pedir() }
  class GeminiHints
  class ClaudeHints
  class FakeHintProvider
  class MysqlPistaRepo
  PistaService --> ContenidoRepo
  PistaService --> PistaRepo
  PistaService --> HintProvider
  GeminiHints ..|> HintProvider
  ClaudeHints ..|> HintProvider
  FakeHintProvider ..|> HintProvider
  MysqlPistaRepo ..|> PistaRepo

  class ReporteRepo { <<interface>> }
  class ReporteService { dashboard() reportes() csv() }
  class MysqlReporteRepo
  ReporteService --> ReporteRepo
  MysqlReporteRepo ..|> ReporteRepo

  class AppError { status code message }
  AppError --|> Error
```
