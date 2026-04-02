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
      
      const keys = ['miele-rag-documents', 'miele-rag-chunks', 'miele-rag-visual-content'];
      let totalSize = 0;
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              if (key === 'miele-rag-documents') {
                const ready = parsed.filter((doc: DocumentItem) => doc.status === 'ready').length;
                parsed.forEach((doc: DocumentItem, i: number) => {
                });
              }
            }
          } catch (e) {
            const error = e as Error;
          }
        } else {
        }
      });
      
    },
    
    clearStorage() {
      
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
        }
      });
      
    },
    
    refreshCount() {
      
      // Dispatch event to trigger UI refresh
      window.dispatchEvent(new CustomEvent('rag-storage-cleared'));
      
      // Also check current count
      const docs = localStorage.getItem('miele-rag-documents');
      if (docs) {
        try {
          const parsed: DocumentItem[] = JSON.parse(docs);
          const ready = parsed.filter((doc: DocumentItem) => doc.status === 'ready').length;
        } catch (e) {
          const error = e as Error;
        }
      } else {
      }
    },
    
    fullDiagnostic() {
      
      // 1. Check storage
      this.checkStorage();
      
      
      // 2. Check for common issues
      
      const docs = localStorage.getItem('miele-rag-documents');
      if (docs) {
        try {
          const parsed: DocumentItem[] = JSON.parse(docs);
          const duplicates = parsed.filter((doc: DocumentItem, index: number, arr: DocumentItem[]) => 
            arr.findIndex((d: DocumentItem) => d.name === doc.name) !== index
          );
          
          if (duplicates.length > 0) {
          } else {
          }
          
          const orphaned = parsed.filter((doc: DocumentItem) => !doc.chunks || doc.chunks.length === 0);
          if (orphaned.length > 0) {
          } else {
          }
          
        } catch (e) {
          const error = e as Error;
        }
      }
      
    }
  } as RagDebugTools;
  
}

export { }; // Make this a module
