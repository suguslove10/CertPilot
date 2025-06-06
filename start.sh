#!/bin/bash

# Script to start CertPilot in either development or production mode

MODE=${1:-dev}

if [ "$MODE" = "dev" ]; then
    echo "Starting CertPilot in development mode..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "CertPilot development environment is running."
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:5001/api"
    echo "MongoDB: mongodb://localhost:27017/certpilot"
elif [ "$MODE" = "prod" ]; then
    echo "Starting CertPilot in production mode..."
    docker-compose up -d
    echo "CertPilot production environment is running."
    echo "Application: http://localhost"
else
    echo "Invalid mode. Please use 'dev' or 'prod'."
    exit 1
fi

echo "To stop the services, run: docker-compose down" 