-- Pistas generadas por IA (o de respaldo) para un intento fallido: auditoría y conteo de límites (1 por intento, 10 por usuario y día).
CREATE TABLE pista_ia (
  id_pista   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_intento BIGINT UNSIGNED NOT NULL,
  id_usuario INT UNSIGNED NOT NULL,
  texto      TEXT NOT NULL,
  fuente     ENUM('ai', 'fallback') NOT NULL,
  fecha      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pista),
  UNIQUE KEY uq_pista_intento (id_intento),
  KEY idx_pista_usuario_fecha (id_usuario, fecha),
  CONSTRAINT fk_pista_intento FOREIGN KEY (id_intento) REFERENCES intento (id_intento) ON DELETE CASCADE,
  CONSTRAINT fk_pista_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
