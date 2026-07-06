package com.kontora.pos.usuarios.service;

import com.kontora.pos.common.exception.ApiException;
import com.kontora.pos.common.security.PrincipalUsuario;
import com.kontora.pos.usuarios.domain.CredencialUsuario;
import com.kontora.pos.usuarios.domain.SesionUsuario;
import com.kontora.pos.usuarios.domain.Usuario;
import com.kontora.pos.usuarios.dto.LoginRequest;
import com.kontora.pos.usuarios.dto.LoginResponse;
import com.kontora.pos.usuarios.dto.UsuarioAutenticadoResponse;
import com.kontora.pos.usuarios.repository.CredencialUsuarioRepository;
import com.kontora.pos.usuarios.repository.SesionUsuarioRepository;
import com.kontora.pos.usuarios.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AutenticacionService {

    private final UsuarioRepository usuarioRepository;
    private final CredencialUsuarioRepository credencialUsuarioRepository;
    private final SesionUsuarioRepository sesionUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AutenticacionService(
            UsuarioRepository usuarioRepository,
            CredencialUsuarioRepository credencialUsuarioRepository,
            SesionUsuarioRepository sesionUsuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.credencialUsuarioRepository = credencialUsuarioRepository;
        this.sesionUsuarioRepository = sesionUsuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, String direccionIp, String userAgent) {
        String nombreUsuario = request.nombreUsuario().trim();
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> credencialesInvalidas());
        validarUsuarioActivo(usuario);

        CredencialUsuario credencial = credencialUsuarioRepository.findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElseThrow(() -> credencialesInvalidas());
        validarCredencialActiva(credencial);
        validarContrasena(request.contrasena(), credencial);

        JwtService.TokenGenerado tokenGenerado = jwtService.generarToken(usuario);
        OffsetDateTime fechaInicio = OffsetDateTime.ofInstant(tokenGenerado.fechaInicio(), ZoneOffset.UTC);
        OffsetDateTime fechaExpiracion = OffsetDateTime.ofInstant(tokenGenerado.fechaExpiracion(), ZoneOffset.UTC);

        credencial.setIntentosFallidos(0);
        credencial.setFechaUltimoAcceso(fechaInicio);
        credencialUsuarioRepository.save(credencial);
        sesionUsuarioRepository.save(crearSesion(usuario, tokenGenerado, fechaInicio, fechaExpiracion, direccionIp, userAgent));

        return new LoginResponse(
                tokenGenerado.token(),
                "Bearer",
                tokenGenerado.expiraEnMinutos(),
                fechaExpiracion,
                usuario.getIdUsuario(),
                usuario.getNombreUsuario(),
                usuario.getNombreCompleto(),
                usuario.getRol().getNombreRol(),
                credencial.isRequiereCambioContrasena());
    }

    @Transactional
    public void logout(PrincipalUsuario principalUsuario) {
        SesionUsuario sesion = sesionUsuarioRepository.findByTokenIdentificador(principalUsuario.tokenIdentificador())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sesion no encontrada"));
        sesion.setEstadoSesion("cerrada");
        sesion.setFechaCierre(OffsetDateTime.now());
        sesionUsuarioRepository.save(sesion);
    }

    public UsuarioAutenticadoResponse obtenerUsuarioAutenticado(PrincipalUsuario principalUsuario) {
        return new UsuarioAutenticadoResponse(
                principalUsuario.idUsuario(),
                principalUsuario.nombreUsuario(),
                principalUsuario.nombreCompleto(),
                principalUsuario.nombreRol());
    }

    private void validarUsuarioActivo(Usuario usuario) {
        if (!"activo".equals(usuario.getEstado())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuario inactivo o bloqueado");
        }
    }

    private void validarCredencialActiva(CredencialUsuario credencial) {
        if (!"activa".equals(credencial.getEstado())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credencial no activa");
        }
    }

    private void validarContrasena(String contrasena, CredencialUsuario credencial) {
        if (!passwordEncoder.matches(contrasena, credencial.getContrasenaHash())) {
            credencial.setIntentosFallidos(credencial.getIntentosFallidos() + 1);
            credencialUsuarioRepository.save(credencial);
            throw credencialesInvalidas();
        }
    }

    private SesionUsuario crearSesion(
            Usuario usuario,
            JwtService.TokenGenerado tokenGenerado,
            OffsetDateTime fechaInicio,
            OffsetDateTime fechaExpiracion,
            String direccionIp,
            String userAgent) {
        SesionUsuario sesion = new SesionUsuario();
        sesion.setUsuario(usuario);
        sesion.setTokenIdentificador(tokenGenerado.tokenIdentificador());
        sesion.setFechaInicio(fechaInicio);
        sesion.setFechaExpiracion(fechaExpiracion);
        sesion.setEstadoSesion("activa");
        sesion.setDireccionIp(direccionIp);
        sesion.setUserAgent(userAgent);
        return sesion;
    }

    private ApiException credencialesInvalidas() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
    }
}

