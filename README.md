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
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
  - [Setting Up AWS Credentials](#setting-up-aws-credentials)
  - [Managing Subdomains](#managing-subdomains)
  - [Certificate Management](#certificate-management)
- [Troubleshooting](#-troubleshooting)
- [Security Considerations](#-security-considerations)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure register, login, and session management
- **AWS Integration** - Secure credential management with encryption
- **Route53 DNS Management** - Create and manage DNS records
- **SSL Automation** - Automated certificate provisioning and renewal
- **Multiple Deployment Options** - Standard or Traefik-based deployment

### UI/UX Features
- **Modern Interface** - Clean design with Tailwind CSS
- **Responsive Design** - Optimized for all device sizes
- **Interactive Components** - Rich user experience with feedback
- **Accessibility** - WCAG-compliant form elements and navigation
- **Real-time Status Updates** - Visual indicators for all operations

### Advanced Features
- **Traefik Integration** - Centralized SSL management with edge routing
- **Container Support** - Direct certificate installation to Docker containers
- **Auto-renewal** - Automatic certificate renewal management
- **Port Independence** - Applications can run on any internal port

## 🏗 Architecture

CertPilot offers two deployment architectures:

### Standard Architecture
```
User → Frontend (React) → Backend (Node.js) → AWS Route53
                                            → Let's Encrypt
                                            → MongoDB
```

### Traefik-based Architecture
```
User → Traefik Proxy → Frontend (React) → Backend (Node.js) → AWS Route53
                     ↓                                      → MongoDB
             Let's Encrypt ACME
```

## 💻 Technology Stack

### Frontend
- **React** - Component-based UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Hook Form** - Form state management

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **AWS SDK** - AWS service integration

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Traefik** - Edge router and reverse proxy
- **Let's Encrypt** - Certificate authority

## 🚦 Quick Start

### One-Click Installation (Recommended)

The easiest way to install CertPilot is using our one-click installation script:

```bash
# Download and run the installer
curl -sSL https://raw.githubusercontent.com/suguslove10/CertPilot/master/install.sh | bash
```

Or if you've already cloned the repository:

```bash
# Run the installer
./install.sh
```

The script will guide you through the installation process with simple prompts.

### Prerequisites

- **Docker and Docker Compose** - [Installation Guide](https://docs.docker.com/get-docker/)
- **AWS Account** - With Route53 access
- **Domain Name** - Managed through Route53

### Standard Installation

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

### Using Traefik (Advanced)

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
# Direct Frontend Access (for internal users): http://YOUR_SERVER_IP:8081
```

### Development Setup

```bash
# Run in development mode with hot-reloading
docker-compose -f docker-compose.dev.yml up -d

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:5001/api
```

## 📘 Usage Guide

### Setting Up AWS Credentials

1. Sign in to your AWS account and create an IAM user with the following permissions:
   - `route53:ListHostedZones`
   - `route53:GetHostedZone`
   - `route53:ChangeResourceRecordSets`
   - `route53:ListResourceRecordSets`

2. Generate access keys for this IAM user

3. In CertPilot, navigate to "AWS Credentials" and add your credentials:
   - Access Key ID
   - Secret Access Key
   - AWS Region (e.g., us-east-1)

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

#### Standard Method

1. Navigate to "SSL Certificates" in the CertPilot UI

2. Select the subdomain you want to secure

3. Select target containers for certificate installation (optional)

4. Click "Issue Certificate" and wait for the process to complete

#### Traefik Method

1. Navigate to "Traefik SSL" in the CertPilot UI

2. Select the subdomain you want to secure

3. Specify the internal application port

4. Click "Issue Certificate with Traefik" and wait for the configuration

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Docker Containers Not Starting

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service_name]
```

#### Certificate Issuance Failures

1. **DNS Propagation Issues**
   - Verify your domain's DNS has propagated with `dig +short yourdomain.com`
   - Wait 15-30 minutes for DNS changes to propagate globally

2. **AWS Credentials Problems**
   - Verify your AWS credentials have the correct permissions
   - Try re-entering your AWS credentials in the UI

3. **Let's Encrypt Rate Limits**
   - Check if you've hit Let's Encrypt rate limits (5 failed validations per hour)
   - Wait an hour before trying again

#### Traefik-specific Issues

1. **Port Conflicts**
   - Ensure ports 80, 443, and 8090 are available on your host
   - Check with `netstat -tuln | grep -E '80|443|8090'`

2. **Configuration Problems**
   - Check Traefik logs: `docker logs certpilot-traefik`
   - Verify dynamic configuration: `docker exec certpilot-backend ls -la /etc/traefik/dynamic/`

## 🔒 Security Considerations

- **AWS Credentials**: Stored with AES-256 encryption in the database
- **JWT Tokens**: Used for secure API access with short expiration times
- **HTTPS**: All production traffic should use HTTPS
- **Container Isolation**: Services run in isolated containers
- **Least Privilege**: Always use IAM users with minimal required permissions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
Made with ❤️ by the CertPilot Team
</div> 