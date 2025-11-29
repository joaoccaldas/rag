/**
 * Visual Content Item Component with Thumbnail Support
 * Handles thumbnail generation and display for visual content
 */

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Eye } from 'lucide-react'
import Image from 'next/image'
import { VisualContent } from '../rag/types'
import { getOrCreateThumbnail } from '../utils/thumbnail-generator'

interface VisualContentItemProps {
  item: VisualContent
  isExpanded: boolean
  onToggleExpand: () => void
  onOpenModal: (item: VisualContent) => void
}

export const VisualContentItem: React.FC<VisualContentItemProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onOpenModal
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        setThumbnailLoading(true)
        const thumbnail = await getOrCreateThumbnail(item)
        setThumbnailUrl(thumbnail)
      } catch (error) {
        console.error('Failed to load thumbnail:', error)
        // Fallback thumbnail
        setThumbnailUrl(`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23f3f4f6"/><text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="12" fill="%236b7280">No Preview</text></svg>`)
      } finally {
        setThumbnailLoading(false)
      }
    }

    loadThumbnail()
  }, [item])

  const getTypeIcon = () => {
    switch (item.type) {
      case 'image': return '🖼️'
      case 'diagram': return '📊'
      case 'table': return '📋'
      case 'chart': return '📈'
      default: return '📄'
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      image: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      diagram: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      table: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      chart: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div 
        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium truncate">
                {item.title || `${item.type} content`}
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                {item.type}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {item.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenModal(item)
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="View full content"
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
          {/* Thumbnail with loading state */}
          <div className="flex justify-center">
            {thumbnailLoading ? (
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onOpenModal(item)}
              >
                <Image 
                  src={thumbnailUrl} 
                  alt={item.title || 'Visual content'}
                  width={128}
                  height={128}
                  className="max-w-32 max-h-32 object-contain border border-gray-200 dark:border-gray-600 rounded"
                  onError={() => {
                    // Fallback if image fails to load
                    setThumbnailUrl(`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23f3f4f6"/><text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="12" fill="%236b7280">No Preview</text></svg>`)
                  }}
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          {item.metadata && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h6 className="font-semibold text-gray-900 dark:text-white mb-3">Document Details</h6>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {item.metadata.size && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
                    <span className="text-gray-900 dark:text-gray-100">{item.metadata.size}</span>
                  </div>
                )}
                {item.metadata.format && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Format:</span>
                    <span className="text-gray-900 dark:text-gray-100">{item.metadata.format}</span>
                  </div>
                )}
                {item.metadata.dimensions && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                    <span className="text-gray-900 dark:text-gray-100">{item.metadata.dimensions}</span>
                  </div>
                )}
                {item.metadata.dataPoints && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Data Points:</span>
                    <span className="text-gray-900 dark:text-gray-100">{item.metadata.dataPoints}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extracted text preview */}
          {item.metadata?.extractedText && (
            <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs border">
              <div className="font-medium mb-1">Extracted Text:</div>
              <div className="text-gray-600 dark:text-gray-400 line-clamp-3">
                {item.metadata.extractedText}
              </div>
            </div>
          )}

          {/* Table columns preview */}
          {item.metadata?.columns && (
            <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs border">
              <div className="font-medium mb-1">Table Columns:</div>
              <div className="flex flex-wrap gap-1">
                {item.metadata.columns.map((col, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* LLM Summary */}
          {item.llmSummary && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg space-y-4 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <h5 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                AI Analysis Summary
              </h5>
              
              {item.llmSummary.mainContent && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Main Content:</h6>
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{item.llmSummary.mainContent}</p>
                </div>
              )}
              
              {item.llmSummary.keyInsights && item.llmSummary.keyInsights.length > 0 && (
                <div>
                  <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Key Insights:</h6>
                  <ul className="text-gray-800 dark:text-gray-200 space-y-2">
                    {item.llmSummary.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {item.llmSummary.significance && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <h6 className="font-semibold text-green-800 dark:text-green-200 mb-2">Significance:</h6>
                  <p className="text-green-900 dark:text-green-100 leading-relaxed">{item.llmSummary.significance}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VisualContentItem
