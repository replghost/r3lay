#!/bin/bash

# R3MAIL Mailbox Contract Setup Script
# Sets up Foundry for Polkadot development

set -e

echo "🔧 Setting up R3MAIL Mailbox Contract..."

# Check if foundry-polkadot is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found. Installing foundry-polkadot..."
    curl -L https://raw.githubusercontent.com/paritytech/foundry-polkadot/main/foundryup/install | bash
    source ~/.bashrc || source ~/.zshrc
    foundryup
else
    echo "✅ Foundry found: $(forge --version)"
fi

# Initialize Foundry project if needed
if [ ! -f "foundry.toml" ]; then
    echo "📝 Initializing Foundry project..."
    forge init --no-commit --force
fi

# Install dependencies
echo "📦 Installing dependencies..."
forge install foundry-rs/forge-std --no-commit || true

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your private key"
fi

# Build contract
echo "🔨 Building contract..."
forge build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your private key"
echo "2. Run tests: forge test -vv"
echo "3. Deploy: ./deploy.sh"
