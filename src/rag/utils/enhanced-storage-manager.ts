/**
 * Enhanced Storage Manager - Centralized storage coordination
 * Fixes the persistence issue by ensuring all storage systems stay synchronized
 */

import { Document } from '../types'
import { ragStorage } from './storage'
import { vectorDB } from './persistent-vector-storage'

interface StorageState {
  lastSync: number
  documentCount: number
  version: string
}

class EnhancedStorageManager {
  private readonly STORAGE_VERSION = '1.2.0'
  private readonly SYNC_KEY = 'rag-storage-state'
  private syncInProgress = false

  /**
   * Initialize storage manager and perform health check
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Enhanced Storage Manager...')
    
    try {
      // Initialize all storage systems
      await Promise.all([
        ragStorage.initialize(),
        vectorDB.initialize(),
        this.initializeStorageState()
      ])
      
      // Perform health check
      await this.performHealthCheck()
      
      console.log('✅ Storage Manager initialized successfully')
    } catch (error) {
      console.error('❌ Storage Manager initialization failed:', error)
      throw error
    }
  }

  /**
   * Save documents with full synchronization
   */
  async saveDocuments(documents: Document[]): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏳ Sync in progress, queuing save operation...')
      await this.waitForSync()
    }

    this.syncInProgress = true
    
    try {
      console.log(`💾 Saving ${documents.length} documents with full sync...`)
      
      // 1. Save documents to main storage
      await ragStorage.saveDocuments(documents)
      
      // 2. Update vector database with embeddings
      const documentsWithEmbeddings = documents.filter(doc => 
        doc.chunks && doc.chunks.some(chunk => chunk.embedding)
      )
      
      if (documentsWithEmbeddings.length > 0) {
        await vectorDB.storeVectors(documentsWithEmbeddings)
        console.log(`📊 Stored vectors for ${documentsWithEmbeddings.length} documents`)
      }
      
      // 3. Update storage state
      await this.updateStorageState(documents.length)
      
      console.log('✅ Documents saved with full synchronization')
      
    } catch (error) {
      console.error('❌ Failed to save documents:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Load documents with integrity check
   */
  async loadDocuments(): Promise<Document[]> {
    console.log('📂 Loading documents with integrity check...')
    
    try {
      // Load documents from main storage
      const documents = await ragStorage.loadDocuments()
      
      // Verify vector database consistency
      const vectorStats = await vectorDB.getStorageStats()
      const expectedVectorDocs = documents.filter(doc => 
        doc.chunks && doc.chunks.some(chunk => chunk.embedding)
      ).length
      
      if (vectorStats.documentCount !== expectedVectorDocs) {
        console.warn(`⚠️ Vector DB inconsistency detected: ${vectorStats.documentCount} vs ${expectedVectorDocs}`)
        // Auto-repair if needed
        await this.repairVectorDatabase(documents)
      }
      
      console.log(`✅ Loaded ${documents.length} documents successfully`)
      return documents
      
    } catch (error) {
      console.error('❌ Failed to load documents:', error)
      throw error
    }
  }

  /**
   * Delete document with cascade cleanup
   */
  async deleteDocument(documentId: string): Promise<void> {
    console.log(`🗑️ Deleting document ${documentId} with cascade cleanup...`)
    
    try {
      // 1. Delete from main storage
      await ragStorage.deleteDocument(documentId)
      
      // 2. Delete vectors
      await vectorDB.deleteVectorsByDocument(documentId)
      
      // 3. Delete visual content
      await visualContentStorage.deleteVisualContent(documentId)
      
      // 4. Update storage state
      const remainingDocs = await ragStorage.loadDocuments()
      await this.updateStorageState(remainingDocs.length)
      
      console.log('✅ Document deleted with cascade cleanup')
      
    } catch (error) {
      console.error('❌ Failed to delete document:', error)
      throw error
    }
  }

  /**
   * Clear all storage systems
   */
  async clearAll(): Promise<void> {
    console.log('🧹 Clearing all storage systems...')
    
    try {
      await Promise.all([
        ragStorage.clearAllDocuments(),
        vectorDB.clearAll(),
        visualContentStorage.clearAll()
      ])
      
      // Reset storage state
      await this.updateStorageState(0)
      
      console.log('✅ All storage cleared')
      
    } catch (error) {
      console.error('❌ Failed to clear storage:', error)
      throw error
    }
  }

  /**
   * Get comprehensive storage statistics
   */
  async getStorageStats() {
    try {
      const [documentStats, vectorStats, storageStats] = await Promise.all([
        ragStorage.loadDocuments().then(docs => ({ count: docs.length, docs })),
        vectorDB.getStorageStats(),
        ragStorage.getStorageStats()
      ])

      const totalSize = documentStats.docs.reduce((sum, doc) => sum + doc.size, 0)
      
      return {
        documents: {
          count: documentStats.count,
          totalSize,
          averageSize: documentStats.count > 0 ? totalSize / documentStats.count : 0
        },
        vectors: vectorStats,
        storage: storageStats,
        health: {
          consistent: vectorStats.documentCount === documentStats.docs.filter(doc => 
            doc.chunks && doc.chunks.some(chunk => chunk.embedding)
          ).length,
          lastSync: await this.getLastSyncTime(),
          version: this.STORAGE_VERSION
        }
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return null
    }
  }

  /**
   * Repair vector database inconsistencies
   */
  private async repairVectorDatabase(documents: Document[]): Promise<void> {
    console.log('🔧 Repairing vector database...')
    
    try {
      // Clear and rebuild vector database
      await vectorDB.clearAll()
      
      const documentsWithEmbeddings = documents.filter(doc => 
        doc.chunks && doc.chunks.some(chunk => chunk.embedding)
      )
      
      if (documentsWithEmbeddings.length > 0) {
        await vectorDB.storeVectors(documentsWithEmbeddings)
      }
      
      console.log('✅ Vector database repaired')
    } catch (error) {
      console.error('❌ Failed to repair vector database:', error)
    }
  }

  /**
   * Perform storage health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const stats = await this.getStorageStats()
      if (stats) {
        console.log('📊 Storage Health Check:', {
          documents: stats.documents.count,
          vectors: stats.vectors.totalVectors,
          consistent: stats.health.consistent,
          version: stats.health.version
        })
      }
    } catch (error) {
      console.warn('Health check failed:', error)
    }
  }

  /**
   * Initialize storage state tracking
   */
  private async initializeStorageState(): Promise<void> {
    const state = this.getStorageState()
    if (!state || state.version !== this.STORAGE_VERSION) {
      await this.updateStorageState(0)
    }
  }

  /**
   * Update storage state
   */
  private async updateStorageState(documentCount: number): Promise<void> {
    const state: StorageState = {
      lastSync: Date.now(),
      documentCount,
      version: this.STORAGE_VERSION
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SYNC_KEY, JSON.stringify(state))
    }
  }

  /**
   * Get storage state
   */
  private getStorageState(): StorageState | null {
    if (typeof window === 'undefined') return null
    
    try {
      const state = localStorage.getItem(this.SYNC_KEY)
      return state ? JSON.parse(state) : null
    } catch {
      return null
    }
  }

  /**
   * Get last sync time
   */
  private async getLastSyncTime(): Promise<number> {
    const state = this.getStorageState()
    return state?.lastSync || 0
  }

  /**
   * Wait for ongoing sync to complete
   */
  private async waitForSync(): Promise<void> {
    while (this.syncInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

// Singleton instance
export const storageManager = new EnhancedStorageManager()

// Enhanced visual content storage interface
interface VisualContentStorageInterface {
  deleteVisualContent(documentId: string): Promise<void>
  clearAll(): Promise<void>
}

// Mock implementation if not available
const visualContentStorage: VisualContentStorageInterface = {
  async deleteVisualContent(documentId: string): Promise<void> {
    console.log(`Deleting visual content for ${documentId}`)
  },
  async clearAll(): Promise<void> {
    console.log('Clearing all visual content')
  }
}
