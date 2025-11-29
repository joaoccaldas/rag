# How to Verify Semantic Caching is Working

## 🎯 Quick Answer

### Where to Find Cache Settings
**Navigate to**: Main Dashboard → **Settings Icon** (gear) → **RAG Settings** → **Semantic Cache** tab

The tab is between "General Settings" and "Storage"

---

## 🧪 Method 1: Dedicated Test Page (Easiest!)

### Access the test page:
```
http://localhost:3000/semantic-cache-test
```

### What you'll see:
1. **Live Stats Dashboard**: Hit rate, L1/L2 hits, cache sizes
2. **Run Test Button**: Automated test that verifies semantic matching
3. **Persistence Check**: Confirms cache survives browser restart

### Test Flow:
```
Click "Run Semantic Cache Test"
  ↓
[Test 1] Stores "How do I reset my password?"
  → ✅ Query cached
  ↓
[Test 2] Retrieves exact match
  → ✅ EXACT MATCH HIT!
  ↓
[Test 3] Retrieves "password reset instructions" (DIFFERENT WORDS!)
  → ✅ SEMANTIC MATCH HIT! (This proves it works!)
  ↓
[Test 4] Tries unrelated query
  → ✅ MISS (correctly rejected)
```

**If Test 3 shows "SEMANTIC MATCH HIT" → Semantic caching is working!** 🎉

---

## 🔍 Method 2: Real Search with Console Logs

### Steps:
1. Open your app: `http://localhost:3000`
2. Press **F12** to open DevTools → Go to **Console** tab
3. Upload a document and perform a search
4. Perform the SAME search again (or similar words)
5. Look for these console messages:

### First search (cache miss):
```console
🔍 Enhanced RAG Search: Searching through 25 documents for "password reset"
🧠 Query analysis: { domain: 'technical', ... }
2️⃣ Checking semantic cache...
💨 Cache MISS: Performing full semantic search for query: "password reset"
...
💾 Cached 8 results in semantic cache
```

### Second search with similar words (cache hit!):
```console
🔍 Enhanced RAG Search: Searching through 25 documents for "how to reset password"
2️⃣ Checking semantic cache...
✨ Semantic Cache HIT: Found 8 cached results for query: "how to reset password"
🎯 Semantic match: "how to reset password" ≈ "password reset" (92%)
🎯 Semantic cache-served results: 8 results
```

**If you see "✨ Semantic Cache HIT" → It's working!** 🎉

---

## 💾 How Persistent is the Cache?

### L1 Cache (Memory):
- **Size**: 100 entries
- **Speed**: ~50ms
- **Persistence**: ❌ **Volatile** - cleared on page refresh
- **Purpose**: Ultra-fast access to hot queries

### L2 Cache (IndexedDB):
- **Size**: 1,000 entries
- **Speed**: ~120ms
- **Persistence**: ✅ **PERSISTENT** - survives browser restart!
- **Purpose**: Larger persistent cache
- **Location**: Browser IndexedDB → Database: "SemanticCache"

### TTL (Time to Live):
- **Default**: 30 minutes
- **Configurable**: 5-120 minutes (in settings)
- **Behavior**: Entries automatically expire after TTL

### Persistence Test:
1. Run a search that gets cached
2. **Close the browser completely**
3. **Reopen and search again with similar words**
4. Check console - you should see **L2 Cache HIT**
5. The L2 entry gets **promoted to L1** for speed

---

## 🔧 How to View Cache in Browser

### View IndexedDB (L2 Cache):
1. Press **F12** → **Application** tab
2. Expand **IndexedDB** in left sidebar
3. Look for **SemanticCache**
4. Click **entries** → See all cached queries!
5. Each entry contains:
   - `id`: Unique identifier
   - `query`: Original search text
   - `queryEmbedding`: 768-dimensional vector
   - `results`: Cached search results
   - `metadata`: Timestamp, hits, lastAccessed, TTL, documentIds

