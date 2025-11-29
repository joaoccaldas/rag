"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { Document, DocumentType } from '../types'
import { ragStorage } from '../utils/storage'
import { storageManager } from '../utils/enhanced-storage-manager'
import { enhanceDocumentsWithAI } from '../utils/ai-analysis-generator'

interface DocumentState {
  documents: Document[]
  selectedDocuments: string[]
  isLoading: boolean
  error: string | null
}

type DocumentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<Document> } }
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'TOGGLE_DOCUMENT_SELECTION'; payload: string }
  | { type: 'CLEAR_DOCUMENT_SELECTION' }

const initialState: DocumentState = {
  documents: [],
  selectedDocuments: [],
  isLoading: false,
  error: null
}

function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'ADD_DOCUMENT':
      return { 
        ...state, 
        documents: [...state.documents, action.payload],
        error: null
      }
    
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id 
            ? { ...doc, ...action.payload.updates }
            : doc
        )
      }
    
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        selectedDocuments: state.selectedDocuments.filter(id => id !== action.payload)
      }
    
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload, error: null }
    
    case 'TOGGLE_DOCUMENT_SELECTION':
      return {
        ...state,
        selectedDocuments: state.selectedDocuments.includes(action.payload)
          ? state.selectedDocuments.filter(id => id !== action.payload)
          : [...state.selectedDocuments, action.payload]
      }
    
    case 'CLEAR_DOCUMENT_SELECTION':
      return { ...state, selectedDocuments: [] }
    
    default:
      return state
  }
}

interface DocumentManagementContextType {
  state: DocumentState
  documents: Document[]
  selectedDocuments: string[]
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  deleteSelectedDocuments: () => Promise<void>
  toggleDocumentSelection: (id: string) => void
  clearSelection: () => void
  loadDocuments: () => Promise<void>
  refreshDocuments: () => Promise<void>
}

const DocumentManagementContext = createContext<DocumentManagementContextType | null>(null)

export function DocumentManagementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(documentReducer, initialState)

  // Load documents from storage on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // Initialize enhanced storage manager
        await storageManager.initialize()
        
        // Clear old cached data to prevent count mismatch
        console.log('🧹 Clearing any stale document cache...')
        
        // Load documents with integrity check and force refresh
        const documents = await storageManager.loadDocuments()
        console.log(`📋 DocumentManagement: Loaded ${documents.length} documents from storage`)
        
        // Verify document count in real-time
        const actualCount = documents.filter(doc => doc.status === 'ready').length
        console.log(`✅ Verified ${actualCount} ready documents (total: ${documents.length})`)
        
        // Debug: Log document details
        documents.forEach((doc, index) => {
          console.log(`  ${index + 1}. "${doc.name}"`)
          console.log(`     - Status: ${doc.status}`)
          console.log(`     - Content length: ${doc.content?.length || 0}`)
          console.log(`     - Chunks: ${doc.chunks?.length || 0}`)
          console.log(`     - Has embeddings: ${doc.chunks?.some(c => c.embedding) ? 'Yes' : 'No'}`)
          console.log(`     - Size: ${(doc.size / 1024).toFixed(1)} KB`)
        })
        
        if (documents.length > 0) {
          const enhancedDocuments = enhanceDocumentsWithAI(documents)
          dispatch({ type: 'SET_DOCUMENTS', payload: enhancedDocuments })
          console.log(`✅ Loaded ${documents.length} documents with enhanced storage`)
          
          // Force UI refresh to update document count
          setTimeout(() => {
            console.log(`🔄 Document count refreshed: ${enhancedDocuments.length}`)
          }, 100)
        } else {
          console.log('⚠️ No documents found in storage')
          // Ensure empty state is set
          dispatch({ type: 'SET_DOCUMENTS', payload: [] })
        }
      } catch (error) {
        console.error('Failed to load documents from storage:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load documents' })
        // Set empty state on error
        dispatch({ type: 'SET_DOCUMENTS', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    loadDocuments()
  }, [])

  const addDocument = useCallback((document: Document) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: document })
  }, [])

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, updates } })
      
      // Update storage with enhanced synchronization
      const updatedDocuments = state.documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      )
      await storageManager.saveDocuments(updatedDocuments)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.documents])

  const deleteDocument = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'REMOVE_DOCUMENT', payload: id })
      
      // Use enhanced storage manager for cascade cleanup
      await storageManager.deleteDocument(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const deleteSelectedDocuments = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      for (const id of state.selectedDocuments) {
        dispatch({ type: 'REMOVE_DOCUMENT', payload: id })
        // Use enhanced storage manager for cascade cleanup
        await storageManager.deleteDocument(id)
      }
      dispatch({ type: 'CLEAR_DOCUMENT_SELECTION' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk delete failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.selectedDocuments])

  const toggleDocumentSelection = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_DOCUMENT_SELECTION', payload: id })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_DOCUMENT_SELECTION' })
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Initialize enhanced storage manager
      await storageManager.initialize()
      
      // Load documents with integrity check
      const documents = await storageManager.loadDocuments()
      const enhancedDocuments = enhanceDocumentsWithAI(documents)
      dispatch({ type: 'SET_DOCUMENTS', payload: enhancedDocuments })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const refreshDocuments = useCallback(async () => {
    await loadDocuments()
  }, [loadDocuments])

  const value: DocumentManagementContextType = {
    state,
    documents: state.documents,
    selectedDocuments: state.selectedDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    deleteSelectedDocuments,
    toggleDocumentSelection,
    clearSelection,
    loadDocuments,
    refreshDocuments
  }

  return (
    <DocumentManagementContext.Provider value={value}>
      {children}
    </DocumentManagementContext.Provider>
  )
}

export function useDocumentManagement() {
  const context = useContext(DocumentManagementContext)
  if (!context) {
    throw new Error('useDocumentManagement must be used within a DocumentManagementProvider')
  }
  return context
}

// Helper function for determining document type
export function getDocumentType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf': return 'pdf'
    case 'txt': return 'txt'
    case 'docx': return 'docx'
    case 'md': return 'markdown'
    case 'json': return 'json'
    case 'csv': return 'csv'
    case 'xlsx': return 'xlsx'
    case 'html': return 'html'
    case 'xml': return 'xml'
    default: return 'txt'
  }
}
