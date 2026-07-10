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
- `vendedor` ve navegacion operativa: ventas, caja, gastos, transferencias y consultas. No ve interfaces independientes de Inventario, Catalogos ni Evidencias.
- `administrador` ve Inventario y Catalogos, ademas de las rutas administrativas de cierre, deposito, evidencias y auditoria.
- `gerente` ve navegacion gerencial con visibilidad administrativa completa.
- Cada ruta informa si su pantalla esta en estado `Base lista` o `Pantalla pendiente`.
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

Administrador / Gerente.

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

## Pantalla: Registro de ventas y pagos

### Objetivo

Registrar ventas con catalogos reales, promociones vigentes y pagos en efectivo, transferencia o modalidad mixta.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoints consumidos

- `POST /api/ventas`
- `POST /api/evidencias/pagos-venta/{idPagoVenta}`
- Endpoints de catalogos necesarios para el formulario.

### Campos del formulario

- `tipoComprador`
- `idUsuarioComprador` cuando el comprador es trabajador
- Tipo de granizado, tamano y cantidad
- Metodo de pago y valores recibidos o transferidos
- Comprobante opcional para transferencia

### Validaciones de interfaz

- El total de pagos no puede ser inferior ni superior al total de la venta.
- El efectivo recibido no puede ser menor al efectivo que se registra como pago.
- La transferencia pura informa faltante o excedente y bloquea el envio si el valor no coincide.
- En pago mixto, el payload aplica solo el valor necesario de efectivo y transferencia; el excedente de efectivo se presenta como cambio.
- La evidencia se envia despues de registrar una venta con transferencia y nunca se carga directamente a Supabase desde el navegador.

### Evidencia de prueba

- `npx tsc -b --pretty false` y `npm run build` completados correctamente.
- Navegador validado con catalogos reales, pago en efectivo, transferencia y pago mixto; consola sin errores ni advertencias.
- Efectivo por `10000` sobre una venta de `8000`: backend devolvio cambio de `2000`.
- Pago mixto con transferencia de `6000` y efectivo recibido de `3000`: la interfaz registro `6000` por transferencia y `2000` por efectivo, con cambio de `1000`.
- Los valores de transferencia por debajo o por encima del total se bloquearon antes de enviar el formulario.
- La subida local de evidencia devolvio `503`, `Supabase Storage no esta configurado`; es el comportamiento esperado hasta configurar el almacenamiento en el backend de despliegue.
- El usuario confirmo manualmente la interfaz el 2026-07-09.

## Pantalla: Inventario operativo

### Objetivo

Controlar el stock general, el stock diario de vasos, sus movimientos y los ajustes auditables desde contratos reales del backend.

### Actor principal

Administrador / Gerente.

### Endpoints consumidos

- `GET /api/inventario/existencias/general`
- `GET /api/inventario/existencias/diarias/abierta`
- `POST /api/inventario/paquetes-vasos`
- `POST /api/inventario/consumos-diarios`
- `GET /api/inventario/movimientos`
- `GET /api/inventario/ajustes`
- `POST /api/inventario/ajustes`
- `POST /api/inventario/ajustes/{idAjusteInventario}/aprobar`
- `POST /api/inventario/ajustes/{idAjusteInventario}/rechazar`

### Validaciones de interfaz

- Gerente registra y aplica directamente ajustes de stock general, incluso si no hay caja diaria abierta.
- Administrador solicita ajustes; solo gerente puede aprobarlos o rechazarlos.
- Sin caja abierta, la pantalla conserva stock general, movimientos y ajustes, pero deshabilita apertura de paquetes y consumos diarios.
- El stock diario del nuevo dia conserva el remanente del dia anterior por item de vaso; no se inicializa vacio por el cambio de caja.
- Vendedor no ve la ruta ni puede acceder a `/inventario`; el backend conserva la autoridad final de permisos.

### Evidencia de prueba

- `npx tsc -b --pretty false` y `npm run build` completados correctamente.
- Pruebas backend focalizadas de Inventario y Caja: 16 pruebas, sin fallos ni errores.
- `GET /api/inventario/ajustes` respondio `200` para administrador y gerente, y `403` para vendedor.
- Se verifico con datos controlados una solicitud de administrador, su aprobacion y rechazo por gerente, y una aplicacion directa del gerente.
- La validacion en navegador cubrio gerente, administrador y vendedor; la verificacion manual final del usuario fue confirmada el 2026-07-09.

## Pantalla: Gastos y pago diario a trabajadores

### Objetivo

Registrar gastos de la jornada y administrar el pago total diario a trabajadores sin duplicar la proyeccion financiera que se consulta desde Caja.

### Actor principal

Vendedor / Administrador / Gerente.

### Endpoints consumidos

- `GET` y `POST /api/operaciones-caja/gastos-caja/abierta` y `/api/operaciones-caja/gastos-caja`.
- `PUT /api/operaciones-caja/gastos-caja/{idGastoCaja}`.
- `POST /api/operaciones-caja/gastos-caja/{idGastoCaja}/anular`.
- `GET` y `POST /api/operaciones-caja/pagos-trabajadores-diarios/abierta` y `/api/operaciones-caja/pagos-trabajadores-diarios`.
- `POST /api/operaciones-caja/pagos-trabajadores-diarios/{idPagoTrabajadoresDiario}/confirmar`.

