# 10. Transferencias

## Objetivo

Consultar transferencias de ventas, revisar sus soportes y decidir las transferencias pendientes sin mezclar esta operacion con la pantalla general de evidencias.

## Requisitos cubiertos

- RF-24 a RF-28.
- RF-56 y RF-59.

## Funcionalidades

- Consulta de transferencias pendientes o rechazadas por periodo.
- Visualizacion y descarga de comprobantes asociados.
- Validacion o rechazo con observacion opcional.
- Carga de una evidencia correctiva que conserva los soportes anteriores.
- Auditoria de validaciones, rechazos y ajustes de evidencia.

## Permisos

| Rol | Funcionalidad |
| --- | --- |
| Vendedor | Consulta el estado de sus propias transferencias. La carga inicial ocurre en Ventas. |
| Administrador | Consulta transferencias y descarga comprobantes para verificarlos. |
| Gerente | Consulta, descarga, valida, rechaza y adjunta evidencias de ajuste. |

## Reglas clave

- Solo pagos con metodo `transferencia` pueden decidirse.
- Solo una transferencia pendiente puede pasar a `validada` o `rechazada`.
- Una transferencia validada conserva su trazabilidad en pagos y auditoria aunque deje de aparecer en la lista operativa.
- El gerente puede adjuntar un ajuste de evidencia sin restriccion de fecha; el soporte anterior se conserva.

## Endpoints principales

- `GET /api/consultas/transferencias`
- `GET /api/evidencias/pagos-venta/{idPagoVenta}`
- `POST /api/pagos-venta/{idPagoVenta}/validar`
- `POST /api/pagos-venta/{idPagoVenta}/rechazar`
- `POST /api/evidencias/pagos-venta/{idPagoVenta}/ajustes`
