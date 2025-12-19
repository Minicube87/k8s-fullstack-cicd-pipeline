# 🚀 k8s-fullstack-cicd-pipeline

> Full-stack Todo application with Docker, Kubernetes, and automated CI/CD pipeline.

[![CI/CD Pipeline](https://github.com/Minicube87/k8s-fullstack-cicd-pipeline/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/Minicube87/k8s-fullstack-cicd-pipeline/actions)

---

## Overview

This project demonstrates a complete DevOps workflow:

- **Containerized** full-stack application (Frontend + Backend)
- **Kubernetes** deployments and services
- **Automated CI/CD** pipeline with GitHub Actions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                           │
│                      (GitHub Actions)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Hub                               │
│            minicube78/todo-frontend:latest                       │
│            minicube78/todo-backend:latest                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                          │
│  ┌─────────────────────┐       ┌─────────────────────┐          │
│  │  Frontend (Nginx)   │──────▶│  Backend (Spring)   │          │
│  │  Service: NodePort  │       │  Service: ClusterIP │          │
│  └─────────────────────┘       └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript, HTML, CSS |
| Backend | Java 17, Spring Boot 2.5.5, Maven |
| Web Server | Nginx (Alpine) |
| Containerization | Docker (Multi-Stage Builds) |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Registry | Docker Hub |

---

## Project Structure

```
├── frontend/
│   ├── Dockerfile          # Nginx-based container
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/
│   ├── Dockerfile          # Multi-stage build (Maven + JRE)
│   ├── pom.xml
│   └── src/
├── k8s/
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   └── backend-service.yaml
├── .github/
│   └── workflows/
│       └── ci-cd.yaml      # GitHub Actions pipeline
├── docker-compose.yaml     # Local development
├── Jenkinsfile             # Alternative CI/CD (Jenkins)
└── JOURNEY.md              # Learning documentation
```

---

## Quick Start

### Local Development (Docker Compose)

```bash
# Start both containers
docker-compose up --build

# Access the app
open http://localhost:3000
```

### Kubernetes (Minikube)

```bash
# Start Minikube
minikube start

# Deploy the application
kubectl apply -f k8s/

# Access the app
minikube service frontend-service
```

---

## CI/CD Pipeline

The pipeline runs automatically on every push to `main`:

```
Checkout → Build Images → Push to Docker Hub → Deploy to Kubernetes
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub password or access token |

---

## Screenshots

### GitHub Actions Pipeline

![Pipeline Success](https://img.shields.io/badge/Pipeline-Passing-brightgreen)

### Kubernetes Pods

```
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxx                 1/1     Running   0          10s
frontend-xxx                1/1     Running   0          10s
```

---

## Key Learnings

Documented in [JOURNEY.md](JOURNEY.md):

- Docker multi-stage builds
- Kubernetes networking (ClusterIP vs NodePort)
- Container-to-container communication
- CI/CD automation principles
- "Shift Left" testing philosophy
