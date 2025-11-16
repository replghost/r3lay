# R3MAIL Mailbox Contract

Lightweight on-chain notification system for R3MAIL encrypted messaging.

## Prerequisites

Install Foundry for Polkadot:

```bash
# Install foundry-polkadot
curl -L https://raw.githubusercontent.com/paritytech/foundry-polkadot/main/foundryup/install | bash
foundryup

# Verify installation
forge --version
```

## Setup

```bash
# Install dependencies
forge install

# Build contract
forge build

# Run tests
forge test -vv

# Deploy to Paseo Asset Hub
./deploy.sh
```

## Contract Details

- **Network:** Paseo Asset Hub EVM
- **Chain ID:** 420429638
- **RPC:** https://testnet-passet-hub-eth-rpc.polkadot.io

## Functions

### `notifyMessage(bytes32 msgId, address to, string calldata envelopeCid)`

Notify the chain that a message has been sent.

**Parameters:**
- `msgId` - Unique message identifier (keccak256 hash)
- `to` - Recipient's EVM address
- `envelopeCid` - IPFS CID of encrypted envelope

**Events:**
```solidity
event MessageNotified(
    bytes32 indexed msgId,
    address indexed from,
    address indexed to,
    string envelopeCid,
    uint256 timestamp
)
```

## Gas Costs

- `notifyMessage()`: ~50,000 gas

## Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test
forge test --match-test testNotifyMessage

# Run with gas report
forge test --gas-report
```

## Deployment

1. Create `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
```

2. Run deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

3. Save the contract address and update:
   - `packages/r3mail-chain/src/config.ts`
   - `apps/r3mail/.env`

## License

MIT
