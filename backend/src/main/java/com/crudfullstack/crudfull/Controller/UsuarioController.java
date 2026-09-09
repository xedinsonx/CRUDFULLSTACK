package com.crudfullstack.crudfull.Controller;

import com.crudfullstack.crudfull.Entidad.Usuario;
import com.crudfullstack.crudfull.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    @Autowired
    private UsuarioService service;

    @GetMapping
    public List<Usuario> listar() { return service.listar(); }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtener(@PathVariable Long id) {
        return service.obtener(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping
    public Usuario crear(@RequestBody Usuario u) { return service.crear(u);}

    @PutMapping("/{id}")
    public Usuario actualizar(@PathVariable Long id, @RequestBody Usuario u) {
        return service.actualizar(id, u);
    }
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id){ service.eliminar(id);}

}
