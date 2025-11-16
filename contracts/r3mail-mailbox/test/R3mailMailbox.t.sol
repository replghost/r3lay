// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/R3mailMailbox.sol";

contract R3mailMailboxTest is Test {
    R3mailMailbox public mailbox;
    
    address public sender = address(0x1);
    address public recipient = address(0x2);
    
    bytes32 public msgId = keccak256("test-message-1");
    string public envelopeCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    
    event MessageNotified(
        bytes32 indexed msgId,
        address indexed from,
        address indexed to,
        string envelopeCid,
        uint256 timestamp
    );
    
    function setUp() public {
        mailbox = new R3mailMailbox();
    }
    
    function testNotifyMessage() public {
        vm.prank(sender);
        
        // Expect event emission
        vm.expectEmit(true, true, true, true);
        emit MessageNotified(msgId, sender, recipient, envelopeCid, block.timestamp);
        
        // Send message
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Verify state changes
        assertEq(mailbox.inboxCount(recipient), 1);
        assertTrue(mailbox.messageExists(msgId));
    }
    
    function testNotifyMultipleMessages() public {
        vm.startPrank(sender);
        
        // Send 3 messages
        mailbox.notifyMessage(keccak256("msg1"), recipient, "cid1");
        mailbox.notifyMessage(keccak256("msg2"), recipient, "cid2");
        mailbox.notifyMessage(keccak256("msg3"), recipient, "cid3");
        
        vm.stopPrank();
        
        // Verify inbox count
        assertEq(mailbox.inboxCount(recipient), 3);
    }
    
    function testCannotSendDuplicateMessage() public {
        vm.startPrank(sender);
        
        // Send first message
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Try to send duplicate
        vm.expectRevert(
            abi.encodeWithSelector(R3mailMailbox.MessageAlreadyExists.selector, msgId)
        );
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        vm.stopPrank();
    }
    
    function testCannotSendToZeroAddress() public {
        vm.prank(sender);
        
        vm.expectRevert(R3mailMailbox.InvalidRecipient.selector);
        mailbox.notifyMessage(msgId, address(0), envelopeCid);
    }
    
    function testCannotSendEmptyCid() public {
        vm.prank(sender);
        
        vm.expectRevert(R3mailMailbox.EmptyCid.selector);
        mailbox.notifyMessage(msgId, recipient, "");
    }
    
    function testGetInboxCount() public {
        // Initially zero
        assertEq(mailbox.getInboxCount(recipient), 0);
        
        // Send message
        vm.prank(sender);
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Should be 1
        assertEq(mailbox.getInboxCount(recipient), 1);
    }
    
    function testHasMessage() public {
        // Initially false
        assertFalse(mailbox.hasMessage(msgId));
        
        // Send message
        vm.prank(sender);
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Should be true
        assertTrue(mailbox.hasMessage(msgId));
    }
    
    function testMultipleSendersToSameRecipient() public {
        address sender2 = address(0x3);
        bytes32 msgId2 = keccak256("msg2");
        
        // Sender 1 sends
        vm.prank(sender);
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Sender 2 sends
        vm.prank(sender2);
        mailbox.notifyMessage(msgId2, recipient, "cid2");
        
        // Recipient should have 2 messages
        assertEq(mailbox.inboxCount(recipient), 2);
    }
    
    function testSenderCanSendToMultipleRecipients() public {
        address recipient2 = address(0x3);
        bytes32 msgId2 = keccak256("msg2");
        
        vm.startPrank(sender);
        
        // Send to recipient 1
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Send to recipient 2
        mailbox.notifyMessage(msgId2, recipient2, "cid2");
        
        vm.stopPrank();
        
        // Both should have 1 message
        assertEq(mailbox.inboxCount(recipient), 1);
        assertEq(mailbox.inboxCount(recipient2), 1);
    }
    
    function testEventEmission() public {
        vm.prank(sender);
        
        // Record logs
        vm.recordLogs();
        
        mailbox.notifyMessage(msgId, recipient, envelopeCid);
        
        // Get logs
        Vm.Log[] memory logs = vm.getRecordedLogs();
        
        // Should have 1 event
        assertEq(logs.length, 1);
        
        // Verify event signature
        assertEq(
            logs[0].topics[0],
            keccak256("MessageNotified(bytes32,address,address,string,uint256)")
        );
    }
    
    function testFuzzNotifyMessage(
        address _sender,
        address _recipient,
        bytes32 _msgId,
        string memory _cid
    ) public {
        // Skip invalid inputs
        vm.assume(_recipient != address(0));
        vm.assume(bytes(_cid).length > 0);
        
        vm.prank(_sender);
        mailbox.notifyMessage(_msgId, _recipient, _cid);
        
        // Verify
        assertEq(mailbox.inboxCount(_recipient), 1);
        assertTrue(mailbox.messageExists(_msgId));
    }
}
