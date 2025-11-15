# R3LAY Smart Contract Roadmap - V3 Features

This document outlines potential features for future versions of the R3LAY Channel Registry smart contract.

## Version 2 (Current)
- ✅ Channel creation and management
- ✅ Subscription requests and approval
- ✅ Follower count tracking
- ✅ Channel activation/deactivation
- ✅ Subscription revocation
- ✅ Batch operations

## Version 3 - Planned Features

### 1. Paid Subscriptions 💰

**Description:** Enable creators to charge for channel access.

**Implementation:**
```solidity
struct Channel {
    // ... existing fields
    uint256 subscriptionPrice;  // 0 = free
    address paymentToken;       // address(0) = native token
}

function requestPaidSubscription(
    bytes32 channelId,
    string calldata followerPublicKey
) external payable {
    Channel storage channel = channels[channelId];
    require(msg.value >= channel.subscriptionPrice, "Insufficient payment");
    
    // Store payment for creator to withdraw
    // ... rest of subscription logic
}

function withdrawEarnings(bytes32 channelId) external onlyCreator(channelId) {
    // Transfer accumulated subscription fees to creator
}
```

**Benefits:**
- Creator monetization
- Sustainable content creation
- Premium content tiers

**Considerations:**
- Payment token support (ETH, stablecoins)
- Refund policy
- Subscription duration/renewal
- Revenue sharing (platform fee?)

---

### 2. Channel Transfer

**Description:** Allow creators to transfer channel ownership.

**Implementation:**
```solidity
function transferChannel(
    bytes32 channelId,
    address newCreator
) external onlyCreator(channelId) {
    require(newCreator != address(0), "Invalid address");
    
    channels[channelId].creator = newCreator;
    emit ChannelTransferred(channelId, msg.sender, newCreator);
}
```

**Use Cases:**
- Selling channels
- Gifting channels
- Team/organization transfers
- Succession planning

---

### 3. Subscription Limits

**Description:** Allow creators to cap the number of subscribers.

**Implementation:**
```solidity
struct Channel {
    // ... existing fields
    uint256 maxSubscribers;  // 0 = unlimited
}

function setMaxSubscribers(
    bytes32 channelId,
    uint256 maxSubs
) external onlyCreator(channelId) {
    channels[channelId].maxSubscribers = maxSubs;
}

function requestSubscription(...) {
    // ... existing checks
    
    if (channel.maxSubscribers > 0) {
        require(
            followerCount[channelId] < channel.maxSubscribers,
            "Channel at capacity"
        );
    }
    
    // ... rest of logic
}
```

**Use Cases:**
- Exclusive/premium channels
- Limited beta access
- Scarcity-based value
- Resource management

---

### 4. Structured Metadata

**Description:** Replace JSON string metadata with structured on-chain data.

**Implementation:**
```solidity
struct ChannelMetadata {
    string name;
    string description;
    string avatarCid;      // IPFS CID for avatar image
    string[] tags;         // Searchable tags
    string website;        // External link
    bool nsfw;            // Content rating
}

mapping(bytes32 => ChannelMetadata) public channelMetadata;

function updateChannelMetadata(
    bytes32 channelId,
    ChannelMetadata calldata metadata
) external onlyCreator(channelId) {
    channelMetadata[channelId] = metadata;
    emit MetadataUpdated(channelId);
}
```

**Benefits:**
- Better on-chain queries
- Standardized channel info
- Improved discovery
- Client-side filtering

**Considerations:**
- Gas costs (storing strings on-chain is expensive)
- Flexibility vs. structure trade-off
- Migration from V2 JSON format

---

### 5. Subscription Tiers

**Description:** Multiple subscription levels with different access.

**Implementation:**
```solidity
enum SubscriptionTier {
    Free,
    Basic,
    Premium,
    VIP
}

struct TierConfig {
    uint256 price;
    string benefits;  // JSON or IPFS CID
}

mapping(bytes32 => mapping(SubscriptionTier => TierConfig)) public tiers;
mapping(bytes32 => mapping(address => SubscriptionTier)) public followerTier;

function setTier(
    bytes32 channelId,
    SubscriptionTier tier,
    TierConfig calldata config
) external onlyCreator(channelId) {
    tiers[channelId][tier] = config;
}
```

**Use Cases:**
- Tiered content access
- Different pricing models
- Gradual upselling
- Flexible monetization

---

### 6. Time-Based Subscriptions

**Description:** Subscriptions that expire and require renewal.

**Implementation:**
```solidity
struct Subscription {
    address follower;
    string publicKey;
    uint256 expiresAt;
    bool autoRenew;
}

function renewSubscription(bytes32 channelId) external payable {
    // Extend subscription by payment period
}

function isSubscriptionActive(
    bytes32 channelId,
    address follower
) external view returns (bool) {
    Subscription storage sub = subscriptions[channelId][follower];
    return sub.expiresAt > block.timestamp;
}
```

