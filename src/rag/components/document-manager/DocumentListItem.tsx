import React from 'react'
import { 
  CheckSquare, 
  Square, 
  Eye, 
  Download, 
  Trash2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive
} from 'lucide-react'
import { DocumentListItemProps } from './types'
import { Button, Card, Badge } from '../../../design-system/components'

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  isSelected,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
  onOpenOriginal
}) => {
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (type.includes('zip') || type.includes('archive')) return <Archive className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Card className={`group transition-all duration-200 hover:shadow-sm ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
    }`}>
      <div className="p-3 flex items-center space-x-4">
        {/* Selection checkbox */}
        <button
          onClick={() => onToggleSelect(document.id)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* File icon */}
        <div className="text-gray-500 dark:text-gray-400">
          {getFileTypeIcon(document.type)}
        </div>

        {/* Document details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {document.name}
            </h3>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => onPreview(document)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDownload(document)}>
                <Download className="w-4 h-4" />
              </Button>
              {onOpenOriginal && document.metadata?.originalFileId && (
                <Button variant="ghost" size="sm" onClick={() => onOpenOriginal(document)}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDelete(document)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(document.size)}</span>
            <span>{formatDate(document.uploadedAt)}</span>
            <Badge variant="secondary" className="text-xs">
              {document.status}
            </Badge>
            {document.visualContent && document.visualContent.length > 0 && (
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                📊 {document.visualContent.length} visuals
              </span>
            )}
          </div>
          {document.status === 'processing' && (
            <div className="mt-2 w-32">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
