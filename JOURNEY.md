# DevOps Learning Journey: Todo App Kubernetes Project

> A junior DevOps engineer's documentation of building a full-stack containerized application with Kubernetes and CI/CD.

---

## Project Overview

**Goal:** Take a simple Todo application (Java Spring Boot backend + Vanilla JS frontend) and:
1. Containerize it with Docker
2. Orchestrate it with Kubernetes
3. Automate everything with CI/CD (Jenkins)

**Scenario:** My colleague *Günther* (a developer) handed me the code and asked me to "make it production-ready." Classic DevOps task.

---

## The Journey

### Phase 1: Understanding the Big Picture

Before touching any code, I had to understand the architecture layers:

```
        CI/CD Pipeline      ← Automation (top layer)
              ↓
         Kubernetes         ← Orchestration (production)
              ↓
        Docker-Compose      ← Local testing
              ↓
         Dockerfiles        ← Container blueprints
              ↓
      Frontend + Backend    ← The actual app (already done)
```

**Key Learning:** Each layer builds on the previous one. You can't skip ahead.

---

### Phase 2: Dockerfiles

#### Frontend Dockerfile

The frontend is just static files (HTML, CSS, JS). No build step needed.

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html 
EXPOSE 80
```

**Learnings:**

- `nginx:alpine` is lightweight (~40MB vs ~140MB for full nginx)
- `/usr/share/nginx/html` is nginx's default directory for static files
- Port 80 is nginx's default port

#### Backend Dockerfile (Multi-Stage Build)

This was more complex. The backend needs to be compiled first.

```dockerfile
# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

**Why Multi-Stage?**

- Build stage needs: JDK, Maven, source code (~500MB)
- Run stage needs: Only JRE and the JAR (~100MB)
- Analogy: **Build = Kitchen with all tools, Run = Just the finished meal**

**Learnings:**

- `ENTRYPOINT ["java", "-jar", "..."]` (exec form) is better than shell form
- Exec form: PID 1 = Java process, receives signals directly
- Shell form: PID 1 = /bin/sh, signals get lost, unclean shutdown

---

### Phase 3: Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
```

**Critical Networking Insight:**

I initially thought containers could reach each other via `localhost`. **WRONG!**

```
┌─────────────────────┐     ┌─────────────────────┐
│  Frontend Container │     │  Backend Container  │
│  localhost = ITSELF │     │  localhost = ITSELF │
└─────────────────────┘     └─────────────────────┘
```

**Solution:** Docker creates a network where containers can reach each other by **service name**:
- Container → Container: `http://backend:8080`
- Browser → Container: `http://localhost:8080`(via port mapping)

**The browser is NOT inside Docker**, so it uses `localhost` + port mapping!

---

### Phase 4: Kubernetes Manifests

#### Deployment vs Service

| Resource | Purpose |
|----------|---------|
| **Deployment** | "Keep N pods running, update them this way" |
| **Service** | "Stable endpoint to reach those pods" |

Pods are ephemeral (they die, get new IPs). Services provide stability.

#### Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: todo-frontend:v1
        imagePullPolicy: Never  # For local Minikube testing
        ports:
        - containerPort: 80
```

#### Service Types

| Type | Use Case |
|------|----------|
| `ClusterIP` | Internal only (backend APIs) |
| `NodePort` | Expose externally (frontend) |
| `LoadBalancer` | Cloud provider load balancer |

**Mistake I made:** Initially set backend to `NodePort`. But the backend doesn't need external access – only the frontend calls it internally.

---

### Phase 5: The ImagePullBackOff Problem

When I tried deploying to the shared cluster:

```
$ kubectl get pods -n jan-dev
NAME                        READY   STATUS             RESTARTS   AGE
backend-577d5889cf-c7gvh    0/1     ImagePullBackOff   0          17s
frontend-78d8dcd697-bj7hs   0/1     ImagePullBackOff   0          17s
```

**Root Cause:** Kubernetes couldn't pull images from Nexus registry because I didn't have credentials configured.

**Debug command:**

```bash
kubectl describe pod <pod-name> -n jan-dev | tail -20
```

This showed: `authorization failed: no basic auth credentials`

**Workaround:** Use Minikube locally with `imagePullPolicy: Never`

---

### Phase 6: Minikube Local Testing

Minikube runs its own Docker daemon. To build images that Minikube can see:

```bash
eval $(minikube docker-env)    # Switch to Minikube's Docker
docker build -t todo-frontend:v1 ./frontend
docker build -t todo-backend:v1 ./backend
```

Then `imagePullPolicy: Never` tells Kubernetes: "Don't try to pull from a registry, use local images."

**To switch back to normal Docker:**
```bash
eval $(minikube docker-env --unset)
```

#### The Mysterious Port

When accessing the app, I noticed the port was different than expected:

- Defined in Service: `nodePort: 30080`
- Actual URL: `http://127.0.0.1:34735`

