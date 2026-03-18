# HEADER / SIDEBAR — No aplica como módulo independiente- HEADER_SIDEBAR_NO_APLICA.md

## Estado

No se realizó una conexión específica entre app móvil y web para “header” o “sidebar”.

## Motivo

En la arquitectura actual de SmartBiz, el header y el sidebar no funcionan como módulos de negocio independientes, sino como contenedores de navegación e interfaz.

Su función principal es:

- mostrar accesos rápidos
- agrupar acciones visuales
- renderizar componentes ya conectados por separado

## Componentes encontrados en web

En web se identificó principalmente:

- `ThemeSwitcher`
- `NotificationBell`
- `UserMenu`

Estos elementos no representan un backend propio del header, sino que reutilizan lógica de otros módulos:

- **UserMenu** → depende de Login / Perfil
- **NotificationBell** → depende de Notificaciones
- **ThemeSwitcher** → depende de Settings / Preferencias visuales

## Decisión tomada

Se decidió **no crear una integración específica para header/sidebar**, porque hacerlo no aportaba funcionalidad nueva y podía generar cambios innecesarios.

## Resultado

El header/sidebar queda considerado como una **capa de interfaz**, no como módulo funcional separado.

Por lo tanto:

- no requiere endpoint propio
- no requiere store propio
- no requiere adaptación directa app ↔ web

## Relación con otros módulos

La funcionalidad visual del header/sidebar ya queda cubierta indirectamente por los módulos ya trabajados:

- Login
- Perfil
- Notificaciones
- Configuración

## Observación futura

Solo se revisará nuevamente este apartado si más adelante se solicita explícitamente:

- sincronización visual del avatar
- badge real de notificaciones en header
- persistencia remota de tema
- datos dinámicos de usuario o negocio activo en encabezado
