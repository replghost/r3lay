# R3MAIL

**Encrypted, wallet-based, one-to-one messaging on Paseo Asset Hub**

R3MAIL is a decentralized, end-to-end encrypted messaging protocol built on Polkadot's Paseo Asset Hub. It provides secure, private communication with instant delivery via blockchain events and off-chain storage for message content.

## Features

- 🔐 **End-to-End Encryption** - X25519 + XChaCha20-Poly1305
- 🔑 **Wallet-Based Identity** - No usernames or passwords
- ⚡ **Instant Delivery** - Real-time via chain event subscription
- 📝 **Markdown Support** - Rich text formatting
- 🌐 **Fully Decentralized** - No central servers
- 🔒 **Substrate Signatures** - Cryptographic sender authenticity

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Architecture

- **On-Chain**: Lightweight mailbox contract for notifications
- **Off-Chain**: IPFS for encrypted message storage
- **Client**: Nuxt 3 + Shadcn Vue UI
- **Crypto**: libsodium for encryption

## Documentation

- [Product Requirements](../../docs/R3MAIL-PRD)
- [Implementation Plan](../../docs/R3MAIL_IMPLEMENTATION_PLAN.md)
- [R3LAY Protocol](../../docs/R3LAY-001.md)

## Tech Stack

- [Nuxt 3](https://nuxt.com/)
- [Shadcn Vue](https://shadcn-vue.com/)
- [TailwindCSS 4](https://tailwindcss.com/)
- [Polkadot.js](https://polkadot.js.org/)
- [libsodium](https://libsodium.gitbook.io/)

## License

MIT

## Credits

UI components based on [Shadcn Vue](https://shadcn-vue.com/) and [Nuxt Shadcn Dashboard](https://github.com/dianprata/nuxt-shadcn-dashboard) by Dian Pratama.
