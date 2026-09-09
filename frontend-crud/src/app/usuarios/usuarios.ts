import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Usuario } from '../usuario';
import { UsuarioService } from '../usuario.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-usuarios',
  styleUrl: './usuarios.css',
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  nuevoUsuario: Usuario = { nombre: '', correo: '', rol: '', activo: true };
  usuarioEditandoId: number | null = null;
  mensaje = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.listar();
  }

  listar() {
    this.mensaje = '';
    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = data;
        this.mensaje = 'Usuarios cargados correctamente.';
      },
      error: () => this.mensaje = 'No se pudieron cargar los usuarios.',
    });
  }

  crear() {
    this.mensaje = '';
    this.usuarioService.crear(this.nuevoUsuario).subscribe({
      next: usuario => {
        this.usuarios.push(usuario);
        this.nuevoUsuario = { nombre: '', correo: '', rol: '', activo: true };
        this.mensaje = 'Usuario creado exitosamente.';
      },
      error: () => this.mensaje = 'No se pudo crear el usuario.',
    });
  }

  editar(usuario: Usuario) {
    if (usuario.id === undefined) {
      return;
    }

    this.usuarioEditandoId = usuario.id;
    this.nuevoUsuario = { ...usuario };
    this.mensaje = '';
  }

  actualizar() {
    if (this.usuarioEditandoId === null) {
      return;
    }

    this.mensaje = '';
    this.usuarioService.actualizar(this.usuarioEditandoId, this.nuevoUsuario).subscribe({
      next: usuarioActualizado => {
        this.usuarios = this.usuarios.map(usuario =>
          usuario.id === usuarioActualizado.id ? usuarioActualizado : usuario,
        );
        this.cancelarEdicion();
        this.mensaje = 'Usuario actualizado exitosamente.';
      },
      error: () => this.mensaje = 'No se pudo actualizar el usuario.',
    });
  }

  cancelarEdicion() {
    this.usuarioEditandoId = null;
    this.nuevoUsuario = { nombre: '', correo: '', rol: '', activo: true };
  }

  eliminar(id: number) {
    this.mensaje = '';
    this.usuarioService.eliminar(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(usuario => usuario.id !== id);
        this.mensaje = 'Usuario eliminado exitosamente.';
      },
      error: () => this.mensaje = 'No se pudo eliminar el usuario.',
    });
  }

  eliminarSeleccionados() {
    const ids = this.usuarios
      .filter(usuario => usuario.seleccionado && usuario.id !== undefined)
      .map(usuario => usuario.id as number);

    if (ids.length === 0) {
      this.mensaje = 'Selecciona al menos un usuario para eliminar.';
      return;
    }

    this.mensaje = '';
    forkJoin(ids.map(id => this.usuarioService.eliminar(id))).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(usuario => !ids.includes(usuario.id as number));
        this.mensaje = 'Usuarios eliminados exitosamente.';
      },
      error: () => this.mensaje = 'No se pudieron eliminar los usuarios seleccionados.',
    });
  }
}
