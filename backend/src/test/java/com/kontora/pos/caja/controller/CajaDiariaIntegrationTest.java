package com.kontora.pos.caja.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class CajaDiariaIntegrationTest {

    private static final String PASSWORD = "Clave12345";
    private static final String USUARIO_ADMIN = "test_caja_admin";
    private static final String USUARIO_GERENTE = "test_caja_gerente";
    private static final String USUARIO_VENDEDOR = "test_caja_vendedor";
    private static final LocalDate FECHA_OPERACION = LocalDate.of(2099, 12, 31);
    private static final LocalDate FECHA_DUPLICADA = LocalDate.of(2099, 12, 30);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        limpiarDatosDePrueba();
        crearUsuarioConCredencial(USUARIO_ADMIN, "Administrador Caja", "administrador");
        crearUsuarioConCredencial(USUARIO_GERENTE, "Gerente Caja", "gerente");
        crearUsuarioConCredencial(USUARIO_VENDEDOR, "Vendedor Caja", "vendedor");
    }

    @Test
    void sinUsuarioAutenticadoNoPuedeAbrirCaja() throws Exception {
        mockMvc.perform(post("/api/cajas-diarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestApertura(FECHA_OPERACION))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void vendedorNoPuedeAbrirCaja() throws Exception {
        String tokenVendedor = iniciarSesion(USUARIO_VENDEDOR);

        mockMvc.perform(post("/api/cajas-diarias")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenVendedor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestApertura(FECHA_OPERACION))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value("Solo administrador o gerente puede abrir caja diaria"));
    }

    @Test
    void administradorAbreCajaYPermiteConsultarla() throws Exception {
        String tokenAdmin = iniciarSesion(USUARIO_ADMIN);

        mockMvc.perform(post("/api/cajas-diarias")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestApertura(FECHA_OPERACION))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fechaOperacion").value(FECHA_OPERACION.toString()))
                .andExpect(jsonPath("$.estadoCaja").value("abierta"))
                .andExpect(jsonPath("$.valorBase").value(300000.00))
                .andExpect(jsonPath("$.nombreUsuarioApertura").value(USUARIO_ADMIN));

        Integer cajasCreadas = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM cajas_diarias WHERE fecha_operacion = ?",
                Integer.class,
                FECHA_OPERACION);
        assertThat(cajasCreadas).isEqualTo(1);

        mockMvc.perform(get("/api/cajas-diarias/fecha/{fechaOperacion}", FECHA_OPERACION)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fechaOperacion").value(FECHA_OPERACION.toString()))
                .andExpect(jsonPath("$.estadoCaja").value("abierta"));

        mockMvc.perform(get("/api/cajas-diarias/abierta")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fechaOperacion").value(FECHA_OPERACION.toString()))
                .andExpect(jsonPath("$.estadoCaja").value("abierta"));
    }

    @Test
    void noPermiteAbrirDosCajasParaLaMismaFecha() throws Exception {
        String tokenGerente = iniciarSesion(USUARIO_GERENTE);

        mockMvc.perform(post("/api/cajas-diarias")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenGerente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestApertura(FECHA_DUPLICADA))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/cajas-diarias")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenGerente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestApertura(FECHA_DUPLICADA))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Ya existe una caja diaria para la fecha indicada"));
    }

    private Map<String, Object> requestApertura(LocalDate fechaOperacion) {
        return Map.of(
                "fechaOperacion", fechaOperacion.toString(),
                "valorBase", new BigDecimal("300000.00"),
                "observaciones", "test_caja_apertura");
    }

    private String iniciarSesion(String nombreUsuario) throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombreUsuario", nombreUsuario,
                                "contrasena", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readValue(loginResponse, Map.class).get("token").toString();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private void crearUsuarioConCredencial(String nombreUsuario, String nombreCompleto, String nombreRol) {
        UUID idRol = jdbcTemplate.queryForObject(
                "SELECT id_rol FROM roles WHERE nombre_rol = ?",
                UUID.class,
                nombreRol);
        UUID idUsuario = jdbcTemplate.queryForObject("""
                INSERT INTO usuarios (id_rol, nombre_usuario, nombre_completo, estado)
                VALUES (?, ?, ?, 'activo'::estado_usuario_enum)
                RETURNING id_usuario
                """, UUID.class, idRol, nombreUsuario, nombreCompleto);
        jdbcTemplate.update("""
                INSERT INTO credenciales_usuario (
                    id_usuario,
                    contrasena_hash,
                    requiere_cambio_contrasena,
                    intentos_fallidos,
                    estado
                )
                VALUES (?, ?, false, 0, 'activa'::estado_credencial_enum)
                """, idUsuario, passwordEncoder.encode(PASSWORD));
    }

    private void limpiarDatosDePrueba() {
        jdbcTemplate.update("""
                DELETE FROM ventas
                WHERE id_caja_diaria IN (
                    SELECT id_caja_diaria FROM cajas_diarias
                    WHERE observaciones LIKE 'test_%'
                    OR fecha_operacion >= DATE '2099-01-01'
                )
                """);
        jdbcTemplate.update("""
                DELETE FROM cierres_caja
                WHERE id_caja_diaria IN (
                    SELECT id_caja_diaria FROM cajas_diarias
                    WHERE observaciones LIKE 'test_%'
                    OR fecha_operacion >= DATE '2099-01-01'
                )
                """);
        jdbcTemplate.update("""
                DELETE FROM cajas_diarias
                WHERE observaciones LIKE 'test_%'
                OR fecha_operacion >= DATE '2099-01-01'
                """);
        jdbcTemplate.update("""
                DELETE FROM sesiones_usuario
                WHERE id_usuario IN (
                    SELECT id_usuario FROM usuarios WHERE nombre_usuario LIKE 'test_caja_%'
                )
                """);
        jdbcTemplate.update("""
                DELETE FROM credenciales_usuario
                WHERE id_usuario IN (
                    SELECT id_usuario FROM usuarios WHERE nombre_usuario LIKE 'test_caja_%'
                )
                """);
        jdbcTemplate.update("DELETE FROM usuarios WHERE nombre_usuario LIKE 'test_caja_%'");
    }
}
