# Pendientes: Inventario operativo frontend

## Objetivo del archivo

Dejar una lista corta y retomable de lo que falta para cerrar el modulo frontend de inventario operativo sin cargar demasiado contexto en una siguiente sesion.

## Estado actual

- Rama: `chore/inicializacion-frontend`.
- Modulo frontend en curso: inventario operativo.
- La ruta `Inventario` sigue como `Pantalla pendiente`.
- Se implemento la pantalla `InventarioPanel` consumiendo contratos reales del backend.
- La UI consulta existencias generales, existencias diarias de caja abierta y movimientos de inventario.
- El usuario `vendedor` queda en modo solo lectura.
- Los formularios de registro quedan visibles solo para `administrador` y `gerente`, pero el backend sigue siendo la autoridad final de permisos.
- La validacion en navegador integrado para rol `vendedor` ya fue realizada contra el backend local.
- Se agregaron accesos visibles desde el inicio de `administrador` y `gerente` hacia las acciones de inventario de jornada.
- No se actualizo `docs/AVANCE_PROYECTO.md` ni se marco la ruta como `base`.

## Que ya quedo implementado

- Servicio frontend para:
  - `GET /api/inventario/existencias/general`
  - `GET /api/inventario/existencias/diarias/abierta`
  - `GET /api/inventario/movimientos`
  - `POST /api/inventario/paquetes-vasos`
  - `POST /api/inventario/consumos-diarios`
- Tipos TypeScript alineados con DTOs backend de inventario.
- Panel de stock general con cantidades actuales.
- Panel de stock diario para caja abierta.
- Panel de movimientos con busqueda, filtro por item y opcion `Solo caja abierta`.
- Resumen de metricas: items generales, stock diario, movimientos y modo de gestion.
- Formularios para abrir paquetes de vasos y registrar consumo diario de desechables cuando el rol lo permite.
- Accesos rapidos en el panel inicial de `administrador` y `gerente`:
  - `Abrir paquetes de vasos`.
  - `Registrar consumo diario`.
- Metadatos de ruta actualizados en `frontend/src/app/routes/appRoutes.ts` para declarar los endpoints usados por el modulo.

## Validaciones tecnicas realizadas

TypeScript:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
```

Resultado:

```text
OK
```

Build frontend despues del ajuste de accesos admin/gerente:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado:

```text
OK fuera del sandbox
```

Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado:

```text
OK fuera del sandbox
```

Nota: `npm run build` dentro del sandbox fallo por el bloqueo conocido de `esbuild` leyendo directorios superiores. Se repitio fuera del sandbox con aprobacion y compilo correctamente.

API real consultada durante implementacion:

```text
GET /api/inventario/existencias/general -> 16 registros
GET /api/inventario/existencias/diarias/abierta -> 1 registro
GET /api/inventario/movimientos -> 13 registros
```

Validacion en navegador integrado:

```text
http://localhost:5173/inventario
Usuario: test_auth_activo / vendedor
La pantalla cargo "Stock y movimientos"
Mostro datos reales de inventario y movimientos
No mostro formularios de paquetes ni consumos para vendedor
Busqueda por vaso_8oz validada
Filtro por item vaso_8oz validado
Filtro Solo caja abierta validado
Consola sin errores ni advertencias desde la carga de inventario
Viewport escritorio 1365x900 sin overflow horizontal
```

La validacion no registro paquetes ni consumos para evitar mutar inventario durante la prueba.

Nota de RF-39:

```text
RF-39 cubre la apertura de paquetes de vasos durante la jornada.
Ese flujo descuenta unidades del stock general y aumenta el stock diario.
No es un reabastecimiento/entrada nueva al stock general.
```

## Que queda pendiente

1. Pedir confirmacion manual del usuario en navegador.
2. Validar visualmente con una sesion real de `administrador` o `gerente` que el panel de inicio muestre los accesos rapidos.
3. Validar en `/inventario` con `administrador` o `gerente` que aparezcan los formularios:
   - `Abrir paquetes de vasos`.
   - `Consumo diario de desechables`.
4. Si se prueba un POST real, evitar mutar inventario innecesariamente o hacerlo con datos controlados.
5. Solo despues de build exitoso, consola limpia y confirmacion manual, actualizar documentacion final del modulo.
6. Cambiar `Inventario` de `pendiente` a `base` solo cuando el modulo quede validado manualmente.

## Archivos relevantes tocados

- `frontend/src/App.tsx`
- `frontend/src/app/routes/appRoutes.ts`
- `frontend/src/index.css`
- `frontend/src/modules/inventario/index.ts`
- `frontend/src/modules/inventario/types.ts`
- `frontend/src/modules/inventario/services/inventarioService.ts`
- `frontend/src/modules/inventario/components/InventarioPanel.tsx`

## Contratos backend usados

- `docs/modules/inventario-operativo.md`
- `backend/src/main/java/com/kontora/pos/inventario/controller/InventarioController.java`
- `ExistenciaInventarioGeneralResponse`
- `ExistenciaInventarioDiarioResponse`
- `MovimientoInventarioResponse`
- `RegistrarPaqueteVasosRequest`
- `PaqueteVasosAbiertoResponse`
- `RegistrarConsumoDiarioInventarioRequest`
- `ConsumoDiarioInventarioResponse`

## Siguiente prompt corto

```text
Estamos en C:\Users\corre\Desktop\Kontora, rama chore/inicializacion-frontend.
Antes de tocar codigo ejecuta git status --short --branch.
Retoma el modulo Inventario operativo frontend leyendo:
- docs/modules/inventario-operativo-frontend-pendientes.md
- docs/modules/inventario-operativo.md
- docs/frontend/pantallas.md
- docs/development/fases/fase_4_frontend_validacion.md

Pendiente principal: pedir confirmacion manual de /inventario, revisar opcionalmente rol administrador/gerente con datos controlados y solo despues actualizar docs finales/ruta base.
```
