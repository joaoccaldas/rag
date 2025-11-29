import { Document, UploadProgress } from '../../types'

export interface DocumentManagerState {
  searchTerm: string
  selectedFileTypes: string[]
  selectedStatuses: string[]
  sortBy: 'name' | 'uploadedAt' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'
  showFilters: boolean
  selectedDocuments: Set<string>
  showBulkActions: boolean
}

export interface DocumentCardProps {
  document: Document
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onPreview: (document: Document) => void
  onDownload: (document: Document) => void
  onDelete: (document: Document) => void
  onOpenOriginal?: (document: Document) => void
}

export interface DocumentListItemProps {
  document: Document
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onPreview: (document: Document) => void
  onDownload: (document: Document) => void
  onDelete: (document: Document) => void
  onOpenOriginal?: (document: Document) => void
}

export interface DocumentUploadAreaProps {
  isUploading: boolean
  uploadProgress: number
  uploadDetails?: Record<string, UploadProgress>
  isDragActive: boolean
  getRootProps: () => Record<string, unknown>
  getInputProps: () => Record<string, unknown>
}

export interface DocumentFiltersProps {
  state: DocumentManagerState
  setState: React.Dispatch<React.SetStateAction<DocumentManagerState>>
  fileTypeOptions: Array<{ value: string; label: string }>
  statusOptions: Array<{ value: string; label: string }>
}

export interface DocumentBulkActionsProps {
  selectedCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkDelete: () => void
}
