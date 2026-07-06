# Guia de despliegue POC

## Objetivo

Documentar la arquitectura prevista para ejecutar Kontora POS con frontend desacoplado, backend dockerizado y persistencia administrada.

## Flujo objetivo

```text
Usuario autorizado
  -> Frontend en Vercel
  -> Subdominio API
  -> Tunel seguro
  -> VM Ubuntu Server
  -> Backend Spring Boot en Docker
  -> Supabase PostgreSQL y Supabase Storage
```

## Variables sensibles

Las credenciales reales nunca deben versionarse. Solo se versionan `.env.example`.

Variables principales:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSLMODE`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

## Estado actual

En Fase 1 solo queda preparado el entorno. La validacion completa del backend en Docker se realizara en Fase 2 cuando exista el proyecto Spring Boot.

