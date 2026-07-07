# Avance del proyecto Kontora POS

Este documento registra el avance real del proyecto para mantener control de contexto entre fases. Debe actualizarse al cerrar cada fase o modulo importante.

## Estado actual

- Fecha de registro: 2026-07-07.
- Rama actual: `chore/inicializacion-frontend`.
- Fase actual: Fase 4, PR 1 de inicializacion frontend completada y validada.
- Fase anterior validada: Fase 3, modulo 10: Consultas operativas.
- Siguiente hito: merge manual de `chore/inicializacion-frontend` hacia `main` e inicio de `feature/frontend-auth`.

## Fase 1: Creacion del proyecto y entorno Docker

Estado: completada y validada operativamente.

Cambios realizados:

- Se inicializo el repositorio local.
- Se creo la estructura base: `backend/`, `frontend/`, `infra/`, `database/` y `docs/`.
- Se agrego `.gitignore`.
- Se agrego `.env.example`.
- Se preparo `infra/compose.local.yml`.
- Se preparo `infra/compose.prod.yml`.
- Se copio el schema canonico recibido a `database/schema/kontora_pos_schema_v1_1.sql`.
- Se creo la migracion inicial Flyway como copia exacta del schema canonico en `database/migrations/V1__schema_inicial_kontora_pos.sql`.
- Se versiono documentacion base de arquitectura, despliegue, base de datos y decisiones tecnicas.
- Se copiaron documentos fuente relevantes dentro de `docs/`.

Validaciones realizadas:

- El hash del SQL original coincide con `database/schema/kontora_pos_schema_v1_1.sql`.
- El hash del SQL original coincide con `database/migrations/V1__schema_inicial_kontora_pos.sql`.
- `docker compose -f infra/compose.local.yml config` valido correctamente la configuracion.
- Se confirmo que la tabla `ventas` conserva `id_usuario_vendedor`.
- Se confirmo que la tabla `pagos_venta` conserva `valor_pago` y `estado_validacion`.
- Se confirmo que existen las tablas canonicas `existencias_inventario_general` y `existencias_inventario_diario`.
- El usuario levanto manualmente `kontora_pos_postgres_local`.
- PostgreSQL finalizo la inicializacion con `COMMIT`.
- La base local reporto 34 tablas publicas.
- La consulta de tablas canonicas devolvio `ventas`, `pagos_venta`, `existencias_inventario_general` y `existencias_inventario_diario`.

Observacion operativa:

- Codex no pudo levantar PostgreSQL local porque Docker rechazo la conexion al motor local desde esta sesion.
- Error observado: permiso denegado al acceder a `npipe:////./pipe/docker_engine`.
- Tambien se observo advertencia de acceso denegado a `C:\Users\corre\.docker\config.json`.
- Se reintento despues de confirmar que el usuario pertenece a `docker-users`, pero Codex siguio sin poder acceder al motor Docker desde esta sesion.
- La validacion operativa se completo manualmente desde PowerShell.

## Fase 2: Infraestructura base y estructura del proyecto

Estado: completada y validada.

Objetivo:

- Crear backend Spring Boot en `backend/`.
- Configurar Maven, Spring Web, JPA, PostgreSQL, Flyway, Spring Security, Validation y pruebas.
- Crear endpoint `GET /api/health`.
- Mantener `ddl-auto=validate`.
- Preparar `Dockerfile`.
- Compilar con `mvn clean test` antes de avanzar a modulos de negocio.

Cambios realizados:

- Se creo `backend/pom.xml` con Spring Boot, Spring Web, Spring Data JPA, PostgreSQL, Flyway, Spring Security, Validation, Actuator y pruebas.
- Se creo `backend/src/main/java/com/kontora/pos/KontoraPosApplication.java`.
- Se creo `GET /api/health`.
- Se configuro seguridad base stateless, permitiendo `/api/health` y endpoints de salud de Actuator.
- Se configuro `application.yml` con variables de entorno, JPA `ddl-auto=validate`, Flyway y PostgreSQL.
- Se agrego migracion Flyway de runtime en `backend/src/main/resources/db/migration/V1__schema_inicial_kontora_pos.sql`.
- La migracion de runtime conserva el SQL canonico y solo elimina las lineas externas `BEGIN;` y `COMMIT;` porque Flyway controla la transaccion.
- Se creo `backend/Dockerfile`.
- Se creo documentacion inicial del backend y estructura de paquetes.

Validaciones realizadas:

- `mvn clean test` ejecutado correctamente.
- Compilacion principal: 16 archivos Java.
- Pruebas compiladas: 2 archivos Java.
- Pruebas ejecutadas: 2.
- Fallos: 0.
- Spring Boot arranco en prueba de integracion con Java 21.
- La aplicacion conecto a PostgreSQL local `kontora_pos`.
- Flyway valido migraciones y dejo el schema en version 1.
- JPA/Hibernate inicio con `ddl-auto=validate`.
- `GET /api/health` respondio con `status=ok` y `service=kontora-pos-backend` dentro de la prueba de integracion.

Observaciones:

