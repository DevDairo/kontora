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

### `AppShell`

Ubicacion: `frontend/src/shared/components/AppShell.tsx`.

Responsabilidades:

- Renderizar marca, navegacion principal y topbar.
- Mostrar estado resumido de salud de API.
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

- Mostrar el orden base de modulos frontend de Fase 4.
- Referenciar endpoints reales documentados.
- Mantener los modulos no implementados como pendientes.

## Convenciones iniciales

- Componentes React en PascalCase.
- Hooks con prefijo `use`.
- Servicios API en `src/shared/services`.
- Tipos API compartidos en `src/shared/types`.
- Un modulo visual no debe inventar endpoints ni campos.
- Los formularios deben validar experiencia de usuario, no reemplazar reglas backend.
