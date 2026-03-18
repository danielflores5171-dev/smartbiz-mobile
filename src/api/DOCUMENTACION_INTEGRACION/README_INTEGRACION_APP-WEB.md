# SmartBiz – Estado de integración App ↔ Web/API- README_INTEGRACION_APP-WEB.md

## Objetivo de este documento

Este documento resume el estado actual de la integración entre la **app móvil** y la **web/API** de SmartBiz, indicando:

- qué módulos ya quedaron conectados del lado app,
- qué comportamiento tienen actualmente,
- qué está funcionando con backend real,
- qué está entrando en fallback demo/local,
- y qué falta ajustar del lado web/backend para que todo quede 100% en línea.

Este archivo sirve como guía para revisar pendientes de autorización, contratos de API, rutas, imágenes y comportamiento esperado por módulo.

---

# Estado general del proyecto

## Situación actual

La app móvil ya quedó preparada para trabajar con la API web mediante:

- token Bearer,
- stores adaptados,
- llamadas reales a endpoints,
- logs de diagnóstico,
- fallback local/demo cuando backend responde `UNAUTHORIZED` o falla.

## Conclusión general

Del lado de la app, la integración quedó **prácticamente cerrada**.  
Lo que sigue pendiente está principalmente del lado de la **web/backend**, sobre todo en:

- autorización Bearer,
- algunos endpoints que aún dependen más de cookies,
- rutas o contratos específicos,
- y detalles puntuales como manejo de imágenes/path en algunos módulos.

---

# Regla general actual de la app

Todos los módulos importantes quedaron bajo esta lógica:

1. La app intenta pegar al backend real.
2. Envía token Bearer.
3. Se registran logs `CALL`, `OK` y/o `FAIL`.
4. Si backend no autoriza o falla, el módulo hace fallback local/demo.
5. La UI no se rompe y sigue operando.

Esto ya permite validar que:

- la app sí está intentando consumir la web,
- el token sí viaja,
- la conexión está hecha,
- y el bloqueo actual está del lado backend/autorización.

---

# Módulos ya trabajados

---

## 1. Login / Auth

### Estado app

**Conectado y adaptado.**

La app ya:

- guarda token en `SecureStore`,
- hidrata sesión,
- repara user con `/api/auth/me` si hace falta,
- limpia stores al cerrar sesión,
- y usa token para los demás módulos.

### Lo que sí funciona

- login desde app,
- persistencia de token,
- recuperación del usuario autenticado mediante `/api/auth/me`,
- bootstrap correcto de sesión.

### Evidencia

Logs como:

- `[authStore.login] final userId= ... tokenHead= ...`
- `[bridge] /api/auth/me OK: ...`

### Pendiente web/backend

- revisar que todos los endpoints protegidos usen el mismo esquema de autorización que ya funciona con `/api/auth/me`.

### Conclusión

Auth base ya quedó bien del lado app.

---

## 2. Dashboard

### Estado app

**Conectado con fallback.**

La app intenta consumir:

- `/api/dashboard/home`

Si no autoriza:

- usa cache/demo/local.

### Lo que ya quedó

- bootstrap del dashboard,
- carga por negocio activo,
- logs de intento real,
- fallback estable.

### Logs típicos

- `[dashboardStore.loadHome] businessId= ... tokenHead= ...`
- `[dashboardApi.home] CALL`
- `[dashboardApi.home] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`

### Pendiente web/backend

- autorizar Bearer correctamente para `/api/dashboard/home`
- validar que `requireAuth` y `requireActiveBusiness` acepten flujo móvil.

### Conclusión

La app ya está lista; falta autorización backend.

---

## 3. Negocios (Business)

### Estado app

**Conectado parcialmente y estable.**

La app ya maneja:

- negocio activo,
- empleados,
- proveedores,
- bootstrap del store,
- persistencia del negocio activo.

### Lo que ya quedó

- activar negocio,
- guardar negocio activo,
- cargar empleados/proveedores,
- navegación correcta.

### Lo que sigue pendiente del lado web

- confirmar que endpoints de business acepten Bearer en todos los casos,
- revisar si el backend depende de cookies en alguna parte,
- asegurar consistencia de roles/permisos.

### Conclusión

El flujo de negocio activo ya quedó funcional en app.

---

## 4. Inventario

### Estado app

**Conectado con fallback.**

La app intenta usar backend para:

- listar productos,
- actualizar stock,
- movimientos,
- productos por negocio.

Si falla autorización:

- usa inventario local/demo.

### Lo que ya quedó

- `inventoryStore` adaptado,
- bootstrap por usuario,
- carga por negocio activo,
- fallback local,
- logs claros.

### Logs típicos

- `[inventoryStore.loadProducts] businessId= ... tokenHead= ...`
- `[productApi.list] CALL`
- `[productApi.list] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`

