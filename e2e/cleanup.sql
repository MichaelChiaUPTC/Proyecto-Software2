-- Borra los datos que crean las pruebas E2E (correos e2e-*@uptc.edu.co y modulos "E2E ...").
-- Las pruebas usan solo la API publica; no hay DELETE de usuarios, por eso se limpia directo en la BD.
DELETE FROM evento_outbox
 WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.usuarioId')) AS UNSIGNED)
       IN (SELECT id_usuario FROM usuario WHERE correo LIKE 'e2e-%@uptc.edu.co');
DELETE FROM pista_ia WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE correo LIKE 'e2e-%@uptc.edu.co');
DELETE FROM intento WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE correo LIKE 'e2e-%@uptc.edu.co');
DELETE FROM usuario_insignia WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE correo LIKE 'e2e-%@uptc.edu.co');
DELETE FROM usuario WHERE correo LIKE 'e2e-%@uptc.edu.co';
DELETE FROM modulo WHERE titulo LIKE 'E2E %';
