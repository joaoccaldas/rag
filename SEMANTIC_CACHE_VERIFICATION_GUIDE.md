# Semantic Cache Verification Guide

## 🎯 How to Know Semantic Caching is Working

### 1. **Cache Debug Panel** (Visual Feedback)

The easiest way to monitor caching in real-time:

**Location**: Bottom-right corner of the screen
- Look for a floating blue button with a cache icon
- Click to expand the debug panel
- Shows live cache statistics:
  - **L1 Cache** (Memory): Fast volatile cache
  - **L2 Cache** (IndexedDB): Persistent storage
  - Hit rates, miss rates, and sizes
  - Real-time updates every 3 seconds

**What to Look For**:
- 🟢 Green "HIT" indicators = Cache is working!
- 🟠 Orange "MISS" indicators = First time query, will be cached
- Progress bars showing cache fill levels
- Hit rate percentage (higher = better)

---

### 2. **Browser Console Logs**

**Open DevTools**: `F12` or `Right-click → Inspect → Console`

**Cache HIT Example**:
```
✨ Semantic Cache HIT! (latency: 52ms)
  Query: "What is Miele's strategy?"
  Similarity: 0.94
  Source: L1 (Memory)
```

**Cache MISS Example**:
```
💨 Cache MISS - performing full search (latency: 1847ms)
  Query: "What is Miele's strategy?"
  Storing in semantic cache...
```

**What This Tells You**:
- HIT = Query found in cache (50-120ms response)
- MISS = New query, performing full search (1-3s response)
- Similarity score (0-1): How closely matched the cached query is
- Source: L1 (memory) or L2 (IndexedDB)

---

### 3. **Cache Settings Dashboard**

**How to Find It**:
1. Navigate to the main application
2. Click on the **"Settings"** tab in the top navigation
3. You'll see several tabs: `Prompts` | `Keywords` | `General` | **`Semantic Cache`** | `Storage`
4. Click on **`Semantic Cache`** (4th tab, with refresh icon ♻️)

**What You'll See**:
- **Real-time Analytics Dashboard**:
  - Total queries processed
  - Cache hit rate percentage
  - Average latency (ms)
  - Live performance metrics

- **Cache Configuration**:
  - L1 Cache Size: 100 entries (default)
  - L2 Cache Size: 1000 entries (default)
  - Similarity Threshold: 85% (default)
  - TTL: 30 minutes (default)

- **Cache Management**:
  - Clear cache button
  - Export/import cache settings
  - View cache contents

**Settings Location Visual**:
```
┌─────────────────────────────────────────┐
│  Settings Navigation Bar                │
├─────────────────────────────────────────┤
│  Prompts | Keywords | General | ►►Semantic Cache◄◄ | Storage │
└─────────────────────────────────────────┘
                                    ↑
                            Click here!
```

---

### 4. **Performance Testing**

**Simple Test to Verify Cache**:

1. **First Query** (Cache MISS):
   - Type: "What is Miele's company history?"
   - Press Enter
   - Notice: Takes 1-3 seconds
   - Console shows: "💨 Cache MISS"
   - Debug panel: Miss count increases

2. **Same Query Again** (Cache HIT):
   - Type: "What is Miele's company history?" (exact same)
   - Press Enter
   - Notice: Takes < 100ms (instant!)
   - Console shows: "✨ Semantic Cache HIT!"
   - Debug panel: Hit count increases, hit rate goes up

3. **Similar Query** (Semantic HIT):
   - Type: "Tell me about Miele's history" (similar meaning)
   - Press Enter
   - Notice: Still fast < 120ms
   - Console shows: "✨ Semantic Cache HIT! Similarity: 0.91"
   - This proves semantic matching is working!

---

## 🔄 Cache Persistence Explained

### L1 Cache (Memory-Based)
**Type**: In-memory JavaScript Map
**Capacity**: 100 entries (default)
**Latency**: ~50ms (ultra-fast)
**Persistence**: ❌ **Volatile**

**Cleared When**:
- Page refresh
- Browser tab closed
- Manual cache clear
- Cache full (LRU eviction)

**Use Case**: Hot queries, immediate repeated searches

---

### L2 Cache (IndexedDB-Based)
**Type**: Browser IndexedDB storage
**Capacity**: 1000 entries (default)
**Latency**: ~120ms (fast)
**Persistence**: ✅ **Persistent**

**Survives**:
- ✅ Page refresh
- ✅ Browser close/reopen
- ✅ System restart
- ✅ Different browsing sessions

