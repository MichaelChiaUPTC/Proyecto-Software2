-- Fase 3: pistas usadas por intento (insignia "A la primera") y lecciones completadas por usuario.
-- Los puntos no se guardan: se derivan de intento (ejercicios resueltos por dificultad) y leccion_completada.
ALTER TABLE intento ADD COLUMN pistas_usadas TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER resultado;

CREATE TABLE leccion_completada (
  id_usuario INT UNSIGNED NOT NULL,
  id_leccion INT UNSIGNED NOT NULL,
  fecha      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_leccion),
  CONSTRAINT fk_lc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_lc_leccion FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