- El `PATH` de Windows prioriza Java 8, pero Maven usa Java 21 por `JAVA_HOME`.
- Se fijo el `maven-compiler-plugin` al compilador de `${java.home}/bin/javac` para evitar usar accidentalmente Java 8.
- Codex sigue sin poder acceder al motor Docker por `npipe:////./pipe/docker_engine`, por lo que la validacion Docker del backend debe ejecutarla el usuario manualmente.
- El usuario intento construir el backend en Docker y la construccion fallo antes de compilar el proyecto porque Docker Desktop no pudo resolver `registry-1.docker.io`.
- Error observado: `lookup registry-1.docker.io: no such host`.
- No se creo el contenedor `kontora_pos_backend_local`.
- El bloqueo actual de Docker corresponde a red/DNS/proxy de Docker Desktop, no al codigo del backend.
- El usuario corrigio el acceso a imagenes base de Docker y repitio la validacion.
- Docker construyo correctamente la imagen `infra-backend`.
- `kontora_pos_postgres_local` quedo saludable.
- `kontora_pos_backend_local` inicio correctamente.
- La primera llamada a `GET /api/health` termino la conexion de forma inesperada, probablemente porque el backend aun estaba terminando de arrancar.
- La segunda llamada a `GET /api/health` respondio correctamente:

```json
{"status":"ok","service":"kontora-pos-backend"}
```

Conclusion:

- Fase 2 queda cerrada.
- Se puede iniciar Fase 3, modulo 1: Seguridad, usuarios y sesiones.

## Fase 3: Modulo 1 - Seguridad, usuarios y sesiones

Estado: completado y validado.

Rama de trabajo:

- `feature/usuarios-sesiones`.

Tablas canonicas usadas:

- `roles`.
- `usuarios`.
- `credenciales_usuario`.
- `sesiones_usuario`.

Cambios realizados:

- Se implementaron entidades JPA respetando `@Table`, `@Column` y nombres reales del schema.
- Se agregaron repositorios para usuarios, credenciales y sesiones.
- Se implemento autenticacion con `nombre_usuario` y contrasena BCrypt almacenada en `credenciales_usuario.contrasena_hash`.
- Se implemento generacion y validacion de JWT con identificador `jti`.
- Se persiste la sesion en `sesiones_usuario.token_identificador` usando el `jti`, no el token completo.
- Se agrego filtro de autenticacion para validar token, expiracion, usuario activo y sesion `activa`.
- Se agregaron endpoints:
  - `POST /api/auth/login`.
  - `GET /api/auth/me`.
  - `POST /api/auth/logout`.
- Se agrego manejo de errores API con respuesta JSON.
- Se documento el modulo en `docs/modules/usuarios-sesiones.md`.

Reglas validadas:

- Usuario activo puede iniciar sesion.
- Usuario bloqueado no puede iniciar sesion.
- Login exitoso crea una sesion activa en `sesiones_usuario`.
- Token valido permite consultar `GET /api/auth/me`.
- Logout cambia la sesion a cerrada.
- El mismo token deja de autorizar despues del logout.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 4.
- Fallos: 0.
- Errores: 0.

Observaciones:

- No se modifico el schema para acomodarlo al codigo.
- La auditoria explicita de login/logout quedo implementada posteriormente en el modulo "Auditoria transversal".
- La administracion completa de usuarios y cambio de contrasena quedan fuera de este modulo inicial y se retomaran cuando correspondan por flujo documentado.

## Fase 3: Modulo 2 - Caja diaria

Estado: completado y validado.

Rama de trabajo:

- `feature/caja-diaria`.

Tablas canonicas usadas:

- `cajas_diarias`.
- `cierres_caja`.

Cambios realizados:

- Se implemento entidad JPA `CajaDiaria` respetando la tabla `cajas_diarias`.
- Se implemento entidad JPA `CierreCaja` respetando la tabla `cierres_caja` como preparacion para el modulo de cierre.
- Se agregaron repositorios para caja diaria y cierres de caja.
- Se agrego endpoint `POST /api/cajas-diarias` para apertura.
- Se agrego endpoint `GET /api/cajas-diarias/abierta`.
- Se agrego endpoint `GET /api/cajas-diarias/fecha/{fechaOperacion}`.
- Se implemento validacion de rol para apertura: solo `administrador` y `gerente`.
- Se implemento validacion para impedir mas de una caja por `fecha_operacion`.
- Se documento el modulo en `docs/modules/caja-diaria.md`.

Reglas validadas:

- Sin usuario autenticado no se puede abrir caja.
- Un `vendedor` no puede abrir caja.
- Un `administrador` puede abrir caja.
- Un `gerente` puede abrir caja.
- No se puede abrir una segunda caja para la misma fecha.
- La caja queda en estado `abierta`.
- La apertura registra `id_usuario_apertura`.
- La caja se puede consultar por fecha.
- La caja abierta se puede consultar.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 8.
- Fallos: 0.
- Errores: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene `cajas_diarias` y `cierres_caja`.
- `valor_base` se conserva en apertura porque existe en el schema, pero sigue excluido de efectivo contado y deposito segun la documentacion.
- El cierre contable completo queda pendiente para el modulo "Cierre de caja y deposito".

## Fase 3: Modulo 3 - Catalogos base

Estado: completado y validado.

Rama de trabajo:

- `feature/catalogos-base`.

Tablas canonicas usadas:

- `roles`.
- `metodos_pago`.
- `tipos_granizado`.
- `tamanos_vaso`.
- `precios_granizado`.
- `promociones`.
- `dias_promocion`.
- `categorias_inventario`.
- `unidades_medida`.
- `items_inventario`.
- `tipos_servicio`.

