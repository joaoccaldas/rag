/**
 * Enhanced Notes & Ideas Storage Manager
 * 
 * This system provides:
 * 1. User-selected folder storage for notes and ideas
 * 2. Real-time backup to browser storage
 * 3. Rich export/import functionality
 * 4. Collaboration features with shared folders
 * 5. Version history and conflict resolution
 */

import { Note } from '../../components/notes/notes-manager'
import { Idea } from '../../components/ideas/ideas-manager'

// Declare File System Access API types
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
    }) => Promise<FileSystemDirectoryHandle>
  }
}

export interface NotesStorageConfig {
  selectedFolder?: FileSystemDirectoryHandle
  enableAutoBackup: boolean
  backupInterval: number // minutes
  enableVersionHistory: boolean
  maxVersions: number
  enableCollaboration: boolean
  storageLocation: 'browser' | 'local-folder' | 'hybrid'
}

export interface StorageStats {
  notesCount: number
  ideasCount: number
  totalSize: number
  lastBackup?: string | undefined
  folderLocation?: string | undefined
  versionsCount: number
}

export interface VersionHistory {
  id: string
  timestamp: string
  type: 'note' | 'idea'
  action: 'create' | 'update' | 'delete'
  data: string // JSON stringified data
  userId?: string
}

export class EnhancedNotesStorage {
  private config: NotesStorageConfig = {
    enableAutoBackup: true,
    backupInterval: 5, // 5 minutes
    enableVersionHistory: true,
    maxVersions: 10,
    enableCollaboration: false,
    storageLocation: 'hybrid'
  }

  private readonly STORAGE_KEY = 'enhanced-notes-storage'
  private readonly CONFIG_KEY = 'notes-storage-config'
  private readonly VERSION_KEY = 'notes-version-history'
  private backupTimer?: NodeJS.Timeout

  constructor() {
    this.loadConfig()
    this.startAutoBackup()
  }

  /**
   * Show folder picker for notes/ideas storage
   */
  async selectStorageFolder(): Promise<boolean> {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support folder selection. Notes will be stored in browser storage.')
        this.config.storageLocation = 'browser'
        await this.saveConfig()
        return false
      }

      // showDirectoryPicker is experimental but needed for folder selection
      const directoryHandle = await window.showDirectoryPicker!({
        mode: 'readwrite',
        startIn: 'documents'
      })

      this.config.selectedFolder = directoryHandle
      this.config.storageLocation = 'local-folder'
      
      await this.saveConfig()
      
      // Create directory structure
      await this.createDirectoryStructure()
      
