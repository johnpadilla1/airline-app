#!/bin/bash

# =============================================================================
# Kubernetes Stop Script for Airline App
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Airline App - Kubernetes Cleanup${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if namespace exists
if kubectl get namespace airline &> /dev/null; then
    echo -e "\n${YELLOW}Deleting airline namespace and all resources...${NC}"
    kubectl delete namespace airline --grace-period=30
    echo -e "${GREEN}✅ Namespace deleted${NC}"
else
    echo -e "\n${YELLOW}⚠️  Namespace 'airline' not found. Nothing to delete.${NC}"
fi

# Optionally remove ingress controller (uncomment if desired)
# echo -e "\n${YELLOW}Removing NGINX Ingress Controller...${NC}"
# kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
# echo -e "${GREEN}✅ Ingress controller removed${NC}"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Cleanup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "\n${BLUE}Remaining resources:${NC}"
kubectl get all --all-namespaces | grep -v "kube-system\|ingress-nginx\|default" || echo "No airline resources found"

echo -e "\n${GREEN}To remove Docker images:${NC}"
echo -e "  docker rmi airline-backend:latest"
echo -e "  docker rmi airline-frontend:latest"
