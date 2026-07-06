# Modulo: Inventario operativo

## Objetivo

Controlar el stock general, el stock diario de vasos y los movimientos de inventario generados por apertura de paquetes, ventas, anulaciones y consumos manuales.

## Tablas involucradas

- `items_inventario`
- `existencias_inventario_general`
- `existencias_inventario_diario`
- `movimientos_inventario`
- `paquetes_vasos_abiertos`
- `consumos_diarios_inventario`
- `ventas`
- `detalles_venta`
- `cajas_diarias`
- `usuarios`

## Fuente de verdad del modelo

El modulo se implementa sobre las tablas reales del schema:

- `existencias_inventario_general.cantidad_actual` representa el stock general disponible por item.
- `existencias_inventario_diario` representa el stock operativo diario, usado en este modulo para vasos.
- `movimientos_inventario` registra cada cambio de stock con `referencia_origen` e `id_referencia_origen`.
- `paquetes_vasos_abiertos` registra paquetes abiertos y vasos rotos al abrirlos.
- `consumos_diarios_inventario` registra consumos manuales de items no automaticos por venta.
- `items_inventario.tipo_control` separa `automatico_por_venta` de `manual_por_consumo`.
- No se implementa `cantidad_minima_alerta` porque esa columna no existe en `kontora_pos_schema.txt`.

## Endpoints

| Metodo | Ruta | Autenticacion | Proposito |
| :- | :- | :- | :- |
| GET | `/api/inventario/existencias/general` | Si | Consultar stock general de inventario. |
| GET | `/api/inventario/existencias/diarias/abierta` | Si | Consultar stock diario de la caja abierta. |
| GET | `/api/inventario/existencias/diarias/caja/{idCajaDiaria}` | Si | Consultar stock diario de una caja especifica. |
| POST | `/api/inventario/paquetes-vasos` | Si | Registrar paquetes de vasos abiertos. |
| POST | `/api/inventario/consumos-diarios` | Si | Registrar consumo manual diario de inventario. |
| GET | `/api/inventario/movimientos` | Si | Consultar movimientos de inventario. Permite filtros `idCajaDiaria` e `idItemInventario`. |
| POST | `/api/ventas/{idVenta}/anular` | Si | Anular una venta registrada y restaurar vasos al stock diario. |

## Diferencia entre stock general y stock diario

- El stock general se conserva en `existencias_inventario_general`.
- Al abrir paquetes de vasos, se descuenta el total generado del stock general.
- El total generado entra al stock diario en `existencias_inventario_diario.cantidad_ingresada`.
- Los vasos rotos al abrir paquetes aumentan `cantidad_perdida`.
- El saldo diario teorico se calcula con:
  - `cantidad_inicial + cantidad_ingresada - cantidad_vendida - cantidad_perdida + cantidad_ajustada`.

## Reglas para vasos

- Solo items activos con `tipo_control = 'automatico_por_venta'`, `maneja_paquetes = true` y `id_tamano_vaso` pueden registrarse como paquetes abiertos.
- La apertura de paquetes crea movimientos de inventario:
  - salida de stock general por `apertura_paquete`.
  - entrada de stock diario por `apertura_paquete`.
  - salida de stock diario por `perdida` si hay `unidades_rotas`.
- Cada venta descuenta vasos del stock diario y genera movimiento `venta`.
- Cada anulacion restaura vasos al stock diario y genera movimiento `anulacion_venta`.
- No se permite que el stock general o diario quede negativo.

## Reglas para consumos manuales

- Solo administrador o gerente puede registrar paquetes y consumos manuales.
- Los consumos manuales aplican a items con `tipo_control = 'manual_por_consumo'`.
- No se permite registrar consumo manual sobre items automaticos por venta.
- Cada consumo manual descuenta stock general y genera movimiento `consumo_diario`.

## Reglas de movimientos

- Todo cambio de stock implementado por el modulo genera registro en `movimientos_inventario`.
- Cada movimiento registra:
  - `tipo_stock`.
  - `tipo_movimiento`.
  - `cantidad`.
  - `sentido_movimiento`.
  - `referencia_origen`.
  - `id_referencia_origen`.
  - `id_usuario_registro`.
- Los movimientos quedan asociados a la caja diaria cuando el proceso corresponde a una operacion diaria.

## Pruebas realizadas

- `mvn clean test`.
- Resultado reportado por el usuario: `BUILD SUCCESS`.
- Rechazo de consulta de inventario sin autenticacion.
- Registro de paquete de vasos con vasos rotos.
- Descuento de stock general al abrir paquetes.
- Creacion de movimientos de apertura de paquete y perdida.
- Registro de consumo manual diario.
- Rechazo de consumo manual para item automatico por venta.
- Descuento automatico de vasos por venta.
- Restauracion de vasos por anulacion de venta.
- Creacion de movimiento de anulacion de venta.

## Pendientes

- Ajustes de inventario con aprobacion de gerente quedan pendientes para una ampliacion del modulo o para auditoria transversal.
- Alertas por cantidad minima quedan pendientes porque `cantidad_minima_alerta` no existe en el schema canonico actual.
- Conteo fisico final y diferencias de cierre se completaran en el modulo "Cierre de caja y deposito".
