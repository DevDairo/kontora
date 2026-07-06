package com.kontora.pos.ventas.repository;

import com.kontora.pos.ventas.domain.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, UUID> {
}
