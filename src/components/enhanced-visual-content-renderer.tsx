/**
 * Enhanced Visual Content Renderer with AI Analysis Integration
 * Displays visual content with business-focused AI insights and metadata
 */

import React, { useState, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, X, Brain, TrendingUp, Eye, BarChart3 } from 'lucide-react'
import { VisualContent } from '../rag/types'
import { VisualContentItem } from './visual-content-item'
import { visualContentManager } from '../utils/enhanced-visual-content-manager'
import { browserAnalysisEngine, VisualAnalysis } from '../ai/browser-analysis-engine'

interface AnalysisDisplayProps {
  analysis: VisualAnalysis
  isExpanded: boolean
  onToggleExpanded: () => void
}

// Analysis Display Component
const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ 
  analysis, 
  isExpanded, 
  onToggleExpanded 
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Analysis</h3>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            {analysis.type}
          </span>
        </div>
        <button
          onClick={onToggleExpanded}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          <Eye className={`w-4 h-4 ${isExpanded ? 'opacity-100' : 'opacity-60'}`} />
        </button>
      </div>

      {/* Main Message */}
      <div className="mb-3">
        <p className="text-gray-800 dark:text-gray-200 font-medium">{analysis.mainMessage}</p>
      </div>

      {/* Key Numbers */}
      {analysis.mainNumbers.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Numbers</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {analysis.mainNumbers.slice(0, isExpanded ? analysis.mainNumbers.length : 4).map((num, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded p-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {num.value} {num.unit}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">{num.key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Insights */}
      {isExpanded && analysis.businessInsights.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Insights</span>
          </div>
          <div className="space-y-2">
            {analysis.businessInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  insight.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  insight.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {insight.priority}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{insight.insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {isExpanded && analysis.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.keywords.map((keyword, idx) => (
            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function to get the best available image source
const getImageSource = (content: VisualContent): string => {
  // Priority: fullContent -> source -> thumbnail -> data.base64 -> data.url
  if (content.fullContent && typeof content.fullContent === 'string') {
    // Check if it's a data URL or API URL
    if (content.fullContent.startsWith('data:') || content.fullContent.startsWith('/api/') || content.fullContent.startsWith('http')) {
      return content.fullContent
    }
  }
  
  if (content.source && typeof content.source === 'string') {
    if (content.source.startsWith('data:') || content.source.startsWith('/api/') || content.source.startsWith('http')) {
      return content.source
    }
  }
  
  if (content.thumbnail && typeof content.thumbnail === 'string') {
    if (content.thumbnail.startsWith('data:') || content.thumbnail.startsWith('/api/') || content.thumbnail.startsWith('http')) {
      return content.thumbnail
    }
  }
  
  // Check data object
  if (content.data?.base64 && typeof content.data.base64 === 'string') {
    return content.data.base64
  }
  
  if (content.data?.url && typeof content.data.url === 'string') {
    return content.data.url
  }
  
  return ''
}

// Helper function to get fallback sources when main source fails
const getImageFallbackSource = (content: VisualContent, failedSrc: string): string | null => {
  const sources = [
    content.fullContent,
    content.source,
    content.thumbnail,
    content.data?.base64,
    content.data?.url
  ].filter((src): src is string => 
    typeof src === 'string' && 
    src !== failedSrc && 
    (src.startsWith('data:') || src.startsWith('/api/') || src.startsWith('http'))
  )
  
  return sources.length > 0 ? sources[0]! : null
}

interface VisualContentRendererProps {
  content: VisualContent[]
  className?: string
  showAIAnalysis?: boolean
  documentId?: string
}

export const EnhancedVisualContentRenderer: React.FC<VisualContentRendererProps> = ({ 
  content, 
  className = '',
  showAIAnalysis = true,
  documentId
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [expandedAnalysis, setExpandedAnalysis] = useState<Set<string>>(new Set())
  const [selectedContent, setSelectedContent] = useState<VisualContent | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [visualAnalyses, setVisualAnalyses] = useState<Record<string, VisualAnalysis>>({})
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<string>>(new Set())

  // Load AI analysis for visual content
  useEffect(() => {
    if (!showAIAnalysis) return

    const loadAnalyses = async () => {
      for (const visual of content) {
        try {
          const analysis = await browserAnalysisEngine.getVisualAnalysis(visual.id)
          if (analysis) {
            setVisualAnalyses(prev => ({
              ...prev,
              [visual.id]: analysis
            }))
          }
        } catch (error) {
          console.warn(`Failed to load analysis for visual ${visual.id}:`, error)
        }
      }
    }

    loadAnalyses()
  }, [content, showAIAnalysis])

  // Generate AI analysis for visual content
  const generateAnalysis = useCallback(async (visual: VisualContent) => {
    if (loadingAnalysis.has(visual.id)) return

    setLoadingAnalysis(prev => new Set([...prev, visual.id]))

    try {
      const analysis = await browserAnalysisEngine.analyzeVisualContent(visual)
      setVisualAnalyses(prev => ({
        ...prev,
        [visual.id]: analysis
      }))
    } catch (error) {
      console.error('Failed to generate analysis:', error)
    } finally {
      setLoadingAnalysis(prev => {
        const newSet = new Set(prev)
        newSet.delete(visual.id)
        return newSet
      })
    }
  }, [loadingAnalysis])

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

  const toggleAnalysisExpanded = useCallback((id: string) => {
    setExpandedAnalysis(prev => {
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

  const renderModal = () => {
    if (!selectedContent) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm" onClick={closeModal}>
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-7xl max-h-[90vh] w-full h-full m-4 flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white">{selectedContent.title || 'Visual Content'}</h3>
                {selectedContent.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedContent.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {(selectedContent.fullContent || selectedContent.source || selectedContent.thumbnail) && (
                <>
                  <button
                    onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 3))}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.25))}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
                    {Math.round(imageZoom * 100)}%
                  </div>
                </>
              )}
              <button
                onClick={closeModal}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
            {/* Image Display with Proper Scaling */}
            {(selectedContent.fullContent || selectedContent.source || selectedContent.thumbnail) && (
              <div className="flex justify-center items-center min-h-[400px] mb-6">
                <div 
                  className="relative transition-transform duration-200 ease-in-out"
                  style={{ 
                    transform: `scale(${imageZoom})`,
                    transformOrigin: 'center center'
                  }}
                >
                  <img
                    src={getImageSource(selectedContent)}
                    alt={selectedContent.title || 'Visual content'}
                    className="max-w-none h-auto shadow-lg rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    style={{
                      maxWidth: `${800 / imageZoom}px`,
                      maxHeight: `${600 / imageZoom}px`,
                      objectFit: 'contain'
                    }}
                    onError={async (e) => {
                      // Enhanced fallback handling with storage recovery
                      const img = e.target as HTMLImageElement
                      console.warn('🚫 Image failed to load:', img.src)
                      
                      // Try fallback sources first
                      const fallbackSrc = getImageFallbackSource(selectedContent, img.src)
                      if (fallbackSrc && fallbackSrc !== img.src) {
                        console.log('🔄 Trying fallback source:', fallbackSrc)
                        img.src = fallbackSrc
                        return
                      }
                      
                      // Try to recover from storage manager
                      try {
                        const recoveredContent = await visualContentManager.ensureVisualContentAccess(selectedContent)
                        const recoveredSrc = getImageSource(recoveredContent)
                        if (recoveredSrc && recoveredSrc !== img.src) {
                          console.log('🔄 Recovered from storage manager:', recoveredSrc)
                          img.src = recoveredSrc
                          return
                        }
                      } catch (recoveryError) {
                        console.error('Recovery failed:', recoveryError)
                      }
                      
                      // All attempts failed - show error placeholder
                      console.error('❌ All image sources failed for:', selectedContent.id)
                      img.style.display = 'none'
                      
                      // Create error placeholder
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'p-8 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'
                      errorDiv.innerHTML = `
                        <div class="text-4xl mb-2">⚠️</div>
                        <div class="font-medium">Image could not be loaded</div>
                        <div class="text-sm mt-1">Try refreshing or re-uploading the document</div>
                      `
                      img.parentNode?.insertBefore(errorDiv, img)
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Document Information */}
            {selectedContent.metadata && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Document Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedContent.metadata.size && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
                      <span className="text-gray-900 dark:text-gray-100">{selectedContent.metadata.size}</span>
                    </div>
                  )}
                  {selectedContent.metadata.format && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Format:</span>
                      <span className="text-gray-900 dark:text-gray-100">{selectedContent.metadata.format}</span>
                    </div>
                  )}
                  {selectedContent.metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                      <span className="text-gray-900 dark:text-gray-100">{selectedContent.metadata.dimensions}</span>
                    </div>
                  )}
                  {selectedContent.metadata.extractedAt && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Extracted:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(selectedContent.metadata.extractedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {selectedContent.llmSummary && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border-2 border-blue-200 dark:border-blue-700 shadow-sm">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  AI Analysis Summary
                </h4>
                
                {selectedContent.llmSummary.mainContent && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Main Content:</h5>
                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{selectedContent.llmSummary.mainContent}</p>
                  </div>
                )}
                
                {selectedContent.llmSummary.keyInsights && selectedContent.llmSummary.keyInsights.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Key Insights:</h5>
                    <ul className="space-y-2">
                      {selectedContent.llmSummary.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedContent.llmSummary.significance && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Significance:</h5>
                    <p className="text-green-900 dark:text-green-100 leading-relaxed">{selectedContent.llmSummary.significance}</p>
                  </div>
                )}
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
      
      <div className="space-y-4">
        {content.map((item) => (
          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* AI Analysis */}
            {showAIAnalysis && visualAnalyses[item.id] && (
              <AnalysisDisplay
                analysis={visualAnalyses[item.id]!}
                isExpanded={expandedAnalysis.has(item.id)}
                onToggleExpanded={() => toggleAnalysisExpanded(item.id)}
              />
            )}
            
            {/* Generate Analysis Button */}
            {showAIAnalysis && !visualAnalyses[item.id] && !loadingAnalysis.has(item.id) && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => generateAnalysis(item)}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors text-sm"
                >
                  <Brain className="w-4 h-4" />
                  Generate AI Analysis
                </button>
              </div>
            )}
            
            {/* Loading Analysis */}
            {loadingAnalysis.has(item.id) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  <span className="text-sm">Analyzing visual content...</span>
                </div>
              </div>
            )}
            
            {/* Visual Content Item */}
            <VisualContentItem
              item={item}
              isExpanded={expandedItems.has(item.id)}
              onToggleExpand={() => toggleExpanded(item.id)}
              onOpenModal={openContentModal}
            />
          </div>
        ))}
      </div>
      
      {renderModal()}
    </div>
  )
}

export default EnhancedVisualContentRenderer
