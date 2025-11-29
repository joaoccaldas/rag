/**
 * STORAGE MIGRATION SCRIPT
 * 
 * Migrates data from old storage systems to the new unified storage manager
 * Handles data from:
 * - Old UnifiedStorageManager
 * - enhanced-file-storage.ts  
 * - visual-content-storage.ts
 * - localStorage keys with various prefixes
 */

import { unifiedStorage } from './unified-storage-manager'
import { Document, VisualContent, AIAnalysisData } from '../rag/types'

interface MigrationStats {
  documentsFound: number
  documentsMigrated: number
  visualContentFound: number
  visualContentMigrated: number
  analysisFound: number
  analysisMigrated: number
  errors: string[]
  totalSize: number
}

class StorageMigration {
  private stats: MigrationStats = {
    documentsFound: 0,
    documentsMigrated: 0,
    visualContentFound: 0,
    visualContentMigrated: 0,
    analysisFound: 0,
    analysisMigrated: 0,
    errors: [],
    totalSize: 0
  }

  private legacyPrefixes = [
    'rag_',
    'miele_rag_',
    'document_',
    'visual_',
    'analysis_',
    'enhanced_',
    'unified_storage_',
    'file_storage_'
  ]

  async migrateAllSystems(): Promise<MigrationStats> {
    console.log('🔄 Starting comprehensive storage migration...')
    
    try {
      // Migrate from localStorage
      await this.migrateFromLocalStorage()
      
      // Migrate from filesystem if available
      await this.migrateFromFilesystem()
      
      // Clean up old storage keys
      await this.cleanupOldStorage()
      
      console.log('✅ Migration completed successfully!')
      this.logMigrationStats()
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.stats.errors.push(`Migration failed: ${error}`)
    }
    
    return this.stats
  }

