FROM node:18-alpine

WORKDIR /app

# Install Docker CLI and tools for certificate management
RUN apk add --no-cache docker-cli openssl bind-tools curl

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