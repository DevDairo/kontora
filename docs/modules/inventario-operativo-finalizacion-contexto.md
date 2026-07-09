# Inventario operativo: contexto y pendientes para finalizar

## Objetivo de este documento

Este archivo deja el contexto completo para retomar y cerrar el modulo de inventario operativo, incluyendo RF-39, consumos diarios y RF-47 de ajustes/reabastecimiento de stock general.

Debe leerse antes de continuar con el modulo o antes de abrir un nuevo chat de Codex. La idea es evitar perder contexto y terminar el desarrollo con el backend, frontend, documentacion y validacion manual alineados.

## Estado de rama y politica de trabajo

Rama observada al generar este documento:

```text
chore/inicializacion-frontend
```

Reglas de trabajo del proyecto:

- Antes de tocar codigo ejecutar `git status --short --branch`.
- Confirmar rama actual y working tree.
- Si hay cambios sin commit o rama inesperada, avisar antes de avanzar.
- No hacer commits, merges ni cambios de rama sin confirmacion del usuario.
- El usuario maneja commits y merges manualmente.
- La fuente de verdad es el schema real, `docs/database/kontora_pos_schema.txt`, la base local/Supabase y los contratos backend existentes.
- No inventar campos, endpoints ni DTOs.

## Archivos que se deben leer primero al retomar

Orden recomendado:

```text
docs/AVANCE_PROYECTO.md
docs/database/kontora_pos_schema.txt
docs/modules/inventario-operativo.md
docs/modules/inventario-operativo-frontend-pendientes.md
docs/modules/inventario-operativo-finalizacion-contexto.md
docs/development/fases/fase_3_desarrollo_logica_backend_modulos.md
docs/development/fases/fase_4_frontend_validacion.md
docs/frontend/pantallas.md
frontend/src/app/routes/appRoutes.ts
backend/src/main/java/com/kontora/pos/inventario/controller/InventarioController.java
backend/src/main/java/com/kontora/pos/inventario/service/InventarioService.java
frontend/src/modules/inventario/components/InventarioPanel.tsx
frontend/src/modules/inventario/services/inventarioService.ts
frontend/src/modules/inventario/types.ts
```

## Contexto funcional del modulo

Inventario operativo cubre:

- Consulta de stock general desde `existencias_inventario_general`.
- Consulta de stock diario de vasos desde `existencias_inventario_diario`.
- Apertura de paquetes de vasos durante la jornada.
- Registro de unidades rotas al abrir paquetes.
- Descuento automatico de vasos por venta.
- Restauracion de vasos por anulacion de venta.
- Consumo diario manual de desechables y otros items no automaticos.
- Movimientos de inventario con referencia obligatoria en `movimientos_inventario`.
- RF-47: solicitud, aprobacion y rechazo de ajustes de inventario usando `ajustes_inventario`.

La diferencia operativa clave:

- Abrir paquetes de vasos NO es reabastecimiento. Ese flujo descuenta unidades del stock general y aumenta stock diario.
- Reabastecimiento/entrada nueva al stock general debe hacerse mediante ajuste de inventario.
- RF-47 exige que el ajuste quede solicitado y que el gerente lo apruebe antes de aplicarlo.

## Backend implementado para RF-47

Se agrego soporte real para `ajustes_inventario` sin migraciones nuevas, porque la tabla ya existe en el schema canonico.

Archivos backend agregados:

```text
backend/src/main/java/com/kontora/pos/inventario/domain/AjusteInventario.java
backend/src/main/java/com/kontora/pos/inventario/dto/AjusteInventarioResponse.java
backend/src/main/java/com/kontora/pos/inventario/dto/ResolverAjusteInventarioRequest.java
backend/src/main/java/com/kontora/pos/inventario/dto/SolicitarAjusteInventarioRequest.java
backend/src/main/java/com/kontora/pos/inventario/repository/AjusteInventarioRepository.java
```

Archivos backend modificados:

