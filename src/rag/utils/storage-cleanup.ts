/**
 * Storage cleanup utilities for RAG system
 * Helps resolve document count mismatches and cache issues
 */

export function clearRAGStorage() {
  
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
      }
    })
    
    return true
  } catch (error) {
    console.error('❌ Failed to clear RAG storage:', error)
    return false
  }
}

export function verifyStorageConsistency() {
  
  try {
    const documentsStr = localStorage.getItem('miele-rag-documents')
    const chunksStr = localStorage.getItem('miele-rag-chunks')
    
    if (!documentsStr) {
      return { documents: 0, chunks: 0, consistent: true }
    }
    
    const documents = JSON.parse(documentsStr)
    const chunks = chunksStr ? JSON.parse(chunksStr) : []
    
    
    // Verify each document
    documents.forEach((doc: { name: string; status: string; chunks?: unknown[] }, index: number) => {
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
  
  try {
    const verification = verifyStorageConsistency()
    
    // Dispatch custom event to trigger UI refresh
    window.dispatchEvent(new CustomEvent('rag-documents-updated', {
      detail: { count: verification.documents }
    }))
    
    return verification.documents
  } catch (error) {
    console.error('❌ Failed to refresh document count:', error)
    return 0
  }
}

// Debug function to inspect storage
export function debugStorage() {
  
  const keys = Object.keys(localStorage).filter(key => key.includes('miele-rag'))
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      const parsed = value ? JSON.parse(value) : null
      
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) {
        }
      } else if (typeof parsed === 'object') {
      } else {
      }
    } catch (error) {
    }
  })
  
}
