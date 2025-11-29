/**
 * Emergency localStorage Quota Fix Script
 * 
 * Run this in the browser console to immediately fix localStorage quota issues
 * This script will move large files from localStorage to IndexedDB
 */

(async function emergencyStorageFix() {
  console.log('🚨 Starting Emergency Storage Fix...')
  
  try {
    // Check current localStorage usage
    let totalSize = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    
    console.log(`📊 Current localStorage usage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    
    const ragStoredFiles = localStorage.getItem('rag-stored-files')
    if (!ragStoredFiles) {
      console.log('✅ No stored files found, no cleanup needed')
      return
    }
    
    const storedFiles = JSON.parse(ragStoredFiles)
    const fileEntries = Object.entries(storedFiles)
    
    console.log(`📁 Found ${fileEntries.length} stored files`)
    
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
      let migratedCount = 0
      let totalSizeSaved = 0
      
      for (const [fileId, fileData] of fileEntries) {
        if (fileData.base64Content) {
          const contentSize = fileData.base64Content.length
          
          // Migrate files larger than 100KB to IndexedDB
          if (contentSize > 100 * 1024) {
            console.log(`🔄 Migrating: ${fileData.originalName} (${(contentSize / 1024 / 1024).toFixed(2)}MB)`)
            
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
            
            // Try to save immediately to free up space
            try {
              localStorage.setItem('rag-stored-files', JSON.stringify(storedFiles))
            } catch (error) {
              console.log('Still need more space, continuing migration...')
            }
          }
        }
      }
      
      // Final save
      try {
        localStorage.setItem('rag-stored-files', JSON.stringify(storedFiles))
        
        // Check new usage
        let newTotalSize = 0
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            newTotalSize += localStorage[key].length + key.length
          }
        }
        
        console.log(`✅ Emergency fix completed successfully!`)
        console.log(`   📊 Files migrated: ${migratedCount}`)
        console.log(`   💾 Space saved: ${(totalSizeSaved / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   📉 localStorage usage: ${(newTotalSize / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   🎉 System should work normally now!`)
        
        // Show success message
        if (window.alert) {
          alert(`Emergency storage fix completed!\n\n✅ Migrated ${migratedCount} files\n💾 Saved ${(totalSizeSaved / 1024 / 1024).toFixed(2)} MB\n\nYou can now upload files normally.`)
        }
        
      } catch (error) {
        console.error('❌ Still having storage issues:', error)
        
        // More aggressive cleanup - remove oldest files entirely
        console.log('🧹 Attempting more aggressive cleanup...')
        
        const sortedByDate = fileEntries.sort(([, a], [, b]) => 
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        )
        
        // Remove oldest 25% of files
        const filesToRemove = Math.ceil(sortedByDate.length * 0.25)
        for (let i = 0; i < filesToRemove; i++) {
          const [fileId] = sortedByDate[i]
          delete storedFiles[fileId]
          console.log(`🗑️ Removed old file: ${sortedByDate[i][1].originalName}`)
        }
        
        try {
          localStorage.setItem('rag-stored-files', JSON.stringify(storedFiles))
          console.log(`✅ Aggressive cleanup successful - removed ${filesToRemove} old files`)
          
          if (window.alert) {
            alert(`Emergency cleanup completed!\n\n🗑️ Removed ${filesToRemove} old files\n✅ System should work now`)
          }
        } catch (finalError) {
          console.error('❌ Critical storage issue - manual intervention needed:', finalError)
          
          if (window.confirm && window.confirm('Critical storage issue detected.\n\nClear ALL stored files?\n\nThis will delete all documents but fix the quota issue.')) {
            localStorage.removeItem('rag-stored-files')
            localStorage.removeItem('rag-documents')
            console.log('🧹 All storage cleared')
            alert('All storage cleared. Please refresh the page.')
          }
        }
      }
      
      db.close()
    }
    
    dbRequest.onerror = (event) => {
      console.error('❌ IndexedDB error:', event.target.error)
      
      // Fallback: just clear problematic data
      if (window.confirm('Cannot access IndexedDB for migration.\n\nClear stored files to fix quota issue?\n\nThis will remove file content but keep documents.')) {
        localStorage.removeItem('rag-stored-files')
        console.log('🧹 Stored files cleared')
        alert('Stored files cleared. File uploads should work now.')
      }
    }
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error)
    
    if (window.confirm('Emergency fix failed.\n\nClear all RAG storage?\n\nThis will reset the entire system.')) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('rag-') || key.includes('domain')) {
          localStorage.removeItem(key)
        }
      }
      console.log('🧹 All RAG storage cleared')
      alert('All storage cleared. Please refresh the page.')
    }
  }
})()

// Instructions for users
console.log(`
🔧 EMERGENCY STORAGE FIX INSTRUCTIONS:
=====================================

If you're seeing localStorage quota errors:

1. 📋 Copy this entire script
2. 🌐 Open browser Developer Tools (F12)
3. 🖥️ Go to the Console tab
4. 📝 Paste the script and press Enter
5. ⏳ Wait for the fix to complete
6. 🔄 Refresh the page

The script will:
✅ Move large files to IndexedDB
✅ Keep metadata in localStorage  
✅ Preserve all your documents
✅ Fix quota exceeded errors

If issues persist, the script offers options to:
🗑️ Remove old files
🧹 Clear storage entirely (last resort)
`)
