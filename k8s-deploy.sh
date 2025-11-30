#!/bin/bash

# =============================================================================
# Kubernetes Deployment Script for Airline App
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Airline App - Kubernetes Deployment${NC}"
echo -e "${BLUE}============================================${NC}"

# -----------------------------------------------------------------------------
# Step 1: Prerequisites Check
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/8] Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Kubernetes cluster not running. Please enable Kubernetes in Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# -----------------------------------------------------------------------------
# Step 2: Load environment variables
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/8] Loading environment variables...${NC}"

if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    echo -e "${GREEN}✅ Loaded .env file${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found. Using defaults.${NC}"
fi

# -----------------------------------------------------------------------------
# Step 3: Build Backend Docker Image
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/8] Building backend Docker image...${NC}"

cd "$SCRIPT_DIR/airline-backend"
docker build -t airline-backend:latest .

echo -e "${GREEN}✅ Backend image built${NC}"

# -----------------------------------------------------------------------------
# Step 4: Build Frontend Docker Image
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/8] Building frontend Docker image...${NC}"

cd "$SCRIPT_DIR/airline-frontend"
docker build -t airline-frontend:latest .

echo -e "${GREEN}✅ Frontend image built${NC}"

# -----------------------------------------------------------------------------
# Step 5: Install NGINX Ingress Controller (if not exists)
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/8] Setting up NGINX Ingress Controller...${NC}"

if kubectl get namespace ingress-nginx &> /dev/null; then
    echo -e "${GREEN}✅ Ingress controller already installed${NC}"
else
    echo "Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
    
    echo "Waiting for Ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=120s
    
    echo -e "${GREEN}✅ Ingress controller installed${NC}"
fi

# -----------------------------------------------------------------------------
# Step 6: Create Namespace and Secrets
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/8] Creating namespace and secrets...${NC}"

cd "$SCRIPT_DIR"

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secret with actual API key from environment
kubectl create secret generic airline-secrets \
    --namespace=airline \
    --from-literal=DB_USER=airline \
    --from-literal=DB_PASSWORD=airline123 \
    --from-literal=OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-your-api-key-here}" \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✅ Namespace and secrets created${NC}"

# -----------------------------------------------------------------------------
# Step 7: Apply Kubernetes Manifests
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/8] Deploying to Kubernetes...${NC}"

# Apply in order: config -> infrastructure -> app
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/kafka-ui.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

echo -e "${GREEN}✅ Manifests applied${NC}"

# -----------------------------------------------------------------------------
# Step 8: Wait for Pods to be Ready
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[8/8] Waiting for pods to be ready...${NC}"

echo "Waiting for PostgreSQL..."
kubectl wait --namespace=airline \
    --for=condition=ready pod \
    --selector=app=postgres \
    --timeout=120s || true

echo "Waiting for Kafka..."
kubectl wait --namespace=airline \
    --for=condition=ready pod \
    --selector=app=kafka \
    --timeout=180s || true

echo "Waiting for Backend..."
kubectl wait --namespace=airline \
    --for=condition=ready pod \
    --selector=app=airline-backend \
    --timeout=180s || true

echo "Waiting for Frontend..."
kubectl wait --namespace=airline \
    --for=condition=ready pod \
    --selector=app=airline-frontend \
    --timeout=60s || true

# -----------------------------------------------------------------------------
# Done!
# -----------------------------------------------------------------------------
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "\n${BLUE}📋 Pod Status:${NC}"
kubectl get pods -n airline

echo -e "\n${BLUE}🌐 Services:${NC}"
kubectl get services -n airline

echo -e "\n${BLUE}🔗 Ingress:${NC}"
kubectl get ingress -n airline

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  IMPORTANT: Add this to /etc/hosts:${NC}"
echo -e "${YELLOW}  127.0.0.1 airline.local${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${GREEN}Access the application:${NC}"
echo -e "  🖥️  Frontend:  ${BLUE}http://airline.local${NC}"
echo -e "  🔧 Backend:   ${BLUE}http://airline.local/api/flights${NC}"
echo -e "  📊 Kafka UI:  ${BLUE}http://airline.local/kafka-ui${NC}"

echo -e "\n${GREEN}Useful commands:${NC}"
echo -e "  kubectl get pods -n airline        # View pod status"
echo -e "  kubectl logs -n airline -l app=airline-backend -f  # Backend logs"
echo -e "  kubectl logs -n airline -l app=airline-frontend -f # Frontend logs"
echo -e "  ./k8s-stop.sh                      # Stop and cleanup"