### Pendiente importante

#### Imágenes / path de imágenes

Aquí sí hay un pendiente relevante para backend/web:

La parte de imágenes de productos todavía necesita revisión del lado web porque anteriormente se detectó que:

- la web no estaba guardando/leyendo correctamente imágenes,
- faltaba revisar el path/ruta de almacenamiento,
- y en Vercel no conviene depender de escritura local en `/public`.

### Qué revisar del lado web

- dónde se están guardando realmente las imágenes,
- si hay Storage/Supabase bucket o ruta fija,
- cómo regresa la URL pública al frontend,
- si la app está recibiendo un campo correcto como `imageUrl`, `photoUrl` o equivalente,
- y si falta normalizar ese campo en el contrato.

### Conclusión

Inventario quedó bien conectado del lado app, pero **imágenes/path** sigue siendo pendiente importante del lado web.

---

## 5. Ventas

### Estado app

**Conectado con fallback.**

La app intenta consumir backend para:

- listar ventas,
- crear ventas,
- historial,
- checkout,
- detalle.

Si backend no autoriza:

- usa ventas demo/local.

### Lo que ya quedó

- `salesStore` conectado,
- carga por negocio,
- historial de ventas,
- checkout funcional con fallback,
- logs de `salesApi.list` y `salesApi.create`.

### Logs típicos

- `[salesApi.list] CALL`
- `[salesApi.list] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`
- `[salesApi.create] CALL`
- `[salesApi.create] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`

### Pendiente web/backend

- autorizar Bearer en endpoints de ventas,
- revisar creación de venta con negocio activo,
- validar permisos por rol.

### Conclusión

Ventas ya quedó bien preparada en app.

---

## 6. Notificaciones

### Estado app

**Conectado y corregido.**

La app ya quedó preparada para:

- listar notificaciones,
- ver detalle,
- marcar como leída,
- marcar todas,
- eliminar,
- navegar al módulo relacionado.

### Lo que ya quedó

- corrección de rutas,
- corrección de `detail`,
- solución del problema de `unmatched route`,
- soporte para fallback local,
- mapeo backend → modelo móvil.

### Endpoints considerados

- `/api/notifications`
- `/api/notifications/read`
- `/api/notifications/read-all`
- `/api/notifications/delete`

### Estado actual

La app ya intenta conectar real; si backend no autoriza, usa fallback demo.

### Conclusión

Módulo estable del lado app.

---

## 7. Configuración / Support

### Estado app

**Conectado del lado app con soporte real preparado.**

Aquí se tomó la decisión de mantener:

- **Settings** como módulo local de preferencias,
- y agregar **Support** como parte funcional conectable al backend.

### Qué ya quedó

- settings locales limpios,
- tema/configuración persistente local,
- pantalla de soporte agregada y enlazada,
- `supportApi.ts` creado,
- envío de ticket listo desde app.

### Logs ya presentes

- `[SettingsSupport] send tokenHead= ... subject= ...`
- `[supportApi.send] CALL tokenHead= ...`
- `[supportApi.send] FAIL -> Error: UNAUTHORIZED: Unauthorized`

### Qué significa eso

La app sí está intentando enviar al backend.  
Si da `UNAUTHORIZED`, el problema ya no es de la app sino de la web/backend.

### Pendiente web/backend

- que `/api/support` acepte Bearer token móvil,
- o que el backend adapte `requireAuth` para app además de cookies web.

### Conclusión

Support ya quedó listo del lado app.

---

## 8. Header / Actions container

### Estado

No se tomó como módulo de integración fuerte.

En web, esta parte es más bien un contenedor de UI que agrupa:

- theme switcher,
- notificaciones,
- user menu.

### Conclusión

No requiere integración móvil especial como módulo independiente.
Se deja documentado como contenedor visual.

---

## 9. Reportes y Estadísticas

### Estado app

**Conectado y adaptado con fallback.**

En la app móvil, **Reportes** concentra lo que en web está separado en:

- `statistics`
- `reports`

### Qué ya quedó

- consumo de `/api/statistics/summary`
- consumo de `/api/reports/sales`
- consumo de `/api/reports/inventory`
- intento de exportación CSV con backend
- fallback local/demo cuando no autoriza

### Logs típicos

- `[reportsStore.fetchStatisticsSummary] ...`
- `[statisticsApi.summary] CALL`
- `[statisticsApi.summary] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`
- `[reportsApi.sales] CALL`
- `[reportsApi.sales] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`
- `[reportsApi.inventory] CALL`
- `[reportsApi.inventory] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized`

### Exportación

#### CSV

Ya intenta pegar a backend real.  
Si backend no autoriza, actualmente sigue mostrando error/resultado no autorizado.

