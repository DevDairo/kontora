# Guia de componentes frontend

## Referencia visual

La referencia visual inicial proviene de la maqueta ubicada fuera del repo:

```text
C:\Users\corre\Downloads\kontora-pos-maqueta\kontora-pos-maqueta\index.html
C:\Users\corre\Downloads\kontora-pos-maqueta\kontora-pos-maqueta\styles.css
```

La maqueta no es contrato funcional. El frontend real se implementa con React, TypeScript y Vite.

## Principios visuales aplicados

- Layout operativo con sidebar, topbar y area de trabajo.
- Tarjetas compactas para estado de API y modulos.
- Bordes de 8px o menos.
- Paleta clara con acentos azul, verde, cian, morado y naranja.
- Iconos de `lucide-react` para navegacion y botones.
- Componentes preparados para escritorio y movil.

## Componentes base

### `LoginPage`

Ubicacion: `frontend/src/modules/auth/components/LoginPage.tsx`.

Responsabilidades:

- Renderizar el formulario de inicio de sesion.
- Validar campos vacios antes de enviar.
- Consumir `POST /api/auth/login` mediante el provider de autenticacion.
- Mostrar errores devueltos por el backend.
- Mostrar estado local de la API mediante el health check.

### `AuthProvider`

Ubicacion: `frontend/src/modules/auth/context/AuthContext.tsx`.

Responsabilidades:

- Mantener estado de sesion autenticada.
- Guardar y limpiar el token en `sessionStorage`.
- Reconstruir sesion con `GET /api/auth/me`.
- Ejecutar logout contra `POST /api/auth/logout`.
- Exponer `useAuth` para pantallas y shell.

### `AppShell`

Ubicacion: `frontend/src/shared/components/AppShell.tsx`.

Responsabilidades:

- Renderizar marca, navegacion principal filtrada por rol y topbar.
- Mostrar estado resumido de salud de API.
- Mostrar usuario autenticado y rol.
- Permitir navegacion interna entre vistas base.
- Ejecutar cierre de sesion desde la topbar.
- Contener la pantalla activa.

### `HealthCheckPanel`

Ubicacion: `frontend/src/shared/components/HealthCheckPanel.tsx`.

Responsabilidades:

- Consumir el estado del hook `useHealthCheck`.
- Mostrar URL final de `GET /api/health`.
- Permitir reintento manual.

### `ModuleOverview`

Ubicacion: `frontend/src/shared/components/ModuleOverview.tsx`.

Responsabilidades:

- Mostrar la navegacion visible para el rol autenticado.
- Referenciar endpoints reales documentados segun rol cuando aplica.
- Permitir navegar a vistas base de modulos pendientes.

### `RouteWorkspace`

Ubicacion: `frontend/src/shared/components/RouteWorkspace.tsx`.

Responsabilidades:

- Renderizar una vista base para cada modulo pendiente.
- Mostrar descripcion de la pantalla segun rol cuando aplica.
- Mostrar endpoints backend documentados sin ejecutar operaciones de negocio.
- Recordar que el filtro de rol en frontend es de experiencia y no reemplaza permisos backend.

### `appRoutes`

Ubicacion: `frontend/src/app/routes/appRoutes.ts`.

Responsabilidades:

- Centralizar rutas visibles del layout principal.
- Definir roles visibles: `vendedor`, `administrador`, `gerente`.
- Definir estado de pantalla: `base` o `pendiente`.
- Asociar cada ruta con endpoints reales ya documentados.
- Normalizar `nombreRol` recibido desde `/api/auth/me`.

### `CajaAbiertaPanel`

Ubicacion: `frontend/src/modules/caja/components/CajaAbiertaPanel.tsx`.

Responsabilidades:

- Consumir `GET /api/cajas-diarias/abierta` con token real.
- Mostrar estado de carga, caja abierta, ausencia de caja y error.
- Mostrar datos reales de la caja diaria abierta.
- Mostrar formulario de apertura solo para `administrador` y `gerente` cuando no existe caja abierta.
- Ejecutar `POST /api/cajas-diarias` sin asumir que el frontend tiene la decision final de permisos.

## Convenciones iniciales

- Componentes React en PascalCase.
- Hooks con prefijo `use`.
- Servicios API en `src/shared/services`.
- Servicios por modulo en `src/modules/[modulo]/services` cuando consumen contratos propios del modulo.
- Tipos API compartidos en `src/shared/types`.
- Un modulo visual no debe inventar endpoints ni campos.
- Los formularios deben validar experiencia de usuario, no reemplazar reglas backend.
