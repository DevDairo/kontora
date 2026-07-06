package com.kontora.pos.usuarios.repository;

import com.kontora.pos.usuarios.domain.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    @EntityGraph(attributePaths = "rol")
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
}

