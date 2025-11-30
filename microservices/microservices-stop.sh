#!/bin/bash

# Stop and delete all microservices K8s resources

NAMESPACE="airline"

echo "=========================================="
echo "Stopping Airline App Microservices"
echo "=========================================="

echo "Deleting all resources in namespace $NAMESPACE..."
kubectl delete namespace $NAMESPACE --ignore-not-found

echo ""
echo "✅ All microservices resources deleted"
echo ""
