# Pantalla: Panel de caja abierta

## Objetivo

Consultar y mostrar la caja diaria abierta dentro del frontend autenticado de Kontora POS.

## Actor principal

Vendedor / Administrador / Gerente.

## Endpoints consumidos

- `GET /api/cajas-diarias/abierta`
- `POST /api/cajas-diarias`

## Contrato usado

Fuente principal: `docs/modules/caja-diaria.md`.

Respuesta esperada de caja abierta:

```json
{
  "idCajaDiaria": "uuid",
  "fechaOperacion": "2200-01-01",
  "estadoCaja": "abierta",
  "valorBase": 300000.00,
  "fechaApertura": "2026-07-07T07:17:00-05:00",
  "fechaCierre": null,
  "idUsuarioApertura": "uuid",
  "nombreUsuarioApertura": "usuario",
  "idUsuarioCierre": null,
  "nombreUsuarioCierre": null,
  "observaciones": "texto"
}
```

Request de apertura:

```json
{
  "fechaOperacion": "2026-07-07",
  "valorBase": 300000,
  "observaciones": "texto opcional"
}
```

## Validaciones de interfaz

- La consulta se realiza con token activo.
- Se muestra estado de carga mientras se consulta la API.
- Si existe caja abierta, se muestran sus datos.
- Si no existe caja abierta, `vendedor` ve mensaje de solo lectura.
- Si no existe caja abierta, `administrador` y `gerente` ven formulario de apertura.
- `valorBase` debe ser mayor o igual a cero antes de enviar.
- El mensaje real de error del backend se muestra al usuario.

## Reglas que no debe duplicar el frontend

- Permiso final para abrir caja.
- Deteccion definitiva de caja duplicada.
- Validez final de `fechaOperacion`.
- Persistencia de auditoria por apertura.

El frontend solo mejora la experiencia visual; el backend conserva la autoridad.

## Respuestas esperadas

- Caja abierta: se muestra `estadoCaja`, `fechaOperacion`, `valorBase`, `fechaApertura`, `nombreUsuarioApertura` y `observaciones`.
- Sin caja abierta: se muestra mensaje o formulario segun rol.
- Apertura exitosa: se muestra la caja devuelta por backend.
- Apertura rechazada: se conserva el formulario y se muestra el mensaje de API.

## Evidencia de prueba

- Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado: exitoso.

- Validacion API local:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/cajas-diarias/abierta"
```

Resultado observado:

```json
{
  "estadoCaja": "abierta",
  "fechaOperacion": "2200-01-01",
  "valorBase": 300000.00
}
```

- Validacion en navegador integrado:

```text
Login vendedor -> /caja muestra panel de caja abierta
Login administrador -> /caja muestra panel de caja abierta
Logout -> vuelve a /login
Consola -> sin errores ni advertencias
```

- Validacion manual del usuario:

```text
El usuario confirmo que se puede continuar despues de verificar el panel en navegador.
```

## Pendiente siguiente

- Implementar catalogos necesarios para formularios consumiendo la API real de catalogos base.
