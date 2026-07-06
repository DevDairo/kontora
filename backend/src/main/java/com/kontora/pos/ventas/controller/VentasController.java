package com.kontora.pos.ventas.controller;

import com.kontora.pos.common.security.PrincipalUsuario;
import com.kontora.pos.ventas.dto.RegistrarVentaRequest;
import com.kontora.pos.ventas.dto.VentaResponse;
import com.kontora.pos.ventas.service.VentasService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ventas")
public class VentasController {

    private final VentasService ventasService;

    public VentasController(VentasService ventasService) {
        this.ventasService = ventasService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse registrarVenta(
            @Valid @RequestBody RegistrarVentaRequest request,
            Authentication authentication) {
        return ventasService.registrarVenta(request, (PrincipalUsuario) authentication.getPrincipal());
    }
}
