# Pendientes: Ventas y pagos frontend

## Objetivo del archivo

Dejar una lista corta y retomable de tareas pendientes para terminar el modulo frontend de registro de venta y pagos sin cargar demasiado contexto en una siguiente sesion.

## Estado actual

- Rama: `chore/inicializacion-frontend`.
- Modulo frontend en curso: registro de venta y pagos.
- Catálogos para formularios ya quedó cerrado en documentación y ruta.
- La ruta `Ventas` sigue como `Pantalla pendiente`.
- Se inició implementación de `VentasPanel` consumiendo contratos reales.
- Se corrigio el calculo de pago mixto para separar:
  - dinero ingresado por el usuario,
  - valor que realmente se registra en `pagos.valorPago`,
  - cambio/devolucion estimada cuando el excedente corresponde a efectivo.
- Transferencia pura ahora tiene campo explicito `Valor transferencia`.
- En transferencia pura, si el valor no coincide con el total, la UI muestra faltante o excedente y no debe enviar payload invalido.
- En pago mixto, el payload se limita al total real de la venta; si hay transferencia sobrante se muestra validacion clara.
- La UI quedo preparada para seleccionar comprobante de transferencia y enviarlo al backend como `FormData` en la parte `archivo`.
- La subida real de evidencia depende de Supabase Storage configurado en backend/servidor; en local se valido el caso esperado sin configuracion.
- TypeScript puro pasó con:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
```

- `npm run build` completo ya paso fuera del sandbox por el bloqueo conocido de esbuild dentro del sandbox.
- API real validada con registro directo de venta en efectivo.
- Navegador integrado validado en `http://127.0.0.1:5173/ventas`.
- UI validada con venta en efectivo y venta mixta.
- UI actualizada para mostrar `Cambio estimado` antes de registrar pagos en efectivo.
- Resultado de venta actualizado para mostrar `cambio` devuelto por backend en `PagoVentaResponse`.
- UI mixta corregida: `Efectivo recibido` ahora se calcula contra el saldo que queda despues de transferencia, y el excedente se muestra como cambio.
- La ruta `Ventas` debe seguir como `Pantalla pendiente` hasta confirmacion manual final del usuario.

## Actualizacion 2026-07-08

### Que se corrigio

- Pago mixto:
  - Caso reportado `total = 8000`, `efectivo recibido = 1000`, `transferencia = 8000`.
  - La UI muestra `Cambio/devolucion estimada $ 1.000`.
  - La UI no muestra alerta contradictoria de pagos por `9000/8000`.
  - El payload a `POST /api/ventas` no envia pagos por mas del total real.
- Pago mixto con ambos metodos:
  - Ejemplo validado `transferencia = 6000`, `efectivo recibido = 3000`.
  - La UI registra `transferencia = 6000`, `efectivo = 2000` y muestra cambio estimado de `1000`.
- Pago transferencia:
  - Se agrego campo `Valor transferencia`.
  - Si falta dinero, muestra cuanto falta.
  - Si la transferencia supera el total, muestra advertencia clara y no debe registrar venta.
- Evidencia de transferencia:
  - Se agrego servicio frontend para `POST /api/evidencias/pagos-venta/{idPagoVenta}`.
  - El archivo se envia como `FormData` en la parte `archivo`.
  - El frontend no sube directo a Supabase y no contiene llaves ni secretos.
  - Despues de registrar la venta, toma `VentaResponse.pagos[]` y usa el pago con `nombreMetodo = "transferencia"`.

### Que se valido

Validacion tecnica:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
npm run build
```

Resultado:

```text
TypeScript OK
Vite build OK fuera del sandbox
```

Nota: `npm run build` dentro del sandbox fallo por el bloqueo conocido de `esbuild` leyendo directorios superiores; se repitio fuera del sandbox con aprobacion y compilo correctamente.

Validacion navegador integrado en `http://127.0.0.1:5173/ventas`:

