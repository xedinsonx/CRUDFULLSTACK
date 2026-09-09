package com.crudfullstack.crudfull.Service;

import com.crudfullstack.crudfull.Entidad.Usuario;
import com.crudfullstack.crudfull.Repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository repo;

    @InjectMocks
    private UsuarioService service;

    @Test
    void testCrearUsuario() {
        Usuario u = new Usuario(null, "Edinson", "edinson@mail.com", "ADMIN", true);
        when(repo.save(any(Usuario.class))).thenReturn(new Usuario(1L, "Edinson", "edinson@mail.com", "ADMIN", true));

        Usuario result = service.crear(u);

        assertNotNull(result.getId());
        assertEquals("Edinson", result.getNombre());
    }

    @Test
    void testListarUsuarios() {
        List<Usuario> lista = Arrays.asList(
            new Usuario(1L, "Maria", "maria@mail.com", "USER", true),
            new Usuario(2L, "Juan", "juan@mail.com", "ADMIN", true)
        );
        when(repo.findAll()).thenReturn(lista);

        List<Usuario> result = service.listar();

        assertEquals(2, result.size());
    }
}
