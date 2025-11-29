/**
 * LocalStorage Management Utility
 * Handles quota management and cleanup for the RAG system
 */

export interface StorageStats {
  totalSize: number
  quotaUsage: number
  itemSizes: Record<string, number>
  warningThreshold: boolean
  criticalThreshold: boolean
}

export class StorageManager {
  private static readonly QUOTA_WARNING_THRESHOLD = 8 * 1024 * 1024 // 8MB
  private static readonly QUOTA_CRITICAL_THRESHOLD = 9 * 1024 * 1024 // 9MB
  
  /**
   * Get current localStorage usage statistics
   */
  static getStorageStats(): StorageStats {
    let totalSize = 0
    const itemSizes: Record<string, number> = {}
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          const size = new Blob([value]).size
          itemSizes[key] = size
          totalSize += size
        }
      }
    } catch (error) {
      console.warn('Error calculating storage stats:', error)
    }
    
    return {
      totalSize,
      quotaUsage: totalSize / (10 * 1024 * 1024), // Assuming 10MB quota
      itemSizes,
      warningThreshold: totalSize > this.QUOTA_WARNING_THRESHOLD,
      criticalThreshold: totalSize > this.QUOTA_CRITICAL_THRESHOLD
    }
  }
  
  /**
   * Clean up visual content by removing large base64 data
   */
  static cleanVisualContent(): boolean {
    try {
      const key = 'rag_visual_content'
      const data = localStorage.getItem(key)
      if (!data) return false
      
      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return false
      
      const cleaned = parsed.map(item => ({
        ...item,
        data: item.data ? { ...item.data, base64: undefined } : undefined,
        fullContent: undefined,
        // Keep small thumbnails, remove large ones
        thumbnail: item.thumbnail?.length > 2000 ? undefined : item.thumbnail
      }))
      
      localStorage.setItem(key, JSON.stringify(cleaned))
      console.log('✅ Cleaned visual content storage')
      return true
    } catch (error) {
      console.warn('Failed to clean visual content:', error)
      return false
    }
  }
  
  /**
   * Trim chat history to keep only recent messages
   */
  static trimChatHistory(maxMessages = 50): boolean {
    try {
      const key = 'chat_history'
      const data = localStorage.getItem(key)
      if (!data) return false
      
      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return false
      
      if (parsed.length <= maxMessages) return false
      
      const trimmed = parsed.slice(-maxMessages)
      localStorage.setItem(key, JSON.stringify(trimmed))
      console.log(`✅ Trimmed chat history to ${maxMessages} messages`)
      return true
    } catch (error) {
      console.warn('Failed to trim chat history:', error)
      return false
    }
  }
  
  /**
   * Remove embeddings from documents to save space
   */
  static removeDocumentEmbeddings(): boolean {
    try {
      const key = 'rag_documents'
      const data = localStorage.getItem(key)
      if (!data) return false
      
      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return false
      
      const cleaned = parsed.map(doc => ({
        ...doc,
        embedding: undefined,
        chunks: doc.chunks?.map((chunk: { id?: string; content?: string; embedding?: unknown }) => ({
          ...chunk,
          embedding: undefined
        }))
      }))
      
      localStorage.setItem(key, JSON.stringify(cleaned))
      console.log('✅ Removed document embeddings')
      return true
    } catch (error) {
      console.warn('Failed to remove document embeddings:', error)
      return false
    }
  }
  
  /**
   * Perform comprehensive storage cleanup
   */
  static performCleanup(): StorageStats {
    console.log('🧹 Starting comprehensive storage cleanup...')
    
    const beforeStats = this.getStorageStats()
    console.log('Storage before cleanup:', Math.round(beforeStats.totalSize / 1024), 'KB')
    
    // Clean in order of impact
    this.cleanVisualContent()
    this.removeDocumentEmbeddings()
    this.trimChatHistory(30) // More aggressive trimming during cleanup
    
    const afterStats = this.getStorageStats()
    console.log('Storage after cleanup:', Math.round(afterStats.totalSize / 1024), 'KB')
    console.log('Space freed:', Math.round((beforeStats.totalSize - afterStats.totalSize) / 1024), 'KB')
    
    return afterStats
  }
  
  /**
   * Emergency storage clear - keeps only essential data
   */
  static emergencyClean(): void {
    console.log('🚨 Performing emergency storage cleanup...')
    
    try {
      // Save essential settings first
      const settings = localStorage.getItem('miele-chat-settings')
      let essentialSettings = null
      
      if (settings) {
        try {
          const parsed = JSON.parse(settings)
          essentialSettings = {
            model: parsed.model || 'llama3.1',
            temperature: parsed.temperature || 0.7,
            maxTokens: parsed.maxTokens || 2000
          }
        } catch {
          essentialSettings = { model: 'llama3.1', temperature: 0.7 }
        }
      }
      
      // Clear everything
      localStorage.clear()
      
      // Restore essential settings
      if (essentialSettings) {
        localStorage.setItem('miele-chat-settings', JSON.stringify(essentialSettings))
      }
      
      console.log('🚨 Emergency cleanup completed - localStorage cleared')
    } catch (error) {
      console.error('Emergency cleanup failed:', error)
    }
  }
  
  /**
   * Safe localStorage setItem with automatic cleanup
   */
  static safeSetItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Quota exceeded, attempting cleanup...')
        
        // Perform cleanup and try again
        this.performCleanup()
        
        try {
          localStorage.setItem(key, value)
          return true
        } catch {
          console.warn('Cleanup failed, trying emergency clean...')
          this.emergencyClean()
          
          try {
            localStorage.setItem(key, value)
            return true
          } catch (finalError) {
            console.error('Even emergency cleanup failed:', finalError)
            return false
          }
        }
      } else {
        console.error('Non-quota localStorage error:', error)
        return false
      }
    }
  }
  
  /**
   * Monitor storage usage and warn when approaching limits
   */
  static monitorStorage(): void {
    const stats = this.getStorageStats()
    
    if (stats.criticalThreshold) {
      console.warn('🚨 CRITICAL: localStorage usage over 9MB - performing cleanup')
      this.performCleanup()
    } else if (stats.warningThreshold) {
      console.warn('⚠️ WARNING: localStorage usage over 8MB - consider cleanup')
    }
    
    // Log largest items for debugging
    const sortedItems = Object.entries(stats.itemSizes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    console.log('Largest localStorage items:')
    sortedItems.forEach(([key, size]) => {
      console.log(`  ${key}: ${Math.round(size / 1024)}KB`)
    })
  }
}

// Export utility functions for easy use
export const {
  getStorageStats,
  cleanVisualContent,
  trimChatHistory,
  removeDocumentEmbeddings,
  performCleanup,
  emergencyClean,
  safeSetItem,
  monitorStorage
} = StorageManager
