# Kontora POS - Indice Operativo

## Estado del proyecto

- Fase 3, desarrollo backend: terminada y validada.
- Fase 4, desarrollo frontend: terminada y validada manualmente.
- Estado de despliegue: preparado. Requiere variables reales de infraestructura, Supabase y dominios antes de publicar.
- La fuente historica de decisiones, pruebas y requisitos se conserva en [historico-desarrollo](./historico-desarrollo/).

## Modulos activos

| Orden | Documento | Ruta principal | Roles |
| --- | --- | --- | --- |
| 01 | [Login y sesion](./01-login-y-sesion.md) | `/login` | Todos |
| 02 | [Caja diaria](./02-caja-diaria.md) | `/caja` | Todos, con acciones administrativas |
| 03 | [Catalogos](./03-catalogos.md) | `/catalogos` | Administrador, gerente |
| 04 | [Ventas y pagos](./04-ventas-y-pagos.md) | `/ventas` | Todos |
| 05 | [Inventario operativo](./05-inventario-operativo.md) | `/inventario` | Administrador, gerente |
| 06 | [Gastos y pago a trabajadores](./06-gastos-y-pago-trabajadores.md) | `/gastos` | Todos, con acciones administrativas |
| 07 | [Cierre de caja](./07-cierre-de-caja.md) | `/cierre` | Administrador, gerente |
| 08 | [Deposito y servicios](./08-deposito-y-servicios.md) | `/deposito` | Administrador, gerente |
| 09 | [Evidencias](./09-evidencias.md) | `/evidencias` | Administrador, gerente |
| 10 | [Transferencias](./10-transferencias.md) | `/transferencias` | Todos, con validacion gerencial |
| 11 | [Consultas](./11-consultas.md) | `/consultas` | Segun rol |
| 12 | [Usuarios](./12-usuarios.md) | `/usuarios` | Gerente |
| 13 | [Auditoria](./13-auditoria.md) | `/auditoria` | Gerente |

## Convenciones

- El backend es la autoridad para permisos, transacciones y reglas de negocio.
- El frontend adapta la experiencia por rol, pero no reemplaza la autorizacion backend.
- Las fechas de operacion de caja no son necesariamente la fecha tecnica de registro de una auditoria.
- El schema, migraciones, DTOs y controladores reales prevalecen sobre cualquier descripcion resumida.
- Los secretos se definen solo en archivos `.env` ignorados por Git.

## Fuentes de referencia

- Requisitos funcionales: `historico-desarrollo/requirements/source/Requisitos_Kontora_POS_Reconstruido.md`.
- Schema canonico: `database/schema/kontora_pos_schema_v1_1.sql`.
- Migracion base: `backend/src/main/resources/db/migration/V1__schema_inicial_kontora_pos.sql`.
- Guia de ejecucion y despliegue: [README principal](../README.md).
