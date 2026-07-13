# Kontora POS

Aplicacion web para la operacion de un punto de venta de granizados. Integra ventas, pagos, caja diaria, inventario, gastos, deposito, evidencias, usuarios, consultas y auditoria con reglas de negocio centralizadas en el backend.

## Estado

El desarrollo backend de Fase 3 y el desarrollo frontend de Fase 4 estan terminados y validados. El proyecto esta preparado para desplegarse; antes de publicar se deben definir las variables reales de base de datos, Storage, JWT, CORS y dominio.

La guia funcional vigente esta en [docs/00-indice.md](docs/00-indice.md). El proceso de desarrollo, requisitos fuente y validaciones anteriores se conservaron en [docs/historico-desarrollo](docs/historico-desarrollo/).

## Tecnologias

- Frontend: React 19, TypeScript, Vite 7 y Lucide.
- Backend: Java 21, Spring Boot 3, Spring Security, JPA, Flyway y Maven.
- Datos: PostgreSQL 16 local y Supabase PostgreSQL para produccion.
- Evidencias: Supabase Storage mediante backend.
- Contenedores: Docker y Docker Compose.

## Modulos

| Modulo | Roles autorizados |
| --- | --- |
| Login y sesion | Vendedor, administrador, gerente |
| Caja diaria | Todos; apertura y control administrativo para administrador y gerente |
| Catalogos | Administrador, gerente |
| Ventas y pagos | Vendedor, administrador, gerente |
| Inventario | Administrador, gerente |
| Gastos y pago a trabajadores | Todos; edicion, anulacion y pago diario para administrador y gerente |
| Cierre y deposito | Administrador, gerente |
| Evidencias | Administrador, gerente; evidencia inicial de transferencia desde Ventas |
| Transferencias | Todos; validacion y ajuste de evidencia para gerente |
| Consultas | Segun alcance del rol |
| Usuarios y auditoria | Gerente |

## Requisitos locales en Windows

- Windows 10 u 11.
- Git.
- Docker Desktop iniciado.
- Node.js `^20.19.0` o `>=22.12.0` para el frontend.
- Java 21 y Maven solo si se ejecutaran pruebas o backend fuera de Docker.

## Ejecucion local con Docker

Desde la raiz del repositorio, en PowerShell:

```powershell
Copy-Item infra\.env.example infra\.env
Copy-Item frontend\.env.example frontend\.env
```

En `infra/.env` conservar los valores locales por defecto, definir un `JWT_SECRET` propio y dejar el bootstrap desactivado si ya existen usuarios. En `frontend/.env` usar:

```env
VITE_API_URL=http://127.0.0.1:8080/api
```

Levantar base y backend:

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --build
Invoke-WebRequest http://127.0.0.1:8080/api/health
```

Instalar y ejecutar frontend:

```powershell
Set-Location frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Abrir `http://127.0.0.1:5173`.

Detener servicios locales:

```powershell
Set-Location ..
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend down
```

Para reiniciar desde una base local vacia se debe bajar el stack con volumenes. Este comando elimina solo los datos locales de Docker:

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend down -v
```

## Validacion local

Backend:

```powershell
Set-Location backend
mvn clean test
```

Frontend:

```powershell
Set-Location frontend
npm run build
```

## Configuracion de Supabase

### PostgreSQL

1. Crear el proyecto de Supabase y obtener los datos de **Session pooler**.
2. En el archivo de entorno del backend configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_SSLMODE=require`.
3. Usar una base vacia para la primera migracion. Flyway aplica la migracion versionada al iniciar el backend.
4. Para una base existente, realizar respaldo y revisar la estrategia de migracion antes de ejecutar el backend.

### Storage

1. Crear o conservar el bucket publico `kontoraimagenes`.
2. Definir solamente en el entorno del backend:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<clave-secreta-del-proyecto>
SUPABASE_STORAGE_BUCKET=kontoraimagenes
```

3. No definir claves de Supabase en `frontend/.env` ni en variables de Vercel expuestas al navegador.
4. El backend recibe archivos, comprime imagenes cuando aplica y construye las referencias de Storage.

## Primer gerente en una instalacion nueva

Antes del primer arranque sobre una base sin usuarios, configurar en `infra/.env` o en el archivo de entorno del servidor:

```env
BOOTSTRAP_MANAGER_ENABLED=true
BOOTSTRAP_MANAGER_USERNAME=gerenteLocal
BOOTSTRAP_MANAGER_FULL_NAME=Gerente Local
BOOTSTRAP_MANAGER_PASSWORD=<contrasena-segura-de-8-a-72-caracteres>
```

El backend crea el gerente solo cuando `usuarios` esta vacia. Esta regla se valido con una base y backend Docker aislados: se creo `gerenteLocal` activo con credencial activa y su login fue exitoso. Despues del primer inicio, cambiar `BOOTSTRAP_MANAGER_ENABLED=false`.

## Despliegue del backend en servidor

Requisitos: Ubuntu Server con Docker Engine y acceso saliente a Supabase. Copiar el repositorio al servidor y crear `infra/.env` a partir de `infra/.env.example` con valores de produccion:

```env
APP_PORT=8080
DB_HOST=<host-del-session-pooler>
DB_PORT=<puerto-del-session-pooler>
DB_NAME=postgres
DB_USER=<usuario-del-pooler>
DB_PASSWORD=<contrasena-del-pooler>
DB_SSLMODE=require
JWT_SECRET=<secreto-largo-y-aleatorio>
CORS_ALLOWED_ORIGINS=https://<dominio-frontend>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<clave-secreta-del-proyecto>
SUPABASE_STORAGE_BUCKET=kontoraimagenes
BOOTSTRAP_MANAGER_ENABLED=true
BOOTSTRAP_MANAGER_USERNAME=gerenteLocal
BOOTSTRAP_MANAGER_FULL_NAME=Gerente Local
BOOTSTRAP_MANAGER_PASSWORD=<contrasena-segura>
```

Construir y ejecutar el backend sin levantar PostgreSQL local:

```bash
docker build -t kontora-pos-backend:latest ./backend
docker run -d --name kontora-pos-backend --restart unless-stopped --env-file infra/.env -p 8080:8080 kontora-pos-backend:latest
curl http://127.0.0.1:8080/api/health
```

Despues de iniciar sesion con el gerente inicial, desactivar el bootstrap en `infra/.env` y recrear el contenedor:

```bash
docker rm -f kontora-pos-backend
docker run -d --name kontora-pos-backend --restart unless-stopped --env-file infra/.env -p 8080:8080 kontora-pos-backend:latest
```

Exponer el backend mediante un proxy HTTPS y permitir en CORS solo el dominio real del frontend.

## Publicacion del frontend

Antes de generar el build de produccion, configurar la URL HTTPS publica del backend:

```env
VITE_API_URL=https://<dominio-backend>/api
```

Luego ejecutar:

```bash
cd frontend
npm ci
npm run build
```

Publicar `frontend/dist` en Vercel, Nginx u otro hosting estatico con soporte de rutas SPA. En Vercel la variable debe llamarse `VITE_API_URL` y se debe volver a construir tras cambiarla.

## Seguridad y mantenimiento

- No versionar `.env`, claves de Supabase, contrasenas ni `JWT_SECRET`.
- El frontend no puede acceder directamente a Supabase Storage con una clave secreta.
- Hacer respaldo antes de cambiar una base de produccion existente.
- Consultar los permisos y reglas de cada modulo en [docs/00-indice.md](docs/00-indice.md).
