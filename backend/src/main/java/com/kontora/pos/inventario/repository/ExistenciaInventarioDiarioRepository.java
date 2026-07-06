package com.kontora.pos.inventario.repository;

import com.kontora.pos.inventario.domain.ExistenciaInventarioDiario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExistenciaInventarioDiarioRepository extends JpaRepository<ExistenciaInventarioDiario, UUID> {

    @EntityGraph(attributePaths = {
            "cajaDiaria",
            "itemInventario",
            "itemInventario.categoriaInventario",
            "itemInventario.unidadMedida",
            "itemInventario.tamanoVaso"
    })
    @Query("""
            SELECT e
            FROM ExistenciaInventarioDiario e
            WHERE e.cajaDiaria.idCajaDiaria = :idCajaDiaria
            ORDER BY e.itemInventario.nombreItem
            """)
    List<ExistenciaInventarioDiario> findByCaja(@Param("idCajaDiaria") UUID idCajaDiaria);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT e
            FROM ExistenciaInventarioDiario e
            WHERE e.cajaDiaria.idCajaDiaria = :idCajaDiaria
              AND e.itemInventario.idItemInventario = :idItemInventario
            """)
    Optional<ExistenciaInventarioDiario> findByCajaAndItemForUpdate(
            @Param("idCajaDiaria") UUID idCajaDiaria,
            @Param("idItemInventario") UUID idItemInventario);
}
