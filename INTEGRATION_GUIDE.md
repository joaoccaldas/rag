# 🔧 Integration Guide: Semantic Chunking & Enhanced Search

## ✅ Status: Services Ready for Integration

Both services are **fully implemented and TypeScript-compliant**:
- ✅ `src/rag/services/semantic-chunking.ts` (600+ lines)
- ✅ `src/rag/services/enhanced-search.ts` (460+ lines)

---

## 📋 Integration Checklist

### Phase 1: Integrate Semantic Chunking into Document Upload
- [ ] Modify document processing to use semantic chunking
- [ ] Add configuration toggle (hybrid vs semantic)
- [ ] Test with sample documents
- [ ] Monitor embedding generation performance

### Phase 2: Integrate Enhanced Search
- [ ] Update SearchContext to use enhanced search
- [ ] Add scoring breakdown to UI
- [ ] Test query expansion
- [ ] Verify reranking improves results

### Phase 3: Migration & Testing
- [ ] Create migration script for existing documents
- [ ] Re-chunk all documents with semantic method
- [ ] Performance comparison (before/after)
- [ ] User acceptance testing

---

## 🚀 Step-by-Step Integration

### **1. Integrate Semantic Chunking into Document Processing**

#### **File:** `src/rag/context/upload-processing-context.tsx`

**Current Implementation:**
```typescript
// Around line 120-150 where chunking happens
import { tokenAwareChunking } from '../utils/enhanced-chunking'

const chunks = tokenAwareChunking(content, documentId, {
  maxTokens: 512,
  overlap: 50,
  preserveStructure: true
})
```

**New Implementation:**
```typescript
import { semanticChunkingService } from '../services/semantic-chunking'
import { tokenAwareChunking } from '../utils/enhanced-chunking'

// Add configuration option
const USE_SEMANTIC_CHUNKING = process.env.NEXT_PUBLIC_USE_SEMANTIC_CHUNKING === 'true'

// In document processing function:
let documentChunks: DocumentChunk[]

if (USE_SEMANTIC_CHUNKING) {
  console.log('🧠 Using semantic chunking...')
  
  try {
    // Generate semantic chunks
    const semanticChunks = await semanticChunkingService.generateSemanticChunks(
      content,
      documentId,
      {
        maxTokens: 512,
        minTokens: 100,
        targetTokens: 400,
        overlapSentences: 2,
        similarityThreshold: 0.7,
        useEmbeddings: true,
        preserveStructure: true
      }
    )
    
    // Convert to DocumentChunk format
    documentChunks = semanticChunks.map(chunk =>
      semanticChunkingService.convertToDocumentChunk(chunk, documentId)
    )
    
    console.log(`✅ Generated ${documentChunks.length} semantic chunks`)
    
  } catch (error) {
    console.warn('⚠️ Semantic chunking failed, falling back to hybrid:', error)
    // Fallback to hybrid chunking
    documentChunks = tokenAwareChunking(content, documentId, {
      maxTokens: 512,
      overlap: 50,
      preserveStructure: true
    })
  }
} else {
  console.log('🔧 Using hybrid chunking...')
  // Use existing hybrid chunking
  documentChunks = tokenAwareChunking(content, documentId, {
    maxTokens: 512,
    overlap: 50,
    preserveStructure: true
  })
}

// Continue with embedding and storage as before...
```

**Environment Variable:**
Add to `.env.local`:
```bash
NEXT_PUBLIC_USE_SEMANTIC_CHUNKING=true
```

---

### **2. Integrate Enhanced Search into SearchContext**

#### **File:** `src/rag/context/search-context.tsx`

**Current Implementation:**
```typescript
// Around line 80-120 in performSearch function
const results = documents.flatMap(doc =>
  doc.chunks.map(chunk => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
    return { chunk, document: doc, similarity }
  })
)
.filter(r => r.similarity >= 0.3)
.sort((a, b) => b.similarity - a.similarity)
.slice(0, 8)
```

