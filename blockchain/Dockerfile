FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy contract files
COPY . .

# Compile contracts
RUN npx hardhat compile

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Expose Hardhat node port
EXPOSE 8545

# Start Hardhat node with deployment
ENTRYPOINT ["./docker-entrypoint.sh"]

