# R3MAIL Indexer Strategy (Like R3LAY)

## 🎯 Goal
Efficiently scan the blockchain for MessageNotified events without needing a full light client.

## 📊 R3LAY's Approach (We Should Copy)

### **1. Chunked Event Scanning**
```typescript
// Scan in 10k block chunks
const chunkSize = 10000n
let currentTo = latestBlock
let currentFrom = currentTo - chunkSize

while (currentTo > fromBlock) {
  const logs = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event MessageNotified(...)'),
    fromBlock: currentFrom,
    toBlock: currentTo,
  })
  
  // Process events
  for (const log of logs) {
    await processMessageEvent(log)
  }
  
  currentTo = currentFrom - 1n
}
```

### **2. Background Polling**
```typescript
// Poll every 30 seconds for new messages
setInterval(async () => {
  await scanForNewMessages()
}, 30000)
```

### **3. Progress Tracking**
```typescript
const blocksScanned = toBlock - currentFrom
const progress = (blocksScanned * 100) / totalBlocks
```

### **4. Cancellable**
```typescript
const cancelRequested = ref(false)

while (currentTo > fromBlock && !cancelRequested.value) {
  // scan...
}
```

---

## 🚀 Implementation for R3MAIL

### **Create `useMessageIndexer.ts`:**

```typescript
export const useMessageIndexer = () => {
  const wallet = useR3mailWallet()
  const messageStore = useR3mailMessages()
  
  const isIndexing = ref(false)
  const indexProgress = ref(0)
  const lastBlock = ref(0n)
  
  // Scan for messages in chunks
  const scanMessages = async (fromBlock?: bigint, toBlock?: bigint) => {
    isIndexing.value = true
    
    try {
      if (!toBlock) {
        toBlock = await chainClient.getBlockNumber()
      }
      
      if (!fromBlock) {
        fromBlock = lastBlock.value || 0n
      }
      
      const chunkSize = 10000n
      let currentTo = toBlock
      
      while (currentTo > fromBlock) {
        const currentFrom = currentTo - chunkSize < fromBlock 
          ? fromBlock 
          : currentTo - chunkSize
        
        // Get MessageNotified events
        const events = await chainClient.getMessages(
          wallet.address.value,
          currentFrom,
          currentTo
        )
        
        // Process each event
        for (const event of events) {
          const existing = await messageStore.getMessage(event.msgId)
          if (!existing) {
            await messageStore.processMessageEvent(event)
          }
        }
        
        // Update progress
        const blocksScanned = toBlock - currentFrom
        const totalBlocks = toBlock - fromBlock
        indexProgress.value = Number((blocksScanned * 100n) / totalBlocks)
        
        lastBlock.value = currentFrom
        currentTo = currentFrom - 1n
      }
      
      console.log('✅ Message sync complete!')
      
    } finally {
      isIndexing.value = false
      indexProgress.value = 0
    }
  }
  
  // Start background sync
  const startBackgroundSync = () => {
    // Initial scan
    scanMessages()
    
    // Poll every 30 seconds
    setInterval(() => {
      scanMessages()
    }, 30000)
  }
  
  return {
    isIndexing,
    indexProgress,
    scanMessages,
    startBackgroundSync,
  }
}
```

---

## 💡 Why This is Better Than Full Light Client

### **Smoldot Light Client:**
- ❌ Requires full chain spec
- ❌ Needs to sync entire chain state
- ❌ Complex setup
- ❌ Large bundle size
- ❌ Memory intensive

### **Chunked Event Scanning:**
- ✅ Simple RPC queries
- ✅ Only fetches what you need
- ✅ Works with any RPC
- ✅ Small bundle size
- ✅ Efficient memory usage
- ✅ Can show progress
- ✅ Can cancel/resume

---

## 🎯 Benefits for R3MAIL

1. **Automatic Sync** - Background polling keeps inbox updated
2. **Efficient** - Only queries MessageNotified events
3. **Progress** - Show user "Syncing messages... 45%"
4. **Resumable** - Can stop/start without losing progress
5. **Works Everywhere** - No special RPC requirements

---

## 📝 Next Steps

1. Create `useMessageIndexer.ts` composable
2. Add progress indicator to inbox UI
3. Start background sync on connect
4. Store `lastBlock` in localStorage
5. Add "Sync Now" button for manual refresh

---

**This is the same strategy R3LAY uses successfully!** 🚀
