# Flujo de autenticacion frontend

## Estado en PR 1

La autenticacion completa no se implementa en esta PR. Esta inicializacion deja preparada la estructura `src/modules/auth` y el cliente HTTP para enviar tokens Bearer cuando se implemente la siguiente PR de Fase 4.

## Contrato backend existente

Fuente: `docs/modules/usuarios-sesiones.md`.

| Metodo | Ruta | Uso |
| :- | :- | :- |
| POST | `/api/auth/login` | Iniciar sesion con `nombreUsuario` y `contrasena`. |
| GET | `/api/auth/me` | Consultar usuario autenticado. |
| POST | `/api/auth/logout` | Cerrar la sesion actual. |

## Flujo previsto

1. El usuario ingresa `nombreUsuario` y `contrasena`.
2. El frontend envia `POST /api/auth/login`.
3. El backend valida usuario activo, credencial activa y contrasena BCrypt.
4. El backend devuelve el JWT de sesion.
5. El frontend guarda el token de forma controlada para la sesion de uso.
6. Las llamadas protegidas envian `Authorization: Bearer <token>`.
7. Al iniciar la app, el frontend consulta `GET /api/auth/me` para reconstruir el estado autenticado.
8. Al cerrar sesion, el frontend llama `POST /api/auth/logout` y descarta el token local.

## Reglas que no debe duplicar el frontend

- Validacion definitiva de credenciales.
- Estado real del usuario.
- Estado real de la sesion persistida.
- Permisos finales por rol.
- Expiracion y revocacion del token.

El frontend puede validar campos vacios y formato basico para mejorar la experiencia, pero la decision final queda en backend.

## Rutas protegidas

Las rutas protegidas se definiran desde la PR de autenticacion. Usuario sin token valido debe volver al login. Token invalido o expirado debe limpiarse localmente despues de la respuesta no autorizada del backend.
