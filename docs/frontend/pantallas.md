# Pantallas frontend

## Pantalla: Login

### Objetivo

Permitir el inicio de sesion contra la API real del backend y abrir la shell protegida solo cuando la sesion sea valida.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoint consumido

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/health`

### Campos del formulario

- `nombreUsuario`
- `contrasena`

### Validaciones de interfaz

- Usuario y contrasena son obligatorios antes de enviar.
- El error real de API se muestra al usuario cuando el backend rechaza el login.
- Sin token valido se muestra `/login`.
- Con token valido se muestra la shell principal.
- El logout limpia la sesion local y vuelve a `/login`.

### Respuestas esperadas

- Caso exitoso: el backend devuelve JWT y datos del usuario; el frontend muestra `Sesion activa`.
- Caso con error: el backend devuelve `mensaje` y el formulario conserva el estado no autenticado.

### Evidencia de prueba

- `npm run build`.
- Login, `GET /api/auth/me` y logout validados contra backend real en `http://localhost:8080/api`.
- Flujo validado en navegador integrado con el fixture local `test_auth_activo`.
- Pendiente confirmacion manual final del usuario en navegador.

## Pantalla: Inicio de inicializacion

### Objetivo

Validar que la app React carga y que puede consultar el endpoint publico de salud del backend.

### Actor principal

Equipo de desarrollo.

### Endpoint consumido

- `GET /api/health`

### Campos del formulario

- No aplica.

### Validaciones de interfaz

- La pantalla muestra estado de conexion: pendiente, validando, disponible o sin conexion.
- El boton de reintento ejecuta nuevamente la consulta.
- La URL base proviene de `VITE_API_URL`.

### Respuestas esperadas

- Caso exitoso: `status = ok` y `service = kontora-pos-backend`.
- Caso con error: se muestra el mensaje de error HTTP o de conexion.

### Evidencia de prueba

- `npm run build`.
- Consulta manual contra `http://localhost:8080/api/health` cuando el backend este activo.

## Orden previsto de pantallas

Fuente: `docs/development/fases/fase_4_frontend_validacion.md`.

1. Login.
2. Layout principal por rol.
3. Panel de caja abierta.
4. Catalogos necesarios para formularios.
5. Registro de venta y pagos.
6. Inventario operativo.
7. Gastos, adiciones y pago trabajadores.
8. Cierre de caja.
9. Deposito, consignaciones y servicios.
10. Evidencias.
11. Auditoria y consultas.

La pantalla de login ya cuenta con implementacion tecnica y validacion automatizada/asistida. El cierre del modulo queda pendiente de confirmacion manual del usuario en navegador.
