/**
 * Browser Console Helper Script for RAG Storage Management
 * 
 * Run these commands in your browser's developer console to debug and fix storage issues:
 * 
 * 1. Check current storage state:
 *    window.ragDebug.checkStorage()
 * 
 * 2. Clear all RAG storage (fixes document count mismatch):
 *    window.ragDebug.clearStorage()
 * 
 * 3. Refresh document count:
 *    window.ragDebug.refreshCount()
 * 
 * 4. Full diagnostic:
 *    window.ragDebug.fullDiagnostic()
 */

interface DocumentItem {
  name: string
  status: string
  chunks?: unknown[]
}

interface RagDebugTools {
  checkStorage: () => void
  clearStorage: () => void
  refreshCount: () => void
  fullDiagnostic: () => void
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
  (window as Window & { ragDebug?: RagDebugTools }).ragDebug = {
    checkStorage() {
      console.log('🔍 RAG Storage Check');
      console.log('===================');
      
      const keys = ['miele-rag-documents', 'miele-rag-chunks', 'miele-rag-visual-content'];
      let totalSize = 0;
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          
          try {
            const parsed = JSON.parse(value);
            console.log(`📁 ${key}:`);
            console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);
            if (Array.isArray(parsed)) {
              console.log(`   Items: ${parsed.length}`);
              if (key === 'miele-rag-documents') {
                const ready = parsed.filter((doc: DocumentItem) => doc.status === 'ready').length;
                console.log(`   Ready documents: ${ready}`);
                parsed.forEach((doc: DocumentItem, i: number) => {
                  console.log(`     ${i + 1}. "${doc.name}" (${doc.status})`);
                });
              }
            }
          } catch (e) {
            const error = e as Error;
            console.log(`   Error parsing: ${error.message}`);
          }
        } else {
          console.log(`📁 ${key}: Not found`);
        }
      });
      
      console.log(`💾 Total storage: ${(totalSize / 1024).toFixed(1)} KB`);
    },
    
    clearStorage() {
      console.log('🧹 Clearing RAG Storage...');
      
      const keys = [
        'miele-rag-documents',
        'miele-rag-chunks', 
        'miele-rag-embeddings',
        'miele-rag-visual-content',
        'miele-rag-metadata',
        'miele-storage-manager-initialized'
      ];
      
      let cleared = 0;
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleared++;
          console.log(`✅ Cleared ${key}`);
        }
      });
      
      console.log(`✅ Cleared ${cleared} storage items`);
      console.log('🔄 Please refresh the page to see updated document count');
    },
    
    refreshCount() {
      console.log('🔄 Refreshing document count...');
      
      // Dispatch event to trigger UI refresh
      window.dispatchEvent(new CustomEvent('rag-storage-cleared'));
      
      // Also check current count
      const docs = localStorage.getItem('miele-rag-documents');
      if (docs) {
        try {
          const parsed: DocumentItem[] = JSON.parse(docs);
          const ready = parsed.filter((doc: DocumentItem) => doc.status === 'ready').length;
          console.log(`📊 Current count: ${ready} ready documents (${parsed.length} total)`);
        } catch (e) {
          const error = e as Error;
          console.log('❌ Error checking count:', error.message);
        }
      } else {
        console.log('📊 No documents in storage');
      }
    },
    
    fullDiagnostic() {
      console.log('🔍 FULL RAG DIAGNOSTIC');
      console.log('======================');
      
      // 1. Check storage
      this.checkStorage();
      
      console.log('\n🌐 Browser Environment:');
      console.log(`   User Agent: ${navigator.userAgent}`);
      console.log(`   Storage available: ${typeof localStorage !== 'undefined'}`);
      
      // 2. Check for common issues
      console.log('\n⚠️ Common Issues Check:');
      
      const docs = localStorage.getItem('miele-rag-documents');
      if (docs) {
        try {
          const parsed: DocumentItem[] = JSON.parse(docs);
          const duplicates = parsed.filter((doc: DocumentItem, index: number, arr: DocumentItem[]) => 
            arr.findIndex((d: DocumentItem) => d.name === doc.name) !== index
          );
          
          if (duplicates.length > 0) {
            console.log(`❌ Found ${duplicates.length} duplicate documents`);
          } else {
            console.log('✅ No duplicate documents found');
          }
          
          const orphaned = parsed.filter((doc: DocumentItem) => !doc.chunks || doc.chunks.length === 0);
          if (orphaned.length > 0) {
            console.log(`⚠️ Found ${orphaned.length} documents without chunks`);
          } else {
            console.log('✅ All documents have chunks');
          }
          
        } catch (e) {
          const error = e as Error;
          console.log(`❌ Error parsing documents: ${error.message}`);
        }
      }
      
      console.log('\n💡 Recommended Actions:');
      console.log('   - If count is wrong: window.ragDebug.clearStorage()');
      console.log('   - If app is slow: Clear browser cache');
      console.log('   - If upload fails: Check file size and type');
    }
  } as RagDebugTools;
  
  console.log('✅ RAG Debug tools loaded! Type window.ragDebug.fullDiagnostic() to start');
}

export { }; // Make this a module
