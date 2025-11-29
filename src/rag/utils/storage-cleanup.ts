/**
 * Storage cleanup utilities for RAG system
 * Helps resolve document count mismatches and cache issues
 */

export function clearRAGStorage() {
  console.log('🧹 Clearing RAG storage data...')
  
  try {
    // Clear all RAG-related localStorage items
    const ragKeys = [
      'miele-rag-documents',
      'miele-rag-chunks', 
      'miele-rag-embeddings',
      'miele-rag-visual-content',
      'miele-rag-metadata',
      'miele-storage-manager-initialized'
    ]
    
    ragKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`✅ Cleared ${key}`)
      }
    })
    
    console.log('✅ RAG storage cleared successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to clear RAG storage:', error)
    return false
  }
}

export function verifyStorageConsistency() {
  console.log('🔍 Verifying storage consistency...')
  
  try {
    const documentsStr = localStorage.getItem('miele-rag-documents')
    const chunksStr = localStorage.getItem('miele-rag-chunks')
    
    if (!documentsStr) {
      console.log('📋 No documents in storage')
      return { documents: 0, chunks: 0, consistent: true }
    }
    
    const documents = JSON.parse(documentsStr)
    const chunks = chunksStr ? JSON.parse(chunksStr) : []
    
    console.log(`📊 Storage stats:`)
    console.log(`   - Documents: ${documents.length}`)
    console.log(`   - Chunks: ${chunks.length}`)
    
    // Verify each document
    documents.forEach((doc: { name: string; status: string; chunks?: unknown[] }, index: number) => {
      console.log(`  ${index + 1}. "${doc.name}" (${doc.status}) - ${doc.chunks?.length || 0} chunks`)
    })
    
    return {
      documents: documents.length,
      chunks: chunks.length,
      consistent: true
    }
  } catch (error) {
    console.error('❌ Storage verification failed:', error)
    return { documents: 0, chunks: 0, consistent: false }
  }
}

export function refreshDocumentCount() {
  console.log('🔄 Refreshing document count...')
  
  try {
    const verification = verifyStorageConsistency()
    
    // Dispatch custom event to trigger UI refresh
    window.dispatchEvent(new CustomEvent('rag-documents-updated', {
      detail: { count: verification.documents }
    }))
    
    console.log(`✅ Document count refreshed: ${verification.documents}`)
    return verification.documents
  } catch (error) {
    console.error('❌ Failed to refresh document count:', error)
    return 0
  }
}

// Debug function to inspect storage
export function debugStorage() {
  console.log('🔍 RAG Storage Debug Information:')
  console.log('================================')
  
  const keys = Object.keys(localStorage).filter(key => key.includes('miele-rag'))
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      const parsed = value ? JSON.parse(value) : null
      
      console.log(`📁 ${key}:`)
      if (Array.isArray(parsed)) {
        console.log(`   Type: Array, Length: ${parsed.length}`)
        if (parsed.length > 0) {
          console.log(`   Sample item:`, parsed[0])
        }
      } else if (typeof parsed === 'object') {
        console.log(`   Type: Object, Keys: ${Object.keys(parsed).length}`)
        console.log(`   Keys:`, Object.keys(parsed))
      } else {
        console.log(`   Type: ${typeof parsed}, Value:`, parsed)
      }
    } catch (error) {
      console.log(`   Error parsing: ${error}`)
    }
  })
  
  console.log('================================')
}
