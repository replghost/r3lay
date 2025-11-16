# MILESTONE 2 PLAN: R3MAIL

**Team:** replghost  
**Track:** [X] SHIP-A-TON [ ] IDEA-TON  
**Date:** November 16, 2025

---

## 📍 WHERE WE ARE NOW

**What we built/validated this weekend:**
- Fully functional end-to-end encrypted messaging app on Passet Hub
- X25519 key derivation from wallet signatures with persistent storage
- Dual signature system (envelope + transaction) for message authenticity
- Modern 3-column inbox UI with message preview and markdown support
- IPFS integration for encrypted message storage
- Public key registry smart contract deployed and working

**What's working:**
- Complete message encryption/decryption flow
- Wallet-based identity (no separate accounts needed)
- Message persistence in IndexedDB
- Message syncing from blockchain events
- Reply functionality and message management
- Onboarding flow for new users

**What still needs work:**
- Mobile responsiveness optimization
- Message search and filtering
- Attachment support
- Group messaging capabilities
- Performance optimization for large message volumes

**Blockers or hurdles we hit:**
- CORS issues with RPC endpoints (filtered out in debug mode)
- Ethers v6 API changes required updates to signature verification
- Key derivation UX needed refinement to avoid repeated signatures

---

## 🚀 WHAT WE'LL SHIP IN 30 DAYS

**Our MVP will do this:**
R3MAIL will be an encrypted messaging platform that allows anyone with a wallet to send private, unstoppable messages. Users can attach files, search their message history, and communicate with zero trust in centralized servers.

### Features We'll Build (5 max)

**Week 1:**
- **Feature:** File attachments (images, documents up to 10MB)
- **Why it matters:** Users need to share files securely without relying on centralized services. This completes the core messaging experience.
- **Who builds it:** replghost

**Week 2:**
- **Feature:** Message search and filtering (by sender, date, keywords)
- **Why it matters:** As message volumes grow, users need to find specific conversations quickly. Essential for daily use.
- **Who builds it:** replghost

**Week 2-3:**
- **Feature:** Mobile-responsive UI optimization
- **Why it matters:** 60%+ of users access messaging on mobile. Current UI works but needs touch optimization and better mobile layouts.
- **Who builds it:** replghost

**Week 3:**
- **Feature:** BYOK IPFS Pinning + Recipient Auto-Pin
- **Why it matters:** Users control their own data with their own Pinata/Web3.Storage keys. Recipients automatically pin received messages, ensuring availability without central infrastructure. Solves the "who pays for storage?" problem while staying truly decentralized.
- **Who builds it:** replghost

**Week 4:**
- **Feature:** Light Client / Progressive Message Loading
- **Why it matters:** Current implementation loads all messages at once. Light client approach syncs recent messages first, then progressively loads history in background. Faster initial load, lower bandwidth, better mobile experience.
- **Who builds it:** replghost

### Team Breakdown

**replghost - Full-stack Developer** | 20 hrs/week
- Owns: All development, smart contracts, UI/UX, deployment

### Mentoring & Expertise We Need

**Areas where we need support:**
- Polkadot/Substrate ecosystem best practices for production deployment
- IPFS pinning strategies and gateway optimization for reliability 
- Security audit for cryptographic implementation (X25519, message encryption)
- UX feedback from Web3 messaging users

**Specific expertise we're looking for:**
- IPFS infrastructure and pinning service recommendations
- Cryptography review for key derivation and message encryption
- Growth/marketing guidance for Web3 messaging adoption

---

## 🎯 WHAT HAPPENS AFTER

**When M2 is done, we plan to...**
- Launch public beta on Paseo testnet with 50-100 early users
- Gather feedback on UX, performance, and feature priorities
- Deploy to Polkadot mainnet (Asset Hub) after security audit
- Build integrations with popular Web3 tools deployed on Polkadot Hub (ENS, etc.)

**And 6 months out we see our project achieve:**
- 1,000+ active users sending encrypted messages daily
- Integration with major Web3 wallets (MetaMask, Coinbase Wallet, WalletConnect)
- Mobile apps (iOS/Android) using the same encryption protocol
- Becoming the default encrypted messaging layer for Web3 communities
- Self-sustaining through optional IPFS pinning subscriptions
