# Módulo: Reportes y Estadísticas- REPORTS_AND_STATISTICS.md

## Estado actual

El módulo de **Reportes y Estadísticas** en la app móvil de SmartBiz ya quedó **adaptado, corregido y conectado del lado app**.

Actualmente la app:

- intenta consumir endpoints reales del backend,
- manda token Bearer,
- registra logs para diagnóstico,
- y si el backend responde `UNAUTHORIZED` o falla, usa **fallback local/demo** para no romper la experiencia.

Esto permite que el módulo funcione visualmente y a nivel de flujo dentro de la app, aunque la autorización del backend todavía deba ajustarse en la web.

---

## Objetivo del módulo

Este módulo concentra en una sola sección móvil lo que en web está dividido entre:

- **Statistics / Analytics**
- **Reports**

En la app, ambos conceptos se integran dentro de **Reports**, mostrando:

- resumen general,
- ventas por periodo,
- top productos,
- inventario,
- exportación,
- métricas e indicadores,
- y una base para estadísticas visuales.

---

## Qué quedó conectado en la app

### 1. Resumen principal de Reportes

**Pantalla:** `app/(tabs)/reports/index.tsx`

Esta pantalla ya quedó lista para:

- detectar negocio activo,
- tomar token desde `authStore`,
- pedir resumen estadístico al backend,
- mostrar datos reales si backend autoriza,
- y usar datos locales/demo si backend no autoriza.

Usa:

- `reportsActions.fetchStatisticsSummary(...)`
- datos locales de ventas e inventario como respaldo.

---

### 2. Reporte de ventas

**Pantalla:** `app/(tabs)/reports/sales.tsx`

Esta parte ya está enlazada con:

- store de ventas local,
- posibilidad de consumir backend vía `reportsStore`,
- fallback local cuando la API no autoriza.

Muestra:

- total del periodo,
- número de ventas,
- distribución por método de pago,
- navegación a ventas por periodo.

---

### 3. Ventas por periodo

**Pantalla:** `app/(tabs)/reports/sales-period.tsx`

Permite:

- filtrar por rango de fechas,
- calcular resumen de ventas,
- mostrar gráficas locales,
- y apoyarse en datos de ventas del negocio activo.

Aquí la lógica visual y funcional ya quedó bien del lado app.  
Si backend autoriza más adelante, este módulo podrá alimentarse con datos más sólidos.

---

### 4. Top productos

**Pantalla:** `app/(tabs)/reports/top-products.tsx`

Ya quedó ligada a:

- `salesStore`
- negocio activo
- carga local de ventas

Calcula:

- top por ingresos,
- top por cantidad,
- gráficas,
- insights demo,
- ranking de productos.

Si backend no autoriza, sigue funcionando con datos locales.

---

### 5. Reporte de inventario

**Pantalla:** `app/(tabs)/reports/inventory.tsx`

Ya quedó funcionando con:

- `inventoryStore`
- productos del negocio activo
- ajustes/movimientos locales

Muestra:

- productos en inventario,
- bajo stock,
- productos sin movimiento,
- movimientos recientes,
- valor estimado de inventario.

Y si la API no autoriza, mantiene el comportamiento local/demo.

---

### 6. Exportación de reportes

**Pantalla:** `app/(tabs)/reports/export.tsx`

Quedó preparada para:

- intentar exportación CSV desde backend,
- abrir URL de export si la web autoriza,
- y usar export local/demo si no autoriza.

Formatos manejados:

- CSV
- TXT
- PDF placeholder
- DOCX placeholder
- XLSX placeholder

Actualmente:

- **CSV** intenta backend primero.
- **TXT** y otros pueden usar fallback local/demo.

---

## Store principal del módulo

**Archivo:** `src/store/reportsStore.ts`

Este store ya quedó adaptado para manejar:

- `statisticsSummary`
- `salesReport`
- `inventoryReport`
- `lastCsvUrl`
- `loading`
- `error`

### Funciones principales

- `fetchStatisticsSummary(...)`
- `fetchSalesReport(...)`
- `fetchInventoryReport(...)`
- `getSalesCsvUrl(...)`
- `clearLocalMemoryOnly()`

### Comportamiento

Cada función:

1. intenta llamar al backend,
2. registra logs,
3. si falla por autorización o error,
4. hace fallback local/demo sin romper la app.

---

## APIs cliente usadas en app

### Archivo

`src/api/reportsApi.ts`

Se usa para:

- `/api/reports/sales`
- `/api/reports/inventory`
- `/api/reports/exports/sales.csv`

### Archivo

`src/api/statisticsApi.ts`

Se usa para:

- `/api/statistics/summary`

Ambos ya quedaron pensados para:

- enviar token Bearer,
- loggear `CALL`,
- loggear `FAIL`,
- y dejar claro si la app sí está intentando conectarse.

---

## Logs que confirman que la app sí quedó conectada

En las pruebas ya aparecieron logs como:

```txt
[reportsStore.fetchStatisticsSummary] ...
[statisticsApi.summary] CALL
[statisticsApi.summary] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
[reportsStore.fetchSalesReport] ...
[reportsApi.sales] CALL
[reportsApi.sales] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

Lo que debe revisarse en backend

que esos endpoints acepten Bearer token desde app móvil,

que no dependan solo de cookies web,

que requireAuth o la lógica de auth soporte el flujo móvil,

que requireActiveBusiness pueda resolver negocio activo con el contexto móvil,

que la exportación CSV también autorice correctamente desde app.
```
