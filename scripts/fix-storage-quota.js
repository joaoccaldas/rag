/**
 * Script to fix localStorage quota issues by migrating large files to IndexedDB
 */

console.log('🔧 Starting localStorage quota fix...')

// Check current localStorage usage
const getCurrentUsage = () => {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return total
}

// Move large files from localStorage to IndexedDB
const migrateLargeFiles = async () => {
  try {
    const ragStoredFiles = localStorage.getItem('rag-stored-files')
    if (!ragStoredFiles) {
      console.log('No stored files found')
      return
    }

    const storedFiles = JSON.parse(ragStoredFiles)
    const fileEntries = Object.entries(storedFiles)
    
    console.log(`Found ${fileEntries.length} stored files`)
    
    let migratedCount = 0
    let totalSizeSaved = 0
    
    // Open IndexedDB
    const dbRequest = indexedDB.open('rag-file-storage', 1)
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' })
      }
    }
    
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result
      
      for (const [fileId, fileData] of fileEntries) {
        if (fileData.base64Content) {
          const contentSize = fileData.base64Content.length
          
          // Migrate files larger than 500KB to IndexedDB
          if (contentSize > 500 * 1024) {
            console.log(`Migrating large file: ${fileData.originalName} (${(contentSize / 1024 / 1024).toFixed(2)}MB)`)
            
            // Store in IndexedDB
            const transaction = db.transaction(['files'], 'readwrite')
            const store = transaction.objectStore('files')
            
            await new Promise((resolve, reject) => {
              const request = store.put({ 
                id: fileId, 
                content: fileData.base64Content 
              })
              request.onsuccess = () => resolve()
              request.onerror = () => reject(request.error)
            })
            
            // Remove base64Content from localStorage entry
            const updatedFileData = { ...fileData }
            delete updatedFileData.base64Content
            storedFiles[fileId] = updatedFileData
            
            migratedCount++
            totalSizeSaved += contentSize
          }
        }
      }
      
      // Update localStorage with cleaned data
      localStorage.setItem('rag-stored-files', JSON.stringify(storedFiles))
      
      console.log(`✅ Migration complete:`)
      console.log(`   - Migrated ${migratedCount} files to IndexedDB`)
      console.log(`   - Saved ${(totalSizeSaved / 1024 / 1024).toFixed(2)}MB in localStorage`)
      console.log(`   - New localStorage usage: ${(getCurrentUsage() / 1024 / 1024).toFixed(2)}MB`)
      
      db.close()
    }
    
    dbRequest.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Check current usage and migrate if needed
const currentUsage = getCurrentUsage()
console.log(`Current localStorage usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB`)

if (currentUsage > 3 * 1024 * 1024) { // > 3MB
  console.log('🚨 localStorage usage is high, starting migration...')
  migrateLargeFiles()
} else {
  console.log('✅ localStorage usage is within acceptable limits')
}
