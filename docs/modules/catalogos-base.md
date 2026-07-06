# Modulo: Catalogos base

## Objetivo

Exponer datos maestros requeridos por los modulos operativos de ventas, pagos, inventario, deposito y administracion.

## Tablas involucradas

- `roles`
- `metodos_pago`
- `tipos_granizado`
- `tamanos_vaso`
- `precios_granizado`
- `promociones`
- `dias_promocion`
- `categorias_inventario`
- `unidades_medida`
- `items_inventario`
- `tipos_servicio`

## Fuente de verdad del modelo

El modulo se implementa sobre las tablas reales del schema:

- Los catalogos operativos devuelven solo registros con `estado = 'activo'`.
- Los precios vigentes se filtran por `precios_granizado.fecha_inicio_vigencia`, `fecha_fin_vigencia` y `estado`.
- Las promociones vigentes se filtran por `promociones.fecha_inicio_vigencia`, `fecha_fin_vigencia` y `estado`.
- `dias_promocion` se devuelve como configuracion asociada a cada promocion.
- `items_inventario` no incluye `cantidad_minima_alerta` porque esa columna no existe en `kontora_pos_schema.txt`.

## Endpoints

| Metodo | Ruta | Autenticacion | Proposito |
| :- | :- | :- | :- |
| GET | `/api/catalogos/roles` | Si | Consultar roles activos. |
| GET | `/api/catalogos/metodos-pago` | Si | Consultar metodos reales de pago. |
| GET | `/api/catalogos/tipos-granizado` | Si | Consultar tipos de granizado activos. |
| GET | `/api/catalogos/tamanos-vaso` | Si | Consultar tamanos de vaso activos. |
| GET | `/api/catalogos/categorias-inventario` | Si | Consultar categorias de inventario activas. |
| GET | `/api/catalogos/unidades-medida` | Si | Consultar unidades de medida activas. |
| GET | `/api/catalogos/items-inventario` | Si | Consultar items activos para operaciones normales. |
| GET | `/api/catalogos/precios-granizado/vigentes` | Si | Consultar precios vigentes. |
| GET | `/api/catalogos/promociones/vigentes` | Si | Consultar promociones vigentes. |
| GET | `/api/catalogos/tipos-servicio` | Si | Consultar tipos de servicio activos. |

## Filtros

- `GET /api/catalogos/precios-granizado/vigentes?fecha=YYYY-MM-DD`
- `GET /api/catalogos/promociones/vigentes?fecha=YYYY-MM-DD`

Si `fecha` no se envia, se usa la fecha actual del backend.

## Reglas de vigencia

- Un precio es vigente si:
  - `estado = 'activo'`.
  - `fecha_inicio_vigencia <= fecha`.
  - `fecha_fin_vigencia IS NULL` o `fecha_fin_vigencia >= fecha`.
  - Tipo de granizado y tamano de vaso asociados estan activos.
- Una promocion es vigente si:
  - `estado = 'activo'`.
  - `fecha_inicio_vigencia <= fecha`.
  - `fecha_fin_vigencia IS NULL` o `fecha_fin_vigencia >= fecha`.
  - Tipo de granizado y tamano de vaso asociados estan activos.
- Las reglas de aplicacion por tipo de comprador y dia de semana se completaran en el modulo de ventas y pagos.

## Reglas de negocio implementadas

- Solo usuarios autenticados pueden consultar catalogos internos.
- Los items inactivos no aparecen en consultas operativas normales.
- Los precios vigentes no incluyen tipos de granizado ni tamanos inactivos.
- Las promociones vigentes incluyen sus dias configurados en `dias_promocion`.
- No se agregan migraciones nuevas: el schema canonico ya contiene las tablas y datos iniciales.

## Pruebas realizadas

- `mvn clean test`.
- Rechazo de consulta sin autenticacion.
- Consulta de roles activos.
- Consulta de metodos de pago activos.
- Consulta de tipos de granizado activos.
- Consulta de tamanos de vaso activos.
- Consulta de tipos de servicio activos.
- Consulta de precios vigentes.
- Consulta de promociones vigentes con dias asociados.
- Verificacion de que un item inactivo no aparece en operaciones normales.

## Pendientes

- La administracion historica de precios y promociones se definira en un flujo administrativo posterior.
- La aplicacion exacta de promociones por venta se implementara en el modulo "Ventas y pagos".