Cambios realizados:

- Se implementaron entidades JPA para los catalogos definidos por el schema.
- Se agregaron repositorios de lectura con consultas nativas para filtrar enums por valores canonicos.
- Se agrego endpoint `GET /api/catalogos/roles`.
- Se agrego endpoint `GET /api/catalogos/metodos-pago`.
- Se agrego endpoint `GET /api/catalogos/tipos-granizado`.
- Se agrego endpoint `GET /api/catalogos/tamanos-vaso`.
- Se agrego endpoint `GET /api/catalogos/categorias-inventario`.
- Se agrego endpoint `GET /api/catalogos/unidades-medida`.
- Se agrego endpoint `GET /api/catalogos/items-inventario`.
- Se agrego endpoint `GET /api/catalogos/precios-granizado/vigentes`.
- Se agrego endpoint `GET /api/catalogos/promociones/vigentes`.
- Se agrego endpoint `GET /api/catalogos/tipos-servicio`.
- Se documento el modulo en `docs/modules/catalogos-base.md`.

Reglas validadas:

- Sin usuario autenticado no se pueden consultar catalogos internos.
- Los catalogos base activos se consultan correctamente.
- Los precios vigentes se filtran por fecha y estado.
- Las promociones vigentes se filtran por fecha y estado.
- Las promociones devuelven sus dias configurados en `dias_promocion`.
- Los items inactivos no aparecen en operaciones normales.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 12.
- Fallos: 0.
- Errores: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene las tablas y datos iniciales de catalogos.
- No se implemento `items_inventario.cantidad_minima_alerta` porque esa columna aparece en documentacion adaptada, pero no existe en `kontora_pos_schema.txt`.
- La aplicacion exacta de promociones por tipo de comprador y dia de semana queda para el modulo "Ventas y pagos".

## Fase 3: Modulo 4 - Ventas y pagos

Estado: completado y validado.

Rama de trabajo:

- `feature/ventas-pagos`.

Tablas canonicas usadas:

- `ventas`.
- `detalles_venta`.
- `pagos_venta`.
- `cajas_diarias`.
- `usuarios`.
- `tipos_granizado`.
- `tamanos_vaso`.
- `precios_granizado`.
- `promociones`.
- `dias_promocion`.
- `metodos_pago`.

Cambios realizados:

- Se implementaron entidades JPA para `ventas`, `detalles_venta` y `pagos_venta`.
- Se agregaron repositorios para ventas, detalles y pagos.
- Se agrego endpoint `POST /api/ventas`.
- Se implemento calculo de precio vigente por tipo de granizado y tamano.
- Se implemento aplicacion de promocion 2x por conjuntos completos.
- Se implemento pago en efectivo con `valor_recibido_efectivo` y `cambio_entregado`.
- Se implemento pago por transferencia con `estado_validacion = 'pendiente'`.
- Se implemento pago hibrido como multiples filas en `pagos_venta`.
- Se corrigio aislamiento de pruebas entre caja diaria y ventas.
- Se documento el modulo en `docs/modules/ventas-pagos.md`.

Reglas validadas:

- No se puede vender sin caja abierta.
- La venta queda asociada a una caja diaria abierta.
- El total de venta coincide con los detalles calculados.
- La suma de pagos coincide con `ventas.total_venta`.
- La promocion 2x aplica por pares del mismo tamano.
- Las unidades sobrantes se cobran a precio normal.
- Transferencias quedan pendientes de validacion.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 16.
- Fallos: 0.
- Errores: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene ventas, detalles y pagos.
- La anulacion con restauracion de stock diario se implemento posteriormente en el modulo "Inventario operativo", junto con movimientos de inventario.
- Evidencias de transferencia quedan para el modulo "Evidencias y almacenamiento".

## Fase 3: Modulo 5 - Inventario operativo

Estado: completado y validado.

Rama de trabajo:

- `feature/inventario-operativo`.

Tablas canonicas usadas:

- `items_inventario`.
- `existencias_inventario_general`.
- `existencias_inventario_diario`.
- `movimientos_inventario`.
- `paquetes_vasos_abiertos`.
- `consumos_diarios_inventario`.
- `ventas`.
- `detalles_venta`.
- `cajas_diarias`.
- `usuarios`.

Cambios realizados:

- Se implementaron entidades JPA para existencias generales, existencias diarias, movimientos, paquetes de vasos abiertos y consumos diarios.
- Se agregaron repositorios para inventario operativo con bloqueo pesimista en filas de existencia modificables.
- Se agrego endpoint `GET /api/inventario/existencias/general`.
- Se agrego endpoint `GET /api/inventario/existencias/diarias/abierta`.
- Se agrego endpoint `GET /api/inventario/existencias/diarias/caja/{idCajaDiaria}`.
- Se agrego endpoint `POST /api/inventario/paquetes-vasos`.
- Se agrego endpoint `POST /api/inventario/consumos-diarios`.
- Se agrego endpoint `GET /api/inventario/movimientos`.
- Se agrego endpoint `POST /api/ventas/{idVenta}/anular`.
- Se integro `POST /api/ventas` con descuento automatico de vasos en stock diario.
- Se integro anulacion de venta con restauracion de vasos en stock diario.
- Se documento el modulo en `docs/modules/inventario-operativo.md`.
- Se actualizo `docs/modules/ventas-pagos.md` para reflejar la anulacion implementada en este modulo.

Reglas validadas:

- Sin usuario autenticado no se puede consultar inventario.
- Solo administrador o gerente puede registrar paquetes de vasos y consumos manuales.
- La apertura de paquetes descuenta stock general y aumenta stock diario.
- Los vasos rotos al abrir paquetes aumentan `cantidad_perdida`.
- Todo cambio de stock genera movimiento de inventario.
- Cada movimiento registra `referencia_origen` e `id_referencia_origen`.
- No se permite consumo manual sobre items `automatico_por_venta`.
- No se permiten movimientos que dejen stock general o diario negativo.
- Una venta descuenta vasos de `existencias_inventario_diario`.
- Una anulacion restaura vasos de `existencias_inventario_diario`.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso, `BUILD SUCCESS` reportado por el usuario.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene las tablas de inventario operativo.
- No se implemento `items_inventario.cantidad_minima_alerta` porque esa columna no existe en `kontora_pos_schema.txt`.
- Los ajustes de inventario con aprobacion quedan pendientes para una ampliacion posterior del flujo de inventario.
- El conteo fisico final y diferencias de inventario diario se completaran con el modulo "Cierre de caja y deposito".

## Fase 3: Modulo 6 - Gastos, adiciones y pago a trabajadores

Estado: completado y validado.

Rama de trabajo:

- `feature/gastos-adiciones-pago-trabajadores`.

Tablas canonicas usadas:

- `adiciones_diarias`.
- `pagos_trabajadores_diarios`.
- `gastos_caja`.
- `cajas_diarias`.
- `usuarios`.

Cambios realizados:

- Se implementaron entidades JPA para `adiciones_diarias`, `pagos_trabajadores_diarios` y `gastos_caja`.
- Se agregaron repositorios para operaciones diarias de caja.
- Se agrego servicio transaccional `OperacionesCajaService`.
- Se agrego endpoint `POST /api/operaciones-caja/adiciones-diarias`.
- Se agrego endpoint `GET /api/operaciones-caja/adiciones-diarias/abierta`.
- Se agrego endpoint `POST /api/operaciones-caja/gastos-caja`.
- Se agrego endpoint `GET /api/operaciones-caja/gastos-caja/abierta`.
- Se agrego endpoint `PUT /api/operaciones-caja/gastos-caja/{idGastoCaja}`.
- Se agrego endpoint `POST /api/operaciones-caja/gastos-caja/{idGastoCaja}/anular`.
- Se agrego endpoint `POST /api/operaciones-caja/pagos-trabajadores-diarios`.
- Se agrego endpoint `GET /api/operaciones-caja/pagos-trabajadores-diarios/abierta`.
- Se agrego endpoint `POST /api/operaciones-caja/pagos-trabajadores-diarios/{idPagoTrabajadoresDiario}/confirmar`.
- Se documento el modulo en `docs/modules/gastos-adiciones-pago-trabajadores.md`.

Reglas validadas:

- Sin usuario autenticado no se pueden consultar operaciones de caja.
- No se registran gastos sin caja abierta.
- El rol `vendedor` puede registrar gastos.
- El rol `vendedor` no puede editar ni anular gastos.
- `administrador` y `gerente` pueden editar y anular gastos.
- Un gasto editado conserva usuario, fecha y motivo de edicion.
- Un gasto anulado conserva usuario, fecha y motivo de anulacion.
- Las adiciones tienen un unico registro por caja y se pueden actualizar mientras la caja esta abierta.
- El pago diario a trabajadores puede registrarse y confirmarse para cierre.
- Si el pago a trabajadores es cero, requiere confirmacion explicita.
- El rol `vendedor` no puede registrar pago diario a trabajadores.

Validacion realizada:

- Comando: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 29.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene las tablas de operaciones diarias de caja.
- La consolidacion contable de gastos, adiciones y pago a trabajadores queda para el modulo "Cierre de caja y deposito".
- Evidencias de gastos quedan para el modulo "Evidencias y almacenamiento".
- La auditoria explicita de ediciones y anulaciones quedo implementada posteriormente en el modulo "Auditoria transversal".

## Fase 3: Modulo 7 - Cierre de caja y deposito

Estado: completado y validado.

Rama de trabajo:

- `feature/cierre-caja-deposito`.

Tablas canonicas usadas:

- `cajas_diarias`.
- `cierres_caja`.
- `ventas`.
- `pagos_venta`.
- `metodos_pago`.
- `gastos_caja`.
- `adiciones_diarias`.
- `pagos_trabajadores_diarios`.
- `movimientos_deposito`.
- `usuarios`.

Cambios realizados:

