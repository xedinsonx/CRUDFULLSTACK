# Frontend CRUD de usuarios

Aplicacion Angular para consultar y administrar usuarios a traves de una API REST desarrollada con Spring Boot. El backend es el responsable de conectarse a Oracle; Angular se comunica unicamente con el backend mediante HTTP.

## 1. Arquitectura del flujo

```text
Navegador (Angular)
        |
        | http://localhost:4200/api/usuarios
        v
Proxy de Angular (desarrollo)
        |
        | http://localhost:8080/api/usuarios
        v
Spring Boot
        |
        v
Oracle
```

El navegador nunca se conecta directamente a Oracle.

## 2. Requisitos

- Node.js y npm instalados.
- Angular CLI 22.1.7.
- Java y Maven instalados para el backend.
- Spring Boot ejecutandose en el puerto `8080`.
- Oracle disponible y configurado en Spring Boot.

Comprobar Angular:

```powershell
ng version
```

## 3. Creacion del proyecto

La carpeta `frontend-crud` se creo como un workspace Angular standalone:

```powershell
cd E:\Programacion\Frontend\Repository
ng new frontend-crud --directory frontend-crud --routing --style css --standalone --ssr=false --skip-git --defaults
```

El nombre `frontend-crud` es necesario. Angular CLI no acepta `.` como nombre del proyecto.

Entrar al workspace:

```powershell
cd E:\Programacion\Frontend\Repository\frontend-crud
```

## 4. Estructura principal

```text
frontend-crud/
├── angular.json
├── package.json
├── proxy.conf.json
├── src/
│   ├── styles.css
│   └── app/
│       ├── app.config.ts
│       ├── app.html
│       ├── app.routes.ts
│       ├── usuario.ts
│       ├── usuario.service.ts
│       └── usuarios/
│           ├── usuarios.ts
│           ├── usuarios.html
│           ├── usuarios.css
│           └── usuarios.spec.ts
└── README.md
```

`angular.json` identifica el workspace. Los comandos `ng serve`, `ng build` y `ng test` deben ejecutarse desde esta carpeta.

## 5. Generacion de componentes y servicios

```powershell
ng generate component usuarios
ng generate service usuario
```

Angular creo el componente en `src/app/usuarios/` y el servicio base en `src/app/usuario.ts`. Luego el servicio se implemento en el archivo convencional `usuario.service.ts`.

## 6. Modelo de datos

El archivo `src/app/usuario.ts` define la forma de los datos que intercambian Angular y Spring Boot:

```typescript
export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  seleccionado?: boolean;
}
```

`seleccionado` solo se usa en la interfaz para marcar usuarios antes de eliminarlos. No deberia ser necesario almacenarlo en Oracle.

## 7. Servicio HTTP

`src/app/usuario.service.ts` centraliza las llamadas a la API:

- `GET /api/usuarios`: listar usuarios.
- `POST /api/usuarios`: crear un usuario.
- `PUT /api/usuarios/{id}`: actualizar un usuario.
- `DELETE /api/usuarios/{id}`: eliminar un usuario.

La URL del servicio es `/api/usuarios`, no una URL absoluta. Esto permite que el proxy de desarrollo evite problemas de CORS.

## 8. Configuracion de HttpClient

En `src/app/app.config.ts` se registra:

```typescript
provideHttpClient()
```

Sin este proveedor, Angular no puede inyectar `HttpClient` en `UsuarioService`.

## 9. Componente de usuarios

`src/app/usuarios/usuarios.ts` contiene la logica de pantalla:

- `listar()` solicita los usuarios al backend.
- `crear()` envia el formulario con `POST` y agrega la respuesta a la lista.
- `editar()` carga un registro en el formulario.
- `actualizar()` envia los cambios con `PUT`.
- `eliminar()` elimina un usuario.
- `eliminarSeleccionados()` ejecuta varios `DELETE` para los checkboxes marcados.

El componente importa `FormsModule` para `[(ngModel)]` y `CommonModule` para `*ngFor` y `*ngIf`.

## 10. Plantilla y uso

La plantilla `usuarios.html` contiene:

- Boton `Listar usuarios`.
- Tarjetas con nombre, correo y rol.
- Checkbox por usuario.
- Botones `Actualizar` y `Eliminar` debajo de cada registro.
- Boton `Eliminar seleccionados`.
- Formulario para nombre, correo, rol y estado activo.
- Mensajes de exito y error.

Flujo para crear:

1. Escribir nombre, correo y rol.
2. Dejar marcado `Usuario activo` si corresponde.
3. Pulsar `Crear usuario`.
4. Verificar el mensaje de confirmacion.

Flujo para actualizar:

1. Pulsar `Actualizar` en una tarjeta.
2. Modificar los campos del formulario.
3. Pulsar `Guardar cambios`.

Flujo para eliminar varios:

1. Marcar los checkboxes de los usuarios.
2. Pulsar `Eliminar seleccionados`.

## 11. Proxy contra Spring Boot

El archivo `proxy.conf.json` redirige las llamadas:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Esta configuracion esta asociada al servidor de Angular en `angular.json`. Cada vez que se modifica el proxy hay que detener y volver a iniciar `ng serve`.

## 12. Ejecucion completa

### Terminal 1: backend

Desde el proyecto Spring Boot:

```powershell
mvn spring-boot:run
```

Comprobar la API:

```text
http://localhost:8080/api/usuarios
```

Una respuesta `200` con `[]` significa que la API funciona, pero no hay registros. Una respuesta con objetos significa que Oracle esta devolviendo usuarios.

### Terminal 2: frontend

Desde `frontend-crud`:

```powershell
ng serve -o
```

Abrir:

```text
http://localhost:4200
```

Si la terminal esta ubicada en `Repository` en vez de `frontend-crud`, usar:

```powershell
npm --prefix .\frontend-crud start -- --host localhost --port 4200
```

No debe haber dos servidores usando el puerto `4200`.

## 13. Validacion

Compilar:

```powershell
ng build --no-progress
```

Ejecutar pruebas:

```powershell
ng test --no-watch --no-progress
```

Las pruebas actuales verifican la aplicacion, el componente y el servicio.

## 14. Diagnostico de errores

### `outside a workspace`

El comando se ejecuto fuera de `frontend-crud`. Ejecutar:

```powershell
cd E:\Programacion\Frontend\Repository\frontend-crud
```

### `ERR_CONNECTION_REFUSED` en `localhost:4200`

Angular no esta ejecutandose. Iniciar `ng serve -o` y mantener abierta esa terminal.

### `Port 4200 is already in use`

Ya existe un servidor Angular activo. Usar el servidor existente o detenerlo antes de iniciar otro.

### Error `status 0` o `Failed to fetch`

Revisar que:

1. Spring Boot este activo en `8080`.
2. La URL `http://localhost:8080/api/usuarios` responda.
3. Angular se haya reiniciado despues de configurar el proxy.

### Error HTTP `400` al crear

El backend esta rechazando el JSON. El frontend envia:

```json
{
  "nombre": "Ana",
  "correo": "ana@empresa.com",
  "rol": "ADMIN",
  "activo": true
}
```

Los nombres deben coincidir con el DTO o entidad que espera Spring Boot.

### Error HTTP `404` al actualizar o eliminar

Verificar que el backend tenga estas rutas:

```text
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}
```

## 15. Nota sobre Oracle

Angular no necesita las credenciales de Oracle. La configuracion de usuario, contrasena, URL JDBC, esquema y tablas pertenece exclusivamente al backend Spring Boot. El frontend solo necesita conocer el contrato HTTP de la API.
