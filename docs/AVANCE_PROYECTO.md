# Avance del proyecto Kontora POS

Este documento registra el avance real del proyecto para mantener control de contexto entre fases. Debe actualizarse al cerrar cada fase o modulo importante.

## Estado actual

- Fecha de registro: 2026-07-06.
- Rama actual: `chore/inicializacion-entorno-docker`.
- Fase actual: Fase 2 iniciada.
- Fase anterior validada: Fase 1 completada y validada operativamente con PostgreSQL local.
- Siguiente hito: backend Spring Boot compilando con endpoint `GET /api/health`.

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

Cuando Docker tenga permiso local:

```bash
docker compose -f infra/compose.local.yml up -d postgres
docker ps
docker logs kontora_pos_postgres_local
```

Despues de validar PostgreSQL local, se puede iniciar Fase 2.

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
