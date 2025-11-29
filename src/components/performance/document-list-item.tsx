/**
 * Document List Item Component
 * Optimized for virtual scrolling with minimal re-renders
 */

import React, { memo } from 'react'
import { FileText, Trash2, Eye, Download, Calendar, HardDrive } from 'lucide-react'
import { Document } from '../../rag/types'
import { Button } from '@/design-system/components/button'
import { Badge } from '@/design-system/components/badge'

interface DocumentListItemProps {
  document: Document
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
  onDelete: () => void
  className?: string
}

const DocumentListItemComponent = ({
  document,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  className = ''
}: DocumentListItemProps) => {
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      processed: 'success',
      processing: 'warning',
      error: 'destructive',
      pending: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className={`flex items-center gap-4 hover:bg-muted/50 transition-colors ${className}`}>
      {/* Selection checkbox */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
          aria-label={`Select ${document.name}`}
        />
      </div>

      {/* Document icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Document info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground truncate">
            {document.name}
          </h3>
          {getStatusBadge(document.status)}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(document.size)}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(document.uploadedAt)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          title="Preview document"
        >
          <Eye className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Trigger download
            const link = globalThis.document.createElement('a')
            link.href = document.url || '#'
            link.download = document.name
            link.click()
          }}
          title="Download document"
        >
          <Download className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Delete document"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

DocumentListItemComponent.displayName = 'DocumentListItem'

export const DocumentListItem = memo(DocumentListItemComponent)
export default DocumentListItem
