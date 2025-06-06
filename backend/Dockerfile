FROM node:18

WORKDIR /app

# Install Docker CLI and other tools
RUN apt-get update && apt-get install -y \
    docker.io \
    openssl \
    dnsutils \
    curl \
    certbot \
    python3-certbot-dns-route53 \
    awscli

COPY package*.json ./

# Install all dependencies including development dependencies
RUN npm install

# Create directory for certificates
RUN mkdir -p /etc/certpilot/certificates
RUN mkdir -p .well-known/acme-challenge
RUN chmod -R 755 .well-known

COPY . .

EXPOSE 5000

# Default command is start but docker-compose will override it with dev for development
CMD ["npm", "start"] 