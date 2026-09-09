# Deploy en Kubernetes (Docker Desktop)

Despliega el stack completo **CRUD fullstack** (Oracle XE + Spring Boot + Angular) como clúster local en Docker Desktop.

## Arquitectura

```
Namespace: crudfullstack
├── oracle (StatefulSet, 1 réplica)
│     ├── PV  oracle-pv (hostPath /var/lib/docker/crudfullstack/oracle, 5Gi, storageClass manual, Retain)
│     ├── PVC oracle-data-oracle-0 (auto via volumeClaimTemplates)
│     ├── initContainer fix-perms: chown -R 54321:54321 /opt/oracle/oradata (usuario oracle)
│     └── Service db (LoadBalancer) port 1522 → targetPort 1521
├── backend (Deployment, 1 réplica)
│     ├── ConfigMap backend-config (DB_HOST=db, DB_PORT=1522, credenciales, Hikari timeout)
│     └── Service backend (ClusterIP) port 8080 → 8080
└── frontend (Deployment, 1 réplica, nginx con proxy /api/ → backend:8080)
      └── Service frontend (LoadBalancer) port 4200 → targetPort 80
```

## Requisitos

- Docker Desktop con **Kubernetes habilitado** (Settings → Kubernetes → Enable). Contexto `docker-desktop`.
- `kubectl` en el PATH.
- Imágenes locales construidas: `crudfullstack-backend:latest` y `crudfullstack-frontend:latest`
  (`docker build -t crudfullstack-backend backend` y `docker build -t crudfullstack-frontend frontend-crud`).

## Desplegar

Aplicar **en este orden** (el namespace primero):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/db/ -f k8s/backend/ -f k8s/frontend/
```

> Solo funciona si las imágenes `crudfullstack-backend:latest` / `crudfullstack-frontend:latest` ya existen en el daemon de Docker (Kubernetes las toma de ahí por ser pod local).

Verificar:

```bash
kubectl get pods -n crudfullstack -o wide
kubectl get svc -n crudfullstack
```

## Acceso

| Recurso        | URL / puerto                             |
|----------------|------------------------------------------|
| Aplicación     | http://localhost:4200                    |
| API REST       | http://localhost:4200/api/usuarios       |
| Oracle (SQL dev)| localhost:1522 (system / tu_password, SID XE) |
| Alternativa API | `kubectl port-forward -n crudfullstack svc/backend 8080:8080` |

## Detalles importantes

- **Oracle no puede correr como root.** El contenedor corre como usuario `oracle` (UID 54321); el initContainer `fix-perms` ajusta la propiedad del volumen. Si lanzas el pod con `runAsUser: 0`, el listener falla con `SNL-00016: Permission denied`.
- **hostPath no copia los datafiles** a la primera (a diferencia del volumen nombrado de Docker); por eso hace falta el `chown` del initContainer.
- **El backend usa el puerto 1522 del Service `db`** (`DB_PORT=1522`), porque el Service expone `1522 → 1521`. Con `DB_PORT=1521` verás `Connection refused`.
- `ORACLE_PASSWORD` solo se aplica en el **primer arranque** del volumen. Si el volumen ya tiene datos, cambiar la variable no cambia la password.
- El `readinessProbe` del backend golpea `/api/usuarios`; el pod solo queda Ready cuando la BD responde.

## Solución de problemas

| Síntoma | Causa / solución |
|---------|------------------|
| `HikariPool-1 - Starting...` sin avanzar | La BD no conecta; revisar `kubectl logs deploy/backend` para `Connection refused` (puerto) u `ORA-01017` (credenciales). |
| `Connection refused` a `db:1521` | El Service expone 1522; asegurar `DB_PORT=1522` en el ConfigMap (`kubectl rollout restart deployment/backend` tras cambiar). |
| `ORA-01017: invalid username/password` | El volumen quedó inicializado con otra password (p.ej. tras un init como root). Limpiarlo: `kubectl delete pod -n crudfullstack oracle-0` y aplicar `k8s/db/volwipe.yaml` (borra `/opt/oracle/oradata/*`, luego el pod se recrea solo). |
| `SNL-00016: Permission denied` | Oracle corriendo como root. Quitar `runAsUser: 0` del pod y usar el initContainer `fix-perms`. |
| Timeouts de `kubectl` / engine | La VM de WSL2 sin memoria. Con 8 GB de RAM host, usar un `.wslconfig` con `memory=6GB` y `swap=4GB` (ver `C:\Users\<tu-usuario>\.wslconfig`) y reiniciar Docker Desktop (`wsl --shutdown`). |
| Pods `Error`/`Unknown` tras reiniciar Docker Desktop | Normal tras un apagado brusco; los controllers los recrean en ~1-2 min. |

## Reiniciar / limpiar la BD

```bash
# Borrar la instancia y que se reinicialice desde cero
kubectl delete pod -n crudfullstack oracle-0
# Si además quieres vaciar el volumen (aplicar tras borrar el pod)
kubectl apply -f k8s/db/volwipe.yaml
```

## Recursos

- `k8s/namespace.yaml` — namespace `crudfullstack`
- `k8s/db/persistentvolume.yaml` — PV hostPath `oracle-pv`
- `k8s/db/statefulset.yaml` — StatefulSet `oracle` + initContainer + PVC
- `k8s/db/service.yaml` — Service `db` (LoadBalancer 1522)
- `k8s/backend/configmap.yaml` — variables del backend
- `k8s/backend/deployment.yaml` — Deployment `backend` (probe `/api/usuarios`)
- `k8s/backend/service.yaml` — Service `backend` (ClusterIP)
- `k8s/frontend/deployment.yaml` — Deployment `frontend` (nginx)
- `k8s/frontend/service.yaml` — Service `frontend` (LoadBalancer 4200)