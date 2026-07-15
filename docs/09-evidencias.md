# 09. Evidencias

## Objetivo

Conservar y consultar soportes de transferencias, gastos, consignaciones y pagos de servicios mediante backend y Supabase Storage.

## Requisitos cubiertos

- RF-24, RF-28 y RF-50.
- RF-53, RF-59 y RF-60.

## Funcionalidades

- Carga multipart de imagenes o PDF autorizados.
- Compresion de imagenes en backend y almacenamiento de metadata original y comprimida.
- Consulta de metadata por el registro que respalda la evidencia.
- Descarga protegida por backend para usuarios autorizados.
- Mensaje uniforme de disponibilidad cuando una descarga no puede completarse: `La evidencia solicitada no esta disponible para descargar.`
- Conservacion de soportes previos cuando se agrega una correccion; no se reemplazan ni eliminan registros historicos.

## Permisos

| Rol | Funcionalidad |
| --- | --- |
| Vendedor | Adjunta la evidencia de transferencia durante la venta y consulta solo lo permitido por su flujo. |
| Administrador | Consulta, adjunta y descarga soportes administrativos de gastos y deposito. |
| Gerente | Tiene las capacidades administrativas y puede realizar ajustes historicos de evidencias de transferencia. |

## Reglas clave

- El frontend nunca recibe claves de Supabase ni sube directamente al bucket.
- El bucket activo configurado para el proyecto es `kontoraimagenes`.
- Cada archivo se relaciona con un unico registro operativo; un pago puede conservar varios archivos de evidencia para trazabilidad.
- La interfaz no diferencia visualmente entre un archivo inexistente y una descarga que no puede completarse; en ambos casos informa que la evidencia no esta disponible. El backend mantiene el estado tecnico real para trazabilidad y diagnostico.
- El ajuste de una evidencia de transferencia se registra en auditoria.

## Endpoints principales

- `POST /api/evidencias/pagos-venta/{idPagoVenta}`
- `POST /api/evidencias/gastos-caja/{idGastoCaja}`
- `POST /api/evidencias/consignaciones-bancarias/{idConsignacionBancaria}`
- `POST /api/evidencias/pagos-servicios/{idPagoServicio}`
- `GET /api/evidencias/{idArchivoEvidencia}/descargar`
