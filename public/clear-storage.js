/**
 * BROWSER STORAGE CLEANER
 * 
 * Script to be run in browser console to clear cached visual content
 * Run this when visual content page shows stale data after database reset
 */

(function clearVisualContentStorage() {
  console.log('🧹 Starting visual content storage cleanup...');
  
  let totalCleared = 0;
  
  // 1. Clear localStorage
  const localStorageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && shouldRemoveKey(key)) {
      localStorageKeys.push(key);
    }
  }
  
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed localStorage: ${key}`);
  });
  totalCleared += localStorageKeys.length;
  
  // 2. Clear sessionStorage
  const sessionStorageKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && shouldRemoveKey(key)) {
      sessionStorageKeys.push(key);
    }
  }
  
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ Removed sessionStorage: ${key}`);
  });
  totalCleared += sessionStorageKeys.length;
  
  // 3. Clear IndexedDB databases
  clearIndexedDBs();
  
  // 4. Clear caches
  clearServiceWorkerCaches();
  
  // 5. Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('visualContentCleared', {
    detail: { 
      keysCleared: totalCleared,
      timestamp: new Date().toISOString()
    }
  }));
  
  console.log(`✅ Cleared ${totalCleared} storage keys`);
  console.log('🔄 Refreshing page in 2 seconds...');
  
  // Auto-refresh to ensure clean state
  setTimeout(() => {
    window.location.reload();
  }, 2000);
  
  function shouldRemoveKey(key) {
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
      'ai_',
      'upload_',
      'processing_'
    ];
    
    return patterns.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  function clearIndexedDBs() {
    const dbNames = [
      'rag_unified_storage',
      'miele_rag_storage', 
      'visual_content_db',
      'document_storage',
      'ai_analysis_db'
    ];
    
    dbNames.forEach(dbName => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        console.log(`✅ Cleared IndexedDB: ${dbName}`);
      };
      
      deleteRequest.onerror = () => {
        console.warn(`⚠️ Failed to clear IndexedDB: ${dbName}`);
      };
      
      deleteRequest.onblocked = () => {
        console.warn(`🔒 IndexedDB deletion blocked: ${dbName}`);
      };
    });
  }
  
  function clearServiceWorkerCaches() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const ragCaches = cacheNames.filter(name => 
          name.includes('rag') || 
          name.includes('miele') || 
          name.includes('visual') ||
          name.includes('api')
        );
        
        ragCaches.forEach(cacheName => {
          caches.delete(cacheName).then(() => {
            console.log(`✅ Cleared cache: ${cacheName}`);
          });
        });
      });
    }
  }
})();

// Also provide manual functions for targeted clearing
window.clearVisualStorage = function() {
  console.log('🎨 Clearing visual content storage only...');
  
  const visualKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('visual') || 
      key.includes('chart') || 
      key.includes('image') ||
      key.includes('thumbnail')
    )) {
      visualKeys.push(key);
    }
  }
  
  visualKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed visual key: ${key}`);
  });
  
  console.log(`✅ Cleared ${visualKeys.length} visual storage keys`);
  window.location.reload();
};

window.clearDocumentStorage = function() {
  console.log('📄 Clearing document storage only...');
  
  const docKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('document') || 
      key.includes('upload') || 
      key.includes('file')
    )) {
      docKeys.push(key);
    }
  }
  
  docKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed document key: ${key}`);
  });
  
  console.log(`✅ Cleared ${docKeys.length} document storage keys`);
  window.location.reload();
};

window.checkStorageStatus = function() {
  console.log('📊 Storage Status Check:');
  console.log('==========================================');
  
  // localStorage check
  let ragKeysCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('rag') || 
      key.includes('miele') || 
      key.includes('visual') || 
      key.includes('document')
    )) {
      ragKeysCount++;
      console.log(`📦 localStorage: ${key}`);
    }
  }
  
  console.log(`Total RAG-related localStorage keys: ${ragKeysCount}`);
  console.log(`Total localStorage keys: ${localStorage.length}`);
  
  // sessionStorage check
  let sessionRagKeys = 0;
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('rag') || 
      key.includes('miele') || 
      key.includes('visual') || 
      key.includes('document')
    )) {
      sessionRagKeys++;
      console.log(`📦 sessionStorage: ${key}`);
    }
  }
  
  console.log(`Total RAG-related sessionStorage keys: ${sessionRagKeys}`);
  console.log('==========================================');
  
  return {
    localStorage: ragKeysCount,
    sessionStorage: sessionRagKeys,
    total: ragKeysCount + sessionRagKeys
  };
};

console.log('🔧 Storage cleaning utilities loaded!');
console.log('📝 Available commands:');
console.log('- clearVisualStorage() - Clear only visual content');
console.log('- clearDocumentStorage() - Clear only document data');
console.log('- checkStorageStatus() - Check what\'s in storage');
console.log('');
console.log('💡 The cleanup script has already run automatically.');
console.log('   If you still see cached data, try: clearVisualStorage()');
