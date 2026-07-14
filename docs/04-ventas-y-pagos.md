# 04. Ventas y pagos

## Objetivo

Registrar ventas de granizados, aplicar precios y promociones vigentes, distribuir pagos y actualizar el stock diario de vasos.

## Requisitos cubiertos

- RF-13 a RF-28.

## Funcionalidades

- Venta de granizados con o sin licor por tamano de vaso.
- Precio historico aplicado desde la vigencia activa.
- Promocion configurable para granizados con licor: pares del mismo tamano y reglas de dia segun comprador.
- Venta a cliente o a trabajador seleccionado desde usuarios activos.
- Pagos en efectivo, transferencia o mixtos.
- Registro de valor recibido y cambio para pagos en efectivo.
- Carga inicial de evidencia cuando el pago incluye transferencia.
- Panel de anulacion para seleccionar una venta registrada de la jornada, indicar el motivo y confirmar la operacion.
- Anulacion autorizada de venta abierta, con motivo, trazabilidad y restauracion del stock diario de vasos.

## Permisos

| Rol | Funcionalidad |
| --- | --- |
| Vendedor | Registra ventas y consulta sus operaciones autorizadas. |
| Administrador | Registra ventas y puede anular ventas mientras la caja esta abierta. |
| Gerente | Tiene las mismas capacidades administrativas. |

## Reglas clave

- Toda venta exige una caja diaria abierta.
- La suma de pagos debe coincidir con el total de la venta.
- Cada venta descuenta vasos segun el tamano; la anulacion los devuelve.
- Solo administrador y gerente pueden anular; vendedor no visualiza la accion y el sistema tambien protege el endpoint.
- Solo se anulan ventas en estado `registrada` de una caja abierta; el registro permanece como `anulada` para consulta y auditoria.
- Las transferencias se crean como pendientes hasta su decision posterior.
- El beneficio de trabajador esta disponible para usuarios activos, incluidos administrador y gerente, bajo la regla vigente de promociones.

## Endpoints principales

- `POST /api/ventas`
- `POST /api/ventas/{idVenta}/anular`
- `GET /api/ventas/trabajadores`
- `GET /api/consultas/ventas`
