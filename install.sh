#!/bin/bash

# CertPilot One-Click Installation Script
# This script automates the installation of CertPilot using Docker

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print CertPilot banner
echo -e "${BLUE}"
echo "  ______           __  ____  _ __      __ "
echo " / ____/__  _____/ /_/ __ \(_) /___  / /_"
echo "/ /   / _ \/ ___/ __/ /_/ / / / __ \/ __/"
echo "/ /___/  __/ /  / /_/ ____/ / / /_/ / /_  "
echo "\____/\___/_/   \__/_/   /_/_/\____/\__/  "
echo -e "${NC}"
echo -e "${GREEN}One-Click Installation Script${NC}\n"

# Check if Docker is installed
echo -e "${BLUE}→ Checking if Docker is installed...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Please install Docker first:${NC}"
    echo -e "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
echo -e "${BLUE}→ Checking if Docker Compose is installed...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Please install Docker Compose first:${NC}"
    echo -e "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if we're in the CertPilot directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${BLUE}→ CertPilot files not found in current directory.${NC}"
    
    # Ask the user if they want to clone the repository
    read -p "Do you want to clone the CertPilot repository? (y/n): " clone_repo
    
    if [[ $clone_repo == "y" || $clone_repo == "Y" ]]; then
        echo -e "${BLUE}→ Cloning CertPilot repository...${NC}"
        git clone https://github.com/suguslove10/CertPilot.git
        
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Failed to clone repository. Please check your internet connection.${NC}"
            exit 1
        fi
        
        cd CertPilot
    else
        echo -e "${YELLOW}Installation canceled.${NC}"
        exit 1
    fi
fi

# Installation Options
echo -e "\n${GREEN}Select installation method:${NC}"
echo "1) Standard Installation (Recommended)"
echo "2) Traefik Installation (Advanced)"
echo "3) Development Setup"
read -p "Enter your choice (1-3) [1]: " install_choice

# Default to option 1 if no input
install_choice=${install_choice:-1}

case $install_choice in
    1)
        echo -e "\n${BLUE}→ Starting Standard Installation...${NC}"
        docker-compose up -d
        
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Failed to start Docker containers. Please check the error message above.${NC}"
            exit 1
        fi
        
        echo -e "\n${GREEN}✓ CertPilot has been successfully installed!${NC}"
        echo -e "Access the application at:"
        echo -e "  Frontend: ${BLUE}http://localhost${NC}"
        echo -e "  API: ${BLUE}http://localhost:5000/api${NC}"
        ;;
        
    2)
        echo -e "\n${BLUE}→ Starting Traefik Installation...${NC}"
        chmod +x start-traefik.sh
        ./start-traefik.sh
        
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Failed to start Traefik setup. Please check the error message above.${NC}"
            exit 1
        fi
        
        echo -e "\n${GREEN}✓ CertPilot with Traefik has been successfully installed!${NC}"
        echo -e "For local testing, add to your hosts file:"
        echo -e "  ${BLUE}127.0.0.1 certpilot.local api.certpilot.local${NC}"
        echo -e "\nAccess the application at:"
        echo -e "  Frontend: ${BLUE}http://certpilot.local${NC}"
        echo -e "  API: ${BLUE}http://api.certpilot.local${NC}"
        echo -e "  Traefik Dashboard: ${BLUE}http://localhost:8090/dashboard/${NC}"
        ;;
        
    3)
        echo -e "\n${BLUE}→ Starting Development Setup...${NC}"
        docker-compose -f docker-compose.dev.yml up -d
        
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Failed to start development environment. Please check the error message above.${NC}"
            exit 1
        fi
        
        echo -e "\n${GREEN}✓ CertPilot Development Environment has been successfully set up!${NC}"
        echo -e "Access the application at:"
        echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
        echo -e "  API: ${BLUE}http://localhost:5001/api${NC}"
        ;;
        
    *)
        echo -e "${YELLOW}Invalid option. Please select 1, 2, or 3.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Next Steps:${NC}"
echo "1. Register an account on the CertPilot web interface"
echo "2. Add your AWS credentials in the 'AWS Credentials' section"
echo "3. Configure your domains in the 'Domains' section"
echo -e "\n${BLUE}Thank you for installing CertPilot!${NC}" 