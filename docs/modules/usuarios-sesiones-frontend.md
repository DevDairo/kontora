# Pantalla: Login y sesion frontend

## Objetivo

Permitir que usuarios internos ingresen a Kontora POS usando la autenticacion real del backend y proteger la shell principal hasta confirmar la sesion con `/api/auth/me`.

## Actor principal

Vendedor / Administrador / Gerente.

## Endpoints consumidos

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/health`

## Campos del formulario

- `nombreUsuario`
- `contrasena`

## Contrato usado

Request de login:

```json
{
  "nombreUsuario": "usuario",
  "contrasena": "contrasena"
}
```

Respuesta esperada de login:

```json
{
  "token": "jwt",
  "tipoToken": "Bearer",
  "expiraEnMinutos": 480,
  "fechaExpiracion": "2026-07-07T00:00:00Z",
  "idUsuario": "uuid",
  "nombreUsuario": "usuario",
  "nombreCompleto": "Nombre Usuario",
  "nombreRol": "vendedor",
  "requiereCambioContrasena": false
}
```

Respuesta esperada de `/auth/me`:

```json
{
  "idUsuario": "uuid",
  "nombreUsuario": "usuario",
  "nombreCompleto": "Nombre Usuario",
  "nombreRol": "vendedor"
}
```

## Validaciones de interfaz

- `nombreUsuario` es obligatorio antes de enviar.
- `contrasena` es obligatoria antes de enviar.
- El frontend no decide si una credencial es valida; esa respuesta viene del backend.
- Si el backend devuelve error con `mensaje`, se muestra en el formulario.
- Si no hay token local, se muestra `/login`.
- Si hay token local, se consulta `GET /api/auth/me` antes de mostrar la shell principal.
- Si `/auth/me` rechaza el token, se limpia la sesion local.
- El token se almacena en `sessionStorage`, no en estado global suelto.

## Respuestas esperadas

- Login exitoso: se guarda token, se muestra `Sesion activa`, usuario y rol.
- Login fallido: se conserva la pantalla de login y se muestra el mensaje del backend.
- Token invalido o expirado: se limpia el token local y se vuelve a `/login`.
- Logout exitoso: el backend cierra la sesion y el frontend limpia token local.
- Logout con token ya invalido: el frontend limpia token local igualmente.

## Evidencia de prueba

- Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado: exitoso.

- Validacion API local:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/health" | ConvertTo-Json -Compress
```

Resultado:

```json
{"status":"ok","service":"kontora-pos-backend"}
```

- Validacion auth contra backend real con fixture local existente:

```text
POST /api/auth/login -> ok
GET /api/auth/me -> usuario test_auth_activo, rol vendedor
POST /api/auth/logout -> ok
```

- Validacion en navegador integrado:

```text
/login muestra Iniciar sesion
Login redirige a /
/ muestra Sesion activa
La topbar muestra usuario y rol
Logout vuelve a /login
Consola sin errores durante el flujo
```

## Pendiente de cierre

El modulo no debe marcarse como completado en `docs/AVANCE_PROYECTO.md` hasta que el usuario confirme manualmente en navegador que el flujo funciona correctamente.
