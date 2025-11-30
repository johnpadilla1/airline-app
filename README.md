# Airline Flight Tracker Application

Real-time flight tracking application with event-driven architecture using Spring Boot, Kafka, PostgreSQL, and React.

## 🏗️ Architecture Options

This project supports **two deployment architectures**:

| Approach | Folder | Description |
|----------|--------|-------------|
| **Monolith** | `airline-backend/` | Single Spring Boot application with all features |
| **Microservices** | `microservices/` | Distributed architecture with 4 separate services |

---

## 📁 Project Structure

```
airline-app/
├── docker-compose.yml              # Infrastructure (PostgreSQL, Kafka)
├── README.md                       # This file
├── plan.md                         # Original implementation plan
├── start.sh                        # Quick start script
├── stop.sh                         # Quick stop script
│
├── airline-backend/                # 🔹 MONOLITH BACKEND
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/airline/
│       ├── AirlineApplication.java
│       ├── config/
│       ├── controller/
│       ├── model/
│       ├── repository/
│       └── service/
│
├── airline-frontend/               # 🔹 REACT FRONTEND (shared)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
├── microservices/                  # 🔹 MICROSERVICES BACKEND
│   ├── pom.xml                     # Parent POM (multi-module)
│   ├── microservices-deploy.sh     # K8s deployment script
│   ├── microservices-stop.sh       # K8s cleanup script
│   ├── common/                     # Shared entities, DTOs, enums
│   ├── flight-service/             # Flight CRUD (port 8081)
│   ├── chat-service/               # AI Chat (port 8082)
│   ├── event-producer-service/     # Kafka producer (port 8083)
│   ├── notification-service/       # Kafka consumer + SSE (port 8084)
│   ├── frontend/                   # Frontend nginx config
│   └── k8s/                        # Kubernetes manifests
│
└── k8s/                            # Kubernetes manifests (monolith)
```

---

## 🚀 Option 1: Monolith (Docker Compose)

The simplest way to run the application using a single backend service.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Spring Boot    │────▶│   PostgreSQL    │
│    (Vite)       │◀────│   Backend       │◀────│    Database     │
│                 │ SSE │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │  Apache Kafka   │
                        │  (Event Bus)    │
                        │                 │
                        └─────────────────┘
```

### Prerequisites

- Docker & Docker Compose
- Java 17+
- Maven 3.8+
- Node.js 18+

### Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Kafka, Kafka UI)
docker-compose up -d

# 2. Start backend
cd airline-backend
./mvnw spring-boot:run

# 3. Start frontend (in another terminal)
cd airline-frontend
npm install
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api/flights |
| Kafka UI | http://localhost:8090 |
| SSE Stream | http://localhost:8080/api/flights/stream |

### Stop Services

```bash
# Stop frontend & backend (Ctrl+C)

# Stop infrastructure
docker-compose down

# Remove volumes (resets database)
docker-compose down -v
```

---

## 🚀 Option 2: Microservices (Kubernetes)

A distributed architecture with separate services for better scalability and maintainability.

### Architecture

```
                         ┌─────────────────────┐
                         │      Ingress        │
                         │   airline.local     │
                         └──────────┬──────────┘
           ┌────────────────┬───────┴───────┬────────────────┐
           ▼                ▼               ▼                ▼
      /api/flights     /api/chat    /api/events/stream   /kafka-ui
           │                │               │                │
           ▼                ▼               ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐
    │ flight-      │ │ chat-        │ │ notification-│ │ kafka-ui │
    │ service      │ │ service      │ │ service      │ │          │
    │ (8081)       │ │ (8082)       │ │ (8084)       │ │          │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────┬─────┘
           │                │                │               │
           │         REST   │         Kafka  │               │
           ▼                ▼                ▼               ▼
    ┌──────────────┐  flight-service   ┌──────────────┐ ┌──────────┐
    │  PostgreSQL  │       ▲           │    Kafka     │ │  Kafka   │
    │   (shared)   │       │           │              │ │          │
    └──────────────┘       │           └──────┬───────┘ └──────────┘
                           │                  │
                    ┌──────┴───────┐          │
                    │ event-       │──────────┘
                    │ producer-    │  (publishes events)
                    │ service      │
                    │ (8083)       │
                    └──────────────┘
```

### Microservices Overview

| Service | Port | Description |
|---------|------|-------------|
| **flight-service** | 8081 | Flight CRUD operations, database source of truth |
| **chat-service** | 8082 | AI-powered chat with streaming responses |
| **event-producer-service** | 8083 | Scheduled job producing flight events to Kafka |
| **notification-service** | 8084 | Kafka consumer + SSE broadcasting to browsers |

### Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl CLI
- Java 17+
- Maven 3.8+
- Node.js 18+

### Enable Kubernetes on Docker Desktop

1. Open Docker Desktop
2. Go to **Settings** → **Kubernetes**
3. Check **Enable Kubernetes**
4. Click **Apply & Restart**
5. Wait for Kubernetes to be ready (green indicator)

### Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### Add hosts entry

```bash
# Add to /etc/hosts
echo "127.0.0.1 airline.local" | sudo tee -a /etc/hosts
```

### Set OpenRouter API Key (Required for Chat)

```bash
# Set your OpenRouter API key as environment variable
export OPENROUTER_API_KEY='sk-or-v1-your-api-key-here'

