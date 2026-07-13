# Infraestructura local

`compose.local.yml` levanta PostgreSQL local y el backend para desarrollo. Copiar `infra/.env.example` a `infra/.env` antes de ejecutar el stack.

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --build
```

La configuracion de Supabase, bootstrap del gerente y despliegue en servidor se describe en el [README principal](../README.md).