- Se completo la entidad JPA `CierreCaja` para persistir los totales del cierre.
- Se implemento entidad JPA `MovimientoDeposito` respetando la tabla `movimientos_deposito`.
- Se agrego repositorio para `movimientos_deposito`.
- Se agregaron consultas agregadas para ventas, pagos por metodo, transferencias por `estado_validacion` y gastos vigentes.
- Se agrego servicio transaccional `CierreCajaService`.
- Se agrego endpoint `POST /api/cajas-diarias/{idCajaDiaria}/cerrar`.
- Se agrego endpoint `GET /api/cajas-diarias/{idCajaDiaria}/cierre`.
- Se calcula `efectivo_esperado_sin_base`.
- Se registra `efectivo_contado_sin_base`.
- Se calcula `diferencia_caja`.
- Se calcula `valor_a_deposito` excluyendo `cajas_diarias.valor_base`.
- Se crea automaticamente `movimientos_deposito` con `tipo_movimiento_deposito = 'entrada_cierre'` cuando `valor_a_deposito > 0`.
- Se ajustaron fixtures de pruebas existentes para borrar `movimientos_deposito` antes de `cierres_caja`.
- Se documento el modulo en `docs/modules/cierre-caja-deposito.md`.

Reglas validadas:

- Solo `administrador` o `gerente` puede cerrar caja.
- No se puede cerrar una caja inexistente o que no este abierta.
- No se puede cerrar una caja sin registro de adiciones diarias.
- No se puede cerrar una caja sin pago diario a trabajadores confirmado.
- El cierre consolida ventas registradas.
- El cierre separa pagos en efectivo y transferencias.
- El cierre muestra transferencias pendientes, validadas y rechazadas.
- El cierre consolida gastos no anulados.
- La base de caja no se suma al deposito.
- El movimiento de deposito coincide con `valor_a_deposito`.
- Despues del cierre no se permiten nuevas ventas.
- Despues del cierre no se permiten anulaciones.

Validacion realizada:

- Comando inicial: `mvn clean test`.
- Error encontrado: fixtures de pruebas antiguas intentaban borrar `cierres_caja` antes de borrar `movimientos_deposito`, violando la FK `movimientos_deposito_id_cierre_caja_fkey`.
- Correccion aplicada: las limpiezas de pruebas borran primero `movimientos_deposito` para cajas de prueba.
- Comando final: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 34.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene `cierres_caja` y `movimientos_deposito`.
- El trigger canonico de base de datos actualiza `cajas_diarias` a estado `cerrada` despues de insertar un cierre.
- Si `valor_a_deposito` es cero, no se crea movimiento de deposito porque `movimientos_deposito.valor_movimiento` exige valor mayor que cero.
- Evidencias de transferencias, gastos, consignaciones y pagos de servicios quedan para el modulo "Evidencias y almacenamiento".
- La auditoria explicita del cierre y movimientos de deposito quedo implementada posteriormente en el modulo "Auditoria transversal".

## Fase 3: Modulo 8 - Evidencias y almacenamiento

Estado: completado y validado.

Rama de trabajo:

- `feature/evidencias-storage`.

Tablas canonicas usadas:

- `archivos_evidencia`.
- `pagos_venta`.
- `gastos_caja`.
- `consignaciones_bancarias`.
- `pagos_servicios`.
- `movimientos_deposito`.
- `usuarios`.

Cambios realizados:

- Se implemento entidad JPA `ArchivoEvidencia` respetando la tabla `archivos_evidencia`.
- Se implementaron entidades JPA `ConsignacionBancaria` y `PagoServicio` para soportar las relaciones reales del schema.
- Se agregaron repositorios para evidencias, consignaciones bancarias y pagos de servicios.
- Se agrego cliente configurable para Supabase Storage.
- Se agregaron variables de configuracion `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET`.
- Se agrego servicio transaccional `EvidenciasService`.
- Se agrego endpoint `POST /api/evidencias/pagos-venta/{idPagoVenta}`.
- Se agrego endpoint `GET /api/evidencias/pagos-venta/{idPagoVenta}`.
- Se agrego endpoint `POST /api/evidencias/gastos-caja/{idGastoCaja}`.
- Se agrego endpoint `GET /api/evidencias/gastos-caja/{idGastoCaja}`.
- Se agrego endpoint `POST /api/evidencias/consignaciones-bancarias/{idConsignacionBancaria}`.
- Se agrego endpoint `GET /api/evidencias/consignaciones-bancarias/{idConsignacionBancaria}`.
- Se agrego endpoint `POST /api/evidencias/pagos-servicios/{idPagoServicio}`.
- Se agrego endpoint `GET /api/evidencias/pagos-servicios/{idPagoServicio}`.
- Se agrego endpoint `GET /api/evidencias/{idArchivoEvidencia}`.
- Se implemento carga multipart con parte `archivo`.
- Se implemento compresion backend para imagenes `jpg`, `jpeg` y `png`, guardandolas como `jpg`.
- Se guardan rutas y metadatos en `archivos_evidencia`, sin binarios en PostgreSQL.
- Se documento el modulo en `docs/modules/evidencias-storage.md`.

Reglas validadas:

- Sin usuario autenticado no se pueden consultar evidencias.
- El archivo se almacena fuera de PostgreSQL.
- PostgreSQL guarda solo ruta y metadatos.
- Una evidencia queda asociada a un solo proceso.
- Solo se cargan evidencias de `pagos_venta` si el metodo de pago real es `transferencia`.
- No se permite cargar evidencia a un pago en efectivo.
- Un vendedor solo puede consultar evidencias de pagos o gastos propios.
- `administrador` y `gerente` pueden gestionar evidencias de deposito.
- Las imagenes se comprimen desde backend.
- Los PDF se conservan sin compresion.

Validacion realizada:

