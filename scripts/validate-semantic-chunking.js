/**
 * Test Script for Semantic Chunking Validation
 * 
 * To run in browser console after uploading a document
 */

async function validateSemanticChunking() {
  console.log('🧪 Starting Semantic Chunking Validation...\n')
  
  // 1. Check environment variable
  const useSemanticChunking = process.env.NEXT_PUBLIC_USE_SEMANTIC_CHUNKING === 'true'
  console.log(`✅ Semantic Chunking Enabled: ${useSemanticChunking}`)
  
  // 2. Check documents in storage
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('RAGDatabase', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  
  const tx = db.transaction(['documents'], 'readonly')
  const store = tx.objectStore('documents')
  const documents = await new Promise((resolve) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
  })
  
  console.log(`\n📚 Found ${documents.length} documents in storage\n`)
  
  // 3. Analyze chunks from latest document
  if (documents.length > 0) {
    const latestDoc = documents[documents.length - 1]
    console.log(`📄 Latest Document: ${latestDoc.name}`)
    console.log(`   - Chunks: ${latestDoc.chunks?.length || 0}`)
    console.log(`   - Upload Date: ${new Date(latestDoc.uploadedAt).toLocaleString()}`)
    
    // Check if chunks have semantic metadata
    if (latestDoc.chunks && latestDoc.chunks.length > 0) {
      const firstChunk = latestDoc.chunks[0]
      console.log(`\n🔍 First Chunk Analysis:`)
      console.log(`   - ID: ${firstChunk.id}`)
      console.log(`   - Content Length: ${firstChunk.content.length} chars`)
      console.log(`   - Has Embedding: ${!!firstChunk.embedding}`)
      
      if (firstChunk.metadata) {
        console.log(`   - Metadata:`)
        console.log(`     * Key Phrases: ${firstChunk.metadata.keyPhrases?.length || 0}`)
        console.log(`     * Topics: ${firstChunk.metadata.topics?.length || 0}`)
        console.log(`     * Entities: ${firstChunk.metadata.entities?.length || 0}`)
        console.log(`     * Importance: ${firstChunk.metadata.importance || 'N/A'}`)
        console.log(`     * Semantic Density: ${firstChunk.metadata.semanticDensity || 'N/A'}`)
        console.log(`     * Coherence: ${firstChunk.metadata.coherence || 'N/A'}`)
        
        if (firstChunk.metadata.keyPhrases?.length > 0) {
          console.log(`\n✅ SEMANTIC CHUNKING DETECTED!`)
          console.log(`   Chunks have rich metadata (key phrases, topics, entities)`)
        } else {
          console.log(`\n⚠️ No semantic metadata found`)
          console.log(`   Likely using hybrid chunking fallback`)
        }
      }
      
      // Token count analysis
      const tokenCounts = latestDoc.chunks.map(chunk => {
        // Rough token estimate: 1 token ≈ 4 chars
        return Math.ceil(chunk.content.length / 4)
      })
      
      const avgTokens = Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length)
      const minTokens = Math.min(...tokenCounts)
      const maxTokens = Math.max(...tokenCounts)
      
      console.log(`\n📊 Token Distribution:`)
      console.log(`   - Average: ${avgTokens} tokens`)
      console.log(`   - Min: ${minTokens} tokens`)
      console.log(`   - Max: ${maxTokens} tokens`)
      console.log(`   - Target: 400 tokens (semantic) or 512 tokens (hybrid)`)
      
      if (avgTokens >= 350 && avgTokens <= 450) {
        console.log(`   ✅ Matches semantic chunking target (400 tokens)`)
      } else if (avgTokens >= 450 && avgTokens <= 550) {
        console.log(`   ⚠️ Matches hybrid chunking target (512 tokens)`)
      }
    }
  }
  
  // 4. Check visual content
  const visualContent = localStorage.getItem('rag_visual_content')
  if (visualContent) {
    const visuals = JSON.parse(visualContent)
    console.log(`\n🎨 Visual Content:`)
    console.log(`   - Total Items: ${visuals.length}`)
    
    const withThumbnails = visuals.filter(v => 
      v.thumbnail?.startsWith('data:') ||
      v.source?.startsWith('data:') ||
      v.data?.base64?.startsWith('data:')
    )
    console.log(`   - With Thumbnails: ${withThumbnails.length}`)
    
    if (withThumbnails.length > 0) {
      console.log(`   ✅ Thumbnails preserved!`)
    } else if (visuals.length > 0) {
      console.log(`   ⚠️ Visual items exist but thumbnails missing`)
    }
    
    // Show breakdown by type
    const typeBreakdown = visuals.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1
      return acc
    }, {})
    console.log(`   - Types:`, typeBreakdown)
  } else {
    console.log(`\n📸 No visual content found`)
  }
  
  console.log(`\n✅ Validation Complete!\n`)
}

// Export for use
if (typeof window !== 'undefined') {
  window.validateSemanticChunking = validateSemanticChunking
  console.log('💡 Run validateSemanticChunking() in console after uploading a document')
}
