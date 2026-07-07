# Estructura frontend

## Alcance de esta inicializacion

Esta inicializacion crea la base React + TypeScript + Vite para Fase 4. El frontend consume la API real del backend y mantiene las reglas criticas en backend.

## Estructura creada

```text
frontend/
|-- src/
|   |-- app/
|   |   |-- providers/
|   |   `-- routes/
|   |-- modules/
|   |   |-- auth/
|   |   |-- auditoria/
|   |   |-- caja/
|   |   |-- catalogos/
|   |   |-- deposito/
|   |   |-- evidencias/
|   |   |-- gastos/
|   |   |-- inventario/
|   |   `-- ventas/
|   |-- shared/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- services/
|   |   |-- types/
|   |   `-- utils/
|   |-- App.tsx
|   |-- index.css
|   `-- main.tsx
|-- .env.example
|-- index.html
|-- package.json
|-- tsconfig.json
`-- vite.config.ts
```

## Responsabilidades

- `src/app`: composicion global, providers y rutas declaradas.
- `src/modules`: superficie reservada para pantallas por modulo funcional.
- `src/modules/auth`: login, proveedor de sesion, servicio de autenticacion y almacenamiento controlado de token.
- `src/shared/components`: componentes visuales reutilizables.
- `src/shared/hooks`: hooks transversales como validacion de salud backend.
- `src/shared/services`: cliente HTTP y servicios de API.
- `src/shared/types`: tipos compartidos de contratos API.
- `src/shared/utils`: utilidades de configuracion.

## Cliente HTTP

El cliente base esta en `frontend/src/shared/services/apiClient.ts`.

- Usa `VITE_API_URL` como URL base.
- Agrega `Accept: application/json`.
- Permite adjuntar token Bearer cuando los modulos autenticados lo necesiten.
- Respeta `FormData` para futuras cargas multipart de evidencias.
- Propaga errores HTTP mediante `ApiClientError`.

## Autenticacion frontend

La autenticacion se implementa en `frontend/src/modules/auth`.

Estructura principal:

```text
frontend/src/modules/auth/
|-- components/LoginPage.tsx
|-- context/AuthContext.tsx
|-- hooks/useAuth.ts
|-- services/authService.ts
|-- utils/tokenStorage.ts
|-- index.ts
`-- types.ts
```

El token JWT se almacena en `sessionStorage` mediante `tokenStorage.ts` y se adjunta a las llamadas protegidas usando la opcion `token` del cliente HTTP.

La app reconstruye la sesion con `GET /api/auth/me`; si el backend rechaza el token, el frontend limpia la sesion local y vuelve al login.

## Variable de entorno

```env
VITE_API_URL=http://localhost:8080/api
```

La configuracion versionada queda en `frontend/.env.example`. No se versionan archivos `.env` reales.

## Validacion esperada

```powershell
cd frontend
npm install
npm run build
```

Para validacion visual local:

```powershell
cd frontend
npm run dev
```

La primera conexion implementada consume `GET /api/health`.

## Integracion local con backend

El proceso de validacion local, errores encontrados y correccion CORS quedan documentados en:

```text
docs/frontend/integracion-backend-local.md
```
