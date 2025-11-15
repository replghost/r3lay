/**
 * R3LAYChannelRegistry Contract ABI
 * 
 * Generated from the Solidity contract
 */

export const R3LAYChannelRegistryABI = [
  {
    type: 'function',
    name: 'createChannel',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'indexCid', type: 'string' },
      { name: 'meta', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updateChannel',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'newIndexCid', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setMeta',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'newMeta', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'publishPost',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'postCid', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getChannel',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'currentIndexCid', type: 'string' },
          { name: 'meta', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'exists',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getCurrentIndexCid',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'getCreator',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'ChannelCreated',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'indexCid', type: 'string', indexed: false },
      { name: 'meta', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ChannelUpdated',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'newIndexCid', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MetadataUpdated',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'newMeta', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PostPublished',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'postCid', type: 'string', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'ChannelAlreadyExists',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'ChannelNotFound',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
  },
  {
    type: 'error',
    name: 'NotChannelCreator',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'caller', type: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'InvalidCid',
    inputs: [{ name: 'cid', type: 'string' }],
  },
  {
    type: 'error',
    name: 'InvalidChannelId',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
  },
] as const
