// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title R3mailMailbox
 * @notice Lightweight mailbox contract for R3MAIL encrypted messaging
 * @dev Only stores message notifications, not content. Content stored off-chain (IPFS).
 */
contract R3mailMailbox {
    // ============================================================================
    // Events
    // ============================================================================

    /**
     * @notice Emitted when a message is sent
     * @param msgId Unique message identifier (keccak256 hash)
     * @param from Sender's EVM address
     * @param to Recipient's EVM address
     * @param envelopeCid IPFS CID of the encrypted envelope
     * @param timestamp Block timestamp
     */
    event MessageNotified(
        bytes32 indexed msgId,
        address indexed from,
        address indexed to,
        string envelopeCid,
        uint256 timestamp
    );

    // ============================================================================
    // State
    // ============================================================================

    /// @notice Mapping of recipient address to their inbox message count
    mapping(address => uint256) public inboxCount;

    /// @notice Mapping to track if a message ID has been used (prevent duplicates)
    mapping(bytes32 => bool) public messageExists;

    // ============================================================================
    // Errors
    // ============================================================================

    error MessageAlreadyExists(bytes32 msgId);
    error InvalidRecipient();
    error EmptyCid();

    // ============================================================================
    // Functions
    // ============================================================================

    /**
     * @notice Notify the chain that a message has been sent
     * @param msgId Unique message identifier (should be keccak256 of envelope)
     * @param to Recipient's EVM address
     * @param envelopeCid IPFS CID of the encrypted envelope.json
     * @dev Sender is msg.sender. Content is stored off-chain.
     */
    function notifyMessage(
        bytes32 msgId,
        address to,
        string calldata envelopeCid
    ) external {
        // Validation
        if (to == address(0)) revert InvalidRecipient();
        if (bytes(envelopeCid).length == 0) revert EmptyCid();
        if (messageExists[msgId]) revert MessageAlreadyExists(msgId);

        // Mark message as sent
        messageExists[msgId] = true;

        // Increment recipient's inbox count
        inboxCount[to]++;

        // Emit event for indexing
        emit MessageNotified(
            msgId,
            msg.sender,
            to,
            envelopeCid,
            block.timestamp
        );
    }

    /**
     * @notice Get the inbox count for an address
     * @param user Address to check
     * @return count Number of messages received
     */
    function getInboxCount(address user) external view returns (uint256) {
        return inboxCount[user];
    }

    /**
     * @notice Check if a message ID exists
     * @param msgId Message ID to check
     * @return exists True if message has been notified
     */
    function hasMessage(bytes32 msgId) external view returns (bool) {
        return messageExists[msgId];
    }
}