```text
backend/src/main/java/com/kontora/pos/inventario/controller/InventarioController.java
backend/src/main/java/com/kontora/pos/inventario/service/InventarioService.java
backend/src/test/java/com/kontora/pos/inventario/controller/InventarioIntegrationTest.java
```

Endpoints backend agregados:

```text
GET  /api/inventario/ajustes
POST /api/inventario/ajustes
POST /api/inventario/ajustes/{idAjusteInventario}/aprobar
POST /api/inventario/ajustes/{idAjusteInventario}/rechazar
```

Contrato de solicitud:

```json
{
  "idItemInventario": "uuid",
  "tipoStock": "general",
  "cantidadAjuste": 1,
  "sentidoAjuste": "entrada",
  "motivoAjuste": "Reabastecimiento de stock general"
}
```

Contrato para aprobar/rechazar:

```json
{
  "observacionAprobacion": "Texto opcional"
}
```

Reglas implementadas:

- `administrador` y `gerente` pueden solicitar ajustes.
- Solo `gerente` puede aprobar o rechazar ajustes.
- En este alcance el backend solo acepta `tipo_stock = 'general'`.
- La solicitud queda en `estado_aprobacion = 'pendiente'`.
- Solicitar no modifica stock general.
- Rechazar no modifica stock general ni crea movimiento.
- Aprobar actualiza `existencias_inventario_general.cantidad_actual`.
- Aprobar genera un movimiento en `movimientos_inventario` con:
  - `tipo_stock = 'general'`
  - `tipo_movimiento = 'ajuste'`
  - `sentido_movimiento = entrada|salida`
  - `referencia_origen = 'ajustes_inventario'`
  - `id_referencia_origen = id_ajuste_inventario`
- No se aprueban ajustes que dejen stock general negativo.
- Solicitud, aprobacion y rechazo se registran en `auditoria_operaciones`.

## Pruebas backend realizadas

Prueba especifica de inventario:

```powershell
cd C:\Users\corre\Desktop\Kontora\backend
mvn -Dtest=InventarioIntegrationTest test
```

Resultado:

```text
BUILD SUCCESS
Tests run: 9
Failures: 0
Errors: 0
Skipped: 0
```

Suite completa backend:

```powershell
cd C:\Users\corre\Desktop\Kontora\backend
mvn clean test
```

Resultado:

```text
BUILD SUCCESS
Tests run: 53
Failures: 0
Errors: 0
Skipped: 0
Finished at: 2026-07-08T23:03:11-05:00
```

Nota de entorno:

- Dentro del sandbox, Maven fallo inicialmente por `Permission denied: getsockopt` al resolver dependencias.
- Se repitio fuera del sandbox con aprobacion y la validacion fue exitosa.

## Documentacion backend actualizada

Se actualizaron:

```text
docs/modules/inventario-operativo.md
docs/AVANCE_PROYECTO.md
```

La documentacion backend ya refleja RF-47 como implementado y validado por `mvn clean test`.

## Frontend implementado para inventario

Archivos frontend relevantes:

```text
frontend/src/App.tsx
frontend/src/app/routes/appRoutes.ts
frontend/src/index.css
frontend/src/modules/inventario/index.ts
frontend/src/modules/inventario/types.ts
frontend/src/modules/inventario/services/inventarioService.ts
frontend/src/modules/inventario/components/InventarioPanel.tsx
```

La pantalla `/inventario` ya incluye:

- Consulta de existencias generales.
- Consulta de existencias diarias de caja abierta.
- Consulta de movimientos.
- Busqueda general.
- Filtro de movimientos por item.
- Filtro `Solo caja abierta`.
- Formulario para abrir paquetes de vasos.
- Formulario para consumo diario de desechables/items manuales.
- Formulario para solicitar ajuste/reabastecimiento de stock general.
- Panel de ajustes de stock general.
- Acciones de aprobar/rechazar ajustes visibles solo para rol `gerente`.
- Modo vendedor solo lectura.
- Metadata de ruta con endpoints reales en `frontend/src/app/routes/appRoutes.ts`.

