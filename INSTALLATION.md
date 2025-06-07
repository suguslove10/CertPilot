# CertPilot Installation Guide

This document provides step-by-step installation instructions for CertPilot.

## Choose Your Installation Method

CertPilot offers three installation methods:

1. **Standard Installation**: Quick production setup with Docker
2. **Traefik Installation**: Advanced setup with centralized SSL management 
3. **Development Setup**: For contributors and developers

## Prerequisites for All Methods

- **Docker and Docker Compose** - [Installation Guide](https://docs.docker.com/get-docker/)
- **AWS Account** with Route53 access
- **Domain Name** managed through Route53

## Method 1: Standard Installation

This is the recommended method for most users.

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/certpilot.git
cd certpilot

# 2. Start the application
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost
# API: http://localhost:5000/api
```

## Method 2: Traefik Installation (Advanced)

This method provides centralized SSL management through Traefik.

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/certpilot.git
cd certpilot

# 2. Start with Traefik
./start-traefik.sh

# 3. For local testing, add to hosts file:
# 127.0.0.1 certpilot.local api.certpilot.local

# 4. Access:
# Frontend: http://certpilot.local
# API: http://api.certpilot.local
# Traefik Dashboard: http://localhost:8090/dashboard/
```

## Method 3: Development Setup

Use this method if you're contributing to CertPilot or need a development environment.

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/certpilot.git
cd certpilot

# 2. Run in development mode with hot-reloading
docker-compose -f docker-compose.dev.yml up -d

# 3. Access:
# Frontend: http://localhost:3000
# API: http://localhost:5001/api
```

## Post-Installation Steps

After installing CertPilot, complete these steps to start using the application:

1. **Register an account** on the CertPilot web interface
2. **Add AWS credentials** in the "AWS Credentials" section
3. **Configure your domains** in the "Domains" section

## Troubleshooting

### Common Issues

#### Docker Containers Not Starting

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service_name]
```

#### Port Conflicts

If you encounter port conflicts, ensure ports 80, 443, and 8090 (for Traefik) are available:

```bash
# Check for port usage
netstat -tuln | grep -E '80|443|8090'
```

You can modify the port mappings in the docker-compose files if needed.

## Manual Installation (Without Docker)

While Docker installation is strongly recommended, manual installation is possible for advanced users:

1. **Prerequisites**
   - Node.js v14+
   - MongoDB v4.4+
   - npm or yarn

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file with required variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create .env file if needed
   npm run dev
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Need Help?

If you encounter any issues during installation, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review container logs for specific error messages
3. Open an issue on our GitHub repository with detailed information about your problem 