#!/bin/bash

# Microservices Kubernetes Deployment Script
# This script builds and deploys all microservices to local Kubernetes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="airline"

echo "=========================================="
echo "Airline App Microservices K8s Deployment"
echo "=========================================="

# Check prerequisites
echo ""
echo "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not running. Please start Docker Desktop with Kubernetes enabled."
    exit 1
fi

echo "✅ All prerequisites met"

# Check for OpenRouter API key
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo ""
    echo "⚠️  Warning: OPENROUTER_API_KEY environment variable is not set."
    echo "   Chat functionality will not work without it."
    echo ""
    echo "   To set it, run:"
    echo "   export OPENROUTER_API_KEY='your-api-key-here'"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Build all microservices with Maven
echo ""
echo "=========================================="
echo "Step 1: Building microservices with Maven"
echo "=========================================="
cd "$SCRIPT_DIR"
./mvnw clean package -DskipTests

# Step 2: Build Docker images
echo ""
echo "=========================================="
echo "Step 2: Building Docker images"
echo "=========================================="

# Build all images from the parent microservices directory
cd "$SCRIPT_DIR"

echo "Building flight-service image..."
docker build -t flight-service:latest -f flight-service/Dockerfile .

echo ""
echo "Building chat-service image..."
docker build -t chat-service:latest -f chat-service/Dockerfile .

echo ""
echo "Building event-producer-service image..."
docker build -t event-producer-service:latest -f event-producer-service/Dockerfile .

echo ""
echo "Building notification-service image..."
docker build -t notification-service:latest -f notification-service/Dockerfile .

# Step 3: Build frontend
echo ""
echo "=========================================="
echo "Step 3: Building frontend"
echo "=========================================="
cd "$SCRIPT_DIR/../airline-frontend"
npm install
npm run build

# Copy dist to frontend folder for Docker build
cp -r dist "$SCRIPT_DIR/frontend/"

echo ""
echo "Building frontend image..."
cd "$SCRIPT_DIR/frontend"
docker build -t airline-frontend:latest .

# Cleanup copied dist
rm -rf "$SCRIPT_DIR/frontend/dist"

# Step 4: Deploy to Kubernetes
echo ""
echo "=========================================="
echo "Step 4: Deploying to Kubernetes"
echo "=========================================="

cd "$SCRIPT_DIR/k8s"

# Create namespace
echo "Creating namespace..."
kubectl apply -f namespace.yaml

# Apply ConfigMap and Secret
echo "Applying ConfigMap and Secret..."
kubectl apply -f configmap.yaml

# Create secret with environment variable if set, otherwise use template
if [ -n "$OPENROUTER_API_KEY" ]; then
    echo "Creating secret from environment variable..."
    kubectl create secret generic airline-secrets \
        --from-literal=DB_USER=airline \
        --from-literal=DB_PASSWORD=airline123 \
        --from-literal=OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
        -n $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
else
    echo "Using secret.yaml template (API key may be placeholder)..."
    kubectl apply -f secret.yaml
fi

# Deploy infrastructure (PostgreSQL, Kafka)
echo "Deploying PostgreSQL..."
kubectl apply -f postgres.yaml

echo "Deploying Kafka..."
kubectl apply -f kafka.yaml

echo "Deploying Kafka UI..."
kubectl apply -f kafka-ui.yaml

# Wait for infrastructure to be ready
echo ""
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s

echo "Waiting for Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=kafka -n $NAMESPACE --timeout=120s

# Deploy microservices
echo ""
echo "Deploying microservices..."
kubectl apply -f flight-service.yaml
kubectl apply -f chat-service.yaml
kubectl apply -f event-producer-service.yaml
kubectl apply -f notification-service.yaml

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f frontend.yaml

# Wait for services to be ready
echo ""
echo "Waiting for flight-service to be ready..."
kubectl wait --for=condition=ready pod -l app=flight-service -n $NAMESPACE --timeout=120s

echo "Waiting for chat-service to be ready..."
kubectl wait --for=condition=ready pod -l app=chat-service -n $NAMESPACE --timeout=120s

echo "Waiting for notification-service to be ready..."
kubectl wait --for=condition=ready pod -l app=notification-service -n $NAMESPACE --timeout=120s

echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=120s

# Apply Ingress
echo ""
echo "Applying Ingress..."
kubectl apply -f ingress.yaml

# Step 5: Verify deployment
echo ""
echo "=========================================="
echo "Step 5: Verifying deployment"
echo "=========================================="

echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE

echo ""
echo "Services:"
kubectl get services -n $NAMESPACE

echo ""
echo "Ingress:"
kubectl get ingress -n $NAMESPACE

echo ""
echo "=========================================="
echo "✅ Microservices deployment complete!"
echo "=========================================="
echo ""
echo "Access the application at: http://airline.local"
echo ""
echo "Make sure you have the following in /etc/hosts:"
echo "127.0.0.1 airline.local"
echo ""
echo "Kafka UI: http://airline.local/kafka-ui"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n $NAMESPACE        # List all pods"
echo "  kubectl logs -f <pod-name> -n $NAMESPACE  # View logs"
echo "  kubectl describe pod <pod-name> -n $NAMESPACE  # Pod details"
echo ""
