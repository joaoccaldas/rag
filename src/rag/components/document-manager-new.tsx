/**
 * Advanced Document Manager - Clean Modular Implementation
 * 
 * This is the main export file for the refactored document manager components.
 * All functionality has been preserved and moved to modular components.
 */

// Re-export the main component from the new modular structure
export { AdvancedDocumentManager } from './document-manager/AdvancedDocumentManager'

// Export individual components for potential reuse
export { DocumentCard } from './document-manager/DocumentCard'
export { DocumentListItem } from './document-manager/DocumentListItem'
export { DocumentUploadArea } from './document-manager/DocumentUploadArea'
export { DocumentFilters } from './document-manager/DocumentFilters'
export { DocumentBulkActions } from './document-manager/DocumentBulkActions'

// Export types for external use
export type { 
  DocumentManagerState,
  DocumentCardProps,
  DocumentListItemProps,
  DocumentUploadAreaProps,
  DocumentFiltersProps,
  DocumentBulkActionsProps
} from './document-manager/types'
