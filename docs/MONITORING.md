# Monitoreo con Prometheus y Grafana

Monitoriza la aplicación (backend Spring Boot) y el nodo del clúster local. Todo desplegado en el namespace `monitoring` del cluster Kubernetes de Docker Desktop.

## Stack

| Componente | Rol | Imagen |
|------------|-----|--------|
| **Micrometer + Actuator** (backend) | Expone métricas de la app en `/actuator/prometheus` | — |
| **node-exporter** (DaemonSet) | Métricas del nodo (CPU, memoria) en `:9100` | `prom/node-exporter:v1.8.2` |
| **Prometheus** (Deployment) | Recoge y almacena las métricas | `prom/prometheus:v2.54.0` |
| **Grafana** (Deployment) | Dashboards | `grafana/grafana:11.2.0` |

```
monitoring namespace
├── node-exporter (DaemonSet, hostNetwork)  → nodo:9100
├── Prometheus (ServiceAccount + ClusterRole + ConfigMap)
│     scrape: backend.crudfullstack:8080/actuator/prometheus
│           : nodos (role=node) → :9100
│           : localhost:9090 (él mismo)
└── Grafana (provisioning: datasource Prometheus + dashboard JVM/Nodo)
```

## Requisitos

- El backend debe tener `spring-boot-starter-actuator` + `micrometer-registry-prometheus` (ya en `backend/pom.xml`) y el endpoint expuesto en `application.properties`:

```properties
management.endpoints.web.exposure.include=health,info,prometheus
management.metrics.export.prometheus.enabled=true
```

- Reconstruir la imagen tras tocar el backend: `docker build -t crudfullstack-backend:latest ./backend` y `kubectl rollout restart deployment/backend -n crudfullstack`.

## Desplegar

> El namespace debe crearse primero: `kubectl apply -f k8s/monitoring/namespace.yaml`

```bash
kubectl apply -f k8s/monitoring/namespace.yaml
kubectl apply -f k8s/monitoring/
```

Si metes más manifiestos en la carpeta y quieres aplicarlos a la vez, ya sabes: aplica el namespace aparte.

## Acceso

| Recurso | URL | Credenciales |
|---------|-----|--------------|
| Grafana | http://localhost:3000 | `admin` / `admin` |
| Prometheus (UI) | `kubectl port-forward -n monitoring svc/prometheus 9091:9090` → http://localhost:9091 | — |
| Métricas raw del backend | `kubectl port-forward -n crudfullstack svc/backend 8090:8080` → http://localhost:8090/actuator/prometheus | — |

## Dashboard autoprovisionado

Grafana carga por provisioning (`k8s/monitoring/grafana-provisioning-configmap.yaml` y `grafana-dashboards-configmap.yaml`):

- Datasource `Prometheus` (uid `prometheus`) → `http://prometheus.monitoring.svc.cluster.local:9090`.
- Dashboard **"Spring Boot / JVM + Nodo"** (uid `springboot-jvm`): heap/no-heap, hilos, CPU sistema/proceso, uptime, HTTP req/s, pool Hikari, memoria JVM, GC, CPU y memoria del nodo.

Para importarlo manualmente en otro Grafana: Menú → Dashboards → Import → pegar el JSON de `k8s/monitoring/grafana-dashboards-configmap.yaml`.

## Comandos útiles

```bash
# Targets que Prometheus está scrapeando
kubectl exec -n monitoring deploy/prometheus -- wget -qO- http://localhost:9090/api/v1/targets

# Métricas disponibles de la app
curl http://localhost:8090/actuator/prometheus | grep -E "jvm_memory|http_server_requests|hikaricp"

# Logs
kubectl logs -n monitoring deploy/prometheus --tail=20
kubectl logs -n monitoring deploy/grafana --tail=20
```

## Detalles y trampas

- **Grafana provisioning:** las YAML deben estar en `provisioning/datasources/` y `provisioning/dashboards/` (subcarpetas). El manifest usa `configMap.items` para colocarlas ahí; montarlas en la raíz de `provisioning/` **no funciona**.
- **node-exporter** usa `hostNetwork`; el scrape lo consigue Prometheus con `kubernetes_sd_configs: role: node` y relabel de `:10250` a `:9100`. El ServiceAccount `prometheus` necesita el ClusterRole (ver `prometheus-rbac.yaml`).
- **IMPORTANTE (almacenes de imágenes):** con *"Use containerd for pulling and storing images"* activado, el clúster K8s y el engine Docker usan almacenes separados: las imágenes reconstruidas (`crudfullstack-backend:latest`) **no** se reflejan en K8s. Está desactivado en `settings-store.json` (`UseContainerdSnapshotter: false`); si se vuelve a activar, habrá que re-cargar las imágenes o el pod seguirá con la vieja.
- Cambiar ese ajuste de Docker Desktop **reinicializa el clúster** (pods/manifiestos se pierden; la data de Oracle en hostPath no). Hay que re-aplicar los manifiestos.
- `volwipe.yaml` (limpieza de la BD) está en `k8s/tools/` a propósito: aplicarlo a la vez que `k8s/db/` borraría los datos de Oracle.

## Recursos

- `k8s/monitoring/namespace.yaml`
- `k8s/monitoring/node-exporter.yaml`
- `k8s/monitoring/prometheus-rbac.yaml`
- `k8s/monitoring/prometheus-configmap.yaml`
- `k8s/monitoring/prometheus-deployment.yaml` / `prometheus-service.yaml`
- `k8s/monitoring/grafana-provisioning-configmap.yaml` (datasource + provider)
- `k8s/monitoring/grafana-dashboards-configmap.yaml` (dashboard JSON)
- `k8s/monitoring/grafana-deployment.yaml` / `grafana-service.yaml`