# 11. Consultas

## Objetivo

Centralizar las consultas de solo lectura por periodo para no repetir historiales en las pantallas operativas.

## Requisitos cubiertos

- RF-10, RF-44, RF-49, RF-57 y RF-58.

## Funcionalidades

- Consulta de ventas y gastos por periodo.
- Las ventas anuladas se conservan en el listado de ventas con su estado para trazabilidad, pero se excluyen de registros vigentes, total vendido, efectivo y transferencias, sin importar si el pago original fue en efectivo, transferencia o mixto.
- Consulta de inventario actual y movimientos por item o caja.
- Consulta de cierres por fecha.
- Consulta de historial de deposito y sus movimientos.
- Consulta de datos operativos y financieros sin modificar registros.

## Permisos

| Rol | Funcionalidad |
| --- | --- |
| Vendedor | Consulta ventas y gastos propios por periodo. |
| Administrador | Consulta ventas, gastos, inventario, cierres y deposito. |
| Gerente | Tiene la misma consulta operativa completa. |

## Reglas clave

- Consultas no modifica informacion.
- Una venta anulada no se elimina del historial: se muestra como evidencia de la operacion, sin afectar los indicadores financieros vigentes ni los valores del cierre de caja. Sus pagos y evidencias permanecen disponibles como trazabilidad.
- Inventario y deposito muestran su historial aqui, no en las pantallas de registro.
- Auditoria es una ruta gerencial separada: registra acciones sensibles, no reemplaza los historiales de ventas o movimientos.

## Endpoints principales

- `GET /api/consultas/ventas`
- `GET /api/consultas/gastos`
- `GET /api/consultas/inventario/actual`
- `GET /api/consultas/inventario/movimientos`
- `GET /api/consultas/cierre`
- `GET /api/consultas/deposito/movimientos`
