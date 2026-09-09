package com.crudfullstack.crudfull.Service;

import com.crudfullstack.crudfull.Entidad.Usuario;
import com.crudfullstack.crudfull.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository repo;

    public List<Usuario> listar() {
        return repo.findAll();
    }

    public Usuario crear(Usuario u) {
        return repo.save(u);
    }

    public Optional<Usuario> obtener(Long id) {
        return repo.findById(id);
    }

    public Usuario actualizar(Long id, Usuario u) {
        u.setId(id);
        return repo.save(u);
    }

    public void eliminar(Long id) {
        repo.deleteById(id);
    }
}