#### TXT

Funciona como export local/demo, y puede mostrar contenido generado aunque compartir archivo falle según entorno.

### Conclusión

Módulo totalmente listo del lado app.
Solo falta autorización y ajuste fino backend.

---

# Qué sí quedó confirmado del lado app

## Confirmado

- La app ya usa token Bearer.
- La app sí llega a los endpoints.
- La app sí registra logs de intento real.
- La app ya no depende solo de demo duro.
- Cada módulo importante tiene fallback local si backend no responde o no autoriza.
- La navegación entre módulos ya quedó estable.
- Stores principales ya están conectados o adaptados.

---

# Qué falta del lado web/backend

---

## A. Autorizar Bearer en todos los endpoints protegidos

Este es el pendiente principal global.

### Síntoma

Muchos endpoints devuelven:

- `401 UNAUTHORIZED`

### Qué significa

La app sí manda token, pero la web/backend aún no está aceptando correctamente ese flujo móvil en varios endpoints.

### Revisar

- `requireAuth`
- middlewares/auth helpers
- si algunos endpoints aún dependen solo de cookies web
- lectura de Authorization header
- compatibilidad entre auth web y auth móvil

---

## B. Resolver negocio activo en flujo móvil

Algunos endpoints usan lógica tipo:

- `requireActiveBusiness`

Eso en web puede venir de cookie, pero en app móvil no siempre existe igual.

### Revisar

- si el backend toma `businessId` por query/header/body,
- o si depende solo de cookie del negocio activo,
- y adaptar eso para móvil.

---

## C. Imágenes de productos

Pendiente importante del módulo inventario.

### Revisar

- path de almacenamiento,
- URL pública,
- bucket o storage,
- contrato del campo de imagen,
- si la web intenta escribir en rutas locales no persistentes.

---

## D. Exportación CSV

La app ya intenta exportar por backend, pero actualmente backend no autoriza.

### Revisar

- endpoint `/api/reports/exports/sales.csv`
- aceptación de token Bearer
- manejo de descarga desde móvil

---

## E. Uniformar contratos API

Conviene que backend use contratos consistentes para que la app no tenga que adivinar shapes.

### Revisar consistencia en:

- `data`
- `items`
- `user`
- `business`
- `kpis`
- `charts`
- `notification`
- campos de imagen
- fechas
- nombres de ids

---

# Recomendaciones para backend/web

## Prioridad 1

Hacer que todos estos endpoints acepten Bearer móvil correctamente:

- `/api/dashboard/home`
- `/api/business/...`
- `/api/products/...`
- `/api/sales/...`
- `/api/notifications/...`
- `/api/support`
- `/api/statistics/summary`
- `/api/reports/sales`
- `/api/reports/inventory`
- `/api/reports/exports/sales.csv`

---

## Prioridad 2

Revisar dependencia a cookies
Todo lo que hoy depende de cookies web debería:

- aceptar token Bearer,
- o soportar ambas vías.

---

## Prioridad 3

Corregir imágenes
Especialmente:

- subida,
- guardado,
- lectura,
- URL final para app.

---

## Prioridad 4

Cerrar exportación real

- CSV primero,
- luego PDF/DOCX/XLSX si se desea.

---

# Resumen por módulo

| Módulo             | Estado app                | Estado backend                              |
| ------------------ | ------------------------- | ------------------------------------------- |
| Auth/Login         | Bien conectado            | Base funcional                              |
| Dashboard          | App lista + fallback      | Falta autorización Bearer                   |
| Business           | App estable               | Falta revisar autorización/contrato         |
| Inventory          | App conectada + fallback  | Falta Bearer + revisar imágenes/path        |
| Sales              | App conectada + fallback  | Falta autorización Bearer                   |
| Notifications      | App conectada + corregida | Falta autorización Bearer                   |
| Settings           | Local OK                  | No requiere backend fuerte                  |
| Support            | App conectada             | Falta autorización Bearer en `/api/support` |
| Header actions     | Contenedor UI             | Sin trabajo fuerte pendiente                |
| Reports/Statistics | App conectada + fallback  | Falta autorización Bearer + export CSV      |

---

# Conclusión final

La parte móvil ya quedó **muy avanzada y prácticamente cerrada**.  
La app ya:

- autentica,
- guarda token,
- intenta consumir backend real,
- registra logs claros,
- y tiene fallback local en módulos clave.

Lo que falta ya está mayormente del lado de la web/backend:

- aceptar Bearer token de forma uniforme,
- resolver negocio activo en flujo móvil,
- corregir imágenes/path de inventario,
- y habilitar exportación/autorización en reportes.

En resumen:

**la app ya quedó integrada; el siguiente paso es que backend/web termine de autorizar y ajustar los endpoints.**
