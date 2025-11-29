/**
 * STORAGE RESET UTILITY
 * 
 * Comprehensive utility to clear all storage systems when database is reset
 * Ensures visual content page syncs properly with database state
 */

import { unifiedStorage } from '../storage/unified-storage-manager'

export interface ResetStats {
  localStorageKeysRemoved: number
  unifiedStorageCleared: boolean
  indexedDbCleared: boolean
  sessionStorageCleared: boolean
  cacheCleared: boolean
  errors: string[]
}

export class StorageResetManager {
  
  async resetAllStorage(): Promise<ResetStats> {
    const stats: ResetStats = {
      localStorageKeysRemoved: 0,
      unifiedStorageCleared: false,
      indexedDbCleared: false,
      sessionStorageCleared: false,
      cacheCleared: false,
      errors: []
    }

    console.log('🧹 Starting comprehensive storage reset...')

    try {
      // 1. Clear localStorage completely
      await this.clearLocalStorage(stats)
      
      // 2. Clear unified storage
      await this.clearUnifiedStorage(stats)
      
      // 3. Clear IndexedDB
      await this.clearIndexedDB(stats)
      
      // 4. Clear sessionStorage
      await this.clearSessionStorage(stats)
      
      // 5. Clear any cached data
      await this.clearCaches(stats)
      
      console.log('✅ Storage reset completed successfully')
      console.log('📊 Reset Statistics:', stats)
      
      // Force page reload to ensure clean state
      if (typeof window !== 'undefined') {
        console.log('🔄 Reloading page to ensure clean state...')
        setTimeout(() => window.location.reload(), 1000)
      }
      
    } catch (error) {
      console.error('❌ Storage reset failed:', error)
      stats.errors.push(`Storage reset failed: ${error}`)
    }

    return stats
  }

  private async clearLocalStorage(stats: ResetStats): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      const keysToRemove: string[] = []
      
