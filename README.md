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

## ☁️ Option 3: Cloud Production Deployment

Deploy to **AWS** or **Azure** for production workloads with managed services, auto-scaling, and high availability.

### Component Comparison

| Component | AWS | Azure |
|-----------|-----|-------|
| **Kubernetes** | EKS ($73/mo control plane) | AKS (free control plane) |
| **Serverless K8s** | EKS + Fargate | AKS + Virtual Nodes |
| **Container PaaS** | ECS + Fargate | Azure Container Apps |
| **PostgreSQL** | RDS / Aurora PostgreSQL | Azure Database for PostgreSQL |
| **Kafka** | Amazon MSK | Azure Event Hubs (Kafka API) |
| **Container Registry** | ECR | ACR |
| **Load Balancer** | ALB (Application LB) | Azure Application Gateway |
| **CDN/Static Assets** | CloudFront + S3 | Azure CDN + Blob Storage |
| **Secrets** | Secrets Manager | Azure Key Vault |
| **DNS** | Route 53 | Azure DNS |
| **TLS Certs** | ACM (free) | App Service Certificates |
| **WAF** | AWS WAF | Azure WAF |
| **Logging** | CloudWatch Logs | Azure Monitor / Log Analytics |
| **Metrics** | CloudWatch Metrics | Azure Monitor Metrics |
| **Tracing** | X-Ray / OpenTelemetry | Application Insights |
| **CI/CD** | CodePipeline / GitHub Actions | Azure DevOps / GitHub Actions |
| **IAM/Identity** | IAM Roles for Service Accounts | Workload Identity |

---

