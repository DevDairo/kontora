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

## Pantalla: Layout principal por rol

### Objetivo

Mostrar la shell principal despues de login y presentar navegacion visible segun el rol autenticado.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoint consumido

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/health`

La pantalla no ejecuta todavia endpoints de negocio; solo referencia contratos documentados para las vistas base.

### Campos del formulario

- No aplica.

### Validaciones de interfaz

- Sin sesion valida se muestra `/login`.
- Con sesion valida se muestra el panel correspondiente a `nombreRol`.
- `vendedor` ve navegacion operativa: ventas, caja, inventario, gastos, transferencias, evidencias y consultas.
- `administrador` ve navegacion administrativa adicional: catalogos, cierre, deposito y auditoria.
- `gerente` ve navegacion gerencial con visibilidad administrativa completa.
- Las pantallas de negocio quedan marcadas como `Pantalla pendiente`.
- El frontend no decide permisos finales; el backend sigue siendo autoridad.

### Respuestas esperadas

- Caso exitoso: la shell muestra usuario, rol, estado de API y menu visible segun rol.
- Caso con token invalido: el frontend limpia sesion y vuelve a `/login`.

### Evidencia de prueba

- `npm run build`.
- Login validado contra backend real con roles `vendedor`, `administrador` y `gerente`.
- Navegacion visible revisada en navegador integrado.
- Consola del navegador sin errores ni advertencias.
- Verificacion manual del usuario completada antes de documentar el cierre.

## Pantalla: Panel de caja abierta

### Objetivo

Consultar la caja diaria abierta desde la API real y mostrar su estado dentro de la shell autenticada.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoint consumido

- `GET /api/cajas-diarias/abierta`
- `POST /api/cajas-diarias`

### Campos del formulario

Solo cuando no existe caja abierta y el rol visible es `administrador` o `gerente`:

- `fechaOperacion`
- `valorBase`
- `observaciones`

### Validaciones de interfaz

- La consulta usa el token de sesion confirmado por `/api/auth/me`.
- Si existe caja abierta, se muestran los datos reales del backend.
- Si no existe caja abierta, `vendedor` ve un mensaje de solo lectura.
- Si no existe caja abierta, `administrador` y `gerente` ven formulario de apertura.
- `valorBase` no puede ser negativo en la validacion de interfaz.
- La autorizacion final para abrir caja queda en backend.

### Respuestas esperadas

- Caja abierta: se muestra estado, fecha de operacion, valor base, fecha de apertura, usuario de apertura y observaciones.
- Sin caja abierta: se muestra mensaje o formulario segun rol.
- Error backend: se muestra el mensaje devuelto por la API.

### Evidencia de prueba

- `npm run build`.
- `GET /api/cajas-diarias/abierta` validado contra backend real.
- Panel `/caja` validado en navegador integrado con `vendedor` y `administrador`.
- Consola del navegador sin errores ni advertencias.
- Verificacion manual del usuario completada antes de documentar el cierre.

## Pantalla: Catalogos para formularios

### Objetivo

Consultar catalogos base activos desde la API real para preparar formularios operativos.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoint consumido

- `GET /api/catalogos/metodos-pago`
- `GET /api/catalogos/tipos-granizado`
- `GET /api/catalogos/tamanos-vaso`
- `GET /api/catalogos/categorias-inventario`
- `GET /api/catalogos/unidades-medida`
- `GET /api/catalogos/items-inventario`
- `GET /api/catalogos/precios-granizado/vigentes`
- `GET /api/catalogos/promociones/vigentes`
- `GET /api/catalogos/tipos-servicio`

### Campos del formulario

- `fechaVigencia`
- `buscar`

### Validaciones de interfaz

- La consulta usa token activo.
- La fecha de vigencia se envia como filtro para precios y promociones.
- La busqueda es local sobre datos ya consultados.
- Si la API devuelve error, se muestra el mensaje real.
- La pantalla no crea ni edita catalogos.

### Respuestas esperadas

- Caso exitoso: se muestran conteos y listas de catalogos, precios, promociones e items.
- Caso con error: se muestra mensaje de API y se permite reintento.

### Evidencia de prueba

- `npm run build`.
- Endpoints de catalogos validados contra backend real con token.
- Panel `/catalogos` validado en navegador integrado.
- Consola del navegador sin errores ni advertencias.
- Verificacion manual del usuario completada antes de documentar el cierre.

## Orden previsto de pantallas

Fuente: `docs/development/fases/fase_4_frontend_validacion.md`.

1. Login.
2. Layout principal por rol. Implementado y validado.
3. Panel de caja abierta. Implementado y validado.
4. Catalogos necesarios para formularios. Implementado y validado.
5. Registro de venta y pagos. Siguiente modulo.
6. Inventario operativo.
7. Gastos, adiciones y pago trabajadores.
8. Cierre de caja.
9. Deposito, consignaciones y servicios.
10. Evidencias.
11. Auditoria y consultas.

La pantalla de login ya cuenta con implementacion tecnica y validacion automatizada/asistida. El cierre del modulo queda pendiente de confirmacion manual del usuario en navegador.
