# SMARTBIZ — PENDIENTE WEB (DASHBOARD)- DASHBOARD_PENDIENTE_WEB.md

====================================

## Estado actual

El módulo Dashboard en la app móvil ya quedó conectado del lado app/frontend
en todo lo que coincide con la web.

Actualmente la app ya muestra o calcula:

- resumen rápido del negocio
- productos
- alertas de stock bajo
- notificaciones no leídas
- negocio activo
- widgets/gráficas habilitadas
- top productos por ingresos
- top productos por unidades
- ventas por día
- volumen de ventas por día
- movimientos recientes
- accesos rápidos

## Archivos principales app

- app/(tabs)/dashboard.tsx
- src/store/dashboardStore.ts o store equivalente
- src/store/dashboardWidgetsStore.ts
- src/store/inventoryStore.ts
- src/store/salesStore.ts
- src/store/businessStore.ts
- src/store/notificationStore.ts

## API que la app intenta usar

- dashboardApi.home

Y además se apoya en:

- salesApi.list
- productApi.list

## Qué ya quedó bien en app

1. Pantalla dashboard conectada con stores reales.
2. Carga de negocio activo.
3. KPIs/estadísticas calculadas localmente si backend falla.
4. Widgets persistidos por usuario.
5. Accesos rápidos funcionales.
6. Fallback cache/demo del dashboard.

## Problema actual observado

El endpoint real del dashboard aún responde Unauthorized desde la app.

Logs típicos:

- [dashboardApi.home] CALL
- [dashboardApi.home] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [dashboardStore.loadHome] fallback cache/demo

Eso significa que la pantalla sí está lista, pero backend todavía no da acceso real.

## Qué revisar en web

1. Que /api/dashboard/home acepte Authorization Bearer.
2. Que la resolución del negocio activo sea compatible con móvil.
3. Que no dependa solo de cookie web.
4. Que regrese el contrato esperado por dashboardStore/dashboardApi.

## Resultado esperado cuando backend quede listo

- obtener KPIs reales del dashboard
- obtener alertas reales
- obtener ventas recientes reales
- obtener low stock real
- obtener series reales para gráficas

## Logs esperados cuando ya funcione

- [dashboardApi.home] CALL
- [dashboardStore.loadHome] API OK
  o equivalente sin fallback

Y ya no debería verse:

- FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

## Conclusión

Dashboard ya quedó implementado del lado app.
Lo pendiente es habilitar el endpoint real para móvil con Bearer token.