**Explanation (from my notes):**
> "The NodePort listens on the Minikube VM's IP, but this VM runs behind WSL2 NAT and isn't directly reachable from Windows. `minikube service` creates a tunnel and maps the service to a random localhost port."

---

### Phase 7: CI/CD Pipeline (Jenkins)

```groovy
pipeline {
    agent any
    
    environment {
        REGISTRY = 'nexus.skyered-devops.de/kurs3/jan'
        FRONTEND_IMAGE = "${REGISTRY}/todo-frontend"
        BACKEND_IMAGE = "${REGISTRY}/todo-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                sh """
                    docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend
                    docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ./backend
                """
            }
        }
        stage('Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin nexus.skyered-devops.de
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }
        stage('Deploy') {
            steps {
                sh "kubectl apply -f k8s/"
            }
        }
    }
}
```

## Key Concepts I Learned

### Docker

| Concept | Explanation |
|---------|-------------|
| Image vs Container | Image = Recipe, Container = Running meal |
| Multi-stage builds | Separate build tools from runtime |
| Layer caching | Order matters in Dockerfile |

### Kubernetes

| Concept | Explanation |
|---------|-------------|
| Deployment | Manages pod lifecycle and updates |
| Service | Stable network endpoint for pods |
| Labels & Selectors | How services find their pods |
| Namespaces | Isolation between environments/teams |

### Networking

| Scenario | URL to use |
|----------|------------|
| Container → Container | `http://service-name:port` |
| Browser → Container (local) | `http://localhost:mapped-port` |
| Browser → Container (K8s) | Via NodePort or LoadBalancer |

### CI/CD

| Stage | Purpose |
|-------|---------|
| Checkout | Get latest code |
| Build | Create artifacts/images |
| Push | Store in registry |
| Deploy | Apply to cluster |

---

## Mistakes I Made (and Fixed)

1. **Used `localhost` for container-to-container communication** → Use service names
2. **Set backend Service to NodePort** → Should be ClusterIP (internal only)
3. **Forgot `imagePullPolicy: Never` for Minikube** → Images couldn't be found
4. **Left `nodePort` in ClusterIP service** → Invalid, had to remove it
5. **Tried to deploy without pushing images to registry** → ImagePullBackOff

---

## Final Project Structure

```
k8s-fullstack-cicd-pipeline/
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── k8s/
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   └── backend-service.yaml
├── .github/
│   └── workflows/
│       └── ci-cd.yaml
├── docker-compose.yaml
├── Jenkinsfile
├── .gitignore
└── README.md
```

---

## Phase 8: From Jenkins to GitHub Actions (Day 3)

### The Problem

The school Jenkins server had restrictions:

- No global credentials allowed
- Nexus registry architecture issues
- Cluster went offline

### The Solution

Switched to **GitHub Actions** – secrets stored in repo settings, no infrastructure needed.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
      - run: docker build & docker push
      
  deploy:
    needs: build-and-push
    steps:
      - uses: medyagh/setup-minikube@latest
      - run: kubectl apply -f k8s/
```

### Key Learnings from Day 3

| Topic | Learning |
|-------|----------|
| Registry switch | Nexus → Docker Hub (same concepts, different URL) |
| imagePullPolicy | `Always` for registry, `Never` for local builds |
| GitHub Secrets | Stored encrypted, injected at runtime |
| Minikube in CI | Fresh cluster per run – no state between jobs |

---

## What's Completed

- [x] Frontend Dockerfile (Nginx)
- [x] Backend Dockerfile (Multi-Stage Maven/JRE)
- [x] Docker Compose for local testing
- [x] Kubernetes Deployments & Services
- [x] Images on Docker Hub (`minicube78/todo-*`)
- [x] GitHub Actions CI/CD Pipeline
- [x] Successful deployment on k3s cluster
- [x] Successful pipeline run on GitHub Actions

## Memorable Quotes from This Session

> "Docker Compose is for local testing, Kubernetes is for production – they solve different problems."

> "The browser is NOT in the Docker network!"

> "`imagePullPolicy: Never` is great for local testing, dangerous in production."

> "Every layer builds on the previous one. You can't skip ahead."
> "The later you find a bug, the more expensive it is."

> "Shift Left = Find problems as early as possible."

---

## Final Thoughts

This project taught me that DevOps is not just about tools, more like:

1. **Understanding the flow**: Code → Build → Test → Deploy → Monitor
2. **Automation mindset**: If you do it twice, automate it
3. **Fail fast, fix fast**: Every push should trigger the pipeline
4. **Documentation matters**: Future-me will thank present-me

The biggest win: I now understand *why* things are done this way, not just *how*.

---

*Written by: A Junior DevOps Engineer learning by doing*  
*Date: December 2025*
