package com.kontora.pos.ventas.repository;

import com.kontora.pos.ventas.domain.Venta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VentaRepository extends JpaRepository<Venta, UUID> {

    @EntityGraph(attributePaths = {"cajaDiaria", "usuarioVendedor", "usuarioComprador"})
    Optional<Venta> findByIdVenta(UUID idVenta);
}
