/**
 * Advanced Document Manager - Refactored modular implementation
 * 
 * This file has been refactored into modular components for better maintainability.
 * The new structure separates concerns and makes the code more testable and reusable.
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
