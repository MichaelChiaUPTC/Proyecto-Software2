-- Esquema inicial (MER 5.1). InnoDB + utf8mb4.
CREATE TABLE usuario (
  id_usuario      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(120) NOT NULL,
  hash_contrasena CHAR(60) NOT NULL,
  rol             ENUM('student','teacher','admin') NOT NULL DEFAULT 'student',
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  programa        VARCHAR(120) NULL,
  semestre        TINYINT UNSIGNED NULL,
  grupo           VARCHAR(80) NULL,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modulo (
  id_modulo INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo    VARCHAR(10) NOT NULL,
  titulo    VARCHAR(100) NOT NULL,
  resumen   VARCHAR(300) NOT NULL DEFAULT '',
  orden     SMALLINT UNSIGNED NOT NULL,
  publicado BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_modulo),
  UNIQUE KEY uq_modulo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE leccion (
  id_leccion INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_modulo  INT UNSIGNED NOT NULL,
  titulo     VARCHAR(100) NOT NULL,
  contenido  JSON NOT NULL,            -- bloques del frontend (LessonBlock[])
  minutos    SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  orden      SMALLINT UNSIGNED NOT NULL,
  publicado  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_leccion),
  UNIQUE KEY uq_leccion_orden (id_modulo, orden),
  CONSTRAINT fk_leccion_modulo FOREIGN KEY (id_modulo) REFERENCES modulo (id_modulo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ejercicio (
  id_ejercicio  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_leccion    INT UNSIGNED NOT NULL,   -- el módulo se obtiene vía leccion (3FN)
  titulo        VARCHAR(100) NOT NULL,
  enunciado     TEXT NOT NULL,
  objetivo      VARCHAR(255) NOT NULL DEFAULT '',
  dificultad    ENUM('baja','media','alta') NOT NULL DEFAULT 'baja',
  lenguaje      VARCHAR(20) NOT NULL DEFAULT 'python',
  starter       TEXT NOT NULL,
  solucion      TEXT NOT NULL,
  pistas        JSON NOT NULL,
  ejemplos      JSON NOT NULL,
  restricciones JSON NOT NULL,
  reglas        JSON NOT NULL,           -- reglas de pista por patrón (ExerciseRule[])
  nota_exito    TEXT NOT NULL,
  orden         SMALLINT UNSIGNED NOT NULL,
  publicado     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_ejercicio),
  UNIQUE KEY uq_ejercicio_orden (id_leccion, orden),
  CONSTRAINT fk_ejercicio_leccion FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE caso_prueba (
  id_caso         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_ejercicio    INT UNSIGNED NOT NULL,
  entrada         TEXT NOT NULL,
  salida_esperada TEXT NOT NULL,
  oculto          BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_caso),
  KEY idx_caso_ejercicio (id_ejercicio),
  CONSTRAINT fk_caso_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES ejercicio (id_ejercicio) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE intento (
  id_intento        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario        INT UNSIGNED NOT NULL,
  id_ejercicio      INT UNSIGNED NOT NULL,
  codigo            TEXT NOT NULL,
  resultado         BOOLEAN NOT NULL,
  retroalimentacion TEXT NULL,
  fecha             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_intento),
  KEY idx_intento_usuario_ejercicio (id_usuario, id_ejercicio),
  KEY idx_intento_ejercicio (id_ejercicio),
  CONSTRAINT fk_intento_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_intento_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES ejercicio (id_ejercicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE insignia (
  id_insignia INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo      VARCHAR(40) NOT NULL,
  nombre      VARCHAR(60) NOT NULL,
  regla       VARCHAR(255) NOT NULL,
  objetivo    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id_insignia),
  UNIQUE KEY uq_insignia_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuario_insignia (
  id_usuario  INT UNSIGNED NOT NULL,
  id_insignia INT UNSIGNED NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_insignia),
  CONSTRAINT fk_ui_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_ui_insignia FOREIGN KEY (id_insignia) REFERENCES insignia (id_insignia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evento_outbox (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo      VARCHAR(60) NOT NULL,
  payload   JSON NOT NULL,
  creado    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  procesado DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_outbox_pendientes (procesado, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
