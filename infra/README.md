# Infraestructura local

La Fase 1 deja preparado Docker Compose sin crear todavia backend funcional.

## Servicios

- `postgres`: PostgreSQL local para desarrollo y validacion del SQL canonico.
- `backend`: perfil preparado para Fase 2, cuando exista `backend/Dockerfile`.

## Uso

```bash
cp infra/.env.example infra/.env
docker compose -f infra/compose.local.yml config
docker compose -f infra/compose.local.yml up -d postgres
```

El script montado al iniciar PostgreSQL local es `database/schema/kontora_pos_schema_v1_1.sql`.