**Benefits:**
- Recurring revenue
- Active subscriber tracking
- Automatic renewals
- Time-limited access

---

### 7. Referral System

**Description:** Reward users for referring new subscribers.

**Implementation:**
```solidity
mapping(bytes32 => mapping(address => address)) public referrers;
mapping(bytes32 => mapping(address => uint256)) public referralEarnings;

function requestSubscriptionWithReferral(
    bytes32 channelId,
    string calldata publicKey,
    address referrer
) external payable {
    // ... subscription logic
    
    if (referrer != address(0) && referrer != msg.sender) {
        referrers[channelId][msg.sender] = referrer;
        // Credit referrer with commission
        uint256 commission = msg.value * referralRate / 100;
        referralEarnings[channelId][referrer] += commission;
    }
}
```

**Benefits:**
- Viral growth
- Community building
- Incentivized sharing
- Network effects

---

### 8. Channel Categories/Discovery

**Description:** Categorize channels for better discovery.

**Implementation:**
```solidity
enum Category {
    Technology,
    Finance,
    Entertainment,
    Education,
    News,
    Other
}

mapping(bytes32 => Category[]) public channelCategories;
mapping(Category => bytes32[]) public categoryChannels;

function addCategory(
    bytes32 channelId,
    Category category
) external onlyCreator(channelId) {
    channelCategories[channelId].push(category);
    categoryChannels[category].push(channelId);
}
```

**Benefits:**
- Improved discovery
- Content organization
- Targeted browsing
- Better UX

---

### 9. Multi-Creator Channels

**Description:** Allow multiple creators to manage a single channel.

**Implementation:**
```solidity
mapping(bytes32 => address[]) public channelCreators;
mapping(bytes32 => mapping(address => bool)) public isCreator;

function addCreator(
    bytes32 channelId,
    address newCreator
) external onlyCreator(channelId) {
    require(!isCreator[channelId][newCreator], "Already creator");
    
    channelCreators[channelId].push(newCreator);
    isCreator[channelId][newCreator] = true;
    
    emit CreatorAdded(channelId, newCreator);
}
```

**Use Cases:**
- Team channels
- Guest contributors
- Organization accounts
- Collaborative content

---

### 10. Content Moderation

**Description:** Community-driven content reporting and moderation.

**Implementation:**
```solidity
struct Report {
    address reporter;
    string postCid;
    string reason;
    uint256 timestamp;
}

mapping(bytes32 => Report[]) public channelReports;

function reportContent(
    bytes32 channelId,
    string calldata postCid,
    string calldata reason
) external {
    require(approvedFollowers[channelId][msg.sender], "Not subscribed");
    
    channelReports[channelId].push(Report({
        reporter: msg.sender,
        postCid: postCid,
        reason: reason,
        timestamp: block.timestamp
    }));
    
    emit ContentReported(channelId, postCid, msg.sender);
}
```

**Benefits:**
- Community safety
- Content quality
- Trust building
- Platform health

---

## Implementation Priority

### High Priority (V3.0)
1. Paid Subscriptions - Core monetization
2. Time-Based Subscriptions - Recurring revenue
3. Channel Transfer - Basic ownership management

### Medium Priority (V3.1)
4. Subscription Tiers - Enhanced monetization
5. Structured Metadata - Better discovery
6. Subscription Limits - Exclusivity features

### Low Priority (V3.2+)
7. Referral System - Growth optimization
8. Multi-Creator Channels - Collaboration
9. Channel Categories - Discovery enhancement
10. Content Moderation - Community management

---

## Gas Optimization Considerations

Many V3 features will increase gas costs. Consider:

1. **Off-Chain Storage:** Store complex data on IPFS, only hashes on-chain
2. **Lazy Loading:** Compute values on-demand rather than storing
3. **Batch Operations:** Continue expanding batch functionality
4. **Events Over Storage:** Use events for historical data, minimize storage
5. **Layer 2:** Consider deploying on L2 for lower gas costs

---

## Security Considerations

1. **Payment Handling:** Secure withdrawal patterns, reentrancy guards
2. **Access Control:** Robust permission system for multi-creator
3. **Rate Limiting:** Prevent spam/abuse
4. **Upgrade Path:** Consider proxy patterns for future upgrades
5. **Audit:** Professional security audit before V3 deployment

---

## Community Feedback

Before implementing V3 features, gather feedback on:
- Most desired features
- Pricing models
- Gas cost tolerance
- Use case priorities

---

**Last Updated:** 2024-11-15  
**Status:** Planning Phase  
**Target Release:** TBD
