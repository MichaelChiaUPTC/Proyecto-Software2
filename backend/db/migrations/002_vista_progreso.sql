-- Progreso derivado de los intentos: ejercicios aprobados e intentos por usuario y módulo.
CREATE VIEW v_progreso AS
SELECT
  i.id_usuario,
  l.id_modulo,
  COUNT(DISTINCT CASE WHEN i.resultado THEN i.id_ejercicio END) AS ejercicios_resueltos,
  COUNT(*)                                                      AS intentos,
  MAX(i.fecha)                                                  AS ultima_actividad
FROM intento i
JOIN ejercicio e ON e.id_ejercicio = i.id_ejercicio
JOIN leccion l   ON l.id_leccion = e.id_leccion
GROUP BY i.id_usuario, l.id_modulo;
