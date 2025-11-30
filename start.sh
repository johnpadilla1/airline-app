#!/bin/bash

# Airline Flight Tracker - Start Script
# This script starts all components: Docker infrastructure, Backend, and Frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Airline Flight Tracker - Starting   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    while ! nc -z "$host" "$port" 2>/dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}$service failed to start after $max_attempts attempts${NC}"
            return 1
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    echo ""
    echo -e "${GREEN}$service is ready!${NC}"
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command_exists java; then
    echo -e "${RED}Error: Java is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# Load environment variables from .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${YELLOW}Loading environment variables from .env...${NC}"
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
    echo -e "${GREEN}Environment variables loaded${NC}"
else
    echo -e "${YELLOW}Warning: .env file not found. Create one from .env.example${NC}"
fi
echo ""

# Step 1: Start Docker infrastructure
echo -e "${BLUE}Step 1: Starting Docker infrastructure...${NC}"
docker-compose up -d

# Wait for services to be ready
wait_for_service localhost 5433 "PostgreSQL"
wait_for_service localhost 9094 "Kafka"
echo ""

# Step 2: Install frontend dependencies if needed
echo -e "${BLUE}Step 2: Checking frontend dependencies...${NC}"
cd "$SCRIPT_DIR/airline-frontend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}Frontend dependencies already installed${NC}"
fi
cd "$SCRIPT_DIR"
echo ""

# Step 3: Start Backend
echo -e "${BLUE}Step 3: Starting Spring Boot backend...${NC}"
cd "$SCRIPT_DIR/airline-backend"

# Check if Maven wrapper exists, if not use mvn
if [ -f "./mvnw" ]; then
    chmod +x ./mvnw
    ./mvnw spring-boot:run > "$SCRIPT_DIR/backend.log" 2>&1 &
else
    mvn spring-boot:run > "$SCRIPT_DIR/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.backend.pid"
echo -e "${GREEN}Backend starting (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}Backend logs: $SCRIPT_DIR/backend.log${NC}"
cd "$SCRIPT_DIR"

# Wait for backend to be ready
wait_for_service localhost 8080 "Backend API"
echo ""

# Step 4: Start Frontend
echo -e "${BLUE}Step 4: Starting React frontend...${NC}"
cd "$SCRIPT_DIR/airline-frontend"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend.pid"
echo -e "${GREEN}Frontend starting (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}Frontend logs: $SCRIPT_DIR/frontend.log${NC}"
cd "$SCRIPT_DIR"

# Wait a moment for frontend to start
sleep 3
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   All services started successfully!  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Access Points:${NC}"
echo -e "  Frontend:    ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend API: ${BLUE}http://localhost:8080/api/flights${NC}"
echo -e "  Kafka UI:    ${BLUE}http://localhost:8090${NC}"
echo -e "  SSE Stream:  ${BLUE}http://localhost:8080/api/flights/stream${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop.sh${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo -e "  Docker:   docker-compose logs -f"
echo ""
