/**
 * Auto-migration script for file storage systems
 * This script automatically runs when the app starts to migrate files
 */

import { unifiedFileStorage, UnifiedStoredFile } from '../managers/unified-file-storage'

export class StorageMigration {
  private static readonly MIGRATION_KEY = 'rag_storage_migration_v1'
  private static migrationInProgress = false

  /**
   * Check if migration is needed and run it
   */
  static async autoMigrate(): Promise<void> {
    // Check if migration already completed
    if (localStorage.getItem(this.MIGRATION_KEY) === 'completed') {
      return
    }

    // Prevent multiple concurrent migrations
    if (this.migrationInProgress) {
      return
    }

    try {
      this.migrationInProgress = true
      console.log('🔄 Starting automatic file storage migration...')

      // Run the migration
      await unifiedFileStorage.migrateOldToNew()
      
      // Clean up duplicates
      await unifiedFileStorage.cleanupDuplicates()

      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_KEY, 'completed')
      
      console.log('✅ File storage migration completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      // Don't mark as completed so it will retry next time
    } finally {
      this.migrationInProgress = false
    }
  }

  /**
   * Force re-run migration (for debugging)
   */
  static async forceMigration(): Promise<void> {
    localStorage.removeItem(this.MIGRATION_KEY)
    this.migrationInProgress = false
    await this.autoMigrate()
  }

  /**
   * Check migration status
   */
  static getMigrationStatus(): {
    completed: boolean
    oldSystemFiles: number
    newSystemFiles: number
    totalFiles: number
  } {
    const completed = localStorage.getItem(this.MIGRATION_KEY) === 'completed'
    const allFiles = unifiedFileStorage.getAllStoredFiles()
    const oldSystemFiles = allFiles.filter((f: any) => f.id.startsWith('old_')).length
    const newSystemFiles = allFiles.filter((f: any) => f.id.startsWith('file_')).length
    
    return {
      completed,
      oldSystemFiles,
      newSystemFiles,
      totalFiles: allFiles.length
    }
  }
}

// Auto-run migration when this module is imported
if (typeof window !== 'undefined') {
  // Wait for the app to be ready before migrating
  setTimeout(() => {
    StorageMigration.autoMigrate().catch(console.error)
  }, 1000)
}
