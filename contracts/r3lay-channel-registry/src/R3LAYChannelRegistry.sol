// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title R3LAY Channel Registry
 * @notice On-chain registry for R3LAY encrypted publishing channels with subscription management
 * @dev Stores channel metadata, IPFS CID pointers, and manages follower subscriptions
 * 
 * Features:
 * - Channel creation and updates
 * - Subscription requests from followers
 * - Approval/rejection by creators
 * - Public key storage for encryption
 * - Event-based sync for clients
 * 
 * Version: 2.0
 */
contract R3LAYChannelRegistry {
    
    // ============================================================================
    // Types
    // ============================================================================
    
    struct Channel {
        address creator;
        string currentIndexCid;  // IPFS CID of feed_index.json
        string meta;             // Optional metadata (JSON or text)
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct SubscriptionRequest {
        address follower;
        string followerPublicKey;  // Base64 encoded public key for encryption
        uint256 requestedAt;
        bool approved;
        bool processed;
    }
    
    // ============================================================================
    // State
    // ============================================================================
    
    /// @notice Mapping from channelId to Channel data
    mapping(bytes32 => Channel) public channels;
    
    /// @notice Tracks which channelIds exist
    mapping(bytes32 => bool) public channelExists;
    
    /// @notice Mapping from channelId to array of subscription requests
    mapping(bytes32 => SubscriptionRequest[]) private subscriptionRequests;
    
    /// @notice Mapping from channelId => follower => request index (1-indexed, 0 = not found)
    mapping(bytes32 => mapping(address => uint256)) private followerRequestIndex;
    
    /// @notice Mapping from channelId => follower => approved status
    mapping(bytes32 => mapping(address => bool)) public approvedFollowers;
    
    /// @notice Mapping from channelId to follower count
    mapping(bytes32 => uint256) public followerCount;
    
    /// @notice Mapping from channelId to active status
    mapping(bytes32 => bool) public channelActive;
    
    // ============================================================================
    // Events
    // ============================================================================
    
    /// @notice Emitted when a new channel is created
    event ChannelCreated(
        bytes32 indexed channelId,
        address indexed creator,
        string indexCid,
        string meta
    );
    
    /// @notice Emitted when a channel's feed index is updated
    event ChannelUpdated(
        bytes32 indexed channelId,
        string newIndexCid
    );
    
    /// @notice Emitted when a channel's metadata is updated
    event MetadataUpdated(
        bytes32 indexed channelId,
        string newMeta
    );
    
    /// @notice Emitted when a post is published
    event PostPublished(
        bytes32 indexed channelId,
        string postCid
    );
    
    /// @notice Emitted when a follower requests to subscribe
    event SubscriptionRequested(
        bytes32 indexed channelId,
        address indexed follower,
        string followerPublicKey
    );
    
    /// @notice Emitted when a creator approves/rejects a subscription
    event SubscriptionProcessed(
        bytes32 indexed channelId,
        address indexed follower,
        bool approved
    );
    
    /// @notice Emitted when a subscription is revoked
    event SubscriptionRevoked(
        bytes32 indexed channelId,
        address indexed follower
    );
    
    /// @notice Emitted when a channel is deactivated
    event ChannelDeactivated(
        bytes32 indexed channelId
    );
    
    /// @notice Emitted when a channel is reactivated
    event ChannelReactivated(
        bytes32 indexed channelId
    );
    
    // ============================================================================
    // Errors
    // ============================================================================
    
    error ChannelAlreadyExists(bytes32 channelId);
    error ChannelNotFound(bytes32 channelId);
    error NotChannelCreator(bytes32 channelId, address caller);
    error InvalidCid(string cid);
    error AlreadyRequested(bytes32 channelId, address follower);
    error RequestNotFound(bytes32 channelId, address follower);
    error AlreadyProcessed(bytes32 channelId, address follower);
    error ChannelNotActive(bytes32 channelId);
    error NotApproved(bytes32 channelId, address follower);
    
    // ============================================================================
    // Modifiers
    // ============================================================================
    
    modifier onlyCreator(bytes32 channelId) {
        if (!channelExists[channelId]) {
            revert ChannelNotFound(channelId);
        }
        if (channels[channelId].creator != msg.sender) {
            revert NotChannelCreator(channelId, msg.sender);
        }
        _;
    }
    
    // ============================================================================
    // Channel Management Functions
    // ============================================================================
    
    /**
     * @notice Creates a new channel
     * @param channelId Unique identifier for the channel
     * @param indexCid IPFS CID of the initial feed index
     * @param meta Optional metadata (JSON string)
     */
    function createChannel(
        bytes32 channelId,
        string calldata indexCid,
        string calldata meta
    ) external {
        if (channelExists[channelId]) {
            revert ChannelAlreadyExists(channelId);
        }
        if (bytes(indexCid).length == 0) {
            revert InvalidCid(indexCid);
        }
        
        channels[channelId] = Channel({
            creator: msg.sender,
            currentIndexCid: indexCid,
            meta: meta,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        channelExists[channelId] = true;
        channelActive[channelId] = true;
        
        emit ChannelCreated(channelId, msg.sender, indexCid, meta);
    }
    
    /**
     * @notice Updates a channel's feed index CID
     * @param channelId The channel to update
     * @param newIndexCid New IPFS CID
     */
    function updateChannel(
        bytes32 channelId,
        string calldata newIndexCid
    ) external onlyCreator(channelId) {
        if (bytes(newIndexCid).length == 0) {
            revert InvalidCid(newIndexCid);
        }
        
        channels[channelId].currentIndexCid = newIndexCid;
        channels[channelId].updatedAt = block.timestamp;
        
        emit ChannelUpdated(channelId, newIndexCid);
    }
    
    /**
     * @notice Updates a channel's metadata
     * @param channelId The channel to update
     * @param newMeta New metadata
     */
    function updateMetadata(
        bytes32 channelId,
        string calldata newMeta
    ) external onlyCreator(channelId) {
        channels[channelId].meta = newMeta;
        channels[channelId].updatedAt = block.timestamp;
        
        emit MetadataUpdated(channelId, newMeta);
    }
    
    /**
     * @notice Emits an event when a post is published
     * @param channelId The channel
     * @param postCid IPFS CID of the post
     */
    function publishPost(
        bytes32 channelId,
        string calldata postCid
    ) external onlyCreator(channelId) {
        emit PostPublished(channelId, postCid);
    }
    
    /**
     * @notice Deactivate a channel (prevents new subscriptions)
     * @param channelId The channel to deactivate
     */
    function deactivateChannel(bytes32 channelId) external onlyCreator(channelId) {
        channelActive[channelId] = false;
        emit ChannelDeactivated(channelId);
    }
    
    /**
     * @notice Reactivate a channel
     * @param channelId The channel to reactivate
     */
    function reactivateChannel(bytes32 channelId) external onlyCreator(channelId) {
        channelActive[channelId] = true;
        emit ChannelReactivated(channelId);
    }
    
    // ============================================================================
    // Subscription Management Functions
    // ============================================================================
    
    /**
     * @notice Request to subscribe to a channel
     * @param channelId The channel to subscribe to
     * @param followerPublicKey The follower's public encryption key (base64)
     */
    function requestSubscription(
        bytes32 channelId,
        string calldata followerPublicKey
    ) external {
        if (!channelExists[channelId]) {
            revert ChannelNotFound(channelId);
        }
        if (!channelActive[channelId]) {
            revert ChannelNotActive(channelId);
        }
        
        // Check if already has a pending request
        uint256 indexPlusOne = followerRequestIndex[channelId][msg.sender];
        if (indexPlusOne > 0) {
            uint256 index = indexPlusOne - 1;
            if (!subscriptionRequests[channelId][index].processed) {
                revert AlreadyRequested(channelId, msg.sender);
            }
        }
        
        // Add new request
        subscriptionRequests[channelId].push(SubscriptionRequest({
            follower: msg.sender,
            followerPublicKey: followerPublicKey,
            requestedAt: block.timestamp,
            approved: false,
            processed: false
        }));
        
        // Store index (1-indexed to distinguish from default 0)
        followerRequestIndex[channelId][msg.sender] = subscriptionRequests[channelId].length;
        
        emit SubscriptionRequested(channelId, msg.sender, followerPublicKey);
    }
    
    /**
     * @notice Approve or reject a subscription request
     * @param channelId The channel
     * @param follower The follower address
     * @param approved Whether to approve or reject
     */
    function processSubscription(
        bytes32 channelId,
        address follower,
        bool approved
    ) external onlyCreator(channelId) {
        uint256 indexPlusOne = followerRequestIndex[channelId][follower];
        if (indexPlusOne == 0) {
            revert RequestNotFound(channelId, follower);
        }
        
        uint256 index = indexPlusOne - 1;
        SubscriptionRequest storage request = subscriptionRequests[channelId][index];
        
        if (request.processed) {
            revert AlreadyProcessed(channelId, follower);
        }
        
        request.processed = true;
        request.approved = approved;
        
        if (approved) {
            approvedFollowers[channelId][follower] = true;
            followerCount[channelId]++;
        }
        
        emit SubscriptionProcessed(channelId, follower, approved);
    }
    
    /**
     * @notice Batch process multiple subscription requests
     * @param channelId The channel
     * @param followers Array of follower addresses
     * @param approvals Array of approval decisions
     */
    function batchProcessSubscriptions(
        bytes32 channelId,
        address[] calldata followers,
        bool[] calldata approvals
    ) external onlyCreator(channelId) {
        require(followers.length == approvals.length, "Array length mismatch");
        
        for (uint256 i = 0; i < followers.length; i++) {
            uint256 indexPlusOne = followerRequestIndex[channelId][followers[i]];
            if (indexPlusOne == 0) continue;
            
            uint256 index = indexPlusOne - 1;
            SubscriptionRequest storage request = subscriptionRequests[channelId][index];
            
            if (request.processed) continue;
            
            request.processed = true;
            request.approved = approvals[i];
            
            if (approvals[i]) {
                approvedFollowers[channelId][followers[i]] = true;
                followerCount[channelId]++;
            }
            
            emit SubscriptionProcessed(channelId, followers[i], approvals[i]);
        }
    }
    
    /**
     * @notice Revoke a follower's subscription
     * @param channelId The channel
     * @param follower The follower to revoke
     */
    function revokeSubscription(
        bytes32 channelId,
        address follower
    ) external onlyCreator(channelId) {
        if (!approvedFollowers[channelId][follower]) {
            revert NotApproved(channelId, follower);
        }
        
        approvedFollowers[channelId][follower] = false;
        if (followerCount[channelId] > 0) {
            followerCount[channelId]--;
        }
        
        emit SubscriptionRevoked(channelId, follower);
    }
    
    /**
     * @notice Batch revoke multiple subscriptions
     * @param channelId The channel
     * @param followers Array of followers to revoke
     */
    function batchRevokeSubscriptions(
        bytes32 channelId,
        address[] calldata followers
    ) external onlyCreator(channelId) {
        for (uint256 i = 0; i < followers.length; i++) {
            if (approvedFollowers[channelId][followers[i]]) {
                approvedFollowers[channelId][followers[i]] = false;
                if (followerCount[channelId] > 0) {
                    followerCount[channelId]--;
                }
                emit SubscriptionRevoked(channelId, followers[i]);
            }
        }
    }
    
    // ============================================================================
    // View Functions
    // ============================================================================
    
    /**
     * @notice Get channel data
     * @param channelId The channel to query
     * @return Channel struct
     */
    function getChannel(bytes32 channelId)
        external
        view
        returns (Channel memory)
    {
        if (!channelExists[channelId]) {
            revert ChannelNotFound(channelId);
        }
        return channels[channelId];
    }
    
    /**
     * @notice Check if a channel exists
     * @param channelId The channel to check
     * @return bool True if exists
     */
    function exists(bytes32 channelId)
        external
        view
        returns (bool)
    {
        return channelExists[channelId];
    }
    
    /**
     * @notice Get pending subscription requests for a channel
     * @param channelId The channel to query
     * @return Array of pending requests
     */
    function getPendingRequests(bytes32 channelId)
        external
        view
        returns (SubscriptionRequest[] memory)
    {
        SubscriptionRequest[] storage allRequests = subscriptionRequests[channelId];
        
        // Count pending
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (!allRequests[i].processed) {
                pendingCount++;
            }
        }
        
        // Build result array
        SubscriptionRequest[] memory pending = new SubscriptionRequest[](pendingCount);
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (!allRequests[i].processed) {
                pending[resultIndex] = allRequests[i];
                resultIndex++;
            }
        }
        
        return pending;
    }
    
    /**
     * @notice Get all approved followers with their public keys
     * @param channelId The channel to query
     * @return followers Array of follower addresses
     * @return publicKeys Array of corresponding public keys
     */
    function getApprovedFollowers(bytes32 channelId)
        external
        view
        returns (address[] memory followers, string[] memory publicKeys)
    {
        SubscriptionRequest[] storage allRequests = subscriptionRequests[channelId];
        
        // Count approved
        uint256 approvedCount = 0;
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (allRequests[i].processed && allRequests[i].approved) {
                approvedCount++;
            }
        }
        
        // Build result arrays
        followers = new address[](approvedCount);
        publicKeys = new string[](approvedCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (allRequests[i].processed && allRequests[i].approved) {
                followers[resultIndex] = allRequests[i].follower;
                publicKeys[resultIndex] = allRequests[i].followerPublicKey;
                resultIndex++;
            }
        }
        
        return (followers, publicKeys);
    }
    
    /**
     * @notice Check if a follower is approved
     * @param channelId The channel
     * @param follower The follower address
     * @return bool True if approved
     */
    function isApproved(bytes32 channelId, address follower)
        external
        view
        returns (bool)
    {
        return approvedFollowers[channelId][follower];
    }
    
    /**
     * @notice Get follower's public key
     * @param channelId The channel
     * @param follower The follower address
     * @return string The follower's public key
     */
    function getFollowerPublicKey(bytes32 channelId, address follower)
        external
        view
        returns (string memory)
    {
        uint256 indexPlusOne = followerRequestIndex[channelId][follower];
        if (indexPlusOne == 0) {
            revert RequestNotFound(channelId, follower);
        }
        
        uint256 index = indexPlusOne - 1;
        return subscriptionRequests[channelId][index].followerPublicKey;
    }
    
    /**
     * @notice Get subscription status for a follower
     * @param channelId The channel
     * @param follower The follower address
     * @return requested Whether a request exists
     * @return processed Whether the request has been processed
     * @return approved Whether the request was approved
     */
    function getSubscriptionStatus(bytes32 channelId, address follower)
        external
        view
        returns (bool requested, bool processed, bool approved)
    {
        uint256 indexPlusOne = followerRequestIndex[channelId][follower];
        if (indexPlusOne == 0) {
            return (false, false, false);
        }
        
        uint256 index = indexPlusOne - 1;
        SubscriptionRequest storage request = subscriptionRequests[channelId][index];
        
        return (true, request.processed, request.approved);
    }
}
