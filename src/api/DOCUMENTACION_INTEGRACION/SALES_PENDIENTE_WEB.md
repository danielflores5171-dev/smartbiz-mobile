# SMARTBIZ — PENDIENTE WEB (VENTAS)- SALES_PENDIENTE_WEB.md

=================================

## Estado actual

El módulo de Ventas en la app móvil ya quedó funcional del lado app/frontend.

Actualmente la app ya puede:

- cargar ventas del negocio activo
- agregar productos al carrito
- calcular subtotal, descuento, impuesto y total
- realizar checkout
- registrar venta local/demo
- cargar historial de ventas
- pedir detalle de venta
- descontar stock localmente al vender
- usar fallback demo si backend no autoriza

## Store principal

- src/store/salesStore.ts

## También interactúa con

- src/store/inventoryStore.ts

## APIs que la app intenta usar

- salesApi.list
- salesApi.create
- salesApi.detail
- salesApi.remove

Y para stock:

- productApi.stock

## Qué ya quedó bien en app

1. Bootstrap por usuario.
2. Persistencia local por usuario.
3. Carga de ventas por negocio.
4. Flujo de carrito.
5. Checkout.
6. Historial de ventas.
7. Integración con movimientos de inventario.
8. Fallback demo completo.

## Problema actual observado

Backend aún responde Unauthorized desde la app móvil en endpoints de ventas.

Logs típicos:

- [salesApi.list] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [salesApi.create] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

Eso significa que:

1. La app sí manda la petición.
2. La app sí manda token.
3. El backend todavía no está aceptando correctamente el flujo móvil.

## Qué revisar en web

1. Que /api/sales acepte Authorization Bearer.
2. Que el negocio activo no dependa solo de cookie web.
3. Que el route handler use requireAuth(req) o soporte Bearer correctamente.
4. Que la estructura de respuesta coincida con lo que espera salesStore.

## Resultado esperado cuando backend quede listo

- listar ventas reales
- crear ventas reales
- ver detalle de venta real
- eliminar venta real
- descontar stock real en backend

## Logs esperados cuando ya funcione

- [salesApi.list] CALL
- [salesApi.create] CALL
- [salesApi.detail] CALL

Y ya no debería verse:

- FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

## Conclusión

Ventas ya quedó armada del lado app.
Lo pendiente es cerrar la autorización/soporte backend real para móvil.