```text
Login -> test_auth_activo / vendedor
/ventas carga Registro de venta
Catalogos reales cargan en selects
Consola sin errores ni advertencias
Venta #314 -> efectivo 10000 sobre total 8000, cambio backend 2000
Venta #315 -> transferencia pura 8000, pago transferencia pendiente
Transferencia pura 9000 sobre total 8000 -> alerta de excedente 1000, sin submit
Transferencia pura 7000 sobre total 8000 -> alerta de faltante 1000, sin submit
Venta #316 -> mixto reportado, transferencia 8000, efectivo recibido 1000, cambio/devolucion estimada 1000
Venta #317 -> mixto, transferencia 6000, efectivo recibido 3000, efectivo registrado 2000, cambio backend 1000
```

Validacion evidencia contra backend local:

```text
POST /api/evidencias/pagos-venta/{idPagoVenta}
Parte multipart: archivo
Resultado local: HTTP 503, "Supabase Storage no esta configurado"
```

Ese `503` es el pendiente operativo esperado cuando el backend local no tiene variables reales de Supabase configuradas.

### Que queda pendiente

- Confirmacion manual del usuario en navegador antes de cerrar el modulo.
- Mantener `Ventas` como `Pantalla pendiente` hasta esa confirmacion.
- No crear `docs/modules/ventas-pagos-frontend.md` ni actualizar `docs/AVANCE_PROYECTO.md` como completado todavia.
- Validar carga real de evidencia en un backend con Supabase Storage configurado.

### Como activar Supabase Storage para despliegue

Configurar solo en backend/servidor:

```env
SUPABASE_URL=https://proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=evidencias
```

Pasos operativos:

1. Crear o verificar el bucket `evidencias` en Supabase Storage.
2. Configurar `SUPABASE_URL` en el entorno del backend.
3. Configurar `SUPABASE_SERVICE_ROLE_KEY` solo en backend/servidor.
4. Configurar `SUPABASE_STORAGE_BUCKET`; si se omite, backend usa `evidencias`.
5. Levantar backend con esas variables.
6. Registrar una venta con pago de transferencia.
7. Subir comprobante desde frontend o con multipart a `POST /api/evidencias/pagos-venta/{idPagoVenta}`.
8. Verificar que `archivos_evidencia` guarde metadata y que `url_archivo` quede como ruta externa controlada por backend.
9. Confirmar que el frontend nunca exponga `SUPABASE_SERVICE_ROLE_KEY` ni suba directo a Supabase.

## Archivos relevantes ya tocados

- `frontend/src/App.tsx`
- `frontend/src/app/routes/appRoutes.ts`
- `frontend/src/index.css`
- `frontend/src/modules/ventas/index.ts`
- `frontend/src/modules/ventas/types.ts`
- `frontend/src/modules/ventas/services/ventasService.ts`
- `frontend/src/modules/ventas/components/VentasPanel.tsx`
- `frontend/src/modules/evidencias/types.ts`
- `frontend/src/modules/evidencias/services/evidenciasService.ts`
- `docs/AVANCE_PROYECTO.md`
- `docs/frontend/estructura-frontend.md`
- `docs/frontend/guia-componentes.md`
- `docs/frontend/pantallas.md`
- `docs/modules/catalogos-base-frontend.md`

## Contratos backend usados

- `POST /api/ventas`
- `docs/modules/ventas-pagos.md`
- DTOs backend:
  - `RegistrarVentaRequest`
  - `RegistrarDetalleVentaRequest`
  - `RegistrarPagoVentaRequest`
  - `VentaResponse`
  - `DetalleVentaResponse`
  - `PagoVentaResponse`

Request real:

```json
{
  "tipoComprador": "cliente",
  "idUsuarioComprador": null,
  "detalles": [
    {
      "idTipoGranizado": "uuid",
      "idTamanoVaso": "uuid",
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "idMetodoPago": "uuid",
      "valorPago": 8000,
      "valorRecibidoEfectivo": 10000
    }
  ]
}
```

