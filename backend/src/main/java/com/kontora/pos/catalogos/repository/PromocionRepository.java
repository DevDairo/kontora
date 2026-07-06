package com.kontora.pos.catalogos.repository;

import com.kontora.pos.catalogos.domain.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PromocionRepository extends JpaRepository<Promocion, UUID> {

    @Query(value = """
            SELECT p.*
            FROM promociones p
            JOIN tipos_granizado tg ON tg.id_tipo_granizado = p.id_tipo_granizado
            JOIN tamanos_vaso tv ON tv.id_tamano_vaso = p.id_tamano_vaso
            WHERE p.estado = 'activo'
              AND tg.estado = 'activo'
              AND tv.estado = 'activo'
              AND p.fecha_inicio_vigencia <= :fecha
              AND (p.fecha_fin_vigencia IS NULL OR p.fecha_fin_vigencia >= :fecha)
            ORDER BY p.tipo_beneficiario, tg.nombre_tipo, tv.onzas, p.nombre_promocion
            """, nativeQuery = true)
    List<Promocion> findVigentes(@Param("fecha") LocalDate fecha);
}