### View Console Logs:
1. Press **F12** → **Console** tab
2. Filter for: "cache" or "semantic"
3. See real-time cache hits/misses

---

## 📊 Cache Settings Location

### Path: Main App → Settings → RAG Settings → Semantic Cache

**Navigation**:
```
Click ⚙️ Settings Icon (top right)
  ↓
Select "RAG Settings"
  ↓
Click "Semantic Cache" tab (4th tab)
  ↓
See full cache dashboard!
```

### What you'll find:
1. **Performance Metrics**:
   - Hit Rate %
   - L1 Hits (Memory)
   - L2 Hits (IndexedDB)
   - Average Latency

2. **Configuration**:
   - ☑️ Enable Semantic Cache
   - ☑️ Enable Legacy Cache
   - ☑️ Prefer Semantic Cache
   - Similarity Threshold: 70-95% (slider)
   - Cache TTL: 5-120 minutes (slider)

3. **Actions**:
   - 🔄 Refresh Stats
   - 🗑️ Clear Entire Cache

---

## 🎯 Quick Verification Checklist

### ✅ Semantic Caching is Working If:
- [ ] You see "✨ Semantic Cache HIT" in console
- [ ] Similar queries return instant results (~50ms vs 2000ms)
- [ ] Cache settings page shows hit rate > 0%
- [ ] Test page shows "SEMANTIC MATCH HIT"
- [ ] IndexedDB contains "SemanticCache" database

### ❌ Troubleshooting If Not Working:
- [ ] Check if semantic cache is enabled (Settings → RAG Settings → Semantic Cache)
- [ ] Verify Ollama is running (for embeddings)
- [ ] Check browser console for errors
- [ ] Clear cache and try again
- [ ] Lower similarity threshold (85% → 80%)

---

## 📈 Performance Expectations

### Cache Hit (Semantic Match):
```
Query: "password reset instructions"
Cached: "How do I reset my password?"
Similarity: 87% (above 85% threshold)
Result: ✅ HIT
Latency: 50-120ms (40x faster!)
```

### Cache Miss:
```
Query: "What is the weather today?"
Cached: "How do I reset my password?"
Similarity: 12% (below 85% threshold)
Result: ❌ MISS
Latency: 2000ms (full search)
```

---

## 🔬 Advanced: Inspect Cache Entries

### Using Browser DevTools:
```javascript
// Open Console (F12)

// 1. Check if cache exists
indexedDB.databases().then(dbs => {
  console.log('Databases:', dbs)
  // Look for SemanticCache
})

// 2. Count cache entries
const request = indexedDB.open('SemanticCache')
request.onsuccess = (event) => {
  const db = event.target.result
  const tx = db.transaction('entries', 'readonly')
  const store = tx.objectStore('entries')
  const countRequest = store.count()
  
  countRequest.onsuccess = () => {
    console.log('L2 Cache entries:', countRequest.result)
  }
}

// 3. List all entries
const getAllRequest = store.getAll()
getAllRequest.onsuccess = () => {
  console.log('All cached queries:', getAllRequest.result)
}
```

---

## 🎉 Summary

### ✅ YES, Semantic Caching is Working When:
1. **Test Page**: Shows "SEMANTIC MATCH HIT" for similar queries
2. **Console**: Shows "✨ Semantic Cache HIT" messages
3. **Performance**: Similar queries return in ~50ms instead of 2000ms
4. **IndexedDB**: Contains SemanticCache database with entries
5. **Settings**: Cache settings page shows hit rate increasing

### 💾 YES, Cache is Persistent:
1. **L1 (Memory)**: No - volatile, cleared on refresh
2. **L2 (IndexedDB)**: **YES** - survives browser restart!
3. **TTL**: Entries expire after 30 minutes (configurable)
4. **Storage**: IndexedDB → SemanticCache → entries table

### 📍 Find Settings At:
**Dashboard → ⚙️ Settings → RAG Settings → Semantic Cache tab**

Or test at: **http://localhost:3000/semantic-cache-test** 🧪