**Cleared When**:
- Manual cache clear
- Browser cache clear (user action)
- TTL expiration (30 min default)
- Cache full (LRU eviction)

**Use Case**: Frequently asked questions, common queries

---

### Time-To-Live (TTL)
**Default**: 30 minutes
**Range**: 5-120 minutes (configurable)

**How It Works**:
- Each cache entry has a timestamp
- After TTL expires, entry is automatically removed
- Prevents stale data from being served
- Balances freshness vs performance

**When to Adjust**:
- Longer TTL (60-120 min): Static content, historical data
- Shorter TTL (5-15 min): Frequently updated data, real-time info

---

## 📊 IndexedDB Inspection

**View Persistent Cache in Browser**:

1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Look for database named **`SemanticCache`**
5. Expand to see **`entries`** object store
6. Click on entries to view cached queries

**What You'll See**:
```javascript
{
  id: "cache_1742234567890_abc123",
  query: "What is Miele's strategy?",
  embedding: [0.123, -0.456, 0.789, ...], // 384-dimensional vector
  results: [...], // Search results
  documentIds: ["doc_1", "doc_2"],
  timestamp: 1742234567890,
  accessCount: 3,
  lastAccessed: 1742234890123
}
```

**Cache Entry Fields**:
- `query`: Original search query text
- `embedding`: Vector representation (for semantic matching)
- `results`: Cached search results
- `documentIds`: Documents used (for cache invalidation)
- `timestamp`: When entry was created
- `accessCount`: How many times this entry was used
- `lastAccessed`: Most recent access time

---

## 🧪 Testing Scenarios

### Scenario 1: Exact Match
```
Query 1: "What is Miele's strategy?"
Result: MISS (1847ms) → Stores in cache

Query 2: "What is Miele's strategy?"
Result: HIT (52ms) → Retrieved from L1
```

### Scenario 2: Semantic Match
```
Query 1: "Miele company strategy"
Result: MISS (1923ms) → Stores in cache

Query 2: "What is Miele's strategic direction?"
Result: HIT (67ms) → Matched with 0.89 similarity
```

### Scenario 3: Persistence Across Sessions
```
Session 1:
  Query: "Miele product lines"
  Result: MISS → Stores in L1 + L2
  Close browser

Session 2 (new browser window):
  Query: "Miele product lines"
  Result: HIT (118ms) → Retrieved from L2 (L1 was empty)
```

### Scenario 4: Document Update Invalidation
```
Query: "Miele history"
Result: HIT (cached)

[Upload new document: "Miele_History_2025.pdf"]
→ Cache automatically invalidates entries using old history doc

Query: "Miele history"
Result: MISS → Forced re-search with new document
```

---

## 🐛 Troubleshooting

### Issue: "I can't find the Semantic Cache settings"

**Solution**:
1. Make sure you're on the main app page (not a sub-page)
2. Look for the top navigation bar with tabs
3. Click on **"Settings"** tab
4. The settings panel should open with multiple tabs
5. Look for **"Semantic Cache"** (4th tab, between "General" and "Storage")
6. If still not visible, refresh the page (`F5`)

**Alternative Path**:
- Look for a settings gear icon (⚙️) in the top-right corner
- Click it to open settings panel
- Navigate to "Semantic Cache" tab

---

### Issue: "Cache doesn't seem to be working"

**Diagnostics**:
1. **Check Console for Errors**:
   - Open DevTools (`F12`) → Console tab
   - Look for any red errors related to "cache" or "IndexedDB"
   
2. **Verify Ollama Embeddings**:
   - Cache requires embeddings to work
   - Check if Ollama is running: `http://localhost:11434`
   - Console should show "Generating embedding..." before cache check

3. **Check Cache Debug Panel**:
   - Is the hit rate 0%?
   - Are queries being counted?
   - If no queries appear, cache wrapper may not be integrated

4. **Verify Browser Storage**:
   - DevTools → Application → IndexedDB
   - Should see "SemanticCache" database
   - If missing, IndexedDB may be disabled or blocked

---

### Issue: "All queries show MISS, no HITs"

**Possible Causes**:
1. **Similarity Threshold Too High**:
   - Default is 85%, might be too strict
   - Try lowering to 75-80% in settings

2. **Queries Not Similar Enough**:
   - Cache uses semantic matching, not exact text
   - "Miele strategy" vs "Company overview" = Different topics

3. **TTL Expired**:
   - Cache entries expire after 30 min by default
   - Check if enough time has passed since last query

4. **Cache Was Cleared**:
   - Check if "Clear Cache" button was clicked
   - Browser cache clear also wipes IndexedDB

