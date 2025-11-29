"use client"

import { useState } from 'react'
import { Trash2, RefreshCw, AlertTriangle, Database, HardDrive } from 'lucide-react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { clearAllVisualContent } from '@/rag/utils/visual-content-storage'
import { Button } from '@/design-system/components'

interface DatabaseManagerProps {
  onActionComplete?: (message: string) => void
}

export function DatabaseManager({ onActionComplete }: DatabaseManagerProps) {
  const { documents, deleteDocument, refreshDocuments } = useRAG()
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)

  const handleCompleteWipeout = async () => {
    setIsLoading(prev => ({ ...prev, wipe: true }))
    try {
      // 1. Delete all documents from RAG context
      const deletePromises = documents.map(doc => deleteDocument(doc.id))
      await Promise.all(deletePromises)
      
      // 2. Clear all localStorage data
      const keysToRemove = [
        'rag_documents',
        'rag_vector_storage', 
        'rag_embeddings',
        'visual_content_storage',
        'rag_visual_content',
        'semantic_keywords',
        'rag_processing_stats',
        'rag_search_history',
        'rag_analytics_data'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // 3. Clear all IndexedDB databases
      if (typeof window !== 'undefined') {
        const dbsToDelete = [
          'rag_vector_store',
          'rag_visual_content', 
          'rag_documents_db',
          'rag_analytics_db'
        ]
        
        for (const dbName of dbsToDelete) {
          const deleteDB = indexedDB.deleteDatabase(dbName)
          deleteDB.onsuccess = () => console.log(`${dbName} database cleared`)
          deleteDB.onerror = () => console.error(`Failed to clear ${dbName} database`)
        }
      }
      
      // 4. Clear visual content using the dedicated function
      await clearAllVisualContent()
      
      // 5. Refresh documents context
      await refreshDocuments()
      
      const message = '✅ Complete database wipeout successful! All documents, embeddings, visual content, analytics, and cached data removed.'
      onActionComplete?.(message)
      
    } catch (error) {
      console.error('Failed to perform complete wipeout:', error)
      const message = '❌ Failed to complete database wipeout. Check console for details.'
      onActionComplete?.(message)
    }
    setIsLoading(prev => ({ ...prev, wipe: false }))
    setShowConfirmation(null)
  }

  const handleClearVisualContent = async () => {
    setIsLoading(prev => ({ ...prev, visual: true }))
    try {
      await clearAllVisualContent()
      const message = '✅ Visual content cleared successfully!'
      onActionComplete?.(message)
    } catch (error) {
      console.error('Failed to clear visual content:', error)
      const message = '❌ Failed to clear visual content. Check console for details.'
      onActionComplete?.(message)
    }
    setIsLoading(prev => ({ ...prev, visual: false }))
  }

  const handleClearCache = async () => {
    setIsLoading(prev => ({ ...prev, cache: true }))
    try {
      const cacheKeys = [
        'rag_search_history',
        'rag_analytics_data',
        'rag_processing_stats'
      ]
      
      cacheKeys.forEach(key => localStorage.removeItem(key))
      
      const message = '✅ Cache cleared successfully!'
      onActionComplete?.(message)
    } catch (error) {
      console.error('Failed to clear cache:', error)
      const message = '❌ Failed to clear cache. Check console for details.'
      onActionComplete?.(message)
    }
    setIsLoading(prev => ({ ...prev, cache: false }))
  }

  const actions = [
    {
      id: 'complete-wipeout',
      title: 'Complete Database Wipeout',
      description: 'Delete ALL documents, embeddings, visual content, analytics, and cached data. This action cannot be undone.',
      icon: Trash2,
      action: handleCompleteWipeout,
      requiresConfirmation: true,
      confirmationMessage: 'This will permanently delete ALL RAG data including documents, embeddings, visual content, analytics, and cached data. This action cannot be undone. Are you absolutely sure?',
      destructive: true,
      loading: isLoading.wipe
    },
    {
      id: 'clear-visual',
      title: 'Clear Visual Content',
      description: 'Remove all extracted visual content (charts, tables, diagrams) while keeping documents and text.',
      icon: HardDrive,
      action: handleClearVisualContent,
      requiresConfirmation: true,
      confirmationMessage: 'This will delete all visual content (charts, tables, diagrams). Text content and documents will remain. Continue?',
      destructive: true,
      loading: isLoading.visual
    },
    {
      id: 'clear-cache',
      title: 'Clear Cache Data',
      description: 'Clear search history, analytics data, and processing statistics. Documents and core data remain.',
      icon: RefreshCw,
      action: handleClearCache,
      requiresConfirmation: false,
      confirmationMessage: '',
      destructive: false,
      loading: isLoading.cache
    }
  ]

  return (
    <div className="space-y-space-md">
      <div className="flex items-center gap-space-sm mb-space-lg">
        <Database className="w-5 h-5 text-primary" />
        <h3 className="text-heading-3 text-foreground">Database Management</h3>
      </div>

      <div className="grid gap-space-md">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border border-border rounded-lg p-space-md"
          >
            <div className="flex items-start gap-space-sm">
              <action.icon className={`w-5 h-5 mt-1 ${action.destructive ? 'text-destructive' : 'text-primary'}`} />
              
              <div className="flex-1">
                <h4 className={`text-body-large font-medium ${action.destructive ? 'text-destructive' : 'text-foreground'}`}>
                  {action.title}
                </h4>
                <p className="text-body-small text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>

              <Button
                variant={action.destructive ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (action.requiresConfirmation) {
                    setShowConfirmation(action.id)
                  } else {
                    action.action()
                  }
                }}
                disabled={action.loading}
                className="ml-space-sm"
              >
                {action.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.destructive ? 'Delete' : 'Clear'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-space-lg max-w-md w-full mx-space-md">
            <div className="flex items-center gap-space-sm mb-space-md">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-heading-4 text-foreground">Confirm Action</h3>
            </div>
            
            <p className="text-body-small text-muted-foreground mb-space-lg">
              {actions.find(a => a.id === showConfirmation)?.confirmationMessage}
            </p>
            
            <div className="flex gap-space-sm">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const action = actions.find(a => a.id === showConfirmation)
                  if (action) action.action()
                }}
                className="flex-1"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
