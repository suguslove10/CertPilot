# CertPilot

<div align="center">

![CertPilot Logo](https://raw.githubusercontent.com/suguslove10/CertPilot/master/frontend/public/logo192.png)

**Your Complete SSL Certificate & AWS Management Solution**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS-Integrated-FF9900?logo=amazon-aws)](https://aws.amazon.com)
[![Let's Encrypt](https://img.shields.io/badge/Let's%20Encrypt-Secured-003A70?logo=letsencrypt)](https://letsencrypt.org)

</div>

CertPilot is a comprehensive web application for managing SSL certificates and AWS resources with a focus on simplicity and automation. It provides a user-friendly interface for managing AWS credentials, Route53 DNS records, and SSL certificate provisioning.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Setup Instructions](#-setup-instructions)
  - [AWS Credentials Setup](#aws-credentials-setup)
  - [Managing Subdomains](#managing-subdomains)
  - [Certificate Management](#certificate-management)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## 🚀 Features

- **Secure AWS Integration** - Reliable credential management with AWS SDK
- **Route53 DNS Management** - Create and manage DNS records with ease
- **SSL Automation** - Automated certificate provisioning and renewal
- **Traefik Integration** - Centralized SSL management with edge routing
- **Modern Interface** - Clean, responsive design with Tailwind CSS
- **Container Support** - Direct certificate installation to Docker containers
- **HTTP to HTTPS Redirection** - Automatic redirection handled by Traefik

## 💻 Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Infrastructure**: Docker, Docker Compose, Traefik
- **SSL**: Let's Encrypt, Traefik ACME
- **AWS**: Route53, IAM

## 🚦 Quick Start

The quickest way to start CertPilot is using the Traefik setup:

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/CertPilot.git
cd CertPilot

# 2. Configure AWS credentials
# Edit the backend.env file with your AWS credentials
nano backend.env

# 3. Start the application with Traefik
./start-traefik.sh

# 4. Access the application
# Frontend: http://YOUR_SERVER_IP:8081
# Traefik Dashboard: http://YOUR_SERVER_IP:8090/dashboard/
```

## 📝 Setup Instructions

### AWS Credentials Setup

CertPilot requires AWS credentials with permissions for Route53. There are two ways to set up credentials:

#### Method 1: Environment Variables (Recommended)

1. Edit the `backend.env` file with your AWS credentials:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1
```

2. Restart the containers:

```bash
docker-compose -f docker-compose.traefik.yml down
docker-compose -f docker-compose.traefik.yml up -d
```

This method is more reliable and avoids credential verification issues.

#### Method 2: Web Interface

1. Navigate to "AWS Credentials" in the CertPilot UI
2. Enter your Access Key ID, Secret Access Key, and Region
3. Click "Save Credentials"

### Managing Subdomains

1. Navigate to "Subdomains" in the CertPilot UI

2. Click "Create New Subdomain" and provide:
   - Subdomain name (e.g., "app" for app.example.com)
   - Parent domain (e.g., example.com)
   - Target IP address
   - Record type (usually A)
   - TTL (Time To Live)

3. Click "Create Subdomain" and wait for DNS propagation

### Certificate Management

#### Using Traefik (Recommended)

1. Navigate to "Traefik SSL" in the CertPilot UI

2. Select the subdomain you want to secure

3. Specify the internal application port

4. Click "Issue Certificate with Traefik" and wait for the configuration

## 🔧 Troubleshooting

### AWS Credential Issues

If you encounter "SignatureDoesNotMatch" errors:

1. Use the environment variable method (backend.env file)
2. Ensure your AWS credentials are correct and have proper permissions
3. Check that your server's time is synchronized:
   ```bash
   sudo apt-get update && sudo apt-get install -y ntp && sudo service ntp restart
   ```

### Connection Issues

If you can't access the frontend:

1. Check if containers are running:
   ```bash
   docker ps
   ```

2. Verify port 8081 is open in your firewall/security group

3. Check frontend container logs:
   ```bash
   docker logs certpilot-frontend
   ```

### Traefik Issues

1. Check Traefik logs:
   ```bash
   docker logs certpilot-traefik
   ```

2. Verify dynamic configuration:
   ```bash
   docker exec certpilot-backend ls -la /etc/traefik/dynamic/
   ```

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Made with ❤️ by the CertPilot Team
</div> 