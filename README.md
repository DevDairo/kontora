# Kontora POS

Aplicacion web para apoyar la gestion de ventas, caja, inventario, deposito, evidencias, usuarios y auditoria del negocio.

## Stack principal

- Frontend: React + TypeScript + Vite.
- Backend: Java + Spring Boot.
- Base de datos: Supabase PostgreSQL y PostgreSQL local para desarrollo.
- Contenedores: Docker y Docker Compose.
- Despliegue frontend: Vercel.
- Backend: VM Ubuntu Server.
- Evidencias: Supabase Storage.

## Estado del proyecto

Fase 2 en curso: backend Spring Boot base creado y validado con Maven.

Ya existe endpoint `GET /api/health`, configuracion JPA/Flyway, seguridad base y Dockerfile del backend. La validacion Docker del backend queda pendiente de ejecucion manual por restriccion de acceso de Codex al motor Docker local.

## Fuente principal de verdad

La base de datos ya esta disenada. El backend, las migraciones, entidades, DTOs, servicios, endpoints, pruebas y posteriormente el frontend deben adaptarse al diseno de base de datos, no al contrario.

Archivos clave versionados en este repositorio:

- `docs/database/Diseno_Base_Datos_Kontora_POS.md`
- `docs/database/kontora_pos_schema.txt`
- `database/schema/kontora_pos_schema_v1_1.sql`
- `database/migrations/V1__schema_inicial_kontora_pos.sql`
- `docs/development/fases/fase_1_creacion_proyecto_entorno_docker.md`
- `docs/development/fases/fase_2_infraestructura_base_estructura_proyecto.md`
- `docs/development/fases/fase_3_desarrollo_logica_backend_modulos.md`

## Reglas de nombres que no se deben romper

- Usar `existencias_inventario_general`, no `stocks_generales`.
- Usar `existencias_inventario_diario`, no `stocks_diarios_vasos`.
- Usar `valor_pago`, no `monto_pago`.
- Usar `estado_validacion`, no `estado_pago`.
- Usar `id_usuario_vendedor` cuando la tabla `ventas` lo define asi.
- No crear tablas alternativas si ya existe una tabla canonica.
- No modificar el schema para acomodarlo al codigo.

## Preparacion local

1. Copiar `.env.example` a `.env` y completar solo valores locales.
2. Para Docker Compose, copiar `infra/.env.example` a `infra/.env`.
3. Validar la configuracion local con:

```bash
docker compose -f infra/compose.local.yml config
```

4. Levantar PostgreSQL local cuando se quiera probar el script canonico:

```bash
docker compose -f infra/compose.local.yml up -d postgres
```

5. Compilar backend:

```bash
cd backend
mvn clean test
```

6. Validar backend local:

```bash
cd backend
mvn spring-boot:run
```

En otra terminal:

```bash
curl http://localhost:8080/api/health
```
