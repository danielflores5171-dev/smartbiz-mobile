# MÓDULO: CONFIGURACIÓN / SOPORTE - SETTINGS_SUPPORT.md

ESTADO: APP CONECTADA / WEB PENDIENTE

Resumen

- En la app móvil ya se agregó una pantalla de Soporte dentro del módulo Configuración.
- Esa pantalla ya envía subject + message + context hacia POST /api/support.
- La llamada ya se hace correctamente desde la app.
- Actualmente el backend responde UNAUTHORIZED, por lo que la conexión del lado móvil está lista pero la autorización del endpoint en web sigue pendiente.

Qué ya quedó listo en app

1. Pantalla de Soporte dentro de Configuración.
2. Navegación desde Settings hacia Soporte.
3. Archivo API cliente:
   - src/api/supportApi.ts
4. Logs de diagnóstico:
   - [SettingsSupport] send ...
   - [supportApi.send] CALL ...
   - [supportApi.send] FAIL -> Error: UNAUTHORIZED: Unauthorized
5. Manejo de error visible para detectar si falla el backend.

Qué significa el log actual

- La app sí llega al endpoint /api/support.
- El token sí se intenta enviar.
- El backend no está aceptando esa autenticación desde móvil por Bearer token.

Pendiente del lado web
Revisar POST /api/support para que acepte correctamente autenticación móvil con Bearer token usando requireAuth(req).

Validación esperada en web

- El endpoint debe autenticar con:
  Authorization: Bearer <token>
- No debe depender solamente de cookies web.
- Debe permitir uso desde app móvil igual que otros endpoints móviles.

Prueba realizada
Flujo probado:

1. Login en app.
2. Selección de negocio activo.
3. Entrar a Configuración.
4. Entrar a Soporte.
5. Escribir asunto y mensaje.
6. Enviar.

Resultado actual:

- Se ejecuta la llamada.
- Aparecen logs de CALL y FAIL.
- Respuesta actual del backend:
  UNAUTHORIZED: Unauthorized

Conclusión

- La app ya quedó conectada correctamente para Soporte.
- Lo único pendiente es ajustar/autorizAR el endpoint web /api/support.
- No se requiere cambiar más lógica móvil para este módulo, salvo que después se quiera mejorar UI o mensajes.
