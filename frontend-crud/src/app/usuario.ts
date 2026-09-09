export interface Usuario {
	id?: number;
	nombre: string;
	correo: string;
	rol: string;
	activo: boolean;
	seleccionado?: boolean;
}
