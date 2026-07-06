package com.kontora.pos.catalogos.domain;

import com.kontora.pos.usuarios.domain.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "precios_granizado")
public class PrecioGranizado {

    @Id
    @Column(name = "id_precio_granizado", nullable = false)
    private UUID idPrecioGranizado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_granizado", nullable = false)
    private TipoGranizado tipoGranizado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tamano_vaso", nullable = false)
    private TamanoVaso tamanoVaso;

    @Column(name = "valor_precio", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorPrecio;

    @Column(name = "fecha_inicio_vigencia", nullable = false)
    private LocalDate fechaInicioVigencia;

    @Column(name = "fecha_fin_vigencia")
    private LocalDate fechaFinVigencia;

    @Column(name = "estado", nullable = false, columnDefinition = "estado_basico_enum")
    @ColumnTransformer(write = "?::estado_basico_enum")
    private String estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_creacion")
    private Usuario usuarioCreacion;

    public UUID getIdPrecioGranizado() {
        return idPrecioGranizado;
    }

    public TipoGranizado getTipoGranizado() {
        return tipoGranizado;
    }

    public TamanoVaso getTamanoVaso() {
        return tamanoVaso;
    }

    public BigDecimal getValorPrecio() {
        return valorPrecio;
    }

    public LocalDate getFechaInicioVigencia() {
        return fechaInicioVigencia;
    }

    public LocalDate getFechaFinVigencia() {
        return fechaFinVigencia;
    }

    public String getEstado() {
        return estado;
    }

    public Usuario getUsuarioCreacion() {
        return usuarioCreacion;
    }
}
