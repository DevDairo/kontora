package com.kontora.pos.consultas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ConsultaVentaResponse(
        UUID idVenta,
        UUID idCajaDiaria,
        LocalDate fechaOperacion,
        Long numeroVenta,
        OffsetDateTime fechaVenta,
        String estadoVenta,
        String tipoComprador,
        UUID idUsuarioVendedor,
        String nombreUsuarioVendedor,
        BigDecimal subtotalVenta,
        BigDecimal descuentoPromocion,
        BigDecimal totalVenta,
        BigDecimal totalPagado,
        BigDecimal totalEfectivo,
        BigDecimal totalTransferencia
) {
}
