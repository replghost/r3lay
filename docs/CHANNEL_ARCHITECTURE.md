# R3LAY Channel Architecture

## Current Implementation (V2)

### One Channel Per Wallet Address

**Design:**
- Channel ID is deterministically derived from wallet address
- Each wallet can only create ONE channel
- Channel ID = `keccak256(walletAddress)`

**Pros:**
- ✅ Simple and intuitive
- ✅ No channel management UI needed
- ✅ Perfect for personal newsletters
- ✅ Easy to discover (wallet → channel mapping)
- ✅ No risk of channel ID collisions

**Cons:**
- ❌ Can't create multiple channels
- ❌ Can't separate personal/professional content
- ❌ Organizations need multiple wallets
- ❌ Can't transfer/sell individual channels

**Use Cases:**
- Personal newsletters
- Individual creators
- Simple content publishing
- One-person operations

---

## Proposed: Multi-Channel Architecture (V3)

### Multiple Channels Per Wallet

**Design:**
- Creators can create multiple channels
- Each channel has a unique ID (user-chosen or auto-generated)
- Channels stored in mapping: `wallet → channelId[]`
- Channel selector in UI

**Implementation:**

```solidity
// Contract changes
mapping(address => bytes32[]) public creatorChannels;
mapping(bytes32 => bool) public channelIdTaken;

function createChannel(
    bytes32 channelId,  // User chooses or we generate
    string calldata name,
    string calldata indexCid,
    string calldata meta
) external {
    require(!channelIdTaken[channelId], "Channel ID taken");
    
    // Create channel
    channels[channelId] = Channel({...});
    channelIdTaken[channelId] = true;
    
    // Track creator's channels
    creatorChannels[msg.sender].push(channelId);
}

function getCreatorChannels(address creator) 
    external 
    view 
    returns (bytes32[] memory) 
{
    return creatorChannels[creator];
}
```

**UI Changes:**

```typescript
// Dashboard shows channel selector
<select v-model="selectedChannelId">
  <option v-for="channel in myChannels" :value="channel.id">
    {{ channel.name }}
  </option>
</select>

// Or channel cards
<div class="grid grid-cols-3 gap-4">
  <ChannelCard 
    v-for="channel in myChannels"
    :channel="channel"
    @select="selectChannel"
  />
</div>
```

**Pros:**
- ✅ Multiple channels per creator
- ✅ Separate topics/audiences
- ✅ Professional + personal separation
- ✅ Can transfer individual channels
- ✅ Better for organizations

**Cons:**
- ❌ More complex UI
- ❌ Need channel management
- ❌ Higher gas costs (more storage)
- ❌ Channel ID namespace management

**Use Cases:**
- Content creators with multiple topics
- Organizations/brands
- Agencies managing multiple clients
- Creators wanting to segment audiences

---

## Hybrid Approach (Recommended)

### Start Simple, Add Complexity Later

**Phase 1 (Current - V2):**
- One channel per wallet
- Simple, clean UX
- Get users onboarded quickly

**Phase 2 (V3):**
- Add multi-channel support
- Backward compatible
- Default channel = derived from wallet
- Additional channels = user-created

**Migration Path:**

```solidity
// V3 contract
function getDefaultChannelId(address creator) 
    public 
    pure 
    returns (bytes32) 
{
    // Backward compatible with V2
    return keccak256(abi.encodePacked(creator));
}

function createAdditionalChannel(
    string calldata channelName,
    string calldata indexCid,
    string calldata meta
) external {
    // Generate unique channel ID
    bytes32 channelId = keccak256(
        abi.encodePacked(
            msg.sender, 
            channelName, 
            block.timestamp
        )
    );
    
    // Create channel...
}
```

**UI Flow:**

1. **First Time User:**
   - "Create Your Channel" → Creates default channel
   - Simple, one-click experience

2. **Existing User:**
   - Dashboard shows current channel
   - "+ Create Another Channel" button
   - Channel switcher in nav

3. **Power User:**
   - Channel management page
   - Create/edit/archive channels
   - Per-channel analytics

---

## Alternative: Named Channels

### Human-Readable Channel IDs

**Design:**
- Channel IDs are human-readable names
- Like Twitter handles: `@username/channelname`
- ENS-style registration

**Example:**
```
Channel ID: "alice/newsletter"
Channel ID: "acme-corp/updates"
Channel ID: "dev-blog/weekly"
```

**Implementation:**

```solidity
mapping(string => bool) public channelNameTaken;
mapping(string => address) public channelOwner;

function createNamedChannel(
    string calldata channelName,
    string calldata indexCid,
    string calldata meta
) external {
    require(!channelNameTaken[channelName], "Name taken");
    require(isValidChannelName(channelName), "Invalid name");
    
    bytes32 channelId = keccak256(bytes(channelName));
    
    channels[channelId] = Channel({...});
    channelNameTaken[channelName] = true;
    channelOwner[channelName] = msg.sender;
}

function isValidChannelName(string memory name) 
    internal 
    pure 
    returns (bool) 
{
    // Only lowercase, numbers, hyphens
    // 3-32 characters
    // No special characters
}
```

**Pros:**
- ✅ Easy to remember
- ✅ Shareable URLs: `r3lay.app/@alice/newsletter`
- ✅ Brand-friendly
- ✅ Discoverable

**Cons:**
- ❌ Name squatting
- ❌ Namespace conflicts
- ❌ Need name validation
- ❌ More complex contract

---

## Comparison Matrix

| Feature | Single Channel | Multi-Channel | Named Channels |
|---------|---------------|---------------|----------------|
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Flexibility** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Gas Cost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **UX** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Discoverability** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Branding** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommendation

### Phase 1 (Now - V2): Single Channel ✅
- Keep current implementation
- One channel per wallet
- Focus on core functionality
- Get users onboarded

### Phase 2 (V3): Add Multi-Channel
- Backward compatible
- Default channel + additional channels
- Channel management UI
- Channel switcher

### Phase 3 (V4): Named Channels (Optional)
- Human-readable names
- ENS integration
- Premium features
- Marketplace for names

---

## Implementation Priority

### Immediate (V2)
- ✅ Fix dashboard to show channel status
- ✅ Load subscriber count
- ✅ Remove duplicate wallet UI
- ✅ One channel per wallet

### Short Term (V3)
- Multi-channel support
- Channel management page
- Channel switcher in nav
- Migration from V2

### Long Term (V4)
- Named channels
- Channel marketplace
- Channel analytics
- Channel templates

---

## User Stories

### Single Channel (Current)
> "As a creator, I want to quickly create my newsletter channel so I can start publishing encrypted content."

### Multi-Channel
> "As a creator, I want to create separate channels for my tech blog and personal diary so I can manage different audiences."

### Named Channels
> "As a brand, I want a memorable channel name like @acme/updates so my subscribers can easily find and share my channel."

---

**Decision:** Stick with single channel for V2, plan multi-channel for V3.

**Last Updated:** 2024-11-15  
**Status:** V2 Implemented, V3 Planned
