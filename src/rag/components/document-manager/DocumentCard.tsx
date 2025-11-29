import React from 'react'
import { CheckSquare, Square, Eye, Download, Trash2, ExternalLink } from 'lucide-react'
import { DocumentCardProps } from './types'
import { Button, Card, Badge } from '../../../design-system/components'
import { DocumentThumbnail } from '../../../components/document-thumbnail'
import SmartAIAnalysisSection from '../../../components/ai-analysis'

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
  onOpenOriginal
}) => {

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return i >= 2 ? `${size.toFixed(2)} ${sizes[i]}` : `${Math.round(size)} ${sizes[i]}`
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)

  const fileType = document.type.split('/')[1]?.toUpperCase() || 'DOC'

  const StatusPill = () => (
    <Badge
      variant={
        document.status === 'ready'
          ? 'default'
          : document.status === 'processing'
          ? 'secondary'
          : 'destructive'
      }
      className={[
        'text-[11px] font-semibold px-2.5 py-1 rounded-full',
        document.status === 'ready'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : document.status === 'processing'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      ].join(' ')}
    >
      {document.status}
    </Badge>
  )

  return (
    <Card
      className={[
        'relative group w-full',
        'min-h-[320px]',            // no clipping; allow content to breathe
        'flex flex-col overflow-hidden rounded-2xl',
        'bg-white/95 dark:bg-gray-850',
        'border border-gray-200/60 dark:border-gray-700/60',
        'shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5',
        isSelected
          ? 'ring-2 ring-blue-500/70 shadow-lg bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900'
          : ''
      ].join(' ')}
    >
      {/* Ultra-compact banner */}
      <div className="relative h-20 w-full overflow-hidden">
        <DocumentThumbnail
          document={document}
          size="sm"
          showVisualCount={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />

        {/* top-left: selection */}
        <div className="absolute top-2 left-2">
          <button
            onClick={() => onToggleSelect(document.id)}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white/85 dark:bg-gray-900/65 shadow-sm backdrop-blur hover:bg-white dark:hover:bg-gray-800 transition"
            aria-label={isSelected ? 'Unselect document' : 'Select document'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* top-right: actions (uniform, subtle) */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-95 group-hover:opacity-100">
          {[
            { Icon: Eye, handler: () => onPreview(document), title: 'Preview' },
            { Icon: Download, handler: () => onDownload(document), title: 'Download' },
            ...(onOpenOriginal && document.metadata?.originalFileId ? [
              { Icon: ExternalLink, handler: () => onOpenOriginal(document), title: 'Open Original' }
            ] : []),
            { Icon: Trash2, handler: () => onDelete(document), title: 'Delete', danger: true }
          ].map(({ Icon, handler, title, danger }, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              onClick={handler}
              className={[
                'h-7 w-7 p-1 rounded-md shadow-sm backdrop-blur',
                'bg-white/85 dark:bg-gray-900/65 hover:bg-white dark:hover:bg-gray-800',
                danger ? 'text-red-600 hover:text-red-700' : ''
              ].join(' ')}
              title={title}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pt-3 pb-4 grid grid-rows-[auto_auto_auto_1fr_auto] gap-2.5 min-h-0">
        {/* Title */}
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 tracking-tight">
          {document.name}
        </h3>

        {/* Meta row with filetype, chunks, visuals, status */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 font-medium text-gray-700 dark:text-gray-200">
            {fileType}
          </span>
          {document.chunks?.length ? (
            <>
              <span className="text-gray-400">•</span>
              <span>{document.chunks.length} chunks</span>
            </>
          ) : null}
          {document.visualContent?.length ? (
            <>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                📊 {document.visualContent.length} visual
                {document.visualContent.length !== 1 ? 's' : ''}
              </span>
            </>
          ) : null}
          <span className="flex-1" />
          <StatusPill />
        </div>

        {/* Enhanced AI Analysis Section */}
        {document.aiAnalysis && (
          <SmartAIAnalysisSection 
            aiAnalysis={document.aiAnalysis} 
            isCompact={true}
            className="w-full"
          />
        )}

        {/* Visual Content Count */}
        {document.visualContent?.length ? (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              📊 {document.visualContent.length} visual
              {document.visualContent.length !== 1 ? 's' : ''}
            </span>
          </div>
        ) : <div />}

        {/* Footer — always visible */}
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200/70 dark:border-gray-700/60">
          <div className="flex items-center gap-2 pt-2 min-w-0">
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatFileSize(document.size)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="truncate">{formatDate(document.uploadedAt)}</span>
          </div>

          {document.status === 'processing' && (
            <div className="w-28 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full w-3/5 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
