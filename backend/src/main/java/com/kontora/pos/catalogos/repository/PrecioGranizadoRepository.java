package com.kontora.pos.catalogos.repository;

import com.kontora.pos.catalogos.domain.PrecioGranizado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PrecioGranizadoRepository extends JpaRepository<PrecioGranizado, UUID> {

    @Query(value = """
            SELECT pg.*
            FROM precios_granizado pg
            JOIN tipos_granizado tg ON tg.id_tipo_granizado = pg.id_tipo_granizado
            JOIN tamanos_vaso tv ON tv.id_tamano_vaso = pg.id_tamano_vaso
            WHERE pg.estado = 'activo'
              AND tg.estado = 'activo'
              AND tv.estado = 'activo'
              AND pg.fecha_inicio_vigencia <= :fecha
              AND (pg.fecha_fin_vigencia IS NULL OR pg.fecha_fin_vigencia >= :fecha)
            ORDER BY tg.nombre_tipo, tv.onzas
            """, nativeQuery = true)
    List<PrecioGranizado> findVigentes(@Param("fecha") LocalDate fecha);
}
