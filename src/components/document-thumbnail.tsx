/**
 * Document Thumbnail Component
 * Displays OCR thumbnails, visual content previews, or file type icons
 */

import React from 'react'
import Image from 'next/image'
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive,
  File,
  BarChart3
} from 'lucide-react'
import { Document, VisualContent } from '../rag/types'

interface DocumentThumbnailProps {
  document: Document
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showVisualCount?: boolean
}

export function DocumentThumbnail({ 
  document, 
  size = 'md', 
  className = '',
  showVisualCount = false 
}: DocumentThumbnailProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className={iconSizes[size]} />
    if (type.startsWith('video/')) return <Video className={iconSizes[size]} />
    if (type.startsWith('audio/')) return <Music className={iconSizes[size]} />
    if (type.includes('zip') || type.includes('archive')) return <Archive className={iconSizes[size]} />
    if (type === 'pdf' || type === 'application/pdf') return <FileText className={iconSizes[size]} />
    return <File className={iconSizes[size]} />
  }

  // Try to get the best thumbnail available
  const getThumbnailSource = (): string | null => {
    if (!document.visualContent || document.visualContent.length === 0) {
      return null
    }

    // Priority 1: Look for actual image thumbnails
    for (const visual of document.visualContent) {
      if (visual.thumbnail && visual.thumbnail.startsWith('data:image')) {
        return visual.thumbnail
      }
    }

    // Priority 2: Look for base64 images
    for (const visual of document.visualContent) {
      if (visual.data?.base64 && visual.type === 'image') {
        const base64 = visual.data.base64
        return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
      }
    }

    // Priority 3: Look for image URLs
    for (const visual of document.visualContent) {
      if (visual.data?.url && visual.type === 'image') {
        return visual.data.url
      }
    }

    return null
  }

  const thumbnailSrc = getThumbnailSource()
  const hasVisualContent = document.visualContent && document.visualContent.length > 0
  const visualCount = document.visualContent?.length || 0

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {thumbnailSrc ? (
        <Image 
          src={thumbnailSrc}
          alt={`Thumbnail for ${document.name}`}
          width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className={`${sizeClasses[size]} rounded border object-cover`}
          onError={(e) => {
            // Fallback to file icon on error
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      ) : null}
      
      {/* Fallback file icon */}
      <div 
        className={`${thumbnailSrc ? 'hidden' : 'flex'} ${sizeClasses[size]} items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border`}
      >
        {getFileTypeIcon(document.type)}
      </div>

      {/* Visual content indicator */}
      {showVisualCount && hasVisualContent && (
        <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full flex items-center justify-center"
             style={{ 
               width: size === 'sm' ? '16px' : '20px', 
               height: size === 'sm' ? '16px' : '20px',
               fontSize: size === 'sm' ? '8px' : '10px'
             }}>
          {visualCount > 9 ? '9+' : visualCount}
        </div>
      )}

      {/* Chart/Graph indicator for non-image visual content */}
      {hasVisualContent && !thumbnailSrc && (
        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
          <BarChart3 className="w-2 h-2" />
        </div>
      )}
    </div>
  )
}

/**
 * Generate a placeholder thumbnail for visual content
 */
export function generatePlaceholderThumbnail(
  type: VisualContent['type'], 
  title?: string
): string {
  const canvas = document.createElement('canvas')
  canvas.width = 120
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''

  // Background
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, 120, 80)

  // Content based on type
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'

  switch (type) {
    case 'chart':
      // Draw simple chart bars
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(20, 50, 8, 20)
      ctx.fillRect(35, 40, 8, 30)
      ctx.fillRect(50, 30, 8, 40)
      ctx.fillRect(65, 45, 8, 25)
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Chart', 60, 20)
      break
      
    case 'table':
      // Draw simple table grid
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.strokeRect(20 + i * 20, 25 + j * 15, 20, 15)
        }
      }
      ctx.fillText('Table', 60, 20)
      break
      
    case 'graph':
      // Draw simple line graph
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(20, 60)
      ctx.lineTo(40, 45)
      ctx.lineTo(60, 35)
      ctx.lineTo(80, 50)
      ctx.lineTo(100, 30)
      ctx.stroke()
      ctx.fillText('Graph', 60, 20)
      break
      
    case 'image':
      // Draw image placeholder
      ctx.fillStyle = '#8b5cf6'
      ctx.fillRect(30, 25, 60, 40)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('IMG', 60, 50)
      break
      
    default:
      ctx.fillText(title || 'Visual', 60, 45)
  }

  return canvas.toDataURL('image/png')
}
