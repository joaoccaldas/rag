/**
 * Unified Document Hub - Types and Interfaces
 * 
 * Shared type definitions for the unified document management system
 */

import { Document, SearchResult, UploadProgress } from '@/rag/types'

// View modes for the unified interface
export type UnifiedViewMode = 'browse' | 'search' | 'upload' | 'hybrid'

// Display modes for documents
export type DocumentDisplayMode = 'grid' | 'list' | 'table'

// Filter options for documents
export interface DocumentFilters {
  searchQuery: string
  documentTypes: string[]
  status: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  tags: string[]
  minSimilarity: number
  maxResults: number
  sortBy: 'name' | 'uploadedAt' | 'size' | 'relevance'
  sortOrder: 'asc' | 'desc'
}

// Selection state for bulk operations
export interface SelectionState {
  selectedIds: Set<string>
  selectAll: boolean
  isSelectMode: boolean
}

// Upload state integrated with document management
export interface UnifiedUploadState {
  isUploading: boolean
  uploadQueue: File[]
  uploadProgress: Record<string, UploadProgress>
  recentUploads: string[] // Document IDs
}

// Search state with enhanced functionality
export interface UnifiedSearchState {
  query: string
  results: SearchResult[]
  isSearching: boolean
  searchHistory: string[]
  suggestions: string[]
  filters: Partial<DocumentFilters>
}

// Main state for the unified hub
export interface UnifiedDocumentState {
  viewMode: UnifiedViewMode
  displayMode: DocumentDisplayMode
  filters: DocumentFilters
  selection: SelectionState
  upload: UnifiedUploadState
  search: UnifiedSearchState
  documents: Document[]
  filteredDocuments: Document[]
  isLoading: boolean
  error: string | null
}

// Action types for state management
export type UnifiedDocumentAction = 
  | { type: 'SET_VIEW_MODE'; payload: UnifiedViewMode }
  | { type: 'SET_DISPLAY_MODE'; payload: DocumentDisplayMode }
  | { type: 'SET_FILTERS'; payload: Partial<DocumentFilters> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_SELECTION'; payload: Partial<SelectionState> }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<Document> } }
  | { type: 'DELETE_DOCUMENTS'; payload: string[] }
  | { type: 'SET_UPLOAD_STATE'; payload: Partial<UnifiedUploadState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SEARCH' }
  | { type: 'CLEAR_SELECTION' }

// Props for main unified component
export interface UnifiedDocumentHubProps {
  className?: string
  initialViewMode?: UnifiedViewMode
  initialDisplayMode?: DocumentDisplayMode
  onDocumentSelect?: (document: Document) => void
  onDocumentAction?: (action: string, documentIds: string[]) => void
  showUploadZone?: boolean
  showAdvancedSearch?: boolean
  maxUploadSize?: number
  allowedFileTypes?: string[]
}

// Props for child components
export interface DocumentGridProps {
  documents: Document[]
  displayMode: DocumentDisplayMode
  selection: SelectionState
  onSelectionChange: (selection: Partial<SelectionState>) => void
  onDocumentAction: (action: string, documentId: string) => void
  isLoading: boolean
}

export interface SearchInterfaceProps {
  query: string
  results: SearchResult[]
  isSearching: boolean
  suggestions: string[]
  searchHistory: string[]
  onSearch: (query: string) => void
  onClearSearch: () => void
  onSuggestionClick: (suggestion: string) => void
}

export interface UploadZoneProps {
  uploadState: UnifiedUploadState
  onFilesAdded: (files: File[]) => void
  onUploadCancel: (fileId: string) => void
  maxFileSize: number
  allowedTypes: string[]
  className?: string
}

export interface FilterPanelProps {
  filters: DocumentFilters
  onFiltersChange: (filters: Partial<DocumentFilters>) => void
  documentTypes: string[]
  availableTags: string[]
  isExpanded: boolean
  onToggleExpanded: () => void
}

export interface ActionToolbarProps {
  selection: SelectionState
  viewMode: UnifiedViewMode
  displayMode: DocumentDisplayMode
  onDisplayModeChange: (mode: DocumentDisplayMode) => void
  onBulkAction: (action: string) => void
  onToggleSelectMode: () => void
}

// Utility types
export interface DocumentStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  recentUploads: number
  searchResults: number
}

export interface BulkOperation {
  id: string
  label: string
  icon: React.ComponentType
  action: (documentIds: string[]) => void
  requiresConfirmation: boolean
  destructive: boolean
}

// Performance optimization types
export interface VirtualizationConfig {
  enabled: boolean
  itemHeight: number
  overscan: number
  threshold: number
}

// Accessibility types
export interface A11yConfig {
  announceSelection: boolean
  announceSearch: boolean
  announceUpload: boolean
  keyboardShortcuts: boolean
}
