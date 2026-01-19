#!/bin/sh

echo "🚀 Starting Hardhat Node..."

# Start hardhat node in background
npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

# Wait for node to be ready
echo "⏳ Waiting for Hardhat node to start..."
sleep 5

# Deploy contract
echo "📦 Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Check if deployment succeeded
if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    
    # Copy ABI to backend
    if [ -f "/app/deployments/StudentCertificate.abi.json" ]; then
        mkdir -p /shared
        cp /app/deployments/StudentCertificate.abi.json /shared/
        echo "📄 ABI copied to shared volume"
    fi
else
    echo "❌ Contract deployment failed"
    kill $HARDHAT_PID
    exit 1
fi

# Keep hardhat node running
echo "✅ Blockchain service ready on port 8545"
wait $HARDHAT_PID
