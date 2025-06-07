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
- [Installation](#-installation)
  - [One-Click Installation](#one-click-installation)
  - [Manual Installation](#manual-installation)
- [AWS Credentials Setup](#-aws-credentials-setup)
- [Usage Guide](#-usage-guide)
- [Traefik Dashboard](#traefik-dashboard)
- [License](#-license)

## 🚀 Features

- **Secure AWS Integration** - Reliable credential management with AWS SDK
- **Route53 DNS Management** - Create and manage DNS records with ease
- **SSL Automation** - Automated certificate provisioning and renewal
- **Traefik Integration** - Centralized SSL management with edge routing
- **Modern Interface** - Clean, responsive design with Tailwind CSS

## 💻 Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Infrastructure**: Docker, Docker Compose, Traefik
- **SSL**: Let's Encrypt, Traefik ACME
- **AWS**: Route53, IAM

## 📥 Installation

### One-Click Installation

For a quick and easy setup, use our installation script:

```bash
# 1. Clone the repository
git clone https://github.com/suguslove10/CertPilot.git
cd CertPilot

# 2. Run the installation script
./install.sh
```

The script will:
- Check for Docker and Docker Compose
- Guide you through AWS credential setup
- Create the necessary configuration files
- Start the application

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

Then access the dashboard at [http://localhost:8090/dashboard/](http://localhost:8090/dashboard/)

**IMPORTANT:** For production deployment, change the default credentials in both:
- `traefik/dynamic/dashboard.yml`  
- `docker-compose.yml` (the traefik service labels)

Generate new credentials with:
```bash
htpasswd -nb admin <your-secure-password>
```

---

<div align="center">
Made with ❤️ by the CertPilot Team
</div> 