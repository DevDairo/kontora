# 05. Inventario operativo

## Objetivo

Gestionar stock general, stock diario de vasos, consumos manuales, perdidas y ajustes autorizados.

## Requisitos cubiertos

- RF-38 a RF-47.

## Funcionalidades

- Consulta del stock diario de vasos de la caja abierta.
- Registro de paquetes de vasos abiertos, con 20 unidades por paquete y perdidas por dano.
- Descuento automatico de vasos por ventas y restauracion por anulaciones.
- Registro de conteo fisico final, diferencia y cantidad teorica.
- Arrastre del remanente de vasos al abrir la siguiente caja: se conserva el conteo fisico final o, en su ausencia, el saldo teorico.
- Consumo manual de dulces, desechables y bolsas de producto con o sin licor desde stock general.
- Solicitudes administrativas de ajuste y decision gerencial de aprobar o rechazar.
- Aplicacion directa de ajustes por gerente cuando corresponde.

## Permisos

| Rol | Funcionalidad |
| --- | --- |
| Vendedor | No recibe interfaz independiente de Inventario. |
| Administrador | Registra paquetes, consumos, conteos y solicitudes de ajuste. |
| Gerente | Ejecuta las operaciones administrativas y aprueba, rechaza o aplica ajustes. |

## Reglas clave

- El stock general no requiere caja abierta para su administracion gerencial.
- La caja abierta solo condiciona operaciones diarias: paquetes, consumos y conteos de vasos.
- El stock diario de vasos no queda vacio por cambio de jornada cuando existe remanente.
- Un ajuste aprobado no puede dejar el stock general negativo.
- Solicitud, aprobacion y rechazo de ajustes generan auditoria.

## Endpoints principales

- `GET /api/inventario/existencias/general`
- `GET /api/inventario/existencias/diarias/abierta`
- `POST /api/inventario/paquetes-vasos`
- `POST /api/inventario/consumos-diarios`
- `POST /api/inventario/ajustes`
- `POST /api/inventario/ajustes/{idAjusteInventario}/aprobar`
- `POST /api/inventario/ajustes/{idAjusteInventario}/rechazar`
