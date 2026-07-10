# Pantalla: Layout principal por rol

## Objetivo

Mostrar la shell principal de Kontora POS despues de autenticacion y filtrar la navegacion visible segun el rol devuelto por el backend.

## Actor principal

Vendedor / Administrador / Gerente.

## Endpoints consumidos

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/health`

La pantalla referencia endpoints documentados de negocio, pero no ejecuta todavia operaciones de esos modulos.

## Contrato usado

Fuente principal: `docs/modules/usuarios-sesiones-frontend.md`.

Respuesta esperada de `/auth/me`:

```json
{
  "idUsuario": "uuid",
  "nombreUsuario": "usuario",
  "nombreCompleto": "Nombre Usuario",
  "nombreRol": "vendedor"
}
```

Roles reconocidos por el layout:

- `vendedor`
- `administrador`
- `gerente`

## Navegacion visible por rol

### Vendedor

- Inicio.
- Ventas.
- Caja.
- Inventario.
- Gastos.
- Transferencias.
- Evidencias.
- Consultas.

### Administrador

- Inicio.
- Ventas.
- Caja.
- Inventario.
- Gastos.
- Transferencias.
- Evidencias.
- Catalogos.
- Cierre.
- Deposito.
- Consultas.
- Auditoria.

### Gerente

- Inicio.
- Ventas.
- Caja.
- Inventario.
- Gastos.
- Transferencias.
- Evidencias.
- Catalogos.
- Cierre.
- Deposito.
- Consultas.
- Auditoria.

## Validaciones de interfaz

- Sin sesion valida se muestra `/login`.
- Con sesion valida se renderiza el panel correspondiente al rol.
- Las opciones administrativas no se muestran en el menu de `vendedor`.
- Las pantallas de negocio no implementadas se muestran como `Pantalla pendiente`.
- Los endpoints mostrados para `vendedor` no incluyen acciones administrativas cuando existe diferencia de rol.

## Reglas que no debe duplicar el frontend

- Permisos finales de acceso a endpoints.
- Reglas de apertura o cierre de caja.
- Validacion o rechazo definitivo de transferencias.
- Visibilidad definitiva de auditoria.
- Cualquier regla critica de negocio documentada en backend.

El frontend solo mejora la experiencia ocultando opciones no relevantes. El backend sigue siendo la autoridad.

## Respuestas esperadas

- Login con `vendedor`: se muestra panel de vendedor y navegacion operativa.
- Login con `administrador`: se muestra panel de administrador y navegacion administrativa.
- Login con `gerente`: se muestra panel de gerente y navegacion gerencial.
- Logout: se llama `/api/auth/logout`, se limpia la sesion local y se vuelve a `/login`.

## Evidencia de prueba

- Build frontend:

```powershell
cd C:\Users\corre\Desktop\Kontora\frontend
npm run build
```

Resultado: exitoso.

- Validacion API local:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/health" | ConvertTo-Json -Compress
```

Resultado:

```json
{"status":"ok","service":"kontora-pos-backend"}
```

- Validacion en navegador integrado:

```text
Login vendedor -> Panel de vendedor
Login administrador -> Panel de administrador
Login gerente -> Panel de gerente
Transferencias con vendedor -> solo GET /api/consultas/transferencias
Logout -> vuelve a /login
Consola -> sin errores ni advertencias
```

- Validacion manual del usuario:

```text
El usuario confirmo la verificacion manual en navegador antes de documentar el cierre.
```

## Pendiente siguiente

- Implementar panel de caja abierta consumiendo la API real de caja diaria.
