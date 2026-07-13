# 01. Login y sesion

## Objetivo

Permitir el acceso autenticado al POS, mantener la sesion mediante JWT y limitar las rutas visibles segun el rol autenticado.

## Requisitos cubiertos

- RF-01 a RF-05.

## Funcionalidades

- Inicio de sesion con `nombreUsuario` y contrasena.
- Consulta de sesion actual, cierre de sesion e invalidacion del token en backend.
- Navegacion por rol: `vendedor`, `administrador` y `gerente`.
- Registro de login y logout en auditoria.
- Gestion de usuarios separada y exclusiva del gerente.

## Permisos

| Rol | Acceso |
| --- | --- |
| Vendedor | Inicia y cierra sesion; usa las rutas operativas autorizadas. |
| Administrador | Inicia y cierra sesion; usa las rutas administrativas autorizadas. |
| Gerente | Inicia y cierra sesion; posee visibilidad total y gestion de usuarios. |

## Endpoints principales

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`

## Gerente inicial para una instalacion nueva

El backend puede crear el primer usuario automaticamente solo si la tabla `usuarios` esta vacia. En `infra/.env` se debe definir antes del primer arranque:

```env
BOOTSTRAP_MANAGER_ENABLED=true
BOOTSTRAP_MANAGER_USERNAME=gerenteLocal
BOOTSTRAP_MANAGER_FULL_NAME=Gerente Local
BOOTSTRAP_MANAGER_PASSWORD=<contrasena-segura>
```

La comprobacion aislada del 2026-07-12 confirmo que una base vacia crea un unico usuario `gerenteLocal`, con rol `gerente`, usuario y credencial activos, y permite iniciar sesion. En arranques posteriores no modifica usuarios existentes. Tras el primer inicio se recomienda cambiar `BOOTSTRAP_MANAGER_ENABLED=false`.