### 🔶 AWS Architecture (EKS)

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│  Route 53 (DNS) → CloudFront (CDN) → S3 (React static files)   │
│                          ↓                                       │
│                    AWS WAF + ACM (TLS)                          │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Application Load Balancer                    ││
│  │  /api/flights/* → flight-service                            ││
│  │  /api/chat/*    → chat-service                              ││
│  │  /api/events/*  → notification-service (SSE)                ││
│  │  /kafka-ui/*    → kafka-ui                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              EKS Cluster (Private Subnets)                   ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  ││
│  │  │flight-service│ │ chat-service │ │event-producer-svc   │  ││
│  │  │   (2 pods)   │ │   (2 pods)   │ │      (1 pod)        │  ││
│  │  └──────────────┘ └──────────────┘ └─────────────────────┘  ││
│  │  ┌────────────────────┐ ┌─────────────┐                     ││
│  │  │notification-service│ │  kafka-ui   │                     ││
│  │  │     (2 pods)       │ │   (1 pod)   │                     ││
│  │  └────────────────────┘ └─────────────┘                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                    ↓                      ↓                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │   Amazon RDS PostgreSQL │  │      Amazon MSK (Kafka)     │   │
│  │   (Multi-AZ, 2 vCPU)    │  │   (2 brokers, kafka.m5.lg)  │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Secrets Manager: DB_PASSWORD, OPENROUTER_API_KEY               │
│  CloudWatch: Logs, Metrics, Alarms                              │
└─────────────────────────────────────────────────────────────────┘
```

#### AWS Services Required

| Service | Purpose | Specs |
|---------|---------|-------|
| **EKS** | Kubernetes control plane | 1 cluster |
| **EC2** | Worker nodes | 3x t3.medium (or Fargate) |
| **RDS PostgreSQL** | Database | db.t3.small, Multi-AZ |
| **MSK** | Kafka messaging | 2 brokers, kafka.t3.small |
| **ALB** | Load balancer + ingress | 1 ALB |
| **ECR** | Container registry | 5 repositories |
| **S3** | Static frontend assets | 1 bucket |
| **CloudFront** | CDN | 1 distribution |
| **Route 53** | DNS | 1 hosted zone |
| **ACM** | TLS certificates | Free with AWS |
| **Secrets Manager** | Secrets storage | 2 secrets |
| **CloudWatch** | Logging & monitoring | Logs + Metrics |

#### AWS Monthly Cost Estimate

| Service | Estimate |
|---------|----------|
| EKS control plane | $73 |
| EC2 nodes (3x t3.medium) | ~$90 |
| RDS PostgreSQL (db.t3.small, Multi-AZ) | ~$50 |
| MSK (2 broker kafka.t3.small) | ~$150 |
| ALB | ~$20 |
| CloudFront + S3 | ~$5 |
| Secrets Manager | ~$2 |
| **Total** | **~$390/mo** |

> 💡 **Cost Optimization**: Use Confluent Cloud (~$25/mo) instead of MSK to save ~$125/mo.

#### AWS Deployment Steps

```bash
# 1. Prerequisites
aws configure                              # Configure AWS CLI
eksctl version                             # Ensure eksctl is installed

# 2. Create EKS Cluster
eksctl create cluster \
  --name airline-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 5

# 3. Create ECR Repositories
aws ecr create-repository --repository-name airline/flight-service
aws ecr create-repository --repository-name airline/chat-service
aws ecr create-repository --repository-name airline/event-producer-service
aws ecr create-repository --repository-name airline/notification-service
aws ecr create-repository --repository-name airline/frontend

# 4. Build and Push Images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# For each service:
docker build -t airline/flight-service ./microservices/flight-service
docker tag airline/flight-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/airline/flight-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/airline/flight-service:latest

# 5. Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier airline-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --master-username airline \
  --master-user-password <password> \
  --allocated-storage 20 \
  --multi-az

# 6. Create MSK Cluster (or use Confluent Cloud)
# Use AWS Console or CloudFormation for MSK setup

# 7. Store Secrets
aws secretsmanager create-secret \
  --name airline/db-credentials \
  --secret-string '{"username":"airline","password":"<password>"}'

aws secretsmanager create-secret \
  --name airline/openrouter-api-key \
  --secret-string '{"api_key":"<your-openrouter-key>"}'

# 8. Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=airline-cluster

# 9. Update K8s manifests with ECR image URLs and RDS/MSK endpoints
# Then apply:
kubectl apply -f microservices/k8s/

# 10. Setup CloudFront + S3 for frontend (optional)
aws s3 mb s3://airline-frontend-<unique-id>
npm run build --prefix airline-frontend
aws s3 sync airline-frontend/dist s3://airline-frontend-<unique-id>
```

#### AWS ALB Ingress Annotations (for SSE)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: airline-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=3600
    alb.ingress.kubernetes.io/healthcheck-path: /actuator/health
```

---

### 🔷 Azure Architecture (AKS)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                               │
├─────────────────────────────────────────────────────────────────┤
│  Azure DNS → Azure CDN → Blob Storage (React static files)     │
│                          ↓                                       │
│               Azure Application Gateway + WAF                   │
│               (or nginx ingress in AKS)                         │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               AKS Cluster (Private VNet)                     ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  ││
│  │  │flight-service│ │ chat-service │ │event-producer-svc   │  ││
│  │  │   (2 pods)   │ │   (2 pods)   │ │      (1 pod)        │  ││
│  │  └──────────────┘ └──────────────┘ └─────────────────────┘  ││
│  │  ┌────────────────────┐ ┌─────────────┐ ┌─────────────┐     ││
│  │  │notification-service│ │  kafka-ui   │ │nginx ingress│     ││
│  │  │     (2 pods)       │ │   (1 pod)   │ │  controller │     ││
│  │  └────────────────────┘ └─────────────┘ └─────────────┘     ││
│  └─────────────────────────────────────────────────────────────┘│
│                    ↓                      ↓                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │ Azure Database Postgres │  │   Azure Event Hubs (Kafka)  │   │
│  │ Flexible Server (2vCPU) │  │   (Standard tier)           │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Key Vault: DB_PASSWORD, OPENROUTER_API_KEY                     │
│  Azure Monitor + Log Analytics: Logs, Metrics, Alerts           │
│  Application Insights: Distributed tracing                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Azure Services Required

| Service | Purpose | Specs |
|---------|---------|-------|
| **AKS** | Kubernetes (free control plane) | 1 cluster |
| **VM Scale Set** | Worker nodes | 3x Standard_B2s |
| **Azure Database for PostgreSQL** | Database | Burstable B2s |
| **Event Hubs** | Kafka-compatible messaging | Standard tier, 1 TU |
| **Application Gateway** | Load balancer + WAF | Basic tier |
| **ACR** | Container registry | Basic tier |
| **Blob Storage** | Static frontend assets | Hot tier |
| **Azure CDN** | CDN | Standard tier |
| **Azure DNS** | DNS | 1 zone |
| **Key Vault** | Secrets storage | Standard tier |
| **Log Analytics** | Logging | Per-GB pricing |
| **Application Insights** | APM & tracing | Per-GB pricing |

#### Azure Monthly Cost Estimate

| Service | Estimate |
|---------|----------|
| AKS control plane | **$0** (free!) |
| VM nodes (3x Standard_B2s) | ~$90 |
| Azure Database PostgreSQL (Burstable B2s) | ~$50 |
| Event Hubs (Standard, 1 TU) | ~$22 |
| Application Gateway (Basic) | ~$20 |
| Azure CDN + Blob | ~$5 |
| Key Vault | ~$1 |
| Log Analytics | ~$10 |
| **Total** | **~$200/mo** |

> 💡 **Azure is ~$190/mo cheaper** than AWS primarily due to free AKS control plane and cheaper Event Hubs vs MSK.

#### Azure Deployment Steps

```bash
# 1. Prerequisites
az login                                   # Login to Azure
az account set --subscription <sub-id>     # Set subscription

# 2. Create Resource Group
az group create --name airline-rg --location eastus

# 3. Create AKS Cluster
az aks create \
  --resource-group airline-rg \
  --name airline-cluster \
  --node-count 3 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group airline-rg --name airline-cluster

# 4. Create ACR (Container Registry)
az acr create --resource-group airline-rg --name airlineacr --sku Basic

# Attach ACR to AKS
az aks update -n airline-cluster -g airline-rg --attach-acr airlineacr

# 5. Build and Push Images
az acr login --name airlineacr

# For each service:
docker build -t airlineacr.azurecr.io/flight-service:latest ./microservices/flight-service
docker push airlineacr.azurecr.io/flight-service:latest

# 6. Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group airline-rg \
  --name airline-db-server \
  --admin-user airline \
  --admin-password <password> \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group airline-rg \
  --server-name airline-db-server \
  --database-name airline_db

# 7. Create Event Hubs Namespace (Kafka-compatible)
az eventhubs namespace create \
  --resource-group airline-rg \
  --name airline-eventhubs \
  --sku Standard \
  --enable-kafka true

# Create event hub (Kafka topic)
az eventhubs eventhub create \
  --resource-group airline-rg \
  --namespace-name airline-eventhubs \
  --name flight-events \
  --partition-count 2

# 8. Create Key Vault and Store Secrets
az keyvault create --name airline-kv --resource-group airline-rg --location eastus

az keyvault secret set --vault-name airline-kv --name db-password --value "<password>"
az keyvault secret set --vault-name airline-kv --name openrouter-api-key --value "<your-key>"

# 9. Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --create-namespace \
  --namespace ingress-nginx

# 10. Update K8s manifests with ACR image URLs and Azure service endpoints
# Then apply:
kubectl apply -f microservices/k8s/

# 11. (Optional) Setup Azure CDN + Blob for frontend
az storage account create --name airlinefrontend --resource-group airline-rg --sku Standard_LRS
az storage blob service-properties update --account-name airlinefrontend --static-website --index-document index.html
npm run build --prefix airline-frontend
az storage blob upload-batch -d '$web' -s airline-frontend/dist --account-name airlinefrontend
```

#### Azure Ingress Configuration (for SSE)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: airline-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-buffering: "off"
spec:
  rules:
  - host: airline.yourdomain.com
    http:
      paths:
      - path: /api/flights
        pathType: Prefix
        backend:
          service:
            name: flight-service
            port:
              number: 8081
      - path: /api/chat
        pathType: Prefix
        backend:
          service:
            name: chat-service
            port:
              number: 8082
      - path: /api/events
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 8084
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

#### Event Hubs Kafka Configuration

Update your Spring application.yml to connect to Event Hubs:

```yaml
spring:
  kafka:
    bootstrap-servers: airline-eventhubs.servicebus.windows.net:9093
    properties:
      security.protocol: SASL_SSL
      sasl.mechanism: PLAIN
      sasl.jaas.config: >
        org.apache.kafka.common.security.plain.PlainLoginModule required
        username="$ConnectionString"
        password="Endpoint=sb://airline-eventhubs.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<your-key>";
```

---

### 🔀 AWS vs Azure Decision Matrix

| Factor | AWS | Azure | Winner |
|--------|-----|-------|--------|
| **K8s control plane cost** | $73/mo | Free | 🏆 Azure |
| **Managed Kafka cost** | MSK ~$150+ | Event Hubs ~$22 | 🏆 Azure |
| **Kafka compatibility** | MSK = full Kafka | Event Hubs = Kafka API (subset) | 🏆 AWS |
| **PostgreSQL** | Similar | Similar | Tie |
| **SSE/WebSocket support** | ALB excellent | App Gateway good | 🏆 AWS |
| **Secrets management** | Secrets Manager | Key Vault | Tie |
| **Observability** | CloudWatch + X-Ray | Monitor + App Insights | 🏆 Azure |
| **Total small prod cost** | ~$390/mo | ~$200/mo | 🏆 Azure |
| **Enterprise ecosystem** | Larger | Strong | AWS slightly |

### Recommendation Summary

| If you... | Choose |
|-----------|--------|
| Want **lowest cost** | **Azure (AKS + Event Hubs)** |
| Need **full Kafka compatibility** | **AWS (EKS + MSK)** |
| Want **simplest ops** (no K8s) | **Azure Container Apps** or **AWS ECS Fargate** |
| Have existing **AWS credits/expertise** | **AWS** |
| Have existing **Azure credits/expertise** | **Azure** |

---

### 🔐 Production Security Checklist

- [ ] Enable private subnets for all services
- [ ] Use managed identity / IAM roles (no hardcoded credentials)
- [ ] Enable encryption at rest for database and storage
- [ ] Enable TLS/HTTPS everywhere
- [ ] Configure WAF rules
- [ ] Set up network policies in K8s
- [ ] Enable audit logging
- [ ] Configure backup retention for database
- [ ] Set up monitoring alerts
- [ ] Implement rate limiting at ingress

---

## 📝 License

MIT License
