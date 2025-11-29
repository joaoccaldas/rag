import React, { useState, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronRight, Image as ImageIcon, FileText, BarChart3, Table, Download, Eye, ZoomIn, ZoomOut } from 'lucide-react'
import Image from 'next/image'
import { VisualContent } from '../rag/types'
import { VisualContentItem } from './visual-content-item'

interface TableRow {
  [key: string]: string | number | boolean
}

interface VisualContentRendererProps {
  content: VisualContent[]
  className?: string
}

export const VisualContentRenderer: React.FC<VisualContentRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedContent, setSelectedContent] = useState<VisualContent | null>(null)
  const [imageZoom, setImageZoom] = useState(1)

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const openContentModal = useCallback((content: VisualContent) => {
    setSelectedContent(content)
    setImageZoom(1)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedContent(null)
    setImageZoom(1)
  }, [])

  const getIcon = (type: VisualContent['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'chart': return <BarChart3 className="w-4 h-4" />
      case 'table': return <Table className="w-4 h-4" />
      case 'graph': return <BarChart3 className="w-4 h-4" />
      case 'diagram': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const renderContentPreview = (item: VisualContent) => {
    const isExpanded = expandedItems.has(item.id)
    
    return (
      <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleExpanded(item.id)}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {getIcon(item.type)}
            <div>
              <h4 className="font-medium text-sm">{item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Content`}</h4>
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {item.type}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openContentModal(item)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="View full content"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 space-y-3">
            {/* Thumbnail or preview */}
            {item.thumbnail && (
              <div className="flex justify-center">
                {item.thumbnail.includes('via.placeholder.com') || item.thumbnail.startsWith('/api/') ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="max-w-32 max-h-32 object-contain border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:opacity-80"
                    onClick={() => openContentModal(item)}
                    onError={(e) => {
                      console.warn('Thumbnail loading failed:', item.thumbnail)
                      e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23f3f4f6"/><text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="12" fill="%236b7280">No Image</text></svg>`
                    }}
                  />
                ) : (
                  <Image 
                    src={item.thumbnail} 
                    alt={item.title || 'Visual content'}
                    width={128}
                    height={128}
                    className="max-w-32 max-h-32 object-contain border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:opacity-80"
                    onClick={() => openContentModal(item)}
                    onError={() => {
                      console.warn('Next.js Image loading failed:', item.thumbnail)
                    }}
                  />
                )}
              </div>
            )}
            
            {/* Show placeholder if no thumbnail */}
            {!item.thumbnail && (
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                     onClick={() => openContentModal(item)}>
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {item.type === 'image' ? '🖼️' : 
                       item.type === 'chart' ? '📊' : 
                       item.type === 'table' ? '📋' : 
                       item.type === 'diagram' ? '📈' : '📄'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.type}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {item.metadata && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {item.metadata.size && (
                  <div>
                    <span className="font-medium">Size: </span>
                    <span className="text-gray-600 dark:text-gray-400">{item.metadata.size}</span>
                  </div>
                )}
                {item.metadata.format && (
                  <div>
                    <span className="font-medium">Format: </span>
                    <span className="text-gray-600 dark:text-gray-400">{item.metadata.format}</span>
                  </div>
                )}
                {item.metadata.dimensions && (
                  <div>
                    <span className="font-medium">Dimensions: </span>
                    <span className="text-gray-600 dark:text-gray-400">{item.metadata.dimensions}</span>
                  </div>
                )}
                {item.metadata.dataPoints && (
                  <div>
                    <span className="font-medium">Data Points: </span>
                    <span className="text-gray-600 dark:text-gray-400">{item.metadata.dataPoints}</span>
                  </div>
                )}
              </div>
            )}

            {/* Extracted text preview */}
            {item.metadata?.extractedText && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                <div className="font-medium mb-1">Extracted Text:</div>
                <div className="text-gray-600 dark:text-gray-400 line-clamp-3">
                  {item.metadata.extractedText}
                </div>
              </div>
            )}

            {/* Table columns preview */}
            {item.metadata?.columns && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                <div className="font-medium mb-1">Columns:</div>
                <div className="flex flex-wrap gap-1">
                  {item.metadata.columns.map((col, idx) => (
                    <span key={idx} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* LLM Summary */}
            {item.llmSummary && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  AI Analysis Summary
                </h5>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">Main Content: </span>
                    <span className="text-gray-700 dark:text-gray-300">{item.llmSummary.mainContent}</span>
                  </div>
                  
                  {item.llmSummary.keyInsights.length > 0 && (
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Key Insights:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                        {item.llmSummary.keyInsights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {item.llmSummary.challenges.length > 0 && (
                    <div>
                      <span className="font-medium text-orange-700 dark:text-orange-300">Challenges:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                        {item.llmSummary.challenges.map((challenge, idx) => (
                          <li key={idx}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Significance: </span>
                    <span className="text-gray-700 dark:text-gray-300">{item.llmSummary.significance}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => openContentModal(item)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              <button
                onClick={() => {
                  // Create download link for visual content
                  const downloadSource = item.source || item.data?.url || item.data?.base64
                  if (downloadSource) {
                    const link = document.createElement('a')
                    link.href = downloadSource
                    link.download = item.title || `visual_content_${item.id}`
                    link.click()
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                disabled={!item.source && !item.data?.url && !item.data?.base64}
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderModal = () => {
    if (!selectedContent) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-4xl w-full h-full m-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {getIcon(selectedContent.type)}
              <div>
                <h3 className="font-medium">{selectedContent.title}</h3>
                {selectedContent.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedContent.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedContent.type === 'image' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm px-2">{Math.round(imageZoom * 100)}%</span>
                  <button
                    onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {selectedContent.type === 'image' && (
              <div className="flex justify-center">
                <div style={{ transform: `scale(${imageZoom})` }} className="transition-transform">
                  <Image 
                    src={selectedContent.source || selectedContent.data?.url || selectedContent.data?.base64 || '/placeholder.png'} 
                    alt={selectedContent.title || 'Visual content'}
                    width={800}
                    height={600}
                    className="max-w-full h-auto"
                  />
                </div>
              </div>
            )}
            
            {selectedContent.type === 'table' && selectedContent.fullContent && Array.isArray(selectedContent.fullContent) && (
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                  {selectedContent.fullContent.length > 0 && (
                    <>
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          {Object.keys(selectedContent.fullContent[0]).map((header, idx) => (
                            <th key={idx} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContent.fullContent.map((row: TableRow, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {Object.values(row).map((cell: string | number | boolean, cellIdx) => (
                              <td key={cellIdx} className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            )}
            
            {(selectedContent.type === 'chart' || selectedContent.type === 'graph') && (
              <div className="text-center">
                <Image 
                  src={selectedContent.source || selectedContent.data?.url || selectedContent.data?.base64 || '/placeholder.png'} 
                  alt={selectedContent.title || 'Chart/Graph content'}
                  width={800}
                  height={600}
                  className="max-w-full h-auto mx-auto"
                />
                {selectedContent.metadata?.extractedText && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm text-left">
                    <div className="font-medium mb-2">Analysis:</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedContent.metadata.extractedText}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {selectedContent.metadata?.extractedText && selectedContent.type !== 'chart' && selectedContent.type !== 'graph' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                <div className="font-medium mb-2">Extracted Text:</div>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedContent.metadata.extractedText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!content || content.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        No visual content found in this document.
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Visual Content ({content.length})</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Click items to expand • Click eye icon to view full content
        </div>
      </div>
      
      <div className="space-y-2">
        {content.map(item => (
          <VisualContentItem
            key={item.id}
            item={item}
            isExpanded={expandedItems.has(item.id)}
            onToggleExpand={() => toggleExpanded(item.id)}
            onOpenModal={openContentModal}
          />
        ))}
      </div>
      
      {renderModal()}
    </div>
  )
}

export default VisualContentRenderer
