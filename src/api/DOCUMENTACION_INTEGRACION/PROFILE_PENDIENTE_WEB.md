# SMARTBIZ — PROFILE_PENDIENTE_WEB- PROFILE_PENDIENTE_WEB.md

## Estado actual del módulo Profile en app móvil

La app móvil ya quedó preparada para trabajar en este orden:

1. Intenta leer perfil por API real.
2. Intenta guardar cambios por API real.
3. Si web/backend responde UNAUTHORIZED o aún no existe el endpoint necesario,
   la app cae a modo demo/local sin romper el flujo.

Resultado actual esperado en logs:

- [profileApi.me] CALL
- [profileApi.me] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [profileApi.update] CALL
- [profileApi.update] FAIL -> fallback demo: Error: UNAUTHORIZED: Unauthorized
- [profileStore.updateProfile] fallback demo

Esto significa que la parte app YA está alineada.
Lo pendiente está del lado web/backend.

## Pendiente requerido en web

Hace falta habilitar guardado real del perfil desde móvil.

1. Confirmar Bearer token en endpoint de perfil
   Actualmente la app móvil manda Authorization: Bearer <token>.
   El endpoint que se use debe validar con requireAuth(req).

2. Crear o habilitar endpoint PATCH para perfil
   Ruta sugerida:

- PATCH /api/me

Campos mínimos que la app necesita guardar:

- full_name
- phone
- photo_url (opcional, para avatar remoto)

Opcional:

- email
  Pero si se actualiza email, debe sincronizarse correctamente con Supabase Auth
  y con app_user para no desalinear datos.

## Shape sugerido del request

{
"full_name": "Daniel Flores Velazquez",
"phone": "3312345678",
"photo_url": "avatars/<user_id>/profile.webp"
}

## Shape sugerido del response

{
"ok": true,
"data": {
"user": {
"id": "uuid",
"email": "correo@ejemplo.com",
"full_name": "Daniel Flores Velazquez",
"phone": "3312345678",
"photo_url": "avatars/<user_id>/profile.webp"
}
}
}

## Notas importantes

- La app NO debe mandar campos innecesarios.
- La app solo enviará lo que coincida con web.
- Si PATCH /api/me no existe o no acepta Bearer token, Profile seguirá funcionando
  solo en modo local/demo.
- Esto NO significa fallo de la app; significa pendiente del lado web/backend.

## Estado funcional actual

- Ver perfil: funciona
- Editar perfil en app: funciona en local/demo
- Persistencia local al salir y volver entrar: funciona
- Sync real con backend web: pendiente

## Prueba esperada cuando web quede lista

Los logs deberían cambiar de:

- [profileApi.me] FAIL -> fallback demo
- [profileApi.update] FAIL -> fallback demo

a algo como:

- [profileApi.me] CALL
- [profileApi.me] OK
- [profileApi.update] CALL
- [profileApi.update] OK

## Conclusión

El módulo Profile del lado app ya está listo.
Solo falta completar soporte real del lado web/backend.

---

Resumidamente en la app ya dejé perfil casi listo para conectarse con web.
Lo que falta del lado web es crear PATCH /api/me usando requireAuth(req) para que acepte Bearer token del móvil.
La app ocuparía guardar full_name, phone y opcional photo_url en app_user.
Lectura ya puede salir de GET /api/me, pero sin ese PATCH la edición queda solo local/demo.
Te dejé documentado eso en este archivo PROFILE_PENDIENTE_WEB.txt.
