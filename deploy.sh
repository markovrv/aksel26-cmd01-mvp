#!/bin/bash

# Industrial Tourism Platform - Docker Quick Deploy Script

echo "========================================"
echo "Industrial Tourism Platform Deployment"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

echo "[INFO] Docker is running."
echo ""

# Check if docker-compose exists
if command -v docker compose &> /dev/null; then
    echo "[INFO] Using docker compose plugin"
    COMPOSE_CMD="docker compose"
else
    echo "[INFO] Using docker-compose legacy"
    COMPOSE_CMD="docker-compose"
fi

echo "[INFO] Building and starting containers..."
echo ""

$COMPOSE_CMD up --build -d

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:5000"
echo "  - Adminer:  http://localhost:8080 (optional)"
echo ""
echo "Test Credentials:"
echo "  - Admin: admin@platform.ru / admin123"
echo "  - Student: ivan@student.ru / password123"
echo "  - Company: hr@kmz.ru / company123"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""