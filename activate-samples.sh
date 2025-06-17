#!/bin/bash

# Script to activate sample data for CertPilot demonstration

echo "Activating sample data for CertPilot..."

# Get the auth token first
echo "Logging in to get auth token..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d':' -f2 | tr -d '"')

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token. Make sure the backend is running and you have created a user."
  echo "You may need to register a user first with: curl -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{\"name\":\"Admin User\",\"email\":\"admin@example.com\",\"password\":\"password123\"}'"
  exit 1
fi

echo "Auth token obtained successfully."

# Create sample subdomains
echo "Creating sample subdomains..."
curl -s -X POST http://localhost:5000/api/subdomains/create-samples \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""

# Create sample certificates
echo "Creating sample certificates..."
curl -s -X POST http://localhost:5000/api/certificates/create-samples \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""

# Create sample Traefik certificates
echo "Creating sample Traefik certificates..."
curl -s -X POST http://localhost:5000/api/traefik-certificates/create-samples \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""

# Activate system health
echo "Activating system health..."
curl -s -X POST http://localhost:5000/api/health/activate-system \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo "Sample data activation complete. Refresh your CertPilot dashboard to see the changes." 