--------------------------------------------------------------------------------
-- LubriAuto · CADA USUARIO VE Y ACTIVA/INACTIVA SOLO SUS VEHÍCULOS
--
--   GET  /lt/autos/lista          Bearer
--        -> { ok, autos: [{ id_auto, descripcion, placa, km_actual,
--                           fecha_registro, estado }] }   solo los del usuario
--   POST /lt/autos/:id/activar    Bearer
--        -> { ok, mensaje }       vuelve a activar un vehículo propio
--   Errores: { ok: false, error }
--
-- QUÉ CORRIGE (17/11/2026):
--
--   - autos/lista tenía comentado el filtro
--         FROM LT_AUTOS
--        --WHERE USUARIO = l_user AND ACTIVO = 'S'
--     y devolvía los autos de TODOS los usuarios. Se vuelve a filtrar por
--     USUARIO, pero NO por ACTIVO: "Mis vehículos" muestra también los
--     inactivos (al final, con su etiqueta), e Inicio e Historial ya los
--     descartan en el frontend. La respuesta no cambia.
--   - No había forma de volver a activar un vehículo (DELETE autos/:id solo
--     inactiva). autos/:id/activar lo hace, solo si el auto es del usuario
--     del token: con un auto ajeno o inexistente responde -20404, sin decir
--     cuál de las dos.
--
-- Del módulo ORDS `lt` SOLO redefine el handler GET de autos/lista y agrega la
-- plantilla autos/:id/activar (sin DEFINE_MODULE, que borraría los demás
-- endpoints). DEFINE_HANDLER borra los parámetros del handler: se vuelven a
-- definir los dos que usa.
--
-- Al final revisa los demás handlers de autos/* y servicios/*: los que no
-- comparan el USUARIO salen como [REVISAR] con su código.
--
-- Se puede correr las veces que haga falta.
--------------------------------------------------------------------------------

SET DEFINE OFF
SET SERVEROUTPUT ON


--------------------------------------------------------------------------------
-- 1. ORDS · GET /lt/autos/lista y POST /lt/autos/:id/activar
--------------------------------------------------------------------------------

DECLARE
  -- Los dos parámetros de los handlers con sesión: el token y el status.
  PROCEDURE parametros(p_patron IN VARCHAR2, p_metodo IN VARCHAR2) IS
  BEGIN
    ORDS.DEFINE_PARAMETER(
      p_module_name => 'lt', p_pattern => p_patron, p_method => p_metodo,
      p_name => 'Authorization', p_bind_variable_name => 'token_hdr',
      p_source_type => 'HEADER', p_param_type => 'STRING', p_access_method => 'IN');
    ORDS.DEFINE_PARAMETER(
      p_module_name => 'lt', p_pattern => p_patron, p_method => p_metodo,
      p_name => 'X-APEX-STATUS-CODE', p_bind_variable_name => 'status_code',
      p_source_type => 'HEADER', p_param_type => 'INT', p_access_method => 'OUT');
  END parametros;
BEGIN
  ------------------------------------------------------------------------------
  -- GET /lt/autos/lista — la plantilla ya existe: solo se redefine el handler
  ------------------------------------------------------------------------------
  ORDS.DEFINE_HANDLER(
    p_module_name => 'lt',
    p_pattern     => 'autos/lista',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'~
DECLARE
    l_user VARCHAR2(100);
BEGIN
    l_user := PKG_AUTOS.fn_usuario(:token_hdr);
    :status_code := 200;
    APEX_JSON.OPEN_OBJECT;
    APEX_JSON.WRITE('ok', TRUE);
    APEX_JSON.OPEN_ARRAY('autos');
    FOR r IN (
        SELECT ID_AUTO, AUTO_DESCRIPCION, PLACA, KM_ACTUAL, ACTIVO,
               TO_CHAR(FECHA_REGISTRO,'YYYY-MM-DD') AS FECHA
          FROM LT_AUTOS
         WHERE USUARIO = l_user
         ORDER BY ID_AUTO DESC
    ) LOOP
        APEX_JSON.OPEN_OBJECT;
        APEX_JSON.WRITE('id_auto', r.ID_AUTO);
        APEX_JSON.WRITE('descripcion', r.AUTO_DESCRIPCION);
        APEX_JSON.WRITE('placa', r.PLACA);
        APEX_JSON.WRITE('km_actual', r.KM_ACTUAL);
        APEX_JSON.WRITE('fecha_registro', r.FECHA);
        APEX_JSON.WRITE('estado', r.ACTIVO);
        APEX_JSON.CLOSE_OBJECT;
    END LOOP;
    APEX_JSON.CLOSE_ARRAY;
    APEX_JSON.CLOSE_OBJECT;
EXCEPTION WHEN OTHERS THEN
    :status_code := CASE SQLCODE WHEN -20401 THEN 401 ELSE 400 END;
    APEX_JSON.OPEN_OBJECT;
    APEX_JSON.WRITE('ok', FALSE);
    APEX_JSON.WRITE('error', SQLERRM);
    APEX_JSON.CLOSE_OBJECT;
END;
~'
  );
  parametros('autos/lista', 'GET');

  ------------------------------------------------------------------------------
  -- POST /lt/autos/:id/activar — plantilla nueva
  ------------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name => 'lt', p_pattern => 'autos/:id/activar');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'lt',
    p_pattern     => 'autos/:id/activar',
    p_method      => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'~
DECLARE
    l_user VARCHAR2(100);
BEGIN
    l_user := PKG_AUTOS.fn_usuario(:token_hdr);
    UPDATE LT_AUTOS
       SET ACTIVO = 'S'
     WHERE ID_AUTO = TO_NUMBER(:id)
       AND USUARIO = l_user;
    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20404, 'Vehículo no encontrado.');
    END IF;
    COMMIT;
    :status_code := 200;
    APEX_JSON.OPEN_OBJECT;
    APEX_JSON.WRITE('ok', TRUE);
    APEX_JSON.WRITE('mensaje', 'Vehículo activado.');
    APEX_JSON.CLOSE_OBJECT;
EXCEPTION WHEN OTHERS THEN
    ROLLBACK;
    :status_code := CASE SQLCODE WHEN -20401 THEN 401 WHEN -20404 THEN 404 ELSE 400 END;
    APEX_JSON.OPEN_OBJECT;
    APEX_JSON.WRITE('ok', FALSE);
    APEX_JSON.WRITE('error', SQLERRM);
    APEX_JSON.CLOSE_OBJECT;
END;
~'
  );
  parametros('autos/:id/activar', 'POST');

  COMMIT;
EXCEPTION WHEN OTHERS THEN
  ROLLBACK;
  RAISE;
END;
/


--------------------------------------------------------------------------------
-- 2. VERIFICACIÓN
--------------------------------------------------------------------------------

DECLARE
  l_n PLS_INTEGER;

  PROCEDURE p(t IN VARCHAR2) IS BEGIN DBMS_OUTPUT.PUT_LINE(t); END;

  PROCEDURE codigo(c IN CLOB) IS
    l_largo PLS_INTEGER := DBMS_LOB.GETLENGTH(c);
    l_pos   PLS_INTEGER := 1;
  BEGIN
    WHILE l_pos <= l_largo LOOP
      p(DBMS_LOB.SUBSTR(c, 4000, l_pos));
      l_pos := l_pos + 4000;
    END LOOP;
  END codigo;

  -- Un handler de `lt`: si existe, con el filtro por usuario activo (no
  -- comentado) y con sus dos parámetros.
  PROCEDURE verificar(p_patron IN VARCHAR2, p_metodo IN VARCHAR2) IS
    l_filtra PLS_INTEGER;
    l_params PLS_INTEGER;
  BEGIN
    SELECT COUNT(*) INTO l_filtra
      FROM user_ords_modules m
      JOIN user_ords_templates t ON t.module_id = m.id
      JOIN user_ords_handlers h ON h.template_id = t.id
     WHERE m.name = 'lt' AND t.uri_template = p_patron AND h.method = p_metodo
       AND REGEXP_LIKE(h.source, '^\s*(WHERE|AND)\s+USUARIO\s*=\s*l_user', 'im');

    SELECT COUNT(*) INTO l_params
      FROM user_ords_modules m
      JOIN user_ords_templates t ON t.module_id = m.id
      JOIN user_ords_handlers h ON h.template_id = t.id
      JOIN user_ords_parameters r ON r.handler_id = h.id
     WHERE m.name = 'lt' AND t.uri_template = p_patron AND h.method = p_metodo;
    p(CASE WHEN l_filtra = 1 THEN '[OK]    ' ELSE '[ERROR] ' END
      || p_metodo || ' ' || p_patron || ' filtra por usuario');
    p(CASE WHEN l_params = 2 THEN '[OK]    ' ELSE '[ERROR] ' END
      || p_metodo || ' ' || p_patron || ' tiene ' || l_params || ' parametro(s) (deben ser 2)');
  END verificar;
BEGIN
  verificar('autos/lista', 'GET');
  verificar('autos/:id/activar', 'POST');

  SELECT COUNT(*) INTO l_n FROM LT_AUTOS WHERE USUARIO IS NULL;
  IF l_n > 0 THEN
    p('[AVISO] ' || l_n || ' auto(s) sin USUARIO en LT_AUTOS: ya no los ve nadie.');
  END IF;

  -- Los demás endpoints de autos y servicios: ¿comparan el USUARIO del auto?
  p('');
  p('== OTROS HANDLERS DE autos/* Y servicios/*');
  FOR r IN (SELECT t.uri_template, h.method, h.source
              FROM user_ords_modules m
              JOIN user_ords_templates t ON t.module_id = m.id
              JOIN user_ords_handlers h ON h.template_id = t.id
             WHERE m.name = 'lt'
               AND (t.uri_template LIKE 'autos/%' OR t.uri_template LIKE 'servicios/%')
               AND t.uri_template NOT IN ('autos/lista', 'autos/:id/activar')
             ORDER BY t.uri_template, h.method) LOOP
    IF REGEXP_LIKE(r.source, 'USUARIO\s*=', 'i') THEN
      p('[OK]      ' || r.method || ' ' || r.uri_template || ' compara el USUARIO');
    ELSE
      p('[REVISAR] ' || r.method || ' ' || r.uri_template || ' no compara el USUARIO. Su código:');
      codigo(r.source);
      p('-----');
    END IF;
  END LOOP;
END;
/
