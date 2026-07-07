# Pantallas frontend

## Pantalla: Inicio de inicializacion

### Objetivo

Validar que la app React carga y que puede consultar el endpoint publico de salud del backend.

### Actor principal

Equipo de desarrollo.

### Endpoint consumido

- `GET /api/health`

### Campos del formulario

- No aplica.

### Validaciones de interfaz

- La pantalla muestra estado de conexion: pendiente, validando, disponible o sin conexion.
- El boton de reintento ejecuta nuevamente la consulta.
- La URL base proviene de `VITE_API_URL`.

### Respuestas esperadas

- Caso exitoso: `status = ok` y `service = kontora-pos-backend`.
- Caso con error: se muestra el mensaje de error HTTP o de conexion.

### Evidencia de prueba

- `npm run build`.
- Consulta manual contra `http://localhost:8080/api/health` cuando el backend este activo.

## Orden previsto de pantallas

Fuente: `docs/development/fases/fase_4_frontend_validacion.md`.

1. Login.
2. Layout principal por rol.
3. Panel de caja abierta.
4. Catalogos necesarios para formularios.
5. Registro de venta y pagos.
6. Inventario operativo.
7. Gastos, adiciones y pago trabajadores.
8. Cierre de caja.
9. Deposito, consignaciones y servicios.
10. Evidencias.
11. Auditoria y consultas.

Estas pantallas quedan pendientes para PRs posteriores. Esta PR solo inicializa el frontend y valida la conexion basica con backend.
