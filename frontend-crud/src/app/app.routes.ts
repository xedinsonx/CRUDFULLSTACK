import { Routes } from '@angular/router';
import { UsuariosComponent } from './usuarios/usuarios';

export const routes: Routes = [
	{ path: '', component: UsuariosComponent },
	{ path: '**', redirectTo: '' },
];