Servicios frontend agregados para RF-47:

```text
GET  /api/inventario/ajustes
POST /api/inventario/ajustes
POST /api/inventario/ajustes/{idAjusteInventario}/aprobar
POST /api/inventario/ajustes/{idAjusteInventario}/rechazar
```

## Validaciones frontend realizadas

TypeScript:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
```

Resultado:

```text
OK
```

Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado fuera del sandbox:

```text
vite v7.3.6
1608 modules transformed
dist/assets/index-CmLjpyAc.css
dist/assets/index-BrNHzx9w.js
built in 3.37s
```

Nota de entorno:

- `npm run build` dentro del sandbox fallo por el bloqueo conocido de `esbuild` leyendo directorios superiores.
- Se repitio fuera del sandbox con aprobacion y compilo correctamente.

## Validacion en navegador: estado real

Validacion previa antes de RF-47:

- En `http://localhost:5173/inventario`, con usuario `test_auth_activo` rol `vendedor`, la pantalla cargo datos reales.
- Se validaron stock general, stock diario, movimientos, busqueda, filtro por item y filtro de caja abierta.
- Consola limpia.
- No se probaron POST reales para evitar mutar inventario.

Validacion posterior a RF-47:

- Login con `test_inventario_gerente / Clave12345` funciono.
- La UI mostro el panel de gerente.
- En `/inventario` se renderizaron:
  - `Ajuste / reabastecimiento`
  - `Ajustes de stock general`
  - Formularios de gestion para rol gerente.
- Consola sin errores.
- Con el backend activo en `localhost:8080`, el endpoint nuevo `GET /api/inventario/ajustes` no quedo usable en esa instancia: respondio `401` aun con token valido, mientras endpoints previos como `/api/auth/me`, `/api/inventario/existencias/general` y `/api/inventario/movimientos` respondieron `200`.
- Una instancia temporal del backend con el codigo nuevo respondio `GET /api/inventario/ajustes -> 200`.

Interpretacion:

- El codigo backend esta implementado y validado por tests.
- Para cerrar la validacion de navegador, el backend que usa el frontend debe estar reconstruido/reiniciado con este codigo.
- No marcar `Inventario` como `base` hasta que el usuario valide manualmente la pantalla completa contra el backend actualizado.

## Pendientes para cerrar Inventario operativo

Checklist tecnico:

1. Confirmar `git status --short --branch`.
2. Reiniciar/reconstruir el backend activo para que `localhost:8080` exponga los endpoints de RF-47.
3. Verificar con token real:

```powershell
cd C:\Users\corre\Desktop\Kontora
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/auth/login" -ContentType "application/json" -Body '{"nombreUsuario":"test_inventario_gerente","contrasena":"Clave12345"}'
$headers = @{ Authorization = "Bearer $($login.token)"; Accept = "application/json" }
Invoke-WebRequest -UseBasicParsing -Method Get -Uri "http://localhost:8080/api/inventario/ajustes" -Headers $headers
```

Resultado esperado:

```text
StatusCode 200
```

4. Ejecutar frontend en `http://localhost:5173` con `VITE_API_URL=http://localhost:8080/api`.
5. Login como `gerente`.
6. Ir a `/inventario`.
7. Confirmar que no aparece `No autenticado`.
8. Confirmar que cargan datos reales:
   - Stock general.
   - Stock diario.
   - Movimientos.
   - Ajustes.
9. Confirmar que gerente ve:
   - `Abrir paquetes de vasos`.
   - `Consumo diario de desechables`.
   - `Ajuste / reabastecimiento`.
   - Panel `Ajustes de stock general`.
   - Botones `Aprobar` y `Rechazar` cuando existan ajustes pendientes.
