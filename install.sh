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
                                          
${NC}"

echo -e "${GREEN}===== CertPilot One-Click Installation =====${NC}\n"

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Please run this script with sudo privileges:${NC}"
    echo -e "sudo $0"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker and Docker Compose are installed"

# Create backend.env if it doesn't exist
if [ ! -f backend.env ]; then
    echo -e "${YELLOW}Creating backend.env file...${NC}"
    
    # Ask for AWS credentials
    echo -e "${BLUE}Please enter your AWS credentials:${NC}"
    read -p "AWS Access Key ID: " aws_access_key
    read -p "AWS Secret Access Key: " aws_secret_key
    read -p "AWS Region [ap-south-1]: " aws_region
    aws_region=${aws_region:-ap-south-1}
    
    # Generate a random session secret
    session_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
    
    # Create the backend.env file
    cat > backend.env << EOF
# AWS Credentials - Required for Route53 integration
AWS_ACCESS_KEY_ID=$aws_access_key
AWS_SECRET_ACCESS_KEY=$aws_secret_key
AWS_REGION=$aws_region

# Session Secret - Used for encrypting session data
SESSION_SECRET=$session_secret

# MongoDB Connection
MONGODB_URI=mongodb://mongo:27017/certpilot

# Other Settings
PORT=5000
NODE_ENV=production

# Encryption Key for stored credentials
ENCRYPTION_KEY=certpilot-secure-encryption-key-32-chars
EOF
    
    echo -e "${GREEN}✓${NC} backend.env file created successfully"
else
    echo -e "${GREEN}✓${NC} backend.env file already exists"
fi

# Create necessary directories if they don't exist
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p ./traefik/dynamic
mkdir -p ./data/certificates
mkdir -p ./data/mongodb

echo -e "${GREEN}✓${NC} Directories created successfully"

# Build the application
echo -e "\n${BLUE}Building CertPilot...${NC}"
echo -e "${YELLOW}Note: This process might take several minutes depending on your system...${NC}"
docker-compose build --no-cache

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build completed successfully"
else
    echo -e "\n${RED}Error building CertPilot. Please check the Docker logs.${NC}"
    exit 1
fi

# Start the application
echo -e "\n${BLUE}Starting CertPilot...${NC}"
docker-compose down 2>/dev/null
docker-compose up -d

# Check if the containers are running
if [ $? -eq 0 ]; then
    # Wait for services to initialize
    echo -e "${YELLOW}Waiting for services to initialize...${NC}"
    sleep 10
    
    # Check if backend container is healthy
    if docker logs certpilot-backend | grep -q "Server running on port 5000"; then
        echo -e "${GREEN}✓${NC} Backend service is running properly"
    else
        echo -e "${YELLOW}Warning: Backend service might not be fully initialized. Check logs with: docker logs certpilot-backend${NC}"
    fi
    
    echo -e "\n${GREEN}====== CertPilot is now running! ======${NC}"
    echo -e "Access the application at:"
    echo -e "  Frontend: ${BLUE}http://$(hostname -I | awk '{print $1}'):8081${NC}"
    echo -e "  Traefik Dashboard: ${BLUE}http://$(hostname -I | awk '{print $1}'):8090/dashboard/${NC}"
    
    # Display running containers for verification
    echo -e "\n${YELLOW}Running containers:${NC}"
    docker-compose ps
    
    echo -e "\nTo stop the application, run: ${YELLOW}docker-compose down${NC}"
    echo -e "To view logs, run: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "To check backend status: ${YELLOW}curl http://localhost:5000/api/health${NC}"
else
    echo -e "\n${RED}Error starting CertPilot. Please check the Docker logs.${NC}"
    exit 1
fi 