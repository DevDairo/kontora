package com.kontora.pos.caja.repository;

import com.kontora.pos.caja.domain.CierreCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CierreCajaRepository extends JpaRepository<CierreCaja, UUID> {
}