10. Login como `administrador`.
11. Confirmar que administrador puede solicitar ajustes, pero no ve/usa aprobacion gerencial.
12. Login como `vendedor`.
13. Confirmar modo solo lectura: sin formularios de paquetes, consumos o ajustes.
14. Si se prueba POST real, hacerlo con datos controlados en base local:
   - Solicitar ajuste de entrada pequeno sobre un item de bajo riesgo.
   - Aprobarlo solo con gerente.
   - Confirmar que aumenta `existencias_inventario_general`.
   - Confirmar movimiento `ajuste`.
   - Confirmar auditoria en `auditoria_operaciones`.
15. Repetir:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
npm run build
```

16. Solo despues de build, navegador limpio y confirmacion manual del usuario:
   - Actualizar `docs/modules/inventario-operativo-frontend-pendientes.md`.
   - Actualizar `docs/frontend/pantallas.md` si corresponde.
   - Actualizar `docs/AVANCE_PROYECTO.md` para registrar cierre frontend.
   - Cambiar estado de ruta `Inventario` de `pendiente` a `base` en `frontend/src/app/routes/appRoutes.ts`.

## Que NO se debe hacer todavia

- No marcar inventario como `base` sin confirmacion manual del usuario.
- No declarar cerrado el frontend solo por `npm run build`.
- No probar ajustes sobre datos de produccion o Supabase sin autorizacion explicita.
- No convertir RF-47 en una pantalla aislada fuera de `/inventario`.
- No editar `cajas_diarias.valor_base` como parte de este modulo.
- No implementar configuracion de base de caja ahora; el usuario indico que eso pertenece a otra fase.
- No avanzar a cierre hasta terminar inventario y luego gastos/adiciones/pago trabajadores.

## Orden recomendado de desarrollo despues de inventario

Orden operativo acordado:

1. Cerrar Inventario operativo:
   - RF-39 paquetes de vasos.
   - Consumos diarios.
   - RF-47 ajustes/reabastecimiento de stock general.
   - Validacion navegador y confirmacion manual.
2. Implementar interfaz de Gastos, adiciones y pago trabajadores.
3. Implementar interfaz de Cierre de caja.

La razon:

- El cierre depende de adiciones diarias y pago diario a trabajadores confirmado.
- Inventario debe quedar coherente antes de cierre, porque el modulo de cierre/conteo fisico necesita estados confiables de inventario.

## Interfaces pendientes del proyecto

### Inventario operativo

Estado: backend RF-47 implementado y validado; frontend implementado pero pendiente de validacion final en navegador contra backend actualizado.

Pendiente:

- Validar rol gerente.
- Validar rol administrador.
- Validar rol vendedor.
- Probar solicitud/aprobacion/rechazo con datos controlados.
- Actualizar docs finales y route status solo tras confirmacion manual.

### Gastos, adiciones y pago trabajadores

Backend ya existe segun documentacion del proyecto.

Endpoints relevantes documentados:

```text
POST /api/operaciones-caja/adiciones-diarias
GET  /api/operaciones-caja/adiciones-diarias/abierta
POST /api/operaciones-caja/gastos-caja
GET  /api/operaciones-caja/gastos-caja/abierta
PUT  /api/operaciones-caja/gastos-caja/{idGastoCaja}
POST /api/operaciones-caja/gastos-caja/{idGastoCaja}/anular
POST /api/operaciones-caja/pagos-trabajadores-diarios
GET  /api/operaciones-caja/pagos-trabajadores-diarios/abierta
POST /api/operaciones-caja/pagos-trabajadores-diarios/{idPagoTrabajadoresDiario}/confirmar
```

Pendiente frontend:

- Pantalla `/gastos`.
- Registro y consulta de gastos.
- Edicion/anulacion de gastos para administrador/gerente.
- Registro/actualizacion de adiciones.
- Registro/confirmacion de pago diario a trabajadores.
- Manejo de pago en cero con confirmacion explicita.
- Validacion por roles.
- Integracion con evidencias si aplica.

### Cierre de caja

Backend ya existe.

Endpoints relevantes:

```text
POST /api/cajas-diarias/{idCajaDiaria}/cerrar
GET  /api/cajas-diarias/{idCajaDiaria}/cierre
```

Pendiente frontend:

- Pantalla `/cierre`.
- Mostrar resumen de ventas, efectivo, transferencias, gastos, adiciones, pago trabajadores y diferencia.
- Bloquear o advertir si pago trabajadores no esta confirmado.
- Confirmar efectivo contado sin base.
- Mostrar que la base de caja se excluye del deposito.
- Mostrar transferencias pendientes visibles.
- Confirmacion final de cierre para administrador/gerente.

### Deposito

Pendiente frontend:

- Pantalla `/deposito`.
- Historial de movimientos de deposito.
- Consignaciones bancarias.
- Pagos de servicios.
- Evidencias asociadas.
- Validacion de roles.

### Evidencias

Backend de evidencias y Supabase Storage ya existe.

Pendiente frontend:

- Pantalla `/evidencias`.
- Carga y consulta de soportes segun entidad.
- Estados claros cuando Supabase Storage no este configurado.
- Validar imagen/PDF.
- Integracion visual con ventas, gastos, deposito, consignaciones y pagos de servicios.

### Transferencias

Pendiente frontend:

- Pantalla `/transferencias`.
- Listado de transferencias.
- Validacion/rechazo para administrador/gerente.
- Estado visible para vendedor.
- Integracion con evidencias de transferencia.

### Consultas

Pendiente frontend:

- Pantalla `/consultas`.
- Ventas, gastos, inventario actual, deposito, cierres y filtros operativos.
- Cuidar permisos por rol.
- No duplicar reglas criticas del backend.

### Auditoria

Pendiente frontend:

- Pantalla `/auditoria`.
- Consulta de auditoria operativa.
- Visibilidad diferenciada entre administrador y gerente.
- Filtros por tabla, usuario, accion, rango de fechas.

### Catalogos/configuraciones

El panel de catalogos base de solo lectura ya fue validado previamente.

Pendiente para otra fase:

- Configuracion de `valor_base_caja`.
- Configuracion de `valor_adicion`.
- Configuracion de pago diario a trabajadores.
- Gestion administrativa de precios/promociones/items/usuarios si el alcance lo requiere.

El usuario indico que configurar base de caja antes de abrir caja pertenece a otra fase y no debe bloquear este modulo ahora.

## Posible estado de procesos temporales

Durante la validacion se levantaron procesos temporales para no tocar los servidores del usuario:

```text
Backend temporal: 8081/8082
Frontend temporal: 5174/5175
```

El usuario interrumpio antes de detener los ultimos procesos temporales. Si quedan activos y se desea limpiarlos, cerrar terminales/procesos asociados o reiniciar los dev servers normales. No es parte del commit.

## Prompt recomendado para un nuevo chat

```text
Estamos en Kontora POS: C:\Users\corre\Desktop\Kontora.

Antes de tocar codigo:
1. Ejecuta git status --short --branch.
2. Confirma rama actual y working tree.
3. No hagas commits, merges ni cambios de rama sin aprobacion.

Lee primero:
- docs/AVANCE_PROYECTO.md
- docs/database/kontora_pos_schema.txt
- docs/modules/inventario-operativo.md
- docs/modules/inventario-operativo-frontend-pendientes.md
- docs/modules/inventario-operativo-finalizacion-contexto.md
- docs/development/fases/fase_4_frontend_validacion.md
- frontend/src/modules/inventario/components/InventarioPanel.tsx
- frontend/src/modules/inventario/services/inventarioService.ts
- frontend/src/app/routes/appRoutes.ts

Objetivo:
Finalizar Inventario operativo frontend con RF-47 ya implementado en backend.

Pendiente principal:
Reiniciar/reconstruir backend activo para que /api/inventario/ajustes responda 200 con token, validar /inventario en navegador con gerente/administrador/vendedor, probar solicitud/aprobacion/rechazo con datos controlados si el usuario autoriza, y solo despues marcar Inventario como base y actualizar docs finales.
```