---

### Issue: "Cache HIT but results seem stale"

**Solution**:
1. **Check Document Updates**:
   - Cache should auto-invalidate when docs change
   - Verify `documentIds` tracking is working

2. **Manually Clear Cache**:
   - Settings → Semantic Cache → Clear Cache
   - Forces fresh search for all queries

3. **Adjust TTL**:
   - Reduce TTL to 10-15 minutes for fresher data
   - Settings → Semantic Cache → TTL slider

---

## 📈 Performance Benchmarks

### Without Semantic Cache
- First query: 1,500-3,000ms
- Repeated query: 1,500-3,000ms (no improvement)
- 100 repeated queries: ~2-3 minutes total

### With Semantic Cache
- First query: 1,500-3,000ms (MISS, stores in cache)
- Repeated query: 50-120ms (HIT from cache)
- 100 repeated queries: ~5-10 seconds total
- **Performance Gain**: 20-30x faster

### Real-World Impact
- User asks 10 questions
- 3 are new topics (MISS)
- 7 are follow-ups or clarifications (HIT)
- **Time Saved**: ~10-15 seconds per session
- **Better UX**: Instant responses feel more interactive

---

## 🔧 Advanced Configuration

### Adjusting Cache Sizes

**When to Increase L1 Size** (Memory):
- You have plenty of RAM (16GB+)
- Users ask many repeated questions in a session
- Default 100 → Try 200-500

**When to Increase L2 Size** (IndexedDB):
- Your knowledge base is large (many docs)
- Users have diverse query patterns
- Default 1000 → Try 5000-10000

**Memory Impact**:
- Each entry: ~10-50KB (depends on results size)
- 100 entries: ~1-5MB RAM
- 1000 entries: ~10-50MB disk space

### Adjusting Similarity Threshold

**Lower Threshold (70-80%)**:
- More cache HITs
- Faster responses
- Risk: Less relevant results

**Higher Threshold (90-95%)**:
- Fewer cache HITs
- More accurate results
- Risk: Cache underutilized

**Optimal**: 85% (default balances speed vs accuracy)

---

## 📝 Summary Checklist

**To verify semantic caching is working**:
- [ ] Cache Debug Panel visible in bottom-right
- [ ] Console shows "✨ Cache HIT" or "💨 Cache MISS" logs
- [ ] Settings → Semantic Cache tab accessible
- [ ] Test: Same query twice = Second is faster
- [ ] Test: Similar query = Still fast (semantic match)
- [ ] IndexedDB has "SemanticCache" database
- [ ] Hit rate increases over time (in debug panel)

**Cache is persistent**:
- [ ] L1 = Memory = Cleared on refresh
- [ ] L2 = IndexedDB = Survives browser restart
- [ ] TTL = 30 min default = Auto-expires old entries
- [ ] Can view cache in DevTools → Application → IndexedDB

**Cache settings found at**:
- [ ] Main app → Settings tab → Semantic Cache (4th tab)
- [ ] Or settings gear icon ⚙️ → Semantic Cache

---

## 🎓 Understanding Semantic Matching

**Traditional Cache** (exact match):
```
Query 1: "What is Miele's strategy?"
Query 2: "What is Miele's strategy?" ✅ HIT
Query 3: "Miele strategy?"           ❌ MISS (different text)
Query 4: "Tell me about Miele's strategic direction?" ❌ MISS
```

**Semantic Cache** (meaning-based):
```
Query 1: "What is Miele's strategy?"
Query 2: "What is Miele's strategy?" ✅ HIT (exact)
Query 3: "Miele strategy?"           ✅ HIT (0.92 similarity)
Query 4: "Tell me about Miele's strategic direction?" ✅ HIT (0.89 similarity)
Query 5: "Who founded Miele?"        ❌ MISS (different topic)
```

**How It Works**:
1. Convert query to embedding (384-dimensional vector)
2. Compare with cached embeddings using cosine similarity
3. If similarity ≥ 85% → HIT (return cached results)
4. If similarity < 85% → MISS (perform full search)

**Why It's Powerful**:
- Users can phrase questions differently
- Natural follow-up questions work
- No need to remember exact wording
- More human-like interaction

---

## 🚀 Next Steps

1. **Monitor Performance**: Watch the debug panel during normal usage
2. **Adjust Settings**: Fine-tune cache sizes and TTL based on usage patterns
3. **Export Stats**: Use the analytics in settings to track improvement
4. **Share Feedback**: Report any issues or unexpected behavior

**Enjoy instant search results!** 🎉