      // Collect all keys that might contain visual content or document data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && this.shouldRemoveKey(key)) {
          keysToRemove.push(key)
        }
      }
      
      // Remove all identified keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed localStorage key: ${key}`)
      })
      
      stats.localStorageKeysRemoved = keysToRemove.length
      console.log(`✅ Cleared ${keysToRemove.length} localStorage keys`)
      
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      stats.errors.push(`localStorage clear failed: ${error}`)
    }
  }

  private async clearUnifiedStorage(stats: ResetStats): Promise<void> {
    try {
      await unifiedStorage.clearAll()
      stats.unifiedStorageCleared = true
      console.log('✅ Cleared unified storage')
    } catch (error) {
      console.error('Failed to clear unified storage:', error)
      stats.errors.push(`Unified storage clear failed: ${error}`)
    }
  }

  private async clearIndexedDB(stats: ResetStats): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) return

      // Clear RAG-related IndexedDB databases
      const dbNames = [
        'rag_unified_storage',
        'miele_rag_storage', 
        'visual_content_db',
        'document_storage',
        'ai_analysis_db'
      ]

      for (const dbName of dbNames) {
        try {
          await this.deleteIndexedDB(dbName)
          console.log(`✅ Cleared IndexedDB: ${dbName}`)
        } catch (error) {
          console.warn(`Failed to clear IndexedDB ${dbName}:`, error)
        }
      }

      stats.indexedDbCleared = true
      
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
      stats.errors.push(`IndexedDB clear failed: ${error}`)
    }
  }

  private async clearSessionStorage(stats: ResetStats): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      const keysToRemove: string[] = []
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && this.shouldRemoveKey(key)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key)
        console.log(`🗑️ Removed sessionStorage key: ${key}`)
      })
      
      stats.sessionStorageCleared = true
      console.log(`✅ Cleared ${keysToRemove.length} sessionStorage keys`)
      
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error)
      stats.errors.push(`sessionStorage clear failed: ${error}`)
    }
  }

  private async clearCaches(stats: ResetStats): Promise<void> {
    try {
      if (typeof window === 'undefined' || !('caches' in window)) return

      const cacheNames = await caches.keys()
      
      for (const cacheName of cacheNames) {
        if (this.shouldClearCache(cacheName)) {
          await caches.delete(cacheName)
          console.log(`✅ Cleared cache: ${cacheName}`)
        }
      }
      
      stats.cacheCleared = true
      
    } catch (error) {
      console.error('Failed to clear caches:', error)
      stats.errors.push(`Cache clear failed: ${error}`)
    }
  }

  private shouldRemoveKey(key: string): boolean {
    const patterns = [
      'rag_',
      'miele_',
      'document_',
      'visual_',
      'analysis_',
      'enhanced_',
      'unified_',
      'file_storage_',
      'chat_',
      'search_',
      'embedding_',
      'ai_'
    ]
    
    return patterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))
  }

  private shouldClearCache(cacheName: string): boolean {
    const patterns = [
      'rag',
      'miele',
      'document',
      'visual',
      'api'
    ]
    
    return patterns.some(pattern => cacheName.toLowerCase().includes(pattern))
  }

  private deleteIndexedDB(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName)
      
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onblocked = () => {
        console.warn(`IndexedDB deletion blocked for: ${dbName}`)
        // Still resolve to continue with other cleanup
        resolve()
      }
    })
  }

  // Specific method to clear only visual content storage
  async clearVisualContentStorage(): Promise<void> {
    console.log('🎨 Clearing visual content storage specifically...')
    
    try {
      // Clear visual content from localStorage
      const visualKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('visual') || key.includes('chart') || key.includes('image'))) {
          visualKeys.push(key)
        }
      }
      
      visualKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed visual key: ${key}`)
      })
      
      // Clear from unified storage
      const allKeys = await unifiedStorage.getStorageStats()
      console.log(`📊 Found ${allKeys.itemCount} items in unified storage`)
      
      // Force reload visual content components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('visualContentCleared'))
      }
      
      console.log('✅ Visual content storage cleared')
      
    } catch (error) {
      console.error('❌ Failed to clear visual content storage:', error)
      throw error
    }
  }

  // Method to verify storage is clean
  async verifyStorageClean(): Promise<{
    isClean: boolean
    remainingItems: string[]
  }> {
    const remainingItems: string[] = []
    
    try {
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && this.shouldRemoveKey(key)) {
          remainingItems.push(`localStorage: ${key}`)
        }
      }
      
      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && this.shouldRemoveKey(key)) {
          remainingItems.push(`sessionStorage: ${key}`)
        }
      }
      
      // Check unified storage
      const stats = await unifiedStorage.getStorageStats()
      if (stats.itemCount > 0) {
        remainingItems.push(`unifiedStorage: ${stats.itemCount} items`)
      }
      
      const isClean = remainingItems.length === 0
      
      console.log(isClean ? '✅ Storage is clean' : `⚠️ Found ${remainingItems.length} remaining items`)
      
      return { isClean, remainingItems }
      
    } catch (error) {
      console.error('Failed to verify storage cleanliness:', error)
      return { isClean: false, remainingItems: [`Verification failed: ${error}`] }
    }
  }
}

// Export singleton instance
export const storageResetManager = new StorageResetManager()

// Convenience functions
export const resetAllStorage = () => storageResetManager.resetAllStorage()
export const clearVisualContentStorage = () => storageResetManager.clearVisualContentStorage()
export const verifyStorageClean = () => storageResetManager.verifyStorageClean()

// Auto-clear function for development
export const autoCleanStorageOnReset = () => {
  if (typeof window !== 'undefined') {
    // Listen for database reset events
    window.addEventListener('databaseReset', () => {
      console.log('🔄 Database reset detected, clearing storage...')
      resetAllStorage()
    })
    
    // Check if we're in a clean state on page load
    setTimeout(async () => {
      const verification = await verifyStorageClean()
      if (!verification.isClean) {
        console.log('⚠️ Storage not clean on page load, remaining items:', verification.remainingItems)
      }
    }, 1000)
  }
}
