#!/bin/bash

# R3LAY Channel Registry Deployment Script
# Deploys to Paseo Asset Hub Testnet

set -e

echo "🚀 R3LAY Contract Deployment"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Create one with:"
    echo "  echo 'PRIVATE_KEY=your_private_key' > .env"
    echo ""
    exit 1
fi

# Load environment
echo "📄 Loading .env file..."
source .env

# Check if private key is provided
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    echo ""
    echo "Add to .env file:"
    echo "  PRIVATE_KEY=your_private_key"
    echo ""
    exit 1
fi

# Configuration
RPC_URL="https://testnet-passet-hub-eth-rpc.polkadot.io"
CONTRACT_NAME="R3LAYChannelRegistry"

echo "📋 Configuration:"
echo "  RPC URL: $RPC_URL"
echo "  Contract: $CONTRACT_NAME v2.0 (with subscription management)"
echo ""

# Check if Foundry Polkadot is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found!"
    echo "Install with: curl -L https://raw.githubusercontent.com/paritytech/foundry-polkadot/refs/heads/master/foundryup/install | bash"
    exit 1
fi

# Compile
echo "📦 Compiling with Revive compiler..."
forge build --resolc

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Deploy
echo "🌐 Deploying to PAsset Hub..."
echo ""

forge create src/$CONTRACT_NAME.sol:$CONTRACT_NAME \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --resolc \
    --broadcast

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the contract address from above"
echo "2. View on BlockScout: https://blockscout-passet-hub.parity-testnet.parity.io"
echo "3. Update apps/r3lay/.env with:"
echo "   CONTRACT_ADDRESS=0x..."
echo ""
