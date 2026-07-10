package com.kontora.pos.caja.service;

import com.kontora.pos.auditoria.service.AuditoriaService;
import com.kontora.pos.caja.dto.RegistrarGastoCajaRequest;
import com.kontora.pos.caja.repository.AdicionDiariaRepository;
import com.kontora.pos.caja.repository.CajaDiariaRepository;
import com.kontora.pos.caja.repository.GastoCajaRepository;
import com.kontora.pos.caja.repository.PagoTrabajadoresDiarioRepository;
import com.kontora.pos.common.exception.ApiException;
import com.kontora.pos.common.security.PrincipalUsuario;
import com.kontora.pos.usuarios.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OperacionesCajaServiceTest {

    @Test
    void noRegistraGastoSinCajaAbierta() {
        CajaDiariaRepository cajaDiariaRepository = mock(CajaDiariaRepository.class);
        when(cajaDiariaRepository.findPrimeraPorEstadoCaja("abierta")).thenReturn(Optional.empty());
        OperacionesCajaService service = new OperacionesCajaService(
                cajaDiariaRepository,
                mock(UsuarioRepository.class),
                mock(AdicionDiariaRepository.class),
                mock(PagoTrabajadoresDiarioRepository.class),
                mock(GastoCajaRepository.class),
                mock(EntityManager.class),
                mock(AuditoriaService.class));
        PrincipalUsuario principalUsuario = new PrincipalUsuario(
                UUID.randomUUID(),
                "test_vendedor",
                "Vendedor de prueba",
                "vendedor",
                "token-prueba");

        assertThatThrownBy(() -> service.registrarGastoCaja(
                new RegistrarGastoCajaRequest(new BigDecimal("12000.00"), "Compra hielo"),
                principalUsuario))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("No existe caja diaria abierta para operaciones de caja");
                });
    }
}
