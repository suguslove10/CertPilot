# CertPilot Installation Guide

This guide will help you set up CertPilot on your system.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Docker (optional, for containerized deployment)

## Standard Installation

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/certpilot.git
   cd certpilot
   ```

2. **Install dependencies**
   ```
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   Create `.env` files in both the backend and frontend directories using the provided templates.

4. **Start the application**
   ```
   # Start backend
   cd backend
   npm run dev
   
   # Start frontend (in a separate terminal)
   cd frontend
   npm run dev
   ```

## Docker Installation

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/certpilot.git
   cd certpilot
   ```

2. **Configure environment variables**
   Create `.env` files or modify the docker-compose.yml with appropriate environment variables.

3. **Build and start containers**
   ```
   docker-compose up -d
   ```

## Optional Features

### Web Server Detection

CertPilot includes a feature to detect web servers running on your system. This requires additional permissions when running in Docker.

#### Security Notice

⚠️ **Important**: Enabling the web server detection feature requires mounting the Docker socket into the container. This gives CertPilot significant access to the host Docker environment, including the ability to inspect all containers.

To enable this optional feature:

1. **Modify your docker-compose.yml file**
   ```yaml
   backend:
     # existing configuration...
     volumes:
       - /var/run/docker.sock:/var/run/docker.sock
   ```

2. **Ensure the backend container has Docker CLI**
   Either by installing it in your Dockerfile or using an image that includes it:
   ```dockerfile
   # In your backend Dockerfile
   RUN apt-get update && apt-get install -y docker.io
   # or for Alpine
   # RUN apk add --no-cache docker-cli
   ```

#### Alternative: Limited Detection

If you prefer not to grant this level of access, the web server detection feature will operate in limited mode, only detecting host-level services that are visible to the container. Docker container detection will be disabled. 