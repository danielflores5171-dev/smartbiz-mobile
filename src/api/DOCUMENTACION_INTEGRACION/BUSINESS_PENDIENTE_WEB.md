# SMARTBIZ — PENDIENTE WEB (BUSINESS / NEGOCIOS)- BUSINESS_PENDIENTE_WEB.md

==============================================

## Estado actual

El módulo de Negocios en la app móvil ya quedó conectado del lado app/frontend
en todo lo que coincide con la web.

Actualmente la app ya maneja:

- bootstrap de negocios
- listado de negocios
- selección de negocio activo
- carga de empleados del negocio activo
- carga de proveedores del negocio activo
- creación / edición / eliminación local con fallback demo
- intento de consumo de endpoints reales cuando hay token

## Store principal

- src/store/businessStore.ts

## Áreas conectadas en app

- Negocios
- Empleados
- Proveedores
- Selección de negocio activo

## APIs que la app intenta usar

- businessApi.list
- businessApi.create
- businessApi.update
- businessApi.remove

- employeesApi.list
- employeesApi.create

- suppliersApi.list
- suppliersApi.create
- suppliersApi.update
- suppliersApi.remove

## Comportamiento actual

La app ya está preparada para trabajar con backend real cuando los endpoints
acepten correctamente autenticación y contrato esperado.

Si backend responde OK:

- usa datos reales

Si backend responde Unauthorized o algo inválido:

- cae a fallback demo/local

## Qué ya quedó bien en app

1. Bootstrap del store de negocios por usuario.
2. Persistencia local por usuario.
3. Selección de negocio activo.
4. Carga de empleados y proveedores del negocio seleccionado.
5. Estructura preparada para backend real.
6. Fallback local sin romper la app.

## Qué revisar o confirmar en web

1. Que los endpoints de negocios acepten Bearer token desde la app móvil.
2. Que employeesApi y suppliersApi usen el mismo negocio activo esperado por web.
3. Que el contrato JSON coincida con lo que espera businessStore.
4. Que los endpoints regresen items en data.items o item en data.item.

## Resultado esperado cuando backend quede completamente listo

- listar negocios reales
- crear negocio real
- editar negocio real
- eliminar negocio real
- listar empleados reales
- crear empleados reales
- listar proveedores reales
- crear / editar / eliminar proveedores reales

## Logs esperados cuando ya funcione backend real

- [businessApi.list] CALL
- [businessStore.bootstrap] businesses from API: X
- [employeesApi.list] CALL
- [suppliersApi.list] CALL

Y ya no debería verse:

- FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized

## Conclusión

El módulo de Negocios ya quedó listo del lado app.
Lo pendiente es asegurar compatibilidad/autorización real del backend web
para que deje de entrar en fallback demo.