- Comando de modulo: `mvn -Dtest=EvidenciasIntegrationTest test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 5.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.
- Comando completo: `mvn clean test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 39.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene `archivos_evidencia`, `consignaciones_bancarias` y `pagos_servicios`.
- La base de datos conserva la restriccion `chk_archivos_relacion_unica`, que exige una unica relacion por evidencia.
- Las pruebas mockean el cliente de storage para no depender de red ni credenciales reales de Supabase.
- La validacion y rechazo formal de transferencias quedo implementada posteriormente en el modulo "Auditoria transversal".
- La implementacion operativa completa de consignaciones bancarias y pagos de servicios queda para modulos posteriores.

## Fase 3: Modulo 9 - Auditoria transversal

Estado: completado y validado.

Rama de trabajo:

- `feature/auditoria-operaciones`.

Tablas canonicas usadas:

- `auditoria_operaciones`.
- `usuarios`.
- `sesiones_usuario`.
- `cajas_diarias`.
- `cierres_caja`.
- `ventas`.
- `pagos_venta`.
- `gastos_caja`.
- `movimientos_deposito`.

Cambios realizados:

- Se implemento entidad JPA `AuditoriaOperacion` respetando la tabla `auditoria_operaciones`.
- Se agrego repositorio para auditoria.
- Se agrego servicio transversal `AuditoriaService`.
- Se implemento persistencia de `valor_anterior` y `valor_nuevo` como JSONB.
- Se captura `direccion_ip` desde el request HTTP, priorizando `X-Forwarded-For`.
- Se agrego helper `AuditoriaValores` para construir snapshots de auditoria.
- Se audita login sobre `sesiones_usuario` con accion `login`.
- Se audita logout sobre `sesiones_usuario` con accion `logout`.
- Se audita apertura de caja sobre `cajas_diarias` con accion `abrir`.
- Se audita cierre de caja sobre `cierres_caja` con accion `cerrar`.
- Se audita el movimiento automatico de deposito sobre `movimientos_deposito` con accion `crear`.
- Se auditan ediciones de gastos sobre `gastos_caja` con accion `editar`.
- Se auditan anulaciones de gastos sobre `gastos_caja` con accion `anular`.
- Se auditan anulaciones de ventas sobre `ventas` con accion `anular`.
- Se agrego endpoint `POST /api/pagos-venta/{idPagoVenta}/validar`.
- Se agrego endpoint `POST /api/pagos-venta/{idPagoVenta}/rechazar`.
- Se implemento validacion y rechazo de transferencias pendientes usando `pagos_venta.estado_validacion`.
- Se registran `id_usuario_validacion`, `fecha_validacion` y `observacion_validacion` al validar o rechazar transferencias.
- Se ajustaron limpiezas de pruebas para borrar `auditoria_operaciones` antes de borrar usuarios de fixture.
- Se documento el modulo en `docs/modules/auditoria-operaciones.md`.
- Se actualizaron documentos de modulos relacionados para reflejar pendientes resueltos.

Reglas validadas:

- Login genera registro en `auditoria_operaciones`.
- Logout genera registro en `auditoria_operaciones`.
- La auditoria registra usuario responsable.
- La auditoria registra tabla afectada.
- La auditoria registra accion realizada.
- La auditoria registra valores anteriores y nuevos cuando aplica.
- Apertura de caja genera auditoria.
- Cierre de caja genera auditoria.
- Movimiento automatico de deposito genera auditoria.
- Edicion y anulacion de gastos generan auditoria.
- Anulacion de ventas genera auditoria.
- Solo `administrador` y `gerente` pueden validar o rechazar transferencias.
- Solo pagos por transferencia pueden validarse o rechazarse.
- Solo transferencias pendientes pueden pasar a `validada` o `rechazada`.
- Validacion y rechazo de transferencias generan auditoria.

Validacion realizada:

- Comando de modulo: `mvn -Dtest=AuditoriaIntegrationTest test`.
- Resultado: exitoso, `BUILD SUCCESS` reportado por el usuario.
- Pruebas ejecutadas: 4.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.
- Comando completo: `mvn clean test`.
- Resultado: exitoso, `BUILD SUCCESS` reportado por el usuario.
- Pruebas ejecutadas: 43.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.
- Tiempo total reportado: 01:03 min.
- Fecha/hora de finalizacion reportada: 2026-07-06T22:25:04-05:00.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene `auditoria_operaciones` y los campos de validacion de `pagos_venta`.
- La auditoria se implemento desde backend, no con triggers de base de datos.
- Solicitud, aprobacion y rechazo de ajustes de inventario quedan pendientes porque el flujo operativo de `ajustes_inventario` aun no esta implementado.
- Cambios de precios, promociones y configuraciones quedan pendientes hasta implementar sus flujos administrativos.
- La consulta filtrada de auditoria queda para el modulo "Consultas operativas".

## Fase 3: Modulo 10 - Consultas operativas

Estado: completado y validado.

Rama de trabajo:

- `feature/consultas-operativas`.

Tablas canonicas usadas:

- `ventas`.
- `pagos_venta`.
- `metodos_pago`.
- `cajas_diarias`.
- `cierres_caja`.
- `gastos_caja`.
- `items_inventario`.
- `categorias_inventario`.
- `unidades_medida`.
- `tamanos_vaso`.
- `existencias_inventario_general`.
- `existencias_inventario_diario`.
- `movimientos_inventario`.
- `movimientos_deposito`.
- `archivos_evidencia`.
- `auditoria_operaciones`.
- `usuarios`.