### Validaciones de interfaz

- Vendedor registra y consulta gastos, pero no ve pago a trabajadores ni acciones de edicion o anulacion.
- Administrador y gerente pueden editar o anular gastos, con el motivo obligatorio que exige el backend.
- Administrador y gerente registran, confirman o actualizan el pago diario a trabajadores mientras la caja este abierta.
- Un pago en cero requiere confirmacion explicita antes de enviarse.
- Los importes aceptan teclado o pegado y normalizan separadores decimales o de miles antes de enviar el valor numerico.
- Los controles se deshabilitan cuando no hay caja abierta; backend conserva la autorizacion y la validacion definitiva.

### Evidencia de prueba

- `npx tsc -b --pretty false` y `npm run build` completados correctamente.
- `/gastos` respondio `200` desde el servidor React local.
- El usuario confirmo manualmente el flujo, el pago a trabajadores para administrador y gerente, la ausencia de ese panel para vendedor y la uniformidad visual final.

## Pantalla: Operaciones financieras de caja

### Objetivo

Presentar el estado financiero de la caja abierta y permitir registrar adiciones sin convertir Caja en una segunda interfaz de gastos o pago a trabajadores.

### Actor principal

Administrador / Gerente.

### Endpoints consumidos

- `GET /api/cajas-diarias/abierta/resumen`.
- `GET` y `POST /api/operaciones-caja/adiciones-diarias/abierta` y `/api/operaciones-caja/adiciones-diarias`.
- `GET /api/operaciones-caja/pagos-trabajadores-diarios/abierta` como dato de lectura para la proyeccion.

### Validaciones de interfaz

- La proyeccion usa ventas en efectivo, adiciones, gastos activos y pago a trabajadores calculados por backend.
- Transferencias y base de caja se muestran por separado porque no corresponden al efectivo fisico disponible para deposito.
- La proyeccion informa los requisitos pendientes para cierre, sin reemplazar las validaciones del endpoint de cierre.
- Vendedor no ve esta superficie administrativa.

### Evidencia de prueba

- `GET /api/cajas-diarias/abierta/resumen` respondio `200` para administrador y gerente, y `403` para vendedor.
- `/caja` respondio `200` desde el servidor React local.
- El usuario confirmo manualmente la distribucion final entre Caja y Gastos.

## Pantalla: Cierre de caja y deposito

### Objetivo

Consolidar el efectivo de la jornada abierta, registrar el conteo fisico sin base y consultar resultados de cierre persistidos por fecha.

### Actor principal

Administrador / Gerente.

### Endpoints consumidos

- `GET /api/cajas-diarias/abierta`.
- `GET /api/cajas-diarias/abierta/resumen`.
- `POST /api/cajas-diarias/{idCajaDiaria}/cerrar`.
- `GET /api/cajas-diarias/{idCajaDiaria}/cierre`.
- `GET /api/consultas/cierre?fecha={fechaOperacion}`.

### Campos y controles

- `efectivoContadoSinBase`.
- `observaciones` opcionales.
- Confirmacion de que el conteo no incluye la base de caja.
- Confirmacion previa al cierre.
- Consulta de cierre por fecha y retorno a la operacion actual.

### Validaciones de interfaz

- Solo se muestra para administrador y gerente.
- El efectivo contado es numerico, no negativo y no incluye la base de caja.
- El boton permanece deshabilitado hasta que backend confirme adiciones y pago a trabajadores para el cierre.
- La confirmacion puede cancelarse sin enviar la solicitud.
- El historial se consulta a backend y permanece disponible despues de recargar.
- La jornada puede cerrar despues de medianoche; la fecha de operacion no se reemplaza por la fecha fisica del cierre.

### Respuestas esperadas

- Cierre exitoso: arqueo, diferencia y valor a deposito calculados por backend.
- Deposito positivo: movimiento creado con saldo anterior y posterior.
- Deposito en cero: resultado sin movimiento de deposito.
- Consulta historica: resultado recuperado para la jornada seleccionada.
- Error: mensaje real de backend sin borrar los datos del formulario.

### Evidencia de prueba

- `mvn clean test`: 60 pruebas sin fallos ni errores.
- `npx tsc -b --pretty false` y `npm run build`: exitosos.
- Backend Docker y rutas `/caja` y `/cierre`: respuesta `200`.
- El usuario confirmo manualmente el flujo de cierre, persistencia, historial, valor base inicial editable y cuadros de confirmacion.

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
5. Registro de venta y pagos. Implementado y validado.
6. Inventario operativo. Implementado y validado.
7. Gastos, adiciones y pago trabajadores. Implementado y validado.
8. Cierre de caja. Implementado y validado.
9. Deposito, consignaciones y servicios. Siguiente modulo.
10. Evidencias.
11. Auditoria y consultas.

Los modulos listados como implementados cuentan con validacion manual del usuario. El siguiente cierre funcional pendiente es Deposito, consignaciones y servicios.