**New Implementation:**
```typescript
import { enhancedSearchService } from '../services/enhanced-search'
import type { RankedResult } from '../services/enhanced-search'

// Add configuration
const USE_ENHANCED_SEARCH = process.env.NEXT_PUBLIC_USE_ENHANCED_SEARCH === 'true'

// In performSearch function:
let results: RankedResult[]

if (USE_ENHANCED_SEARCH) {
  console.log('🚀 Using enhanced search with reranking...')
  
  try {
    results = await enhancedSearchService.search(
      query,
      documents,
      {
        topK: 8,
        rerankTopN: 20,
        similarityThreshold: 0.3,
        useQueryExpansion: true,
        useHybridSearch: true,
        metadataFilters: filters ? {
          dateRange: filters.dateRange,
          documentTypes: filters.documentTypes,
          keywords: filters.keywords,
          minImportance: filters.minImportance || 0.5
        } : undefined
      }
    )
    
    console.log(`✅ Found ${results.length} results after reranking`)
    
  } catch (error) {
    console.warn('⚠️ Enhanced search failed, using basic search:', error)
    // Fallback to basic search
    results = basicSearch(query, documents)
  }
} else {
  console.log('🔍 Using basic search...')
  results = basicSearch(query, documents)
}

// Update state with results
setSearchResults(results)
```

**Environment Variable:**
Add to `.env.local`:
```bash
NEXT_PUBLIC_USE_ENHANCED_SEARCH=true
```

---

### **3. Update Search Results UI to Show Scoring Breakdown**

#### **File:** `src/components/search/search-results.tsx`

**Add Score Visualization:**
```typescript
interface SearchResultCardProps {
  result: RankedResult
  // ... other props
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const { scoringBreakdown, rerankedScore } = result
  
  return (
    <div className="search-result-card">
      {/* Existing content display */}
      
      {/* New: Scoring breakdown */}
      <div className="scoring-breakdown">
        <div className="score-header">
          <span>Relevance Score: {(rerankedScore * 100).toFixed(0)}%</span>
        </div>
        
        <div className="score-bars">
          <ScoreBar 
            label="Semantic" 
            score={scoringBreakdown.semantic} 
            color="blue" 
          />
          <ScoreBar 
            label="Keyword" 
            score={scoringBreakdown.keyword} 
            color="green" 
          />
          <ScoreBar 
            label="Metadata" 
            score={scoringBreakdown.metadata} 
            color="purple" 
          />
          <ScoreBar 
            label="Recency" 
            score={scoringBreakdown.recency} 
            color="orange" 
          />
        </div>
      </div>
      
      {/* Show chunk metadata if available */}
      {result.chunk?.metadata && (
        <div className="chunk-metadata">
          {result.chunk.metadata.topics && (
            <div className="topics">
              {result.chunk.metadata.topics.map((topic: string) => (
                <span key={topic} className="topic-badge">
                  {topic}
                </span>
              ))}
            </div>
          )}
          
          {result.chunk.metadata.importance && (
            <div className="importance">
              Importance: {(result.chunk.metadata.importance * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, score, color }: { 
  label: string
  score: number
  color: string 
}) {
  return (
    <div className="score-bar">
      <span className="label">{label}</span>
      <div className="bar-container">
        <div 
          className={`bar bar-${color}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="value">{(score * 100).toFixed(0)}%</span>
    </div>
  )
}
```

**Add Styles:**
```css
.scoring-breakdown {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
}