Cambios realizados:

- Se implemento el modulo backend `consultas` para consultas de solo lectura.
- Se agrego controlador `GET /api/consultas/...`.
- Se agrego servicio transaccional de lectura con validacion de permisos por rol.
- Se agrego repositorio de consultas nativas tipadas con `NamedParameterJdbcTemplate`.
- Se agrego endpoint `GET /api/consultas/ventas`.
- Se agrego endpoint `GET /api/consultas/cierre`.
- Se agrego endpoint `GET /api/consultas/gastos`.
- Se agrego endpoint `GET /api/consultas/inventario/actual`.
- Se agrego endpoint `GET /api/consultas/inventario/movimientos`.
- Se agrego endpoint `GET /api/consultas/deposito/movimientos`.
- Se agrego endpoint `GET /api/consultas/transferencias`.
- Se agrego endpoint `GET /api/consultas/auditoria`.
- Se reforzo la limpieza de `AuditoriaIntegrationTest` para eliminar gastos residuales asociados a usuarios de prueba antes de borrar dichos usuarios.
- Se documento el modulo en `docs/modules/consultas-operativas.md`.

Reglas validadas:

- Las consultas no modifican informacion.
- Un `vendedor` solo consulta ventas, gastos y transferencias propias.
- Un `vendedor` puede consultar informacion operativa de inventario.
- Un `vendedor` no puede consultar cierre, deposito ni auditoria.
- Un `administrador` consulta cierre, deposito y auditoria operativa.
- Un `administrador` no recibe auditoria de seguridad sobre `sesiones_usuario`.
- Un `gerente` tiene visibilidad completa de auditoria.
- Las transferencias pendientes o rechazadas se consultan usando `pagos_venta.estado_validacion`.
- El inventario actual consulta `existencias_inventario_general` y `existencias_inventario_diario`.

Validacion realizada:

- Comando de modulo: `mvn -Dtest=ConsultasOperativasIntegrationTest test`.
- Resultado: exitoso.
- Pruebas ejecutadas: 5.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.
- Comando completo: `mvn clean test`.
- Resultado: exitoso, `BUILD SUCCESS`.
- Pruebas ejecutadas: 48.
- Fallos: 0.
- Errores: 0.
- Omitidas: 0.
- Tiempo total reportado: 01:33 min.
- Fecha/hora de finalizacion reportada: 2026-07-06T22:48:34-05:00.

Observaciones:

- No se agregaron migraciones nuevas porque el schema canonico ya contiene todas las tablas consultadas.
- Las consultas usan endpoints `GET` y transacciones `readOnly`.
- El modulo no crea, edita ni anula informacion.
- Reportes exportables o agregados para tableros administrativos quedan pendientes para definicion de la siguiente fase.

## Fase 4: PR 1 - Inicializacion frontend

Estado: completada y validada.

Rama de trabajo:

- `chore/inicializacion-frontend`.

Objetivo:

- Inicializar frontend React + TypeScript + Vite en `frontend/`.
- Crear estructura modular base para Fase 4.
- Configurar `VITE_API_URL=http://localhost:8080/api`.
- Crear cliente HTTP base.
- Conectar contra `GET /api/health`.
- Crear documentacion inicial del frontend.

Documentacion incorporada:

- Se copio `C:\Users\corre\Downloads\fase_4_frontend_validacion.md` dentro del repo como `docs/development/fases/fase_4_frontend_validacion.md`.
- Se crearon:
  - `docs/frontend/estructura-frontend.md`.
  - `docs/frontend/flujo-autenticacion-frontend.md`.
  - `docs/frontend/guia-componentes.md`.
  - `docs/frontend/pantallas.md`.
  - `docs/frontend/integracion-backend-local.md`.

Cambios realizados:

- Se inicializo `frontend/package.json` con React, TypeScript, Vite y `lucide-react`.
- Se agrego `frontend/.env.example` con `VITE_API_URL=http://localhost:8080/api`.
- Se creo `frontend/src/app` para providers y rutas.
- Se creo `frontend/src/modules` con modulos base de autenticacion, caja, catalogos, ventas, inventario, gastos, deposito, evidencias y auditoria.
- Se creo `frontend/src/shared` con componentes, hooks, servicios, tipos y utilidades.
- Se implemento cliente HTTP base en `frontend/src/shared/services/apiClient.ts`.
- Se implemento servicio y hook de salud backend usando `GET /api/health`.
- Se creo una pantalla inicial operativa inspirada visualmente en la maqueta, sin copiarla como HTML/CSS estatico final.
- Se configuro CORS backend para permitir el frontend local de Vite en `http://localhost:5173` y `http://127.0.0.1:5173`.
- Se mantuvo la autenticacion backend: solo `OPTIONS /api/**`, `GET /api/health` y `POST /api/auth/login` quedan sin token; el resto sigue protegido por `anyRequest().authenticated()`.

Validacion realizada:

- Comando: `npm install`.
- Resultado: exitoso.
- Auditoria npm: 0 vulnerabilidades.
- Comando: `npm run build`.
- Resultado: exitoso.
- Vite generado en `frontend/dist`.
- Validacion HTTP local:

