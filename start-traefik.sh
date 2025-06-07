#!/bin/bash

# Create necessary directories
mkdir -p ./traefik/dynamic
mkdir -p ./backend/.well-known/acme-challenge

# Check if js-yaml is installed
cd backend
if ! grep -q "js-yaml" package.json; then
  echo "Installing js-yaml dependency..."
  npm install --save js-yaml
fi
cd ..

# Start the application with Traefik
echo "Starting CertPilot with Traefik..."
docker-compose -f docker-compose.traefik.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Display service status
echo "Services status:"
docker-compose -f docker-compose.traefik.yml ps

# Show access information
echo ""
echo "CertPilot is now running with Traefik!"
echo "----------------------------------------"
echo "Frontend: http://certpilot.local"
echo "API: http://api.certpilot.local"
echo "Traefik Dashboard: http://localhost:8090/dashboard/"
echo ""
echo "To use the local domains, add the following to your hosts file:"
echo "127.0.0.1 certpilot.local api.certpilot.local"
echo ""
echo "To stop the application:"
echo "docker-compose -f docker-compose.traefik.yml down" 