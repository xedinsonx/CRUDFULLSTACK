# Jenkins (CI/CD)

Servicio **Jenkins** corriendo en Docker para el pipeline del CRUD fullstack, junto al stack de la app en `docker-compose.yml`.

## Imagen (`jenkins/Dockerfile`)

Base `jenkins/jenkins:lts-jdk17`. Añade, como root:

- `maven`, `curl`, `ca-certificates`, `xz-utils` (apt)
- **Node.js 22.18.0** (tarball oficial, extraído a `/usr/local`) + npm
- **Docker CLI 29.8.0** (binario estático oficial de `download.docker.com`: instala `docker` y `dockerd` en `/usr/local/bin`)
- **docker compose v5.5.1** (binario en `/usr/local/bin/docker-compose` + symlink como plugin de Docker en `/usr/local/lib/docker/cli-plugins/docker-compose`)

> Nota: el paquete apt `docker.io` instala `dockerd` pero **no** el cliente; por eso se usa el binario estático de Docker.

## Servicio (`docker-compose.yml`)

```yaml
jenkins:
  build: ./jenkins
  container_name: jenkins
  user: root          # necesario para gestionar el socket de Docker
  ports:
    - "8088:8080"     # UI de Jenkins
    - "50000:50000"   # agentes/SSH
  volumes:
    - jenkins_home:/var/jenkins_home
    - /var/run/docker.sock:/var/run/docker.sock   # docker-outside-of-docker
  restart: unless-stopped
```

## Primer arranque

```powershell
docker compose build jenkins
docker compose up -d
```

- UI en **http://localhost:8088**
- Password inicial:

```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

- Completar el asistente y los plugins. Los usados en este proyecto: **git**, **workflow-aggregator** (Pipeline), **nodejs**, **docker-workflow**. Se instalaron con `jenkins-plugin-manager` descargando los `.jpi` en `/var/jenkins_home/plugins`.

## Conectar el repositorio

1. Crear un token de acceso en GitHub (Settings → Developer settings → Personal access tokens) con permiso `repo`.
2. Jenkins → Manage Jenkins → Credentials → Add Credentials, tipo **Username with password** (usuario + token como password).
3. Crear job: **New Item → Pipeline** con **SCM: Git**, URL `https://github.com/xedinsonx/CRUDFULLSTACK.git`, la credencial anterior y **Script path: `Jenkinsfile`**.

## Pipeline (`Jenkinsfile`)

| Etapa | Qué hace |
|-------|----------|
| Checkout | Clona el repo (`checkout scm`) |
| Build Backend | `mvn -f backend/pom.xml -q -DskipTests clean package` + archivado de `backend/target/backend.jar` |
| Build Frontend | `npm ci` + `npm run build -- --configuration production` + archivado de `dist/**` |
| Deploy | `docker compose -f docker-compose.app.yml -p crudfullstack up -d --build db backend frontend` |
| post | Publica resultados JUnit (`backend/target/surefire-reports/*.xml`) y mensajes de éxito/fallo |

El pipeline usa **Docker del host** vía el socket montado (`docker-outside-of-docker`): construye las imágenes del backend/frontend y levanta el stack real de la app.

## `docker-compose.app.yml`

Compose **solo para el despliegue de la app** (`db`, `backend`, `frontend`, volumen `oracle_data`), sin el servicio Jenkins. Es el que usa el pipeline para no recrear al propio Jenkins durante el deploy.

```powershell
docker compose -f docker-compose.app.yml -p crudfullstack up -d --build db backend frontend
```

## Comandos útiles

```powershell
docker compose logs -f jenkins        # logs del servidor
docker compose build jenkins          # reconstruir la imagen custom
docker start jenkins / docker stop jenkins   # arrancar/parar (está bajo demanda)
```

## Notas

- **Estado actual:** Jenkins está **detenido** (se paró para liberar memoria del clúster local). Se levanta con `docker start jenkins`.
- Los puertos: `8088` (UI) y `50000` (agentes). El stack de la app sigue en `8080` (backend) y `4200` (frontend); Oracle en host `1522`.
- Jenkins corre como `root` porque necesita montar y usar `/var/run/docker.sock`; el servidor final queda como usuario `jenkins` (`USER jenkins` al final del Dockerfile).