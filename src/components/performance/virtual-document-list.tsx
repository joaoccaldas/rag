/**
 * Virtual Document List Component
 * Implements virtual scrolling for performance with large document collections
 */

import React, { memo, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Document } from '../../rag/types'
import { DocumentListItem } from './document-list-item'

interface VirtualDocumentListProps {
  documents: Document[]
  selectedDocuments: string[]
  onDocumentSelect?: (documentId: string) => void
  onDocumentPreview?: (document: Document) => void
  onDocumentDelete?: (documentId: string) => void
  height?: number
  itemHeight?: number
  className?: string
}

const VirtualDocumentListComponent = ({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onDocumentPreview,
  onDocumentDelete,
  height = 600,
  itemHeight = 80,
  className = ''
}: VirtualDocumentListProps) => {
  
  // Memoized row renderer for performance
  const RowRenderer = useMemo(() => {
    const RowComponent = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const document = documents[index]
      
      if (!document) {
        return <div style={style} />
      }

      return (
        <div style={style}>
          <DocumentListItem
            document={document}
            isSelected={selectedDocuments.includes(document.id)}
            onSelect={() => onDocumentSelect?.(document.id)}
            onPreview={() => onDocumentPreview?.(document)}
            onDelete={() => onDocumentDelete?.(document.id)}
            className="px-4 py-2 border-b border-gray-100 dark:border-gray-700"
          />
        </div>
      )
    }
    
    RowComponent.displayName = 'DocumentRow'
    return RowComponent
  }, [documents, selectedDocuments, onDocumentSelect, onDocumentPreview, onDocumentDelete])

  // Empty state
  if (documents.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No documents found</div>
          <div className="text-sm">
            Upload documents to get started with your RAG system
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Document count header */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <div className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? 's' : ''} total
          {selectedDocuments.length > 0 && (
            <span className="ml-2 text-primary">
              ({selectedDocuments.length} selected)
            </span>
          )}
        </div>
      </div>

      {/* Virtual scrolling list */}
      <List
        height={height}
        width="100%"
        itemCount={documents.length}
        itemSize={itemHeight}
        overscanCount={10}
        className="scrollbar-thin scrollbar-thumb-border"
      >
        {RowRenderer}
      </List>
    </div>
  )
}

VirtualDocumentListComponent.displayName = 'VirtualDocumentList'

export const VirtualDocumentList = memo(VirtualDocumentListComponent)
export default VirtualDocumentList
