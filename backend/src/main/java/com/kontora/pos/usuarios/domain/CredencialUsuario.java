package com.kontora.pos.usuarios.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "credenciales_usuario")
public class CredencialUsuario {

    @Id
    @Column(name = "id_credencial_usuario", nullable = false)
    private UUID idCredencialUsuario;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "contrasena_hash", nullable = false)
    private String contrasenaHash;

    @Column(name = "requiere_cambio_contrasena", nullable = false)
    private boolean requiereCambioContrasena;

    @Column(name = "intentos_fallidos", nullable = false)
    private int intentosFallidos;

    @Column(name = "fecha_ultimo_acceso")
    private OffsetDateTime fechaUltimoAcceso;

    @Column(name = "fecha_cambio_contrasena")
    private OffsetDateTime fechaCambioContrasena;

    @Column(name = "estado", nullable = false, columnDefinition = "estado_credencial_enum")
    @ColumnTransformer(write = "?::estado_credencial_enum")
    private String estado;

    public UUID getIdCredencialUsuario() {
        return idCredencialUsuario;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getContrasenaHash() {
        return contrasenaHash;
    }

    public boolean isRequiereCambioContrasena() {
        return requiereCambioContrasena;
    }

    public int getIntentosFallidos() {
        return intentosFallidos;
    }

    public void setIntentosFallidos(int intentosFallidos) {
        this.intentosFallidos = intentosFallidos;
    }

    public OffsetDateTime getFechaUltimoAcceso() {
        return fechaUltimoAcceso;
    }

    public void setFechaUltimoAcceso(OffsetDateTime fechaUltimoAcceso) {
        this.fechaUltimoAcceso = fechaUltimoAcceso;
    }

    public OffsetDateTime getFechaCambioContrasena() {
        return fechaCambioContrasena;
    }

    public String getEstado() {
        return estado;
    }
}

