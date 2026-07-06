package com.kontora.pos.usuarios.controller;

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

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class AutenticacionIntegrationTest {

    private static final String USERNAME_ACTIVO = "test_auth_activo";
    private static final String USERNAME_BLOQUEADO = "test_auth_bloqueado";
    private static final String PASSWORD = "Clave12345";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        limpiarUsuariosDePrueba();
        crearUsuarioConCredencial(USERNAME_ACTIVO, "Usuario Activo", "activo", "activa");
        crearUsuarioConCredencial(USERNAME_BLOQUEADO, "Usuario Bloqueado", "bloqueado", "activa");
    }

    @Test
    void loginMeYLogoutFuncionanConSesionPersistida() throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombreUsuario", USERNAME_ACTIVO,
                                "contrasena", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoToken").value("Bearer"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = objectMapper.readValue(loginResponse, Map.class).get("token").toString();

        Integer sesionesActivas = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sesiones_usuario su
                JOIN usuarios u ON u.id_usuario = su.id_usuario
                WHERE u.nombre_usuario = ? AND su.estado_sesion = 'activa'
                """, Integer.class, USERNAME_ACTIVO);
        assertThat(sesionesActivas).isEqualTo(1);

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreUsuario").value(USERNAME_ACTIVO))
                .andExpect(jsonPath("$.nombreRol").value("vendedor"));

        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioBloqueadoNoPuedeIniciarSesion() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombreUsuario", USERNAME_BLOQUEADO,
                                "contrasena", PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Usuario inactivo o bloqueado"));
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private void crearUsuarioConCredencial(String nombreUsuario, String nombreCompleto, String estadoUsuario, String estadoCredencial) {
        UUID idRol = jdbcTemplate.queryForObject(
                "SELECT id_rol FROM roles WHERE nombre_rol = 'vendedor'",
                UUID.class);
        UUID idUsuario = jdbcTemplate.queryForObject("""
                INSERT INTO usuarios (id_rol, nombre_usuario, nombre_completo, estado)
                VALUES (?, ?, ?, ?::estado_usuario_enum)
                RETURNING id_usuario
                """, UUID.class, idRol, nombreUsuario, nombreCompleto, estadoUsuario);
        jdbcTemplate.update("""
                INSERT INTO credenciales_usuario (
                    id_usuario,
                    contrasena_hash,
                    requiere_cambio_contrasena,
                    intentos_fallidos,
                    estado
                )
                VALUES (?, ?, false, 0, ?::estado_credencial_enum)
                """, idUsuario, passwordEncoder.encode(PASSWORD), estadoCredencial);
    }

    private void limpiarUsuariosDePrueba() {
        jdbcTemplate.update("""
                DELETE FROM sesiones_usuario
                WHERE id_usuario IN (
                    SELECT id_usuario FROM usuarios WHERE nombre_usuario LIKE 'test_auth_%'
                )
                """);
        jdbcTemplate.update("""
                DELETE FROM credenciales_usuario
                WHERE id_usuario IN (
                    SELECT id_usuario FROM usuarios WHERE nombre_usuario LIKE 'test_auth_%'
                )
                """);
        jdbcTemplate.update("DELETE FROM usuarios WHERE nombre_usuario LIKE 'test_auth_%'");
    }
}
