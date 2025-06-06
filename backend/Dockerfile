FROM node:18-alpine

WORKDIR /app

# Install Docker CLI for container detection
RUN apk add --no-cache docker-cli

COPY package*.json ./

# Install all dependencies including development dependencies
RUN npm install

COPY . .

EXPOSE 5000

# Default command is start but docker-compose will override it with dev for development
CMD ["npm", "start"] 