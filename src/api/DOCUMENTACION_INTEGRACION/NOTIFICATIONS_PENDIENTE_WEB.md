# SMARTBIZ — PENDIENTE WEB (NOTIFICACIONES)- NOTIFICATIONS_PENDIENTE_WEB.md

========================================

## Estado actual

El módulo de Notificaciones en la app móvil ya quedó funcional del lado frontend/app:

- Ya abre la lista de notificaciones.
- Ya abre el detalle de cada notificación.
- Ya navega correctamente al detalle (se corrigió el error de unmatched route).
- Ya intenta marcar como leída una notificación al abrirla.
- Ya tiene fallback local/demo funcionando.
- Ya permite eliminar y refrescar del lado app.

## Lo que falta

Lo pendiente ya no está en la app móvil, sino en la autorización / soporte real del backend web
para aceptar llamadas desde la app con Bearer token.

Actualmente la app sí manda token, pero los endpoints web de notificaciones siguen respondiendo:
UNAUTHORIZED

Eso provoca que la app haga fallback al modo demo/local.

## Endpoints web involucrados

Estos endpoints ya existen en web y son los que la app intenta usar:

- GET /api/notifications
- POST /api/notifications/read
- POST /api/notifications/read-all
- POST /api/notifications/delete

Y también existe:

- DELETE /api/notifications/[id]

## Problema observado

Desde la app móvil se ve en logs algo como:

- [notificationStore.markRead] id=... read=true tokenHead= eyJhbGciOi
- [notificationsApi.read] CALL
- [notificationsApi.read] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

Esto confirma que:

1. La app sí dispara la acción correctamente.
2. La app sí intenta consumir el endpoint real.
3. El backend web no está aceptando correctamente la autenticación Bearer para esas rutas.

## Qué revisar en web

Revisar que los endpoints de notificaciones soporten correctamente autenticación móvil vía:

Authorization: Bearer <token>

Puntos a validar:

1. Que requireAuth(req) realmente esté usando el Request recibido
   dentro de:
   - /api/notifications
   - /api/notifications/read
   - /api/notifications/read-all
   - /api/notifications/delete
   - /api/notifications/[id]

2. Que no dependan solo de cookies de sesión web.
   La app móvil entra por Bearer token, no por cookies.

3. Que si el helper requireAuth ya soporta Bearer,
   esos route handlers lo estén invocando de forma compatible.

4. Que no haya diferencia entre:
   - requireAuth()
     y
   - requireAuth(req)

   porque en móvil normalmente sí se necesita pasar el req.

## Qué ya quedó hecho en app

La app ya está preparada para consumir backend real y, si falla, usar fallback demo.

Store principal:

- src/store/notificationStore.ts

Pantallas:

- app/(tabs)/notifications/index.tsx
- app/(tabs)/notifications/[id].tsx
- app/(tabs)/notifications/\_layout.tsx

## Comportamiento actual esperado en app

Mientras backend web siga respondiendo UNAUTHORIZED:

- La lista puede verse desde fallback local/demo.
- Abrir notificación funciona.
- Marcar leída funciona localmente.
- Eliminar funciona localmente.
- Pero no habrá persistencia real contra backend web.

## Resultado esperado cuando web quede listo

Cuando el backend web ya acepte Bearer token correctamente, la app deberá:

- cargar notificaciones reales desde GET /api/notifications
- marcar leída real con POST /api/notifications/read
- marcar todas leídas con POST /api/notifications/read-all
- eliminar con POST /api/notifications/delete o DELETE /api/notifications/[id]
- dejar de caer al fallback demo

## Prueba sugerida cuando se corrija web

1. Iniciar sesión en la app.
2. Entrar a Notificaciones.
3. Abrir una notificación no leída.
4. Volver a la lista.
5. Verificar que ya aparezca como leída.
6. Cerrar sesión / reiniciar app / volver a entrar.
7. Confirmar que el estado leído siga persistido desde backend real.

## Logs esperados cuando ya funcione de verdad

Ejemplo de logs esperados:

- [notificationStore.markRead] id=... read=true tokenHead= eyJhbGciOi
- [notificationsApi.read] CALL
- [notificationStore.refresh] userId=... tokenHead= eyJhbGciOi
- [notificationsApi.list] CALL

Y ya NO debería aparecer:

- FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

## Conclusión

El módulo de Notificaciones ya quedó correcto del lado app/frontend.
Lo pendiente es habilitar correctamente autenticación real con Bearer token
en los endpoints web de notificaciones.
