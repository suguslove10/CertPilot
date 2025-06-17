# CertPilot

<div align="center">

![CertPilot Logo](https://raw.githubusercontent.com/suguslove10/CertPilot/master/frontend/public/logo192.png)

**Your Complete SSL Certificate & AWS Management Solution**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS-Integrated-FF9900?logo=amazon-aws)](https://aws.amazon.com)
[![Let's Encrypt](https://img.shields.io/badge/Let's%20Encrypt-Secured-003A70?logo=letsencrypt)](https://letsencrypt.org)

</div>

CertPilot is a comprehensive SSL certificate and AWS resource management application designed to simplify certificate lifecycle management and AWS infrastructure integration.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
  - [Prerequisites](#prerequisites)
  - [One-Click Installation](#one-click-installation)
  - [Manual Installation](#manual-installation)
- [AWS Credentials Setup](#-aws-credentials-setup)
- [Usage Guide](#-usage-guide)
- [Traefik Dashboard](#traefik-dashboard)
- [License](#-license)
- [Observability Features](#observability-features)

## 🚀 Features

- **Certificate Lifecycle Management**
  - Expiration monitoring and alerting
  - Auto-renewal tracking
  - Certificate inventory management
  
- **AWS Integration**
  - EC2 instance discovery and management
  - Load balancer integration
  - ACM certificate management
  - AWS credentials management

## 💻 Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Infrastructure**: Docker, Docker Compose, Traefik
- **SSL**: Let's Encrypt, Traefik ACME
- **AWS**: Route53, IAM

## 📥 Installation

### Prerequisites

- Docker and Docker Compose
- Linux/Unix-based system (tested on Ubuntu)
- Sudo/root privileges

### One-Click Installation

1. Clone the repository:
```bash
   git clone https://github.com/yourusername/CertPilot.git
cd CertPilot
   ```

2. Run the installation script:
   ```bash
   sudo ./install.sh
```

3. Follow the prompts to provide your AWS credentials when requested.

4. Once installation is complete, access the application:
   - Frontend: http://localhost:8081
   - Traefik Dashboard: http://localhost:8090/dashboard/

### Manual Installation

If you prefer to set up manually:

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/CertPilot.git
cd CertPilot

# 2. Configure AWS credentials
cp backend.env.sample backend.env
# Edit the backend.env file with your AWS credentials
nano backend.env

# 3. Start the application
docker-compose up -d

# 4. Access the application
# Frontend: http://YOUR_SERVER_IP:8081
# Traefik Dashboard: http://YOUR_SERVER_IP:8090/dashboard/
```

## 🔐 AWS Credentials Setup

CertPilot requires AWS credentials with permissions for Route53:

1. Create an IAM user with the following permissions:
   - `route53:ListHostedZones`
   - `route53:GetHostedZone`
   - `route53:ChangeResourceRecordSets`
   - `route53:ListResourceRecordSets`

2. Edit the `backend.env` file with your AWS credentials:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1
```

## 📘 Usage Guide

### Managing Subdomains

1. Navigate to "Subdomains" in the CertPilot UI
2. Click "Create New Subdomain" and provide:
   - Subdomain name (e.g., "app" for app.example.com)
   - Parent domain (e.g., example.com)
   - Record type (usually A)
   - TTL (Time To Live)

### Certificate Management

1. Navigate to "Traefik SSL" in the CertPilot UI
2. Select the subdomain you want to secure
3. Specify the internal application port (8081 for frontend, 5000 for backend services)
4. Click "Issue Certificate with Traefik" and wait for the configuration

## 🔧 Troubleshooting

If you encounter issues with AWS credentials, ensure:
1. Your AWS credentials are correct and have proper permissions
2. Your server's time is synchronized

If you can't access the frontend:
1. Check if containers are running with `docker ps`
2. Verify port 8081 is open in your firewall/security group

## 📄 License

This project is licensed under the MIT License.

## Traefik Dashboard

### Local Development
In development mode, the Traefik dashboard is accessible at [http://localhost:8090/dashboard/](http://localhost:8090/dashboard/).

### Direct Access in Production
You can directly access the Traefik dashboard in production at:

```
http://your-server-ip:8090/dashboard/
```

For example: http://13.233.90.14:8090/dashboard/

### Production Access
For security reasons, the Traefik dashboard in production is:

1. Bound only to localhost (127.0.0.1) on port 8090
2. Protected with basic authentication (default credentials: admin/certpilot)
3. Accessible via:
   - SSH tunnel using the provided `dashboard-access.sh` script
   - Domain-based access at `traefik.<your-domain>` with HTTPS and basic auth

To securely access the dashboard from your local machine:

```bash
# Usage
./dashboard-access.sh <remote_user> <remote_host>

# Example
./dashboard-access.sh ubuntu 123.45.67.89
```

### Troubleshooting SSH Connection
If you get "Permission denied (publickey)" error:
- Ensure your SSH key is properly set up on your local machine
- Make sure your public key is added to the server's authorized_keys file
- Try connecting manually first: `ssh username@your-server-ip`

Then access the dashboard at [http://localhost:8090/dashboard/](http://localhost:8090/dashboard/)

**IMPORTANT:** For production deployment, change the default credentials in both:
- `traefik/dynamic/dashboard.yml`  
- `docker-compose.yml` (the traefik service labels)

Generate new credentials with:
```bash
htpasswd -nb admin <your-secure-password>
```

## Docker Management

- **Start CertPilot**:
  ```bash
  docker-compose up -d
  ```

- **Stop CertPilot**:
  ```bash
  docker-compose down
  ```

- **View logs**:
  ```bash
  docker-compose logs -f
  ```

- **Check specific container logs**:
  ```bash
  docker logs certpilot-backend
  docker logs certpilot-frontend
  ```

## Troubleshooting

### Common Issues

1. **Docker permission errors**:
   - Make sure you're running commands with `sudo` or that your user is in the docker group
   - Fix: `sudo usermod -aG docker $USER` and log out/in

2. **Backend fails to start**:
   - Check logs: `docker logs certpilot-backend`
   - Verify MongoDB is running: `docker ps | grep mongo`

3. **Frontend shows no data**:
   - Verify backend is running: `curl http://localhost:5000/api/health`
   - Check browser console for CORS or connection errors

### Rebuilding Containers

If you need to rebuild a specific container:

```bash
docker-compose build --no-cache backend
docker-compose up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Observability Features

CertPilot now includes comprehensive observability features to help you monitor system performance, service health, and certificate status:

### Performance Metrics Dashboard
- Real-time system metrics (CPU, memory, network)
- Database performance monitoring
- Certificate metrics (status counts, expiration timelines)
- Historical metrics tracking with visualizations

### Health Monitoring
- Service health checks for all system components
- Database connectivity monitoring
- AWS integration status
- Traefik configuration validation
- Historical health data with status timeline

### Certificate Status Visualizations
- Certificate status distribution charts
- Expiration timeline analysis
- Certificate health categorization
- Upcoming expiration alerts with detailed views

The observability dashboards are accessible through the `/observability` route in the application.

---

<div align="center">
Made with ❤️ by the CertPilot Team
</div> 