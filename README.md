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

## Ejecucion local: backend con Docker y frontend Vite

Este procedimiento sirve cuando el navegador, Vite y Docker se ejecutan en la **misma computadora**. El backend y PostgreSQL se ejecutan en contenedores; el frontend se ejecuta con Vite directamente desde Node.js.

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

`frontend/.env` se lee al iniciar Vite. Si se modifica `VITE_API_URL`, detener Vite con `Ctrl+C` y ejecutar de nuevo el comando anterior. No copiar archivos `.env` desde otra computadora ni versionarlos: cada instalacion debe generar sus propios archivos desde los ejemplos.

## CORS local y produccion

### Entorno local

No requiere configuracion adicional si el frontend Vite se ejecuta en cualquiera de estas direcciones:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Ambas ya estan definidas por defecto en `application.yml` y en `infra/.env.example`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Solo cambia esta variable si Vite usa otro puerto u origen. Por ejemplo, para el puerto `4173`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173
```

Despues de editar `infra/.env`, recrear el contenedor backend para que lea las variables nuevas:

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend up -d --force-recreate backend
```

### Acceso desde otro equipo de la red local

Esto es distinto de clonar y ejecutar el proyecto en una segunda computadora. Si el navegador se abre desde otro equipo, `localhost` y `127.0.0.1` apuntan a ese equipo cliente, no al que ejecuta Docker. En ese caso:

1. Obtener la IPv4 de la computadora que ejecuta Docker, por ejemplo `192.168.1.50`.
2. En `frontend/.env`, configurar `VITE_API_URL=http://192.168.1.50:8080/api`.
3. En `infra/.env`, agregar el origen exacto del navegador:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.50:5173
```

4. Recrear el backend y reiniciar Vite. Para que Vite acepte conexiones de la red, iniciarlo asi:

```powershell
npm run dev -- --host 0.0.0.0
```

5. Abrir `http://192.168.1.50:5173` desde el equipo cliente y permitir los puertos `5173` y `8080` en el firewall de Windows solo para la red privada.

No utilizar esta configuracion como despliegue publico; para ello se debe seguir la configuracion HTTPS de produccion descrita mas abajo.

### Entorno de produccion

En produccion `CORS_ALLOWED_ORIGINS` debe contener el origen publico exacto del frontend, sin la ruta `/api` ni barra final:

```env
CORS_ALLOWED_ORIGINS=https://app.ejemplo.com
```

El valor debe corresponder con la URL configurada en el frontend:

```env
VITE_API_URL=https://api.ejemplo.com/api
```

Para varios origenes autorizados, separarlos por comas. No usar `*` ni exponer origenes de desarrollo en produccion:

```env
CORS_ALLOWED_ORIGINS=https://app.ejemplo.com,https://admin.ejemplo.com
```

### Paso a paso con un dominio propio

Ejemplo: frontend publicado en `https://pos.midominio.com` y backend publicado en `https://api.midominio.com`.

1. Confirmar el dominio HTTPS final del frontend. Solo se usa el origen: protocolo y dominio. No agregar `/api`, rutas ni barra final.

```text
Correcto: https://pos.midominio.com
Incorrecto: https://pos.midominio.com/
Incorrecto: https://pos.midominio.com/api
```

2. En el servidor backend, abrir `infra/.env` y asignar el origen del frontend:

```env
CORS_ALLOWED_ORIGINS=https://pos.midominio.com
```

3. Configurar la URL publica del backend en `frontend/.env` antes de construir el frontend:

```env
VITE_API_URL=https://api.midominio.com/api
```

4. Recrear el servicio backend para que cargue el nuevo valor de CORS:

```bash
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d --force-recreate backend
```

5. Generar y publicar un nuevo build del frontend:

```bash
cd frontend
npm ci
npm run build
```

En Vercel, definir `VITE_API_URL=https://api.midominio.com/api` en las variables de produccion y redeplegar. En cualquier hosting estatico, publicar de nuevo `frontend/dist`.

6. Verificar desde una terminal que el backend responde al origen correcto:

```bash
curl -i -X OPTIONS https://api.midominio.com/api/health \
  -H "Origin: https://pos.midominio.com" \
  -H "Access-Control-Request-Method: GET"
```

La respuesta debe incluir `Access-Control-Allow-Origin: https://pos.midominio.com`. Si se usa otro subdominio para una vista administrativa, agregarlo separado por coma en `CORS_ALLOWED_ORIGINS` y volver a recrear el backend.

Detener servicios locales:

```powershell
Set-Location ..
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend down
```

Para reiniciar desde una base local vacia se debe bajar el stack con volumenes. Este comando elimina solo los datos locales de Docker:

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend down -v
```

## Diagnostico de "Failed to fetch"

Ese mensaje lo produce el navegador cuando no puede completar una solicitud HTTP. No representa un error de credenciales: si el usuario o la contrasena fueran invalidos, el backend responderia `401` con un mensaje visible en el formulario.

Realizar estas comprobaciones desde la raiz del repositorio, en este orden:

```powershell
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend ps
Invoke-WebRequest http://127.0.0.1:8080/api/health
docker compose --env-file infra\.env -f infra\compose.local.yml --profile backend logs --tail=200 backend
```

La segunda instruccion debe responder `200` con un cuerpo que incluya `"status":"ok"`. Si no responde, el problema esta en Docker, PostgreSQL o las variables del backend; los ultimos logs indican la causa concreta.

Si el health responde `200`, verificar que `frontend/.env` tenga exactamente una URL utilizable desde el navegador:

```env
# Misma computadora
VITE_API_URL=http://127.0.0.1:8080/api

# Navegador en otro equipo de la red: reemplazar por la IP del servidor local
# VITE_API_URL=http://192.168.1.50:8080/api
```

Si se cambia `APP_PORT` en `infra/.env`, reemplazar tambien `8080` por ese mismo puerto en `VITE_API_URL` y en las comprobaciones de health. Despues de editar `frontend/.env`, reiniciar Vite. Si el navegador usa otro puerto u otra IP, agregar ese origen a `CORS_ALLOWED_ORIGINS` y recrear el backend. Tambien se puede comprobar CORS localmente:

```powershell
Invoke-WebRequest http://127.0.0.1:8080/api/health -Headers @{ Origin = "http://127.0.0.1:5173" }
```

La respuesta debe incluir el encabezado `Access-Control-Allow-Origin: http://127.0.0.1:5173`. Si la pestaña Network del navegador muestra `ERR_CONNECTION_REFUSED`, revisar la URL y los puertos; si muestra un bloqueo CORS, revisar el origen exacto, incluido protocolo, IP y puerto.

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

El procedimiento completo, incluidos los casos de una cuenta existente y el reinicio seguro de una instalacion local de prueba, esta en [docs/14-credenciales-gerente-inicial.md](docs/14-credenciales-gerente-inicial.md).

### Reinicio controlado de la base Supabase

Usar este procedimiento solo cuando se haya decidido descartar **todos** los datos de produccion. Elimina usuarios, catalogos, precios, inventario, ventas, cajas, auditoria y metadatos de evidencias de la aplicacion. Los archivos fisicos del bucket de Supabase Storage no se eliminan automaticamente y deben revisarse por separado.

1. Antes de detener el backend, configurar temporalmente el bootstrap en `infra/.env` con las credenciales que tendra el nuevo gerente inicial.
2. Detener solo el backend, ejecutar el reinicio de `public` desde Supabase SQL Editor y volver a iniciar el backend. Flyway recrea el esquema, los datos iniciales y el gerente configurado.
3. Verificar el log de provision y la fila del usuario. No es posible consultar la contrasena porque se guarda como hash.
4. Cuando el login del gerente haya sido confirmado, cambiar `BOOTSTRAP_MANAGER_ENABLED=false` y recrear solo el contenedor backend. Las demas variables `BOOTSTRAP_MANAGER_*` pueden conservarse, pero ya no se usan mientras el bootstrap este desactivado.

El bloque SQL, las verificaciones y los comandos exactos estan en [docs/14-credenciales-gerente-inicial.md](docs/14-credenciales-gerente-inicial.md#caso-4-reiniciar-por-completo-la-base-supabase-de-produccion).

## Despliegue del backend en servidor

Requisitos: Ubuntu Server con Docker Engine y acceso saliente a Supabase. Copiar el repositorio al servidor y crear `infra/.env` desde la plantilla exclusiva de produccion:

```bash
cp infra/.env.production.example infra/.env
chmod 600 infra/.env
```

Completar en `infra/.env` los valores reales de produccion:

```env
APP_PORT=8080
TZ=America/Bogota
JAVA_TOOL_OPTIONS=-Duser.timezone=America/Bogota
DB_HOST=<host-del-session-pooler>
DB_PORT=<puerto-del-session-pooler>
DB_NAME=postgres
DB_USER=<usuario-del-pooler>
DB_PASSWORD=<contrasena-del-pooler>
DB_SSLMODE=require
JWT_SECRET=<secreto-largo-y-aleatorio>
CORS_ALLOWED_ORIGINS=https://kontora-pos.store,https://www.kontora-pos.store
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<clave-secreta-del-proyecto>
SUPABASE_STORAGE_BUCKET=kontoraimagenes
BOOTSTRAP_MANAGER_ENABLED=true
BOOTSTRAP_MANAGER_USERNAME=gerenteLocal
BOOTSTRAP_MANAGER_FULL_NAME=Gerente Local
BOOTSTRAP_MANAGER_PASSWORD=<contrasena-segura>
```

Construir y ejecutar el backend sin levantar PostgreSQL local. El Compose de produccion publica el puerto solo en `127.0.0.1`; Cloudflare Tunnel sera el unico acceso publico a la API:

```bash
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d --build
docker compose --env-file infra/.env -f infra/compose.prod.yml ps
curl http://127.0.0.1:8080/api/health
```

### Fecha operativa y zona horaria

Ventas, precios vigentes y promociones se calculan en el backend con la fecha de la JVM. La VM debe usar `America/Bogota`, igual que la jornada operativa. Si la VM queda en UTC, desde las 19:00 de Colombia el backend puede usar el dia siguiente mientras el navegador mantiene el dia actual. Esto puede rechazar una venta con `HTTP 400` y el mensaje `La suma de pagos debe coincidir con total_venta`, aunque el efectivo digitado sea igual al total mostrado.

Antes del primer arranque, o para corregir una VM ya instalada, configurar la zona del sistema:

```bash
sudo timedatectl set-timezone America/Bogota
timedatectl status
```

En `infra/.env` deben mantenerse estas dos variables:

```env
TZ=America/Bogota
JAVA_TOOL_OPTIONS=-Duser.timezone=America/Bogota
```

`TZ` alinea el entorno del contenedor y `JAVA_TOOL_OPTIONS` fija la zona de la JVM. Tras cambiar el archivo, recrear solamente el backend y comprobar su zona efectiva:

```bash
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d --force-recreate backend
docker compose --env-file infra/.env -f infra/compose.prod.yml logs --tail=120 backend
docker exec kontora_pos_backend sh -c 'echo "TZ=$TZ"; java -XshowSettings:properties -version 2>&1 | grep user.timezone'
curl -i http://127.0.0.1:8080/api/health
```

La salida esperada incluye `TZ=America/Bogota`, `user.timezone = America/Bogota` y el health con `HTTP/1.1 200`. El encabezado HTTP `Date` puede seguir apareciendo en GMT/UTC porque es el formato estandar de HTTP; no cambia la fecha operativa de Java. Esta recreacion produce una indisponibilidad breve de la API, pero no cierra, liquida ni altera la caja diaria abierta. Una solicitud de venta rechazada con `400` no se persiste y puede registrarse de nuevo despues de la correccion.

### Recuperacion despues de reiniciar la VM

El servicio `backend` usa la politica Docker `restart: unless-stopped`. Si Docker inicia al arrancar la VM, el contenedor debe recuperarse automaticamente. Si el backend o el Tunnel no responden, ejecutar desde `~/apps/kontora`:

```bash
sudo systemctl enable --now docker

docker compose --env-file infra/.env -f infra/compose.prod.yml ps
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d backend
docker compose --env-file infra/.env -f infra/compose.prod.yml logs --tail=200 backend
curl -i http://127.0.0.1:8080/api/health
```

El health local debe responder `HTTP/1.1 200` y un JSON con `"status":"ok"`. No ejecutar `docker compose down` como paso de recuperacion.

Cloudflare Tunnel es un servicio independiente de Docker. Restablecerlo y validar la API publica con:

```bash
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager -l
curl -i https://api.kontora-pos.store/api/health
```

Si el contenedor no existe o requiere una nueva imagen, reconstruir solamente el backend:

```bash
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d --build backend
```

### Publicacion de dominios

Una zona DNS sin registros, como `kontora-pos.store` antes de este despliegue, es el estado inicial esperado. Las variables de CORS no crean DNS: solo autorizan al navegador cuando el frontend ya este publicado. Completar los servicios en este orden:

1. Con el health local exitoso, crear en Cloudflare Zero Trust un tunnel para la VM y registrar la aplicacion publica `api.kontora-pos.store` con servicio `http://127.0.0.1:8080`. Cloudflare crea el registro DNS del subdominio del tunnel.
2. Crear o importar el proyecto frontend en Vercel, definir `VITE_API_URL=https://api.kontora-pos.store/api` y asociar los dominios `kontora-pos.store` y `www.kontora-pos.store`.
3. Crear en Cloudflare exclusivamente los registros que Vercel indique para los dominios web. No crear registros `A` hacia la IP de la VM ni publicar el puerto `8080`.
4. Probar `https://api.kontora-pos.store/api/health`, abrir `https://kontora-pos.store/login` y verificar una solicitud autenticada desde el navegador.

El token de Cloudflare Tunnel se configura en el servicio `cloudflared` de la VM; no es una variable del backend y no debe agregarse a `infra/.env`.

Despues de iniciar sesion con el gerente inicial, desactivar el bootstrap en `infra/.env` y recrear el contenedor:

```bash
docker compose --env-file infra/.env -f infra/compose.prod.yml up -d --force-recreate backend
```

El backend queda accesible desde Internet solo por `api.kontora-pos.store` a traves del tunnel. Los dos origenes de Vercel configurados en CORS cubren el dominio principal y `www`.

## Publicacion del frontend

Antes de generar el build de produccion, configurar la URL HTTPS publica del backend:

```env
VITE_API_URL=https://api.kontora-pos.store/api
```

Luego ejecutar:

```bash
cd frontend
npm ci
npm run build
```

Publicar `frontend/dist` en Vercel, Nginx u otro hosting estatico con soporte de rutas SPA. En Vercel la variable debe llamarse `VITE_API_URL` y se debe volver a construir tras cambiarla.

### Rutas SPA en Vercel

El frontend usa rutas del lado del cliente, como `/login`, `/caja` e `/inventario`. Al recargar una de esas rutas, Vercel debe responder con `index.html` para que React resuelva la pantalla. El archivo `frontend/vercel.json` ya incluye esta regla:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Mantener este archivo dentro de `frontend/`, porque esa es la raiz configurada para el proyecto de Vercel. Sin la regla, Vercel puede responder `NOT_FOUND` al actualizar directamente una ruta interna aunque el build haya terminado correctamente.

## Seguridad y mantenimiento

- No versionar `.env`, claves de Supabase, contrasenas ni `JWT_SECRET`.
- El frontend no puede acceder directamente a Supabase Storage con una clave secreta.
- Hacer respaldo antes de cambiar una base de produccion existente.
- Consultar los permisos y reglas de cada modulo en [docs/00-indice.md](docs/00-indice.md).
