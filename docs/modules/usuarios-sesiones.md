# Modulo: Seguridad, usuarios y sesiones

## Objetivo

Implementar autenticacion propia para usuarios internos de Kontora POS usando `nombre_usuario`, contrasena hasheada, JWT y sesiones persistidas.

## Tablas involucradas

- `roles`
- `usuarios`
- `credenciales_usuario`
- `sesiones_usuario`

## Fuente de verdad del modelo

El modulo se implementa sobre las tablas reales del schema:

- `usuarios.nombre_usuario` es el identificador de login.
- `credenciales_usuario.contrasena_hash` guarda BCrypt, nunca texto plano.
- `sesiones_usuario.token_identificador` guarda el identificador `jti` del JWT, no el token completo.
- `sesiones_usuario.estado_sesion` controla si un token sigue activo.

## Endpoints

| Metodo | Ruta | Autenticacion | Proposito |
| :- | :- | :- | :- |
| POST | `/api/auth/login` | No | Iniciar sesion con `nombreUsuario` y `contrasena`. |
| GET | `/api/auth/me` | Si | Consultar usuario autenticado. |
| POST | `/api/auth/logout` | Si | Cerrar la sesion actual. |

## Reglas de negocio implementadas

- Solo usuarios con `usuarios.estado = 'activo'` pueden iniciar sesion.
- Solo credenciales con `credenciales_usuario.estado = 'activa'` permiten login.
- La contrasena se valida con BCrypt.
- Al iniciar sesion se crea un registro en `sesiones_usuario`.
- El JWT contiene `jti`, pero la base de datos no guarda el token completo.
- Para acceder a endpoints protegidos, el token debe estar firmado, no expirado y tener una sesion `activa`.
- Al cerrar sesion, `sesiones_usuario.estado_sesion` pasa a `cerrada` y se registra `fecha_cierre`.
- Luego del logout, el mismo token ya no autoriza endpoints protegidos.

## Estados usados

- Usuario: `activo`, `inactivo`, `bloqueado`.
- Credencial: `activa`, `bloqueada`, `expirada`, `revocada`.
- Sesion: `activa`, `cerrada`, `expirada`, `revocada`.

## Validaciones realizadas

- `mvn clean test`.
- Login exitoso con usuario activo.
- Creacion de sesion activa en `sesiones_usuario`.
- Consulta de usuario autenticado con `GET /api/auth/me`.
- Logout de sesion actual.
- Rechazo del token despues del logout.
- Rechazo de login para usuario bloqueado.

## Pendientes

- Auditoria explicita de login/logout se implementara en el modulo transversal de auditoria.
- Administracion completa de usuarios y cambio de contrasena se desarrollara cuando se definan sus flujos operativos.