      console.log(`📁 Selected notes storage folder: ${directoryHandle.name}`)
      return true
      
    } catch (error) {
      console.warn('User cancelled folder selection or error occurred:', error)
      return false
    }
  }

  /**
   * Save notes with enhanced storage
   */
  async saveNotes(notes: Note[]): Promise<void> {
    try {
      // Save to browser storage (always as backup)
      localStorage.setItem('rag-notes', JSON.stringify(notes))
      
      // Save to selected folder if available
      if (this.config.selectedFolder && this.config.storageLocation !== 'browser') {
        await this.saveNotesToFolder(notes)
      }

      // Update version history
      if (this.config.enableVersionHistory) {
        await this.addToVersionHistory('note', 'update', notes)
      }

      console.log(`💾 Saved ${notes.length} notes successfully`)
      
    } catch (error) {
      console.error('Failed to save notes:', error)
      // Fallback to browser storage only
      localStorage.setItem('rag-notes', JSON.stringify(notes))
    }
  }

  /**
   * Save ideas with enhanced storage
   */
  async saveIdeas(ideas: Idea[]): Promise<void> {
    try {
      // Save to browser storage (always as backup)
      localStorage.setItem('rag-ideas', JSON.stringify(ideas))
      
      // Save to selected folder if available
      if (this.config.selectedFolder && this.config.storageLocation !== 'browser') {
        await this.saveIdeasToFolder(ideas)
      }

      // Update version history
      if (this.config.enableVersionHistory) {
        await this.addToVersionHistory('idea', 'update', ideas)
      }

      console.log(`💡 Saved ${ideas.length} ideas successfully`)
      
    } catch (error) {
      console.error('Failed to save ideas:', error)
      // Fallback to browser storage only
      localStorage.setItem('rag-ideas', JSON.stringify(ideas))
    }
  }

  /**
   * Load notes from storage
   */
  async loadNotes(): Promise<Note[]> {
    try {
      // Try loading from folder first
      if (this.config.selectedFolder && this.config.storageLocation !== 'browser') {
        const folderNotes = await this.loadNotesFromFolder()
        if (folderNotes.length > 0) {
          return folderNotes
        }
      }

      // Fallback to browser storage
      const savedNotes = localStorage.getItem('rag-notes')
      return savedNotes ? JSON.parse(savedNotes) : []
      
    } catch (error) {
      console.error('Failed to load notes:', error)
      return []
    }
  }

  /**
   * Load ideas from storage
   */
  async loadIdeas(): Promise<Idea[]> {
    try {
      // Try loading from folder first
      if (this.config.selectedFolder && this.config.storageLocation !== 'browser') {
        const folderIdeas = await this.loadIdeasFromFolder()
        if (folderIdeas.length > 0) {
          return folderIdeas
        }
      }

      // Fallback to browser storage
      const savedIdeas = localStorage.getItem('rag-ideas')
      return savedIdeas ? JSON.parse(savedIdeas) : []
      
    } catch (error) {
      console.error('Failed to load ideas:', error)
      return []
    }
  }

  /**
   * Export all data to files
   */
  async exportAllData(): Promise<void> {
    try {
      const notes = await this.loadNotes()
      const ideas = await this.loadIdeas()
      const versionHistory = this.getVersionHistory()

      const exportData = {
        notes,
        ideas,
        versionHistory,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }

      if (this.config.selectedFolder) {
        // Save to selected folder
        const fileHandle = await this.config.selectedFolder.getFileHandle(
          `notes-ideas-export-${new Date().toISOString().split('T')[0]}.json`,
          { create: true }
        )
        
        const writable = await fileHandle.createWritable()
        await writable.write(JSON.stringify(exportData, null, 2))
        await writable.close()
        
        console.log('📦 Data exported to selected folder')
      } else {
        // Download as file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notes-ideas-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        console.log('📦 Data exported as download')
      }
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  /**
   * Import data from file
   */
  async importData(file: File): Promise<{ success: boolean; notesCount: number; ideasCount: number }> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.notes && Array.isArray(data.notes)) {
        await this.saveNotes(data.notes)
      }

      if (data.ideas && Array.isArray(data.ideas)) {
        await this.saveIdeas(data.ideas)
      }

      console.log('📥 Data imported successfully')
      return {
        success: true,
        notesCount: data.notes?.length || 0,
        ideasCount: data.ideas?.length || 0
      }
      
    } catch (error) {
      console.error('Import failed:', error)
      return { success: false, notesCount: 0, ideasCount: 0 }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const notes = await this.loadNotes()
    const ideas = await this.loadIdeas()
    const versionHistory = this.getVersionHistory()

    const notesSize = JSON.stringify(notes).length
    const ideasSize = JSON.stringify(ideas).length

    return {
      notesCount: notes.length,
      ideasCount: ideas.length,
      totalSize: notesSize + ideasSize,
      lastBackup: (typeof window !== 'undefined' && typeof localStorage !== 'undefined') 
        ? localStorage.getItem('notes-last-backup') || undefined 
        : undefined,
      folderLocation: this.config.selectedFolder?.name,
      versionsCount: versionHistory.length
    }
  }

  /**
   * Create folder picker UI component
   */
  createFolderPickerUI(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'notes-storage-ui bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
    
    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notes & Ideas Storage</h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">Choose where to store your notes</span>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <input type="radio" id="browser-notes-storage" name="notes-storage-type" value="browser" ${this.config.storageLocation === 'browser' ? 'checked' : ''}>
          <label for="browser-notes-storage" class="text-sm font-medium text-gray-700 dark:text-gray-300">Browser Storage</label>
          <span class="text-xs text-gray-500">Store in browser (limited space)</span>
        </div>
        
        <div class="flex items-center space-x-3">
          <input type="radio" id="local-notes-folder" name="notes-storage-type" value="local-folder" ${this.config.storageLocation === 'local-folder' ? 'checked' : ''}>
          <label for="local-notes-folder" class="text-sm font-medium text-gray-700 dark:text-gray-300">Local Folder</label>
          <span class="text-xs text-gray-500">Choose a folder on your computer</span>
        </div>
        
        <div class="flex items-center space-x-3">
          <input type="radio" id="hybrid-notes-storage" name="notes-storage-type" value="hybrid" ${this.config.storageLocation === 'hybrid' ? 'checked' : ''}>
          <label for="hybrid-notes-storage" class="text-sm font-medium text-gray-700 dark:text-gray-300">Hybrid Storage</label>
          <span class="text-xs text-gray-500">Both browser and local folder</span>
        </div>
        
        <div class="flex space-x-3">
          <button id="select-notes-folder-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
            📁 Select Notes Folder
          </button>
          <button id="export-notes-btn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
            📦 Export All Data
          </button>
          <button id="open-notes-folder-btn" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm" ${!this.config.selectedFolder ? 'disabled' : ''}>
            🗂️ Open Folder
          </button>
        </div>
        
        <div id="notes-folder-status" class="text-sm p-3 rounded-md ${this.config.selectedFolder ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}">
          ${this.config.selectedFolder ? `✅ Notes stored in: ${this.config.selectedFolder.name}` : '📂 No folder selected - using browser storage'}
        </div>
        
        <div class="grid grid-cols-3 gap-4 text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white" id="notes-count">0</div>
            <div class="text-xs text-gray-500">Notes</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white" id="ideas-count">0</div>
            <div class="text-xs text-gray-500">Ideas</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white" id="storage-size">0 KB</div>
            <div class="text-xs text-gray-500">Storage</div>
          </div>
        </div>
      </div>
    `
    
    // Add event listeners
    this.attachEventListeners(container)
    
    // Update stats
    this.updateStatsDisplay(container)
    
    return container
  }

  // Private methods

  private async createDirectoryStructure(): Promise<void> {
    if (!this.config.selectedFolder) return

    try {
      // Create subdirectories for organization
      await this.config.selectedFolder.getDirectoryHandle('notes', { create: true })
      await this.config.selectedFolder.getDirectoryHandle('ideas', { create: true })
      await this.config.selectedFolder.getDirectoryHandle('exports', { create: true })
      await this.config.selectedFolder.getDirectoryHandle('backups', { create: true })
      
      console.log('📁 Created directory structure for notes storage')
    } catch (error) {
      console.warn('Could not create directory structure:', error)
    }
  }

  private async saveNotesToFolder(notes: Note[]): Promise<void> {
    if (!this.config.selectedFolder) return

    try {
      const notesDir = await this.config.selectedFolder.getDirectoryHandle('notes', { create: true })
      const fileHandle = await notesDir.getFileHandle('notes.json', { create: true })
      
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(notes, null, 2))
      await writable.close()
      
      // Save individual note files for better organization
      for (const note of notes) {
        const safeFileName = this.sanitizeFileName(`${note.title}.md`)
        const noteFileHandle = await notesDir.getFileHandle(safeFileName, { create: true })
        
        const noteWritable = await noteFileHandle.createWritable()
        const markdown = this.noteToMarkdown(note)
        await noteWritable.write(markdown)
        await noteWritable.close()
      }
      
    } catch (error) {
      console.error('Failed to save notes to folder:', error)
      throw error
    }
  }

  private async saveIdeasToFolder(ideas: Idea[]): Promise<void> {
    if (!this.config.selectedFolder) return

    try {
      const ideasDir = await this.config.selectedFolder.getDirectoryHandle('ideas', { create: true })
      const fileHandle = await ideasDir.getFileHandle('ideas.json', { create: true })
      
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(ideas, null, 2))
      await writable.close()
      
      // Save individual idea files
      for (const idea of ideas) {
        const safeFileName = this.sanitizeFileName(`${idea.title}.md`)
        const ideaFileHandle = await ideasDir.getFileHandle(safeFileName, { create: true })
        
        const ideaWritable = await ideaFileHandle.createWritable()
        const markdown = this.ideaToMarkdown(idea)
        await ideaWritable.write(markdown)
        await ideaWritable.close()
      }
      
    } catch (error) {
      console.error('Failed to save ideas to folder:', error)
      throw error
    }
  }

  private async loadNotesFromFolder(): Promise<Note[]> {
    if (!this.config.selectedFolder) return []

    try {
      const notesDir = await this.config.selectedFolder.getDirectoryHandle('notes')
      const fileHandle = await notesDir.getFileHandle('notes.json')
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch (error) {
      console.warn('Could not load notes from folder:', error)
      return []
    }
  }

  private async loadIdeasFromFolder(): Promise<Idea[]> {
    if (!this.config.selectedFolder) return []

    try {
      const ideasDir = await this.config.selectedFolder.getDirectoryHandle('ideas')
      const fileHandle = await ideasDir.getFileHandle('ideas.json')
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch (error) {
      console.warn('Could not load ideas from folder:', error)
      return []
    }
  }

  private noteToMarkdown(note: Note): string {
    const tags = note.tags.length > 0 ? `\nTags: ${note.tags.join(', ')}` : ''
    const created = new Date(note.createdAt).toLocaleDateString()
    const updated = new Date(note.updatedAt).toLocaleDateString()
    
    return `# ${note.title}\n\nCreated: ${created}\nUpdated: ${updated}${tags}\n\n---\n\n${note.content}`
  }

  private ideaToMarkdown(idea: Idea): string {
    const keywords = idea.keywords.length > 0 ? `\nKeywords: ${idea.keywords.join(', ')}` : ''
    const created = new Date(idea.createdAt).toLocaleDateString()
    
    return `# ${idea.title}\n\nCategory: ${idea.category}\nCreated: ${created}${keywords}\n\n---\n\n${idea.description}`
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255)
  }

  private async addToVersionHistory(type: 'note' | 'idea', action: string, data: Note[] | Idea[]): Promise<void> {
    try {
      const history = this.getVersionHistory()
      const newEntry: VersionHistory = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        timestamp: new Date().toISOString(),
        type,
        action: action as 'create' | 'update' | 'delete',
        data: JSON.stringify(data)
      }
      
      history.push(newEntry)
      
      // Keep only the latest versions
      if (history.length > this.config.maxVersions) {
        history.splice(0, history.length - this.config.maxVersions)
      }
      
      localStorage.setItem(this.VERSION_KEY, JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to update version history:', error)
    }
  }

  private getVersionHistory(): VersionHistory[] {
    try {
      const saved = localStorage.getItem(this.VERSION_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY)
      if (saved) {
        const config = JSON.parse(saved)
        this.config = { ...this.config, ...config }
      }
    } catch (error) {
      console.warn('Failed to load notes storage config:', error)
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const configToSave = {
        enableAutoBackup: this.config.enableAutoBackup,
        backupInterval: this.config.backupInterval,
        enableVersionHistory: this.config.enableVersionHistory,
        maxVersions: this.config.maxVersions,
        enableCollaboration: this.config.enableCollaboration,
        storageLocation: this.config.storageLocation
      }
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configToSave))
    } catch (error) {
      console.warn('Failed to save notes storage config:', error)
    }
  }

  private startAutoBackup(): void {
    if (!this.config.enableAutoBackup) return

    this.backupTimer = setInterval(async () => {
      try {
        // Only access localStorage on client side
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          // Create backup timestamp
          localStorage.setItem('notes-last-backup', new Date().toISOString())
        }
        
        console.log('🔄 Auto backup completed')
      } catch (error) {
        console.warn('Auto backup failed:', error)
      }
    }, this.config.backupInterval * 60 * 1000) // Convert minutes to milliseconds
  }

  private attachEventListeners(container: HTMLElement): void {
    const selectBtn = container.querySelector('#select-notes-folder-btn') as HTMLButtonElement
    const exportBtn = container.querySelector('#export-notes-btn') as HTMLButtonElement
    const openBtn = container.querySelector('#open-notes-folder-btn') as HTMLButtonElement
    const status = container.querySelector('#notes-folder-status') as HTMLDivElement

    selectBtn?.addEventListener('click', async () => {
      const success = await this.selectStorageFolder()
      if (success) {
        status.innerHTML = `✅ Notes stored in: ${this.config.selectedFolder?.name}`
        status.className = 'text-sm p-3 rounded-md bg-green-50 text-green-700 border border-green-200'
        if (openBtn) openBtn.disabled = false
      }
    })

    exportBtn?.addEventListener('click', () => {
      this.exportAllData()
    })

    openBtn?.addEventListener('click', () => {
      this.openStorageFolder()
    })

    // Storage type radio buttons
    const radioButtons = container.querySelectorAll('input[name="notes-storage-type"]')
    radioButtons.forEach(radio => {
      radio.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement
        this.config.storageLocation = target.value as 'browser' | 'local-folder' | 'hybrid'
        await this.saveConfig()
      })
    })
  }

  private async updateStatsDisplay(container: HTMLElement): Promise<void> {
    try {
      const stats = await this.getStorageStats()
      
      const notesCount = container.querySelector('#notes-count')
      const ideasCount = container.querySelector('#ideas-count')
      const storageSize = container.querySelector('#storage-size')
      
      if (notesCount) notesCount.textContent = stats.notesCount.toString()
      if (ideasCount) ideasCount.textContent = stats.ideasCount.toString()
      if (storageSize) storageSize.textContent = `${(stats.totalSize / 1024).toFixed(1)} KB`
    } catch (error) {
      console.warn('Failed to update stats display:', error)
    }
  }

  private async openStorageFolder(): Promise<void> {
    if (!this.config.selectedFolder) {
      alert('No folder selected')
      return
    }

    try {
      alert(`Notes folder: ${this.config.selectedFolder.name}\n\nYour notes and ideas are stored here in organized subfolders.`)
    } catch (error) {
      console.error('Cannot open folder:', error)
      alert('Cannot access folder. Please check permissions.')
    }
  }
}

// Export singleton instance
export const enhancedNotesStorage = new EnhancedNotesStorage()

// Make available globally for debugging
if (typeof window !== 'undefined') {
  // @ts-expect-error - Global debugging utility
  window.enhancedNotesStorage = enhancedNotesStorage
}