```json
{"status":"ok","service":"kontora-pos-backend"}
```
- Validacion CORS local desde navegador:

```javascript
{ status: "ok", service: "kontora-pos-backend" }
```

- Validacion enfocada de backend:

```text
mvn "-Dtest=HealthEndpointIntegrationTest,AutenticacionIntegrationTest" test
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- Validacion completa de backend tras CORS:

```text
mvn clean test
Tests run: 49, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Observaciones:

- El primer intento de `npm install` dentro del sandbox excedio el tiempo sin generar `package-lock.json`; se repitio con permisos aprobados para descargar dependencias.
- El primer intento de `npm run build` dentro del sandbox fallo por permisos de lectura de esbuild hacia directorios superiores; se repitio con permisos aprobados y compilo correctamente.
- La primera prueba en navegador detecto bloqueo CORS: el backend respondia `200 OK`, pero sin `Access-Control-Allow-Origin` para `http://127.0.0.1:5173`.
- `mvn spring-boot:run` no pudo iniciar en `8080` porque el contenedor Docker `kontora_pos_backend_local` ya estaba ocupando ese puerto.
- El contenedor Docker activo estaba construido con una imagen anterior al ajuste CORS; se reconstruyo con `docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --build backend`.
- No se implementaron pantallas funcionales por modulo en esta PR.
- La siguiente PR sugerida por Fase 4 es `feature/frontend-auth`.

## Reglas activas para las siguientes fases

- La base de datos sigue siendo la fuente principal de verdad.
- No se deben renombrar tablas ni columnas para acomodarlas al codigo.
- El entorno base ya fue validado con PostgreSQL local.
- Antes de pasar de fase o modulo se debe compilar y verificar en la maquina local.
- En Fase 2 se debe crear el backend Spring Boot sin implementar todavia modulos de negocio.
- La rama `main` representa el estado validado del proyecto.
- Cada modulo de Fase 3 debe desarrollarse en su propia rama `feature/[nombre-modulo]`.
- Al terminar un modulo, se debe ejecutar `mvn clean test`.
- Solo si compila y las pruebas pasan, se hace merge del modulo hacia `main`.
- No se inicia el siguiente modulo desde una rama anterior; siempre se parte de `main` actualizado.
- El frontend debe consumir la API real del backend.
- Las reglas criticas de negocio y permisos viven en backend.
- La maqueta visual es referencia de experiencia, no contrato de endpoints, campos ni reglas.

## Flujo Git por modulo

1. Confirmar que `main` contiene el ultimo estado validado.
2. Crear la rama del modulo desde `main`.
3. Implementar codigo y documentacion del modulo.
4. Ejecutar pruebas.
5. Corregir errores si los hay.
6. Hacer commit del modulo.
7. Volver a `main`.
8. Hacer merge de la rama del modulo.
9. Actualizar este documento con la validacion.

## Proxima validacion esperada

Despues del merge manual de `chore/inicializacion-frontend` hacia `main`, iniciar la siguiente PR de frontend desde `main` actualizado:

```powershell
git switch main
git merge --no-ff chore/inicializacion-frontend
git switch -c feature/frontend-auth
```

La siguiente implementacion sera Fase 4, PR 2: Autenticacion frontend.

## Comandos manuales para validar Docker/PostgreSQL

Si Codex no puede acceder al motor Docker, ejecutar desde PowerShell:

```powershell
cd C:\Users\corre\Desktop\Kontora
docker compose --env-file infra\.env -f infra\compose.local.yml up -d postgres
docker ps --filter "name=kontora_pos_postgres_local"
docker logs kontora_pos_postgres_local --tail 80
docker exec kontora_pos_postgres_local psql -U kontora_pos -d kontora_pos -c "SELECT COUNT(*) AS tablas_publicas FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
docker exec kontora_pos_postgres_local psql -U kontora_pos -d kontora_pos -c "SELECT to_regclass('public.ventas') AS ventas, to_regclass('public.pagos_venta') AS pagos_venta, to_regclass('public.existencias_inventario_general') AS existencias_general, to_regclass('public.existencias_inventario_diario') AS existencias_diario;"
```

Validacion esperada:

- El contenedor `kontora_pos_postgres_local` aparece en estado saludable o en ejecucion.
- Los logs terminan sin errores de SQL.
- La consulta de tablas devuelve un numero mayor que cero.
- Las tablas canonicas consultadas aparecen con nombre completo.

## Comandos manuales para validar backend en Docker

Ejecutar desde PowerShell:

```powershell
cd C:\Users\corre\Desktop\Kontora
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --build backend
docker ps --filter "name=kontora_pos_backend_local"
docker logs kontora_pos_backend_local --tail 120
Invoke-RestMethod -Uri "http://localhost:8080/api/health" | ConvertTo-Json -Compress
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend stop backend
```

Respuesta esperada del endpoint:

```json
{"status":"ok","service":"kontora-pos-backend"}
```

Si Docker no puede descargar imagenes desde Docker Hub, validar primero:

```powershell
docker pull eclipse-temurin:21-jre
docker pull maven:3.9-eclipse-temurin-21
```

Si esos comandos fallan con `lookup registry-1.docker.io: no such host`, se debe corregir DNS/proxy de Docker Desktop antes de repetir la validacion del backend.