.score-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.score-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.score-bar .label {
  width: 80px;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-blue { background: #3b82f6; }
.bar-green { background: #10b981; }
.bar-purple { background: #8b5cf6; }
.bar-orange { background: #f59e0b; }

.score-bar .value {
  width: 40px;
  text-align: right;
  font-weight: 600;
}

.chunk-metadata {
  margin-top: 0.5rem;
}

.topics {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.topic-badge {
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.importance {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}
```

---

### **4. Create Migration Script for Existing Documents**

#### **File:** `scripts/migrate-to-semantic-chunking.ts`

```typescript
import { unlimitedRAGStorage } from '@/rag/services/unlimited-rag-storage'
import { semanticChunkingService } from '@/rag/services/semantic-chunking'

async function migrateToSemanticChunking() {
  console.log('🔄 Starting semantic chunking migration...')
  
  // 1. Load all documents
  const documents = await unlimitedRAGStorage.getAllDocuments()
  console.log(`📚 Found ${documents.length} documents to migrate`)
  
  let migratedCount = 0
  let failedCount = 0
  
  for (const document of documents) {
    try {
      console.log(`\n📄 Processing: ${document.name}`)
      
      // 2. Re-generate chunks with semantic method
      const semanticChunks = await semanticChunkingService.generateSemanticChunks(
        document.content,
        document.id,
        {
          maxTokens: 512,
          minTokens: 100,
          targetTokens: 400,
          overlapSentences: 2,
          similarityThreshold: 0.7,
          useEmbeddings: true,
          preserveStructure: true
        }
      )
      
      // 3. Convert to DocumentChunk format
      const newChunks = semanticChunks.map(chunk =>
        semanticChunkingService.convertToDocumentChunk(chunk, document.id)
      )
      
      // 4. Generate embeddings for new chunks
      const chunksWithEmbeddings = await Promise.all(
        newChunks.map(async (chunk) => {
          const embedding = await semanticChunkingService.generateEmbedding(chunk.content)
          return { ...chunk, embedding: embedding || [] }
        })
      )
      
      // 5. Update document with new chunks
      await unlimitedRAGStorage.updateDocument(document.id, {
        chunks: chunksWithEmbeddings,
        metadata: {
          ...document.metadata,
          chunkingMethod: 'semantic',
          migratedAt: new Date().toISOString(),
          previousChunkCount: document.chunks.length,
          newChunkCount: chunksWithEmbeddings.length
        }
      })
      
      console.log(`✅ Migrated: ${document.chunks.length} → ${chunksWithEmbeddings.length} chunks`)
      migratedCount++
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${document.name}:`, error)
      failedCount++
    }
  }
  
  console.log(`\n✅ Migration complete!`)
  console.log(`   Migrated: ${migratedCount}`)
  console.log(`   Failed: ${failedCount}`)
}

// Run migration
migrateToSemanticChunking().catch(console.error)
```

**Run Migration:**
```bash
npm run tsx scripts/migrate-to-semantic-chunking.ts
```

---

### **5. Add Configuration Panel in UI**

#### **File:** `src/components/settings/rag-settings.tsx`

```typescript
export function RAGSettings() {
  const [useSemanticChunking, setUseSemanticChunking] = useState(
    process.env.NEXT_PUBLIC_USE_SEMANTIC_CHUNKING === 'true'
  )
  
  const [useEnhancedSearch, setUseEnhancedSearch] = useState(
    process.env.NEXT_PUBLIC_USE_ENHANCED_SEARCH === 'true'
  )
  
  return (
    <div className="rag-settings">
      <h2>RAG Configuration</h2>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={useSemanticChunking}
            onChange={(e) => setUseSemanticChunking(e.target.checked)}
          />
          <span>Use Semantic Chunking</span>
        </label>
        <p className="setting-description">
          Chunks documents based on semantic meaning instead of fixed token counts.
          More accurate but slower processing.
        </p>
      </div>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={useEnhancedSearch}
            onChange={(e) => setUseEnhancedSearch(e.target.checked)}
          />
          <span>Use Enhanced Search</span>
        </label>
        <p className="setting-description">
          Enables query expansion, hybrid search, and reranking for better results.
        </p>
      </div>
      
      <button onClick={handleSave}>Save Settings</button>
    </div>
  )
}
```

---

## 📊 Testing & Validation

### **Test Semantic Chunking**

```typescript
// Test script: scripts/test-semantic-chunking.ts
import { semanticChunkingService } from '@/rag/services/semantic-chunking'

const testText = `
# Fight Plan for Nordic Region

## Executive Summary
Miele's strategy in the Nordic region focuses on three key areas...

## Market Analysis
The Nordic market presents unique opportunities for premium appliances...

## Action Items
1. Increase brand presence in Denmark
2. Partner with high-end retailers in Sweden
3. Launch targeted campaigns in Norway
`

async function testSemanticChunking() {
  console.log('🧪 Testing semantic chunking...\n')
  
  const chunks = await semanticChunkingService.generateSemanticChunks(
    testText,
    'test-doc-123',
    {
      targetTokens: 400,
      useEmbeddings: true,
      preserveStructure: true
    }
  )
  
  console.log(`Generated ${chunks.length} semantic chunks:\n`)
  
  chunks.forEach((chunk, i) => {
    console.log(`\n--- Chunk ${i + 1} ---`)
    console.log(`Tokens: ${chunk.tokenCount}`)
    console.log(`Topics: ${chunk.metadata.topics.join(', ')}`)
    console.log(`Key Phrases: ${chunk.metadata.keyPhrases.join(', ')}`)
    console.log(`Importance: ${(chunk.metadata.importance * 100).toFixed(0)}%`)
    console.log(`Content: ${chunk.content.substring(0, 100)}...`)
  })
}

testSemanticChunking()
```

### **Test Enhanced Search**

```typescript
// Test script: scripts/test-enhanced-search.ts
import { enhancedSearchService } from '@/rag/services/enhanced-search'
import { unlimitedRAGStorage } from '@/rag/services/unlimited-rag-storage'

async function testEnhancedSearch() {
  console.log('🧪 Testing enhanced search...\n')
  
  const documents = await unlimitedRAGStorage.getAllDocuments()
  
  const queries = [
    'fight plan for nordics',
    'miele strategy scandinavia',
    'sales plan northern europe'
  ]
  
  for (const query of queries) {
    console.log(`\n🔍 Query: "${query}"`)
    
    const results = await enhancedSearchService.search(query, documents, {
      topK: 5,
      rerankTopN: 15,
      useQueryExpansion: true,
      useHybridSearch: true
    })
    
    console.log(`Found ${results.length} results:`)
    
    results.forEach((result, i) => {
      console.log(`\n  ${i + 1}. Score: ${(result.rerankedScore * 100).toFixed(0)}%`)
      console.log(`     Document: ${result.document?.name}`)
      console.log(`     Semantic: ${(result.scoringBreakdown.semantic * 100).toFixed(0)}%`)
      console.log(`     Keyword: ${(result.scoringBreakdown.keyword * 100).toFixed(0)}%`)
      console.log(`     Preview: ${result.relevantText}`)
    })
  }
}

testEnhancedSearch()
```

---

## 🎯 Expected Improvements

### **Before (Hybrid Chunking + Basic Search)**
```
Query: "fight plan for nordics miele"
↓
Results: 5 chunks found
- Score: 0.65
- Sources: Generic matches
- Response: May hallucinate or be imprecise
```

### **After (Semantic Chunking + Enhanced Search)**
```
Query: "fight plan for nordics miele"
↓
Query Expansion:
  - "fight plan for nordics miele"
  - "strategy plan for scandinavia miele"
  - "action plan for northern europe miele"
↓
Initial Retrieval: 20 results
↓
Reranking: Top 8 results
↓
Results: 8 chunks with rich metadata
- Score: 0.85-0.95
- Topics: finance, strategy, marketing
- Key Phrases: nordic, miele, fight plan, strategy
- Response: Precise, well-cited, contextual
```

---

## ✅ Deployment Checklist

- [ ] Enable semantic chunking in `.env.local`
- [ ] Enable enhanced search in `.env.local`
- [ ] Test with sample documents
- [ ] Run migration script for existing documents
- [ ] Monitor Ollama performance (embedding generation)
- [ ] Verify search results improve
- [ ] Check user feedback
- [ ] Monitor response times
- [ ] Adjust thresholds if needed

---

## 🚀 Ready to Integrate!

Both services are production-ready. Start with **Phase 1** (semantic chunking) and test thoroughly before moving to **Phase 2** (enhanced search).

Your RAG pipeline is about to become **state-of-the-art**! 🎉
