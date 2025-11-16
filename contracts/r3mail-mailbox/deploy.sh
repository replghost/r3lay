#!/bin/bash

# R3MAIL Mailbox Contract Deployment Script
# Deploys to Paseo Asset Hub EVM

set -e

echo "🚀 Deploying R3mailMailbox to Paseo Asset Hub..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

# Check for private key
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    exit 1
fi

# Network configuration
RPC_URL="https://testnet-passet-hub-eth-rpc.polkadot.io"
CHAIN_ID=420429638

echo "📡 RPC: $RPC_URL"
echo "🔗 Chain ID: $CHAIN_ID"

# Deploy contract
echo "📝 Deploying contract..."
forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    --broadcast \
    src/R3mailMailbox.sol:R3mailMailbox

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Save the contract address"
echo "2. Update packages/r3mail-chain/src/config.ts"
echo "3. Generate ABI: forge inspect src/R3mailMailbox.sol:R3mailMailbox abi > abi.json"
