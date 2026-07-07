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

## Layout principal por rol

El layout principal queda implementado sobre la sesion confirmada por backend.

Archivos principales:

```text
frontend/src/App.tsx
frontend/src/app/routes/appRoutes.ts
frontend/src/shared/components/AppShell.tsx
frontend/src/shared/components/ModuleOverview.tsx
frontend/src/shared/components/RouteWorkspace.tsx
```

Responsabilidades:

- `appRoutes.ts` centraliza rutas visibles, roles, estado de pantalla y endpoints documentados.
- `App.tsx` filtra rutas con `nombreRol` devuelto por `/api/auth/me`.
- `AppShell` renderiza sidebar, topbar, usuario autenticado, estado de API y navegacion.
- `ModuleOverview` muestra la navegacion visible para el rol autenticado.
- `RouteWorkspace` muestra vistas base de modulos pendientes con endpoints reales documentados.

El filtro por rol en frontend es solo una mejora de experiencia. Los permisos finales se mantienen en backend.

## Panel de caja abierta

El panel de caja abierta queda implementado dentro de `src/modules/caja`.

Archivos principales:

```text
frontend/src/modules/caja/components/CajaAbiertaPanel.tsx
frontend/src/modules/caja/services/cajaService.ts
frontend/src/modules/caja/types.ts
```

Responsabilidades:

- `CajaAbiertaPanel` consulta y muestra la caja diaria abierta.
- `cajaService` consume `GET /api/cajas-diarias/abierta` y `POST /api/cajas-diarias`.
- `types.ts` conserva el contrato real de `CajaDiariaResponse`.

La apertura visible para `administrador` y `gerente` no reemplaza la validacion del backend.

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