  private async migrateFromLocalStorage(): Promise<void> {
    console.log('📦 Scanning localStorage for legacy data...')
    
    const allKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) allKeys.push(key)
    }
    
    for (const key of allKeys) {
      if (this.isLegacyKey(key)) {
        await this.migrateLegacyItem(key)
      }
    }
  }

  private async migrateFromFilesystem(): Promise<void> {
    // Only attempt filesystem migration in Node.js environments
    if (typeof window !== 'undefined') return
    
    console.log('📁 Scanning filesystem for legacy data...')
    
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const storagePaths = ['./storage', './data', './rag-storage']
      
      for (const storagePath of storagePaths) {
        try {
          const files = await fs.readdir(storagePath)
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(storagePath, file)
              await this.migrateFileSystemItem(filePath)
            }
          }
        } catch {
          // Directory doesn't exist, skip
          console.log(`Directory ${storagePath} not found, skipping`)
        }
      }
    } catch (error) {
      console.warn('Filesystem migration failed:', error)
    }
  }

  private isLegacyKey(key: string): boolean {
    // Skip if already using new unified prefix
    if (key.startsWith('rag_unified_')) return false
    
    return this.legacyPrefixes.some(prefix => key.startsWith(prefix))
  }

  private async migrateLegacyItem(key: string): Promise<void> {
    try {
      const rawData = localStorage.getItem(key)
      if (!rawData) return
      
      let data: unknown
      try {
        data = JSON.parse(rawData)
      } catch {
        // Not JSON, skip
        return
      }
      
      // Extract actual data if wrapped
      const wrappedData = data as Record<string, unknown>
      const actualData = wrappedData['data'] || data

      this.stats.totalSize += rawData.length
      
      // Determine data type and migrate accordingly
      if (this.isDocument(actualData)) {
        const doc = actualData as Document
        await unifiedStorage.storeDocument(doc)
        this.stats.documentsFound++
        this.stats.documentsMigrated++
        console.log(`📄 Migrated document: ${doc.name}`)
        
      } else if (this.isVisualContent(actualData)) {
        const visual = actualData as VisualContent
        await unifiedStorage.storeVisualContent([visual])
        this.stats.visualContentFound++
        this.stats.visualContentMigrated++
        console.log(`🎨 Migrated visual content: ${visual.id}`)
        
      } else if (this.isAIAnalysis(actualData)) {
        const analysis = actualData as AIAnalysisData & { documentId?: string }
        await unifiedStorage.storeAIAnalysis(analysis.documentId || 'unknown', analysis)
        this.stats.analysisFound++
        this.stats.analysisMigrated++
        console.log(`🧠 Migrated AI analysis: ${analysis.documentId}`)
        
      } else if (Array.isArray(actualData)) {
        // Handle arrays (likely visual content arrays)
        for (const item of actualData) {
          if (this.isVisualContent(item)) {
            await unifiedStorage.storeVisualContent([item as VisualContent])
            this.stats.visualContentFound++
            this.stats.visualContentMigrated++
          }
        }
        console.log(`📦 Migrated array with ${actualData.length} items`)
      }    } catch (error) {
      console.warn(`Failed to migrate ${key}:`, error)
      this.stats.errors.push(`Failed to migrate ${key}: ${error}`)
    }
  }

  private async migrateFileSystemItem(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(filePath, 'utf8')
      
      let data: unknown
      try {
        data = JSON.parse(content)
      } catch {
        return // Not valid JSON
      }
      
      const wrappedData = data as Record<string, unknown>
      const actualData = wrappedData['data'] || data
      this.stats.totalSize += content.length
      
      if (this.isDocument(actualData)) {
        await unifiedStorage.storeDocument(actualData as Document)
        this.stats.documentsFound++
        this.stats.documentsMigrated++
        
      } else if (this.isVisualContent(actualData)) {
        await unifiedStorage.storeVisualContent([actualData as VisualContent])
        this.stats.visualContentFound++
        this.stats.visualContentMigrated++
        
      } else if (this.isAIAnalysis(actualData)) {
        const analysis = actualData as AIAnalysisData & { documentId?: string }
        await unifiedStorage.storeAIAnalysis(analysis.documentId || 'unknown', analysis)
        this.stats.analysisFound++
        this.stats.analysisMigrated++
      }
      
      console.log(`📁 Migrated file: ${filePath}`)
      
    } catch (error) {
      console.warn(`Failed to migrate file ${filePath}:`, error)
      this.stats.errors.push(`Failed to migrate file ${filePath}: ${error}`)
    }
  }

  private isDocument(data: unknown): data is Document {
    const obj = data as Record<string, unknown>
    return Boolean(obj && 
           typeof obj.id === 'string' &&
           typeof obj.name === 'string' &&
           typeof obj.content === 'string' &&
           obj.uploadedAt !== undefined)
  }

  private isVisualContent(data: unknown): data is VisualContent {
    const obj = data as Record<string, unknown>
    return Boolean(obj &&
           typeof obj.id === 'string' &&
           typeof obj.documentId === 'string' &&
           typeof obj.type === 'string' &&
           obj.content !== undefined)
  }

  private isAIAnalysis(data: unknown): data is AIAnalysisData {
    const obj = data as Record<string, unknown>
    return Boolean(obj &&
           (obj.summary !== undefined ||
            obj.keywords !== undefined ||
            obj.topics !== undefined ||
            obj.entities !== undefined))
  }

  private async cleanupOldStorage(): Promise<void> {
    console.log('🧹 Cleaning up old storage keys...')
    
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && this.isLegacyKey(key)) {
        keysToRemove.push(key)
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
      console.log(`🗑️ Removed legacy key: ${key}`)
    }
    
    console.log(`✅ Cleaned up ${keysToRemove.length} legacy storage keys`)
  }

  private logMigrationStats(): void {
    console.log('\n📊 MIGRATION STATISTICS:')
    console.log(`📄 Documents: ${this.stats.documentsMigrated}/${this.stats.documentsFound}`)
    console.log(`🎨 Visual Content: ${this.stats.visualContentMigrated}/${this.stats.visualContentFound}`)
    console.log(`🧠 AI Analysis: ${this.stats.analysisMigrated}/${this.stats.analysisFound}`)
    console.log(`📦 Total Size: ${this.formatBytes(this.stats.totalSize)}`)
    console.log(`❌ Errors: ${this.stats.errors.length}`)
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ MIGRATION ERRORS:')
      this.stats.errors.forEach(error => console.log(`  - ${error}`))
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Public method to check what would be migrated (dry run)
  async getDryRunStats(): Promise<MigrationStats> {
    const dryRunStats: MigrationStats = {
      documentsFound: 0,
      documentsMigrated: 0,
      visualContentFound: 0,
      visualContentMigrated: 0,
      analysisFound: 0,
      analysisMigrated: 0,
      errors: [],
      totalSize: 0
    }

    // Scan localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && this.isLegacyKey(key)) {
        const rawData = localStorage.getItem(key)
        if (rawData) {
          dryRunStats.totalSize += rawData.length
          
          try {
            const data = JSON.parse(rawData)
            const actualData = data.data || data
            
            if (this.isDocument(actualData)) {
              dryRunStats.documentsFound++
            } else if (this.isVisualContent(actualData)) {
              dryRunStats.visualContentFound++
            } else if (this.isAIAnalysis(actualData)) {
              dryRunStats.analysisFound++
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    return dryRunStats
  }
}

// Export singleton and utility functions
export const storageMigration = new StorageMigration()

export async function runStorageMigration(): Promise<MigrationStats> {
  return await storageMigration.migrateAllSystems()
}

export async function previewMigration(): Promise<MigrationStats> {
  return await storageMigration.getDryRunStats()
}

// Auto-migration hook for development
export async function autoMigrateIfNeeded(): Promise<boolean> {
  try {
    const preview = await previewMigration()
    const totalItems = preview.documentsFound + preview.visualContentFound + preview.analysisFound
    
    if (totalItems > 0) {
      console.log(`🔍 Found ${totalItems} items to migrate. Running auto-migration...`)
      await runStorageMigration()
      return true
    }
    
    return false
  } catch (error) {
    console.error('Auto-migration failed:', error)
    return false
  }
}
