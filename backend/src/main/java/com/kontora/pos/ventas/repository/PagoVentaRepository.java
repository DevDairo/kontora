package com.kontora.pos.ventas.repository;

import com.kontora.pos.ventas.domain.PagoVenta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PagoVentaRepository extends JpaRepository<PagoVenta, UUID> {

    @EntityGraph(attributePaths = "metodoPago")
    List<PagoVenta> findByVenta_IdVenta(UUID idVenta);
}
