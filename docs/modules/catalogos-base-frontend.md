# Pantalla: Catalogos para formularios

## Objetivo

Consultar catalogos base activos desde la API real para alimentar formularios operativos de ventas, inventario, gastos y servicios.

## Actor principal

Vendedor / Administrador / Gerente.

## Endpoints consumidos

- `GET /api/catalogos/metodos-pago`
- `GET /api/catalogos/tipos-granizado`
- `GET /api/catalogos/tamanos-vaso`
- `GET /api/catalogos/categorias-inventario`
- `GET /api/catalogos/unidades-medida`
- `GET /api/catalogos/items-inventario`
- `GET /api/catalogos/precios-granizado/vigentes?fecha=YYYY-MM-DD`
- `GET /api/catalogos/promociones/vigentes?fecha=YYYY-MM-DD`
- `GET /api/catalogos/tipos-servicio`

## Contrato usado

Fuente principal: `docs/modules/catalogos-base.md`.

La pantalla consume catalogos autenticados y conserva los nombres reales expuestos por backend:

- Metodos de pago activos.
- Tipos de granizado activos.
- Tamanos de vaso activos.
- Categorias y unidades de inventario activas.
- Items de inventario activos.
- Precios vigentes por fecha.
- Promociones vigentes por fecha con `diasPromocion`.
- Tipos de servicio activos.

## Campos del formulario

- `fechaVigencia`: fecha usada para consultar precios y promociones vigentes.
- `buscar`: filtro local para precios, promociones e items ya recibidos.

## Validaciones de interfaz

- La consulta se realiza con token activo.
- La fecha de vigencia se envia como query param `fecha`.
- El filtro de busqueda no modifica datos ni llama endpoints de escritura.
- Si la API rechaza la consulta, se muestra el mensaje real del backend.
- Los catalogos se usan solo como lectura y preparacion de formularios.

## Reglas que no debe duplicar el frontend

- Vigencia definitiva de precios y promociones.
- Filtrado definitivo por estado activo.
- Reglas de aplicacion de promociones en ventas.
- Permisos finales de acceso.

El frontend solo presenta datos maestros y mejora busqueda/seleccion; el backend conserva la autoridad.

## Respuestas esperadas

- Caso exitoso: se muestran conteos y listas de metodos de pago, tipos de granizado, items, precios, promociones y listas base.
- Caso con error: se muestra el mensaje devuelto por la API y se permite reintentar.

## Evidencia de prueba

- Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado: exitoso.

- Validacion API real con token de `test_auth_activo`:

```text
GET /api/catalogos/metodos-pago -> 2 registros
GET /api/catalogos/tipos-granizado -> 2 registros
GET /api/catalogos/tamanos-vaso -> 6 registros
GET /api/catalogos/categorias-inventario -> 5 registros
GET /api/catalogos/unidades-medida -> 4 registros
GET /api/catalogos/items-inventario -> 16 registros
GET /api/catalogos/precios-granizado/vigentes?fecha=2026-07-07 -> 12 registros
GET /api/catalogos/promociones/vigentes?fecha=2026-07-07 -> 12 registros
GET /api/catalogos/tipos-servicio -> 5 registros
```

- Validacion en navegador integrado:

```text
/catalogos muestra Catalogos para formularios
La pantalla muestra datos reales de precios, promociones, inventario y listas base
Caja aparece como Base lista
Catalogos aparece como Base lista despues de la confirmacion manual
Consola sin errores ni advertencias
```

- Validacion manual del usuario:

```text
El usuario confirmo continuar despues de revisar la pantalla de catalogos en navegador.
```

## Pendiente siguiente

- Implementar registro de venta y pagos consumiendo `POST /api/ventas` y catalogos reales.
