# Clear Old Mock Messages

To clear the old mock messages from IndexedDB, open your browser console and run:

```javascript
// Clear all messages from IndexedDB
const request = indexedDB.open('r3mail_messages', 1)
request.onsuccess = (event) => {
  const db = event.target.result
  const transaction = db.transaction(['messages'], 'readwrite')
  const store = transaction.objectStore('messages')
  const clearRequest = store.clear()
  clearRequest.onsuccess = () => {
    console.log('✅ All messages cleared!')
  }
}

// Or delete the entire database
indexedDB.deleteDatabase('r3mail_messages')
console.log('✅ Database deleted!')
```

## Quick Clear (Copy/Paste):

```javascript
indexedDB.deleteDatabase('r3mail_messages'); console.log('✅ Cleared!')
```

Then refresh the page.
