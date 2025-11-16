# R3MAIL Mailbox Contract Deployment

**Date:** November 15, 2024  
**Network:** Paseo Asset Hub (Testnet)  
**Status:** ✅ Deployed

---

## Contract Details

**Contract Address:**
```
0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769
```

**Deployer Address:**
```
0xa2F70Cc9798171d3ef8fF7dAE91a76e8A1964438
```

**Transaction Hash:**
```
0x572712abd5e70ad8e03a88a71b45d042d347d07a20910f4c26ebdb4ff0352d8e
```

**Network:**
- Name: Paseo Asset Hub
- Chain ID: 420429638 (0x190f1b46)
- RPC: https://testnet-passet-hub-eth-rpc.polkadot.io
- Explorer: https://blockscout-passet-hub.parity-testnet.parity.io

---

## Verification

**Block Explorer:**
```
https://blockscout-passet-hub.parity-testnet.parity.io/address/0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769
```

**Contract Code:**
- Source: `/contracts/r3mail-mailbox/src/R3mailMailbox.sol`
- Compiler: Solidity 0.8.28
- Optimization: Enabled
- EVM Version: Cancun

---

## ABI

ABI file generated: `abi.json`

**Functions:**
- `notifyMessage(bytes32 msgId, address to, string envelopeCid)`
- `getInboxCount(address user) returns (uint256)`
- `hasMessage(bytes32 msgId) returns (bool)`

**Events:**
- `MessageNotified(bytes32 indexed msgId, address indexed from, address indexed to, string envelopeCid, uint256 timestamp)`

---

## Next Steps

### 1. Create @r3mail/chain Package

```bash
mkdir -p packages/r3mail-chain/src
```

Create `packages/r3mail-chain/src/config.ts`:
```typescript
export const R3MAIL_CONTRACT_ADDRESS = '0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769'
export const PASEO_ASSET_HUB_CHAIN_ID = 420429638
export const PASEO_ASSET_HUB_RPC = 'https://testnet-passet-hub-eth-rpc.polkadot.io'
```

### 2. Copy ABI

```bash
cp contracts/r3mail-mailbox/abi.json packages/r3mail-chain/src/abi.json
```

### 3. Update Client Config

Update `apps/r3mail/.env`:
```
NUXT_PUBLIC_CONTRACT_ADDRESS=0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769
NUXT_PUBLIC_CHAIN_ID=420429638
NUXT_PUBLIC_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
```

---

## Testing

Test the deployed contract:

```bash
# Get inbox count (should be 0 initially)
cast call 0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769 \
  "getInboxCount(address)(uint256)" \
  0xa2F70Cc9798171d3ef8fF7dAE91a76e8A1964438 \
  --rpc-url https://testnet-passet-hub-eth-rpc.polkadot.io

# Check if message exists (should be false)
cast call 0xABE4bEea70cA1F2A4B9a5eACcB9972E096B5d769 \
  "hasMessage(bytes32)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000001 \
  --rpc-url https://testnet-passet-hub-eth-rpc.polkadot.io
```

---

## Deployment Summary

✅ Contract compiled successfully  
✅ All tests passing (11/11)  
✅ Deployed to Paseo Asset Hub  
✅ ABI generated  
✅ Transaction confirmed  

**Ready for Week 1, Day 3-4: Build @r3mail/core package!** 🚀
