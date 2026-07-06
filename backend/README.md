# Backend - Kontora POS

Backend construido con Java 21 y Spring Boot.

## Responsabilidades

- Exponer API REST.
- Gestionar autenticacion y autorizacion.
- Ejecutar logica de negocio transaccional.
- Persistir informacion en PostgreSQL/Supabase respetando el schema canonico.
- Registrar auditoria.
- Coordinar evidencias con Supabase Storage.

## Estado actual

Fase 2: infraestructura base del backend creada. Todavia no hay modulos de negocio implementados.

## Ejecucion local

1. Confirmar que PostgreSQL local este levantado.
2. Configurar variables de entorno si se requiere cambiar los valores por defecto.
3. Compilar:

```bash
mvn clean test
```

4. Ejecutar:

```bash
mvn spring-boot:run
```

5. Validar:

```bash
curl http://localhost:8080/api/health
```

Respuesta esperada:

```json
{"status":"ok","service":"kontora-pos-backend"}
```

## Pruebas

```bash
mvn clean test
```

La prueba de integracion levanta Spring Boot, conecta a PostgreSQL local y valida `GET /api/health`.
