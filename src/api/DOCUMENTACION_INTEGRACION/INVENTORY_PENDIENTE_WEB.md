# SMARTBIZ — PENDIENTE WEB (INVENTARIO)- INVENTORY_PENDIENTE_WEB.md

====================================

## Estado actual

El módulo de Inventario en la app móvil ya quedó funcional del lado app/frontend.

Actualmente la app ya permite:

- listar productos
- crear productos
- editar productos
- eliminar productos
- ajustar stock
- cargar productos por negocio activo
- persistir localmente por usuario
- intentar backend real con token
- usar fallback demo/local si backend no autoriza

## Store principal

- src/store/inventoryStore.ts

## Pantallas relacionadas

- inventario principal
- crear producto
- editar producto

## APIs que la app intenta usar

- productApi.list
- productApi.create
- productApi.update
- productApi.remove
- productApi.stock

## Qué ya quedó bien en app

1. Bootstrap por usuario.
2. Persistencia local por usuario.
3. Carga por negocio activo.
4. Crear / editar / eliminar producto.
5. Ajustes de stock.
6. Integración con notificaciones locales.
7. Fallback demo si backend falla.

## Problema actual observado

Los endpoints web de producto todavía responden Unauthorized desde la app móvil.

Por eso en logs aparece:

- [productApi.list] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [productApi.create] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [productApi.update] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [productApi.stock] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

Eso significa que:

1. La app sí está llamando correctamente.
2. La app sí trae token.
3. El backend aún no está aceptando correctamente el flujo móvil/Bearer.

## Qué revisar en web

1. Que /api/product acepte Authorization Bearer.
2. Que /api/product/[id] acepte Authorization Bearer.
3. Que /api/product/[id]/stock o endpoint equivalente acepte Bearer.
4. Que la resolución del negocio activo sea compatible con app móvil.
5. Que no dependan solo de cookies web.

## Resultado esperado cuando backend quede listo

- listar productos reales
- crear producto real
- editar producto real
- eliminar producto real
- ajustar stock real

## Logs esperados cuando backend real funcione

- [productApi.list] CALL
- [inventoryStore.loadProducts] API items= X
- [productApi.create] CALL
- [productApi.update] CALL
- [productApi.stock] CALL

Y ya no debería salir:

- FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

## Conclusión

Inventario ya quedó bien implementado del lado app.
Lo pendiente es que backend web acepte correctamente la autenticación móvil
y complete la integración real.
