#!/bin/bash

# Airline Flight Tracker - Stop Script
# This script stops all components: Frontend, Backend, and Docker infrastructure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Airline Flight Tracker - Stopping   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process by PID file
kill_process() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service_name (PID: $PID)...${NC}"
            kill $PID 2>/dev/null
            sleep 2
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID 2>/dev/null
            fi
            echo -e "${GREEN}$service_name stopped${NC}"
        else
            echo -e "${YELLOW}$service_name is not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}$service_name PID file not found${NC}"
    fi
}

# Step 1: Stop Frontend
echo -e "${BLUE}Step 1: Stopping Frontend...${NC}"
kill_process "$SCRIPT_DIR/.frontend.pid" "Frontend"

# Also kill any running vite processes
pkill -f "vite" 2>/dev/null || true
echo ""

# Step 2: Stop Backend
echo -e "${BLUE}Step 2: Stopping Backend...${NC}"
kill_process "$SCRIPT_DIR/.backend.pid" "Backend"

# Also kill any running spring-boot processes for this project
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "airline-backend" 2>/dev/null || true
echo ""

# Step 3: Stop Docker infrastructure
echo -e "${BLUE}Step 3: Stopping Docker infrastructure...${NC}"
if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    docker-compose down
    echo -e "${GREEN}Docker containers stopped${NC}"
else
    echo -e "${YELLOW}docker-compose.yml not found${NC}"
fi
echo ""

# Clean up log files (optional)
read -p "Do you want to remove log files? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$SCRIPT_DIR/backend.log" "$SCRIPT_DIR/frontend.log"
    echo -e "${GREEN}Log files removed${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   All services stopped successfully!  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}To start again, run: ./start.sh${NC}"
echo ""

# Optional: Remove Docker volumes
echo -e "${YELLOW}Note: Database data is preserved in Docker volumes.${NC}"
echo -e "${YELLOW}To reset database, run: docker-compose down -v${NC}"
echo ""
