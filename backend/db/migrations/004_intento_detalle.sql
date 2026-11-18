-- Detalle interno de los casos fallidos de cada intento (qué caso, esperado, obtenido, error). Nunca se envía al estudiante;
-- lo usa la Fase 3b (pistas con IA) para saber en qué falló el último intento.
ALTER TABLE intento ADD COLUMN detalle JSON NULL AFTER retroalimentacion;