## Tareas pendientes

1. Revisar visualmente `VentasPanel` en navegador integrado. Hecho por Codex.
2. Confirmar que `/ventas` carga catalogos reales sin errores de consola. Hecho por Codex.
3. Probar registro de venta con pago en efectivo contra API real. Hecho por API directa y por UI.
4. Probar pago por transferencia o mixto si la base local tiene caja abierta y stock suficiente. Hecho por UI con pago mixto.
5. Confirmar que el frontend muestra correctamente la respuesta real de `VentaResponse`. Hecho por Codex.
6. Ejecutar build completo. Hecho fuera del sandbox:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

7. Si el build falla solo por bloqueo de sandbox/esbuild, repetirlo fuera del sandbox con aprobacion. Hecho.
8. Revisar consola del navegador despues de registrar venta. Hecho por Codex, sin errores ni advertencias.
9. Pedir confirmacion manual del usuario en navegador. Pendiente.
10. Solo despues de build exitoso, consola limpia y confirmacion manual, actualizar:
    - `docs/modules/ventas-pagos-frontend.md`
    - `docs/frontend/estructura-frontend.md`
    - `docs/frontend/guia-componentes.md`
    - `docs/frontend/pantallas.md`
    - `docs/AVANCE_PROYECTO.md`
11. Cambiar la ruta `Ventas` de `pendiente` a `base` solo cuando el modulo quede validado manualmente. Pendiente.

## Validaciones realizadas por Codex

Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
npm run build
```

Resultado:

```text
TypeScript OK
Vite build OK
```

Validacion API directa:

```text
POST /api/auth/login -> test_auth_activo, rol vendedor
GET /api/catalogos/tipos-granizado -> con_licor disponible
GET /api/catalogos/tamanos-vaso -> 8 oz disponible
GET /api/catalogos/metodos-pago -> efectivo disponible
POST /api/ventas -> Venta registrada #304, total 8000, efectivo no_aplica
```

Validacion navegador integrado:

```text
/ventas carga Registro de venta
Catalogos reales cargan en selects
Consola sin errores ni advertencias al cargar
Venta en efectivo desde UI -> Venta registrada #305, total 8000, efectivo no_aplica
Venta mixta desde UI -> Venta registrada #306, efectivo no_aplica y transferencia pendiente
Valor recibido efectivo 10000 sobre total 8000 -> Cambio estimado 2000
Venta en efectivo desde UI -> Venta registrada #311, efectivo no_aplica y cambio 2000
Pago mixto con total 8000, efectivo recibido 1000 y transferencia 8000 -> Cambio estimado 1000, sin alerta de pagos 9000/8000
Venta mixta desde UI -> Venta registrada #313, transferencia pendiente y Cambio estimado 1000
Consola sin errores ni advertencias despues de registrar
```

## Pendiente real para cierre

1. Usuario revisa manualmente `http://127.0.0.1:5173/ventas`.
2. Si visualmente esta correcto, crear `docs/modules/ventas-pagos-frontend.md`.
3. Actualizar docs frontend y `docs/AVANCE_PROYECTO.md`.
4. Cambiar `Ventas` a `base` en `frontend/src/app/routes/appRoutes.ts`.

## Validaciones sugeridas

Validacion tecnica minima:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npx tsc -b --pretty false
npm run build
```

Validacion API local:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/health" | ConvertTo-Json -Compress
```

Validacion manual:

- Login con usuario local.
- Ir a `/ventas`.
- Agregar un producto.
- Registrar venta.
- Ver respuesta de venta registrada.
- Confirmar consola sin errores.

## No hacer todavia

- No marcar ventas/pagos frontend como completado sin confirmacion manual en navegador.
- No documentar el cierre del modulo antes de confirmacion manual del usuario.
- No inventar endpoints para usuarios compradores; si `tipoComprador = trabajador`, usar `idUsuarioComprador` como UUID requerido por backend.
- No hacer commits, merges ni cambios de rama sin confirmacion del usuario.
