# Infraestructura local

`compose.local.yml` levanta PostgreSQL local y el backend para desarrollo. Copiar `infra/.env.example` a `infra/.env` antes de ejecutar el stack.

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --build
```

La configuracion de Supabase, bootstrap del gerente y despliegue en servidor se describe en el [README principal](../README.md).

Para produccion usar `compose.prod.yml` junto con `infra/.env.production.example`. Esta configuracion enlaza el backend solo a `127.0.0.1`; la API se publica posteriormente mediante Cloudflare Tunnel, no abriendo el puerto `8080` a Internet. La plantilla no crea el tunel, registros DNS ni la configuracion de Vercel; esos pasos se realizan despues de comprobar el health local del backend. La plantilla define `TZ` y `JAVA_TOOL_OPTIONS` para que la fecha operativa del backend sea `America/Bogota`; conservar ambos valores.
