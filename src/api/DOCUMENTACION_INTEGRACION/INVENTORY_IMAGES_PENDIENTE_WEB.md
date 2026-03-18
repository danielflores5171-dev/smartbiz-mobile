# SMARTBIZ — PENDIENTE WEB (INVENTARIO / IMÁGENES)- INVENTORY_IMAGES_PENDIENTE_WEB.md

================================================

## Estado actual

La parte de imágenes de productos en la app móvil ya quedó funcional del lado app.

Actualmente la app ya permite:

- agregar imagen al crear producto
- cambiar imagen desde editar producto
- quitar imagen
- persistir imagen local en fallback demo
- intentar subir imagen al backend real

## Archivos principales app

- src/services/productImageService.ts
- src/store/inventoryStore.ts
- pantalla de crear producto
- pantalla de editar producto

## APIs que la app intenta usar

- productApi.uploadImage
- productApi.listImages
- productApi.deleteImage
- productApi.setPrimaryImage

## Qué ya quedó bien en app

1. Se corrigieron warnings de expo-image-picker.
2. Se corrigieron warnings de expo-file-system legacy/deprecated.
3. Se corrigió el manejo de rutas/archivos locales.
4. Ya se puede agregar, cambiar y quitar imagen sin romper la app.
5. Si backend falla, la app guarda la referencia local en demo.

## Comportamiento actual

La funcionalidad visual ya opera bien en app.
Pero el backend real de imágenes todavía no autoriza correctamente desde móvil.

Por eso aparecen logs como:

- [productApi.uploadImage] FAIL -> fallback demo: Error: Unauthorized
- [productApi.listImages] FAIL -> fallback demo: Error: Unauthorized

## Resultado esperado cuando backend quede listo

- subir imagen real al backend/storage
- asignar imagen principal real
- listar imágenes reales
- eliminar imagen real
- dejar de usar fallback demo local

## Conclusión

La parte difícil de frontend/app ya quedó resuelta.
Lo pendiente es terminar la autorización/soporte backend para imágenes reales.