# To make it permanent, add to ~/.zshrc or ~/.bashrc:
echo "export OPENROUTER_API_KEY='your-key-here'" >> ~/.zshrc
```

### Deploy Microservices

```bash
cd microservices

# Run the deployment script (reads OPENROUTER_API_KEY from environment)
./microservices-deploy.sh
```

This script will:
1. Build all microservices with Maven
2. Build Docker images for each service
3. Build the frontend
4. Deploy everything to Kubernetes

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://airline.local |
| Flight API | http://airline.local/api/flights |
| Chat API | http://airline.local/api/chat |
| SSE Stream | http://airline.local/api/events/stream |
| Kafka UI | http://airline.local/kafka-ui |

### Useful Kubernetes Commands

```bash
# View all pods
kubectl get pods -n airline

# View logs for a service
kubectl logs -f deployment/flight-service -n airline

# Describe a pod
kubectl describe pod <pod-name> -n airline

# Port forward a service (for debugging)
kubectl port-forward svc/flight-service 8081:8081 -n airline

# View all services
kubectl get svc -n airline

# View ingress
kubectl get ingress -n airline
```

### Stop Microservices

```bash
# Option 1: Use the stop script
cd microservices
./microservices-stop.sh

# Option 2: Delete namespace directly
kubectl delete namespace airline
```

### Start Microservices

```bash
# Full deployment (builds and deploys everything)
cd microservices
./microservices-deploy.sh
```

### Restart Individual Services

```bash
# Restart a single service without full redeploy
kubectl rollout restart deployment flight-service -n airline
kubectl rollout restart deployment chat-service -n airline
kubectl rollout restart deployment event-producer-service -n airline
kubectl rollout restart deployment notification-service -n airline
kubectl rollout restart deployment frontend -n airline
```

### Scale Services

```bash
# Scale down (stop a service)
kubectl scale deployment flight-service --replicas=0 -n airline

# Scale up (start a service)
kubectl scale deployment flight-service --replicas=1 -n airline

# Scale multiple replicas for load balancing
kubectl scale deployment flight-service --replicas=3 -n airline
```

---

## 🔌 API Endpoints

### Flight API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flights` | List all flights |
| GET | `/api/flights/{id}` | Get flight by ID |
| GET | `/api/flights/number/{flightNumber}` | Get flight by number |
| GET | `/api/flights/status/{status}` | Filter by status |
| GET | `/api/flights/{flightNumber}/events` | Get flight event history |
| GET | `/api/flights/events/recent` | Get recent events |

### Chat API (Microservices only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send chat message |
| POST | `/api/chat/stream` | Stream chat response (SSE) |

### Events API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flights/stream` | SSE stream (monolith) |
| GET | `/api/events/stream` | SSE stream (microservices) |

---

## 📊 Event Types

| Event | Weight | Description |
|-------|--------|-------------|
| DELAY | 60% | Adds 15-60 minutes delay |
| GATE_CHANGE | 20% | Changes gate assignment |
| BOARDING_STARTED | 10% | Sets status to BOARDING |
| CANCELLATION | 10% | Cancels the flight |

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Spring Boot 3.3.5, Java 17 |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL 15 |
| Messaging | Apache Kafka 3.7.0 (KRaft mode) |
| AI | Spring AI 1.0.0 + OpenAI |
| Container Orchestration | Kubernetes (Docker Desktop) |
| Ingress | NGINX Ingress Controller |

---

## 🔧 Troubleshooting

### Monolith Issues

**Backend won't start**
- Ensure Docker containers are running: `docker-compose ps`
- Check Kafka is healthy: `docker logs airline-kafka`
- Verify PostgreSQL: `docker exec -it airline-postgres psql -U airline -d airline_db`

**Frontend SSE not connecting**
- Check browser console for errors
- Verify backend is running on port 8080
- Check CORS configuration

### Microservices Issues

**Kubernetes not available**
- Enable Kubernetes in Docker Desktop settings
- Verify with: `kubectl cluster-info`

**Pods not starting**
- Check pod status: `kubectl get pods -n airline-app`
- View pod logs: `kubectl logs <pod-name> -n airline-app`
- Describe pod: `kubectl describe pod <pod-name> -n airline-app`

**Ingress not working**
- Verify NGINX Ingress is installed: `kubectl get pods -n ingress-nginx`
- Check ingress rules: `kubectl describe ingress -n airline-app`
- Ensure `/etc/hosts` has `127.0.0.1 airline.local`

**Docker build fails**
- Clear Docker cache: `docker builder prune`
- Ensure Maven build succeeds first: `./mvnw clean package -DskipTests`

---

## 📝 License

MIT License
