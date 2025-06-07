#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}
 _____           _   _____ _ _       _   
/  __ \\         | | |  __ (_) |     | |  
| /  \\/ ___ _ __| |_| |_) |_| | ___ | |_ 
| |    / _ \\ '__| __|  ___/ | |/ _ \\| __|
| \\__/\\  __/ |  | |_| |   | | | (_) | |_ 
 \\____/\\___|_|   \\__|_|   |_|_|\\___/ \\__|
                 DEVELOPMENT MODE                
${NC}"

echo -e "${GREEN}===== Starting CertPilot in Development Mode =====${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create backend.env if it doesn't exist
if [ ! -f backend.env ]; then
    echo -e "${YELLOW}Creating backend.env file...${NC}"
    cp backend.env.sample backend.env
    echo -e "${GREEN}✓${NC} backend.env file created from sample"
    echo -e "${YELLOW}Please edit backend.env with your credentials before proceeding${NC}"
    exit 1
fi

# Start the application in development mode
echo -e "\n${BLUE}Starting CertPilot in development mode...${NC}"
docker-compose -f docker-compose.dev.yml down 2>/dev/null
docker-compose -f docker-compose.dev.yml up -d

# Check if the containers are running
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}====== CertPilot Development Environment is now running! ======${NC}"
    echo -e "Access the application at:"
    echo -e "  Frontend: ${BLUE}http://localhost:8081${NC}"
    echo -e "  Backend API: ${BLUE}http://localhost:5001${NC}"
    echo -e "  Traefik Dashboard: ${BLUE}http://localhost:8090/dashboard/${NC}"
    
    # Add local hosts entries reminder
    echo -e "\n${YELLOW}To use custom domains locally, add these to your /etc/hosts file:${NC}"
    echo -e "127.0.0.1    certpilot.local"
    echo -e "127.0.0.1    api.certpilot.local"
    
    echo -e "\nTo stop the development environment, run: ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
else
    echo -e "\n${RED}Error starting CertPilot development environment. Please check the Docker logs.${NC}"
    exit 1
fi 