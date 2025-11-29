"use client"

import { useState, useEffect } from 'react'
import { X, FileText, Image as ImageIcon, BarChart3, Table, Eye, Download, Search, Grid, List, ChevronLeft, ChevronRight, Trash2, RefreshCw, Brain, Lightbulb } from 'lucide-react'
import { getStoredVisualContent } from '../rag/utils/visual-content-storage'
import { deduplicateIds, useHydrationSafe, HydrationBoundary, useBrowserExtensionCleanup, generateHydrationSafeId } from '../utils/hydration-fix'

interface VisualAnalysis {
  mainNumbers: string[]
  keyFindings: string[]
  businessMessage: string
  businessDrivers: string[]
  context: string
  recommendations: string[]
  trends: string[]
  confidence?: number
  metadata: {
    analysisDate: string
    confidence: number
    keywords: string[]
  }
}

interface DocumentAnalysis {
  executiveSummary: string
  mainMessages: string[]
  businessRecommendations: string[]
  businessDrivers: string[]
  contextualFactors: string[]
  followUpActions: string[]
  keyInsights: string[]
  confidence?: number
  priority?: 'high' | 'medium' | 'low'
  metadata: {
    analysisDate: string
    confidence: number
    keywords: string[]
    documentType: string
    priority: 'high' | 'medium' | 'low'
  }
}

interface VisualElement {
  id: string
  type: 'image' | 'chart' | 'graph' | 'table' | 'diagram' | 'infographic'
  content: string
  description: string
  metadata: {
    documentTitle: string
    documentId: string
    pageNumber?: number
    position?: { x: number; y: number; width: number; height: number }
    extractedText?: string
    dataValues?: Record<string, unknown>[]
  }
  thumbnailUrl?: string
  fullUrl?: string
  createdAt: string
  analysis?: VisualAnalysis
  documentAnalysis?: DocumentAnalysis
}

interface VisualContentLibraryProps {
  isOpen: boolean
  onClose: () => void
  filterByDocument?: string
  filterByType?: string
}

// Utility function to generate fallback visual analysis when AI service is unavailable
function generateFallbackVisualAnalysis(element: VisualElement): VisualAnalysis {
  const typeSpecificAnalysis = {
    chart: {
      mainNumbers: ['Data visualization', 'Chart analysis'],
      keyFindings: ['Visual representation of data trends', 'Comparative analysis'],
      businessMessage: `This chart provides visual insights from ${element.metadata.documentTitle}`,
      businessDrivers: ['Data-driven decision making', 'Performance tracking'],
      recommendations: ['Review underlying data', 'Compare with historical trends', 'Consider external factors']
    },
    graph: {
      mainNumbers: ['Graph data points', 'Trend analysis'],
      keyFindings: ['Relationship patterns', 'Data correlations'],
      businessMessage: `Graph showing relationships and trends from ${element.metadata.documentTitle}`,
      businessDrivers: ['Performance monitoring', 'Trend identification'],
      recommendations: ['Analyze growth patterns', 'Identify anomalies', 'Plan strategic actions']
    },
    table: {
      mainNumbers: ['Structured data', 'Multiple data points'],
      keyFindings: ['Organized information', 'Comparative values'],
      businessMessage: `Table containing structured data from ${element.metadata.documentTitle}`,
      businessDrivers: ['Data organization', 'Reference material'],
      recommendations: ['Review data accuracy', 'Compare across periods', 'Extract key metrics']
    },
    image: {
      mainNumbers: ['Visual content', 'Image analysis'],
      keyFindings: ['Visual information', 'Context representation'],
      businessMessage: `Image providing visual context from ${element.metadata.documentTitle}`,
      businessDrivers: ['Visual communication', 'Documentation'],
      recommendations: ['Analyze visual elements', 'Consider context', 'Review relevance']
    },
    diagram: {
      mainNumbers: ['Process visualization', 'Flow analysis'],
      keyFindings: ['Process relationships', 'System overview'],
      businessMessage: `Diagram illustrating processes from ${element.metadata.documentTitle}`,
      businessDrivers: ['Process optimization', 'System understanding'],
      recommendations: ['Review process steps', 'Identify bottlenecks', 'Optimize workflow']
    },
    infographic: {
      mainNumbers: ['Information summary', 'Key statistics'],
      keyFindings: ['Summarized insights', 'Visual communication'],
      businessMessage: `Infographic summarizing key information from ${element.metadata.documentTitle}`,
      businessDrivers: ['Knowledge sharing', 'Communication efficiency'],
      recommendations: ['Extract key points', 'Share insights', 'Apply learnings']
    }
  }

  const analysis = typeSpecificAnalysis[element.type] || typeSpecificAnalysis.image

  return {
    ...analysis,
    context: `Analysis based on ${element.type} from document: ${element.metadata.documentTitle}`,
    trends: ['Offline analysis', 'Manual review required'],
    confidence: 0.6,
    metadata: {
      analysisDate: new Date().toISOString(),
      confidence: 0.6,
      keywords: [element.type, 'visual content', 'document analysis', 'fallback']
    }
  }
}

export function VisualContentLibrary({ isOpen, onClose, filterByDocument, filterByType }: VisualContentLibraryProps) {
  const [visualElements, setVisualElements] = useState<VisualElement[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>(filterByType || 'all')
  const [selectedDocument, setSelectedDocument] = useState<string>(filterByDocument || 'all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedElement, setSelectedElement] = useState<VisualElement | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Record<string, { visualAnalysis?: VisualAnalysis; documentAnalysis?: DocumentAnalysis }>>({})

  const itemsPerPage = 12
  
  // Hydration safety and browser extension cleanup
  const hasMounted = useHydrationSafe()
  const containerRef = useState<HTMLDivElement | null>(null)
  useBrowserExtensionCleanup({ current: containerRef[0] })

  // Generate truly unique ID using hydration-safe method
  const generateUniqueId = (baseId: string, index: number, elementData?: { 
    metadata?: { documentTitle?: string; pageNumber?: number }; 
    type?: string 
  }): string => {
    // Use deterministic ID generation that includes more context
    const contextParts = [
      baseId || 'visual',
      index,
      elementData?.metadata?.documentTitle || 'doc',
      elementData?.type || 'unknown',
      elementData?.metadata?.pageNumber || 0
    ];
    
    return generateHydrationSafeId('visual', ...contextParts);
  }

  // Load visual content from storage
  const loadVisualContent = async () => {
    setLoading(true)
    try {
      const content = await getStoredVisualContent()
      
      if (!content || content.length === 0) {
        console.log('No visual content found in storage')
        setVisualElements([])
        return
      }

      // Transform content to visual elements
      const elements = content.map((item, index) => {
        // Create a more robust unique ID to prevent duplicates
        const uniqueId = item.id || generateUniqueId('visual', index, item)
        
        // Get thumbnail URL with fallback and validation
        let thumbnailUrl = ''
        let fullUrl = ''
        
        // Helper function to validate if an API URL actually works
        const isValidApiUrl = async (url: string): Promise<boolean> => {
          if (!url.startsWith('/api/visual-content/')) return true
          try {
            const response = await fetch(url, { method: 'HEAD' })
            return response.ok
          } catch {
            return false
          }
        }
        
        if (item.thumbnail && item.thumbnail.startsWith('data:')) {
          thumbnailUrl = item.thumbnail
          fullUrl = item.thumbnail
        } else if (item.source && typeof item.source === 'string' && item.source.startsWith('data:')) {
          thumbnailUrl = item.source
          fullUrl = item.source
        } else if (item.data?.base64 && item.data.base64.startsWith('data:')) {
          thumbnailUrl = item.data.base64
          fullUrl = item.data.base64
        } else if (item.data?.url && item.data.url.startsWith('data:')) {
          thumbnailUrl = item.data.url
          fullUrl = item.data.url
        } else if (item.data?.url && item.data.url.startsWith('/api/visual-content/')) {
          // API URL - use but will fallback to placeholder in img onError
          thumbnailUrl = item.data.url
          fullUrl = item.data.url
        } else if (item.thumbnail && item.thumbnail.startsWith('/api/visual-content/')) {
          // API URL - use but will fallback to placeholder in img onError
          thumbnailUrl = item.thumbnail
          fullUrl = item.thumbnail
        } else if (item.source && typeof item.source === 'string' && item.source.startsWith('/api/visual-content/')) {
          // API URL - use but will fallback to placeholder in img onError
          thumbnailUrl = item.source
          fullUrl = item.source
        } else if (item.data?.url) {
          thumbnailUrl = item.data.url
          fullUrl = item.data.url
        } else {
          // Generate placeholder SVG
          const iconMap: Record<string, string> = {
            chart: '📊', table: '📋', graph: '📈', image: '🖼️', diagram: '📐'
          }
          const icon = iconMap[item.type] || '📄'
          const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="150" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" rx="8"/>
            <text x="100" y="80" font-family="Arial" font-size="24" text-anchor="middle" fill="#64748b">${icon}</text>
            <text x="100" y="110" font-family="Arial" font-size="12" text-anchor="middle" fill="#94a3b8">
              ${item.type.toUpperCase()}
            </text>
          </svg>`
          
          // Use URL encoding for SVG data URLs - more reliable for Unicode
          const encodedSvg = encodeURIComponent(svg)
          const dataUrl = `data:image/svg+xml,${encodedSvg}`
          thumbnailUrl = dataUrl
          fullUrl = dataUrl
        }

        return {
          id: uniqueId,
          type: item.type as VisualElement['type'],
          content: typeof item.fullContent === 'string' ? item.fullContent : 
                   typeof item.description === 'string' ? item.description : 'Visual content',
          description: item.description || `${item.type} from ${item.metadata?.documentTitle || 'unknown document'}`,
          metadata: {
            documentTitle: item.metadata?.documentTitle || 'Unknown Document',
            documentId: item.documentId,
            pageNumber: item.metadata?.pageNumber || 1,
            position: item.metadata?.boundingBox ? {
              x: item.metadata.boundingBox.x,
              y: item.metadata.boundingBox.y,
              width: item.metadata.boundingBox.width,
              height: item.metadata.boundingBox.height
            } : {
              x: 0,
              y: 0,
              width: 100,
              height: 100
            },
            extractedText: item.metadata?.extractedText || '',
            dataValues: item.data ? [item.data] : []
          },
          thumbnailUrl,
          fullUrl,
          createdAt: item.metadata?.extractedAt || new Date().toISOString()
        }
      })

      // Use hydration-safe deduplication to prevent React key conflicts and hydration mismatches
      const deduplicatedElements = deduplicateIds(elements, (element, index) => 
        generateHydrationSafeId(
          'visual', 
          element.metadata?.documentTitle || 'doc',
          element.type || 'unknown',
          element.metadata?.pageNumber || 0,
          index,
          element.description || 'content'
        )
      )

      console.log('Processed visual elements:', deduplicatedElements)
      setVisualElements(deduplicatedElements)
      
    } catch (error) {
      console.error('Error loading visual content:', error)
      setVisualElements([])
    } finally {
      setLoading(false)
    }
  }

  // Clear storage function
  const clearStorageAndRefresh = async () => {
    try {
      // Clear localStorage visual content
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('visual') || key.includes('rag') || key.includes('miele')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear state
      setVisualElements([])
      
      // Reload
      await loadVisualContent()
      
      console.log('✅ Storage cleared and refreshed')
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  }

  // AI Analysis function for visual content and documents
  const analyzeVisualContent = async (element: VisualElement): Promise<VisualElement> => {
    try {
      // Create analysis prompt for visual content
      const visualPrompt = `Analyze this ${element.type} from document "${element.metadata.documentTitle}":

Content: ${element.content}
Description: ${element.description}
Extracted Text: ${element.metadata.extractedText || 'None'}
Data Values: ${element.metadata.dataValues ? JSON.stringify(element.metadata.dataValues, null, 2) : 'None'}

Please provide a business-focused analysis with:
1. Main numbers and key data points
2. Primary business message and insights
3. Business drivers and strategic implications
4. Contextual factors affecting interpretation
5. Specific recommendations for action
6. Trends or patterns visible
7. Relevant keywords for search and categorization

Format your response as JSON with this structure:
{
  "mainNumbers": ["key figure 1", "key figure 2"],
  "keyFindings": ["finding 1", "finding 2"],
  "businessMessage": "core message",
  "businessDrivers": ["driver 1", "driver 2"],
  "context": "contextual background",
  "recommendations": ["action 1", "action 2"],
  "trends": ["trend 1", "trend 2"],
  "metadata": {
    "confidence": 0.85,
    "keywords": ["keyword1", "keyword2"]
  }
}`

      // Document analysis prompt
      const documentPrompt = `Analyze the document "${element.metadata.documentTitle}" and provide:

1. Executive summary of the document
2. Main messages and key points
3. Business recommendations for stakeholders
4. Critical business drivers identified
5. Contextual factors for interpretation
6. Follow-up actions required
7. Key insights for decision making
8. Document type and priority level

Format as JSON:
{
  "executiveSummary": "summary",
  "mainMessages": ["message 1", "message 2"],
  "businessRecommendations": ["rec 1", "rec 2"],
  "businessDrivers": ["driver 1", "driver 2"],
  "contextualFactors": ["factor 1", "factor 2"],
  "followUpActions": ["action 1", "action 2"],
  "keyInsights": ["insight 1", "insight 2"],
  "metadata": {
    "confidence": 0.85,
    "keywords": ["keyword1", "keyword2"],
    "documentType": "report/presentation/analysis",
    "priority": "high/medium/low"
  }
}`

      // Call AI API for visual analysis with fallback
      let visualResponse: Response
      try {
        visualResponse = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: visualPrompt,
            type: 'visual-analysis',
            elementId: element.id
          })
        })
      } catch (error) {
        console.warn('AI service unavailable, using fallback analysis:', error)
        // Create mock response for fallback
        visualResponse = new Response(JSON.stringify({
          analysis: generateFallbackVisualAnalysis(element)
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      // Call AI API for document analysis with proper error handling
      let documentResponse
      try {
        documentResponse = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.1:70b',
            prompt: `Analyze this document content for business insights: ${element.description}`,
            type: 'document-analysis',
            temperature: 0.3,
            max_tokens: 1000
          })
        })

        if (!documentResponse.ok) {
          throw new Error(`AI service returned ${documentResponse.status}`)
        }
      } catch (error) {
        console.warn('AI service unavailable for document analysis, using fallback:', error)
        // Create mock response for fallback
        documentResponse = new Response(JSON.stringify({
          response: JSON.stringify({
            summary: "Document processed - AI analysis pending",
            keyPoints: ["Content extracted successfully", "Awaiting AI service connection"],
            recommendations: ["Verify AI service status", "Retry analysis when available"],
            businessDrivers: ["Content processing", "System connectivity"],
            context: "Fallback processing while AI service initializes",
            insights: ["Document ready for analysis"],
            metadata: {
              confidence: 0.1,
              keywords: ["document", "pending", "analysis"]
            }
          })
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      let visualAnalysis: VisualAnalysis | undefined
      let documentAnalysis: DocumentAnalysis | undefined

      if (visualResponse.ok) {
        const visualData = await visualResponse.json()
        if (visualData.analysis) {
          visualAnalysis = {
            ...visualData.analysis,
            metadata: {
              ...visualData.analysis.metadata,
              analysisDate: new Date().toISOString()
            }
          }
        }
      }

      if (documentResponse.ok) {
        const documentData = await documentResponse.json()
        if (documentData.analysis) {
          documentAnalysis = {
            ...documentData.analysis,
            metadata: {
              ...documentData.analysis.metadata,
              analysisDate: new Date().toISOString()
            }
          }
        }
      }

      // Return element with analysis data
      const updatedElement: VisualElement = {
        ...element,
        ...(visualAnalysis && { analysis: visualAnalysis }),
        ...(documentAnalysis && { documentAnalysis: documentAnalysis })
      }
      
      return updatedElement

    } catch (error) {
      console.error('Error analyzing visual content:', error)
      return element // Return original element if analysis fails
    }
  }

  // Analyze all visual elements
  const analyzeAllVisualContent = async () => {
    if (visualElements.length === 0) return

    setLoading(true)
    try {
      const newAnalysisResults: Record<string, { visualAnalysis?: VisualAnalysis; documentAnalysis?: DocumentAnalysis }> = {}
      
      const analyzedElements = await Promise.all(
        visualElements.map(async element => {
          if (element.analysis && element.documentAnalysis) {
            // Already analyzed - preserve existing analysis
            newAnalysisResults[element.id] = {
              visualAnalysis: element.analysis,
              documentAnalysis: element.documentAnalysis
            }
            return element
          } else {
            // Analyze this element
            const analyzedElement = await analyzeVisualContent(element)
            const analysisData: { visualAnalysis?: VisualAnalysis; documentAnalysis?: DocumentAnalysis } = {}
            
            if (analyzedElement.analysis) {
              analysisData.visualAnalysis = analyzedElement.analysis
            }
            if (analyzedElement.documentAnalysis) {
              analysisData.documentAnalysis = analyzedElement.documentAnalysis
            }
            
            newAnalysisResults[element.id] = analysisData
            return analyzedElement
          }
        })
      )
      
      // Update both the elements and the analysis results
      setVisualElements(analyzedElements)
      setAnalysisResults(prev => ({ ...prev, ...newAnalysisResults }))
      
      // Store analyzed content back to localStorage
      const storageKey = 'miele-visual-content-analyzed'
      // Use unlimited storage instead of localStorage to prevent QuotaExceededError
      try {
        const { UnlimitedRAGStorage } = await import('../storage/unlimited-rag-storage')
        const storage = new UnlimitedRAGStorage()
        await storage.storeVisualContent(analyzedElements)
        console.log('✅ All visual content analyzed and stored in unlimited storage')
      } catch (storageError) {
        console.warn('Failed to store in unlimited storage, falling back to memory only:', storageError)
      }
      
      console.log('✅ All visual content analyzed and stored in state')
    } catch (error) {
      console.error('Error analyzing visual content:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadVisualContent()
    }
  }, [isOpen])

  // Filter elements
  const filteredElements = visualElements.filter(element => {
    const matchesSearch = searchTerm === '' || 
      element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.metadata.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (element.metadata.extractedText && element.metadata.extractedText.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || element.type === selectedType
    const matchesDocument = selectedDocument === 'all' || element.metadata.documentId === selectedDocument
    
    return matchesSearch && matchesType && matchesDocument
  })

  // Pagination
  const totalPages = Math.ceil(filteredElements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentElements = filteredElements.slice(startIndex, endIndex)

  // Get unique document titles for filter
  const documentTitles = Array.from(new Set(visualElements.map(el => el.metadata.documentTitle)))

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'chart': case 'graph': return <BarChart3 className="w-4 h-4" />
      case 'table': return <Table className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const openPreview = (element: VisualElement) => {
    setSelectedElement(element)
    setShowPreview(true)
  }

  const closePreview = () => {
    setSelectedElement(null)
    setShowPreview(false)
  }

  const downloadElement = (element: VisualElement) => {
    if (element.fullUrl) {
      const link = document.createElement('a')
      link.href = element.fullUrl
      link.download = `${element.metadata.documentTitle}_${element.type}_${element.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!isOpen) return null

  return (
    <HydrationBoundary fallback={<div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <div ref={(el) => containerRef[1](el)}>
        {/* Modal Overlay */}
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="fixed inset-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Visual Content Library ({visualElements.length})
              </h2>
              {loading && (
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={analyzeAllVisualContent}
                disabled={loading || visualElements.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                AI Analysis
              </button>
              <button
                onClick={clearStorageAndRefresh}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
              <button
                onClick={loadVisualContent}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search visual content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="chart">Charts</option>
                <option value="graph">Graphs</option>
                <option value="table">Tables</option>
                <option value="diagram">Diagrams</option>
              </select>

              {/* Document Filter */}
              <select
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Documents</option>
                {documentTitles.map((title, index) => (
                  <option key={index} value={title}>{title}</option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading visual content...</p>
                </div>
              </div>
            ) : currentElements.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Visual Content Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {filteredElements.length === 0 && visualElements.length > 0 
                      ? 'No content matches your current filters'
                      : 'No visual content has been processed yet'}
                  </p>
                  {visualElements.length === 0 && (
                    <button
                      onClick={clearStorageAndRefresh}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Clear Cache & Refresh
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentElements.map((element) => (
                      <div key={element.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative group">
                          <img
                            src={element.thumbnailUrl}
                            alt={element.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              console.warn('Image failed to load:', element.thumbnailUrl)
                              
                              // Generate type-specific fallback icon
                              const iconMap: Record<string, string> = {
                                chart: '📊', table: '📋', graph: '📈', image: '🖼️', diagram: '📐'
                              }
                              const icon = iconMap[element.type] || '📄'
                              
                              const errorSvg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                                <rect width="200" height="150" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" rx="8"/>
                                <text x="100" y="70" font-family="Arial" font-size="32" text-anchor="middle" fill="#64748b">${icon}</text>
                                <text x="100" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#94a3b8">${element.type.toUpperCase()}</text>
                                <text x="100" y="120" font-family="Arial" font-size="10" text-anchor="middle" fill="#94a3b8">Preview Unavailable</text>
                              </svg>`
                              target.src = `data:image/svg+xml,${encodeURIComponent(errorSvg)}`
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openPreview(element)}
                                className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadElement(element)}
                                className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(element.type)}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {element.type}
                            </span>
                            {element.analysis && (
                              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                AI Analyzed
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                            {element.description}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {element.metadata.documentTitle}
                          </p>
                          {element.metadata.pageNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Page {element.metadata.pageNumber}
                            </p>
                          )}
                          
                          {/* AI Analysis Summary */}
                          {element.analysis && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Business Message:
                              </div>
                              <p className="text-blue-800 dark:text-blue-200 line-clamp-2">
                                {element.analysis.businessMessage}
                              </p>
                              {element.analysis.mainNumbers.length > 0 && (
                                <div className="mt-1">
                                  <span className="font-medium text-blue-900 dark:text-blue-100">Key Numbers: </span>
                                  <span className="text-blue-800 dark:text-blue-200">
                                    {element.analysis.mainNumbers.slice(0, 2).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Document Analysis Summary */}
                          {element.documentAnalysis && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                              <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                                Document Summary:
                              </div>
                              <p className="text-purple-800 dark:text-purple-200 line-clamp-2">
                                {element.documentAnalysis.executiveSummary}
                              </p>
                              {element.documentAnalysis.metadata.priority && (
                                <div className="mt-1">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    element.documentAnalysis.metadata.priority === 'high' 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : element.documentAnalysis.metadata.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {element.documentAnalysis.metadata.priority.toUpperCase()} Priority
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-2">
                    {currentElements.map((element) => (
                      <div key={element.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={element.thumbnailUrl}
                              alt={element.description}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(element.type)}
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {element.type}
                              </span>
                              {element.analysis && (
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                  AI Analyzed
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {element.description}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {element.metadata.documentTitle}
                              {element.metadata.pageNumber && ` • Page ${element.metadata.pageNumber}`}
                            </p>
                            
                            {/* AI Analysis Summary in List View */}
                            <div className="mt-2 flex gap-2">
                              {element.analysis && (
                                <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    Business Message:
                                  </div>
                                  <p className="text-blue-800 dark:text-blue-200 line-clamp-1">
                                    {element.analysis.businessMessage}
                                  </p>
                                  {element.analysis.mainNumbers.length > 0 && (
                                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                                      Key: {element.analysis.mainNumbers.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {element.documentAnalysis && (
                                <div className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                                  <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                                    Document Priority:
                                  </div>
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    element.documentAnalysis.metadata.priority === 'high' 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : element.documentAnalysis.metadata.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {element.documentAnalysis.metadata.priority?.toUpperCase() || 'UNKNOWN'}
                                  </span>
                                  <p className="text-purple-800 dark:text-purple-200 line-clamp-1 mt-1">
                                    {element.documentAnalysis.executiveSummary}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPreview(element)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadElement(element)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredElements.length)} of {filteredElements.length} items
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedElement && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-75 flex items-center justify-center backdrop-blur-sm" onClick={closePreview}>
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] w-full h-full m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getTypeIcon(selectedElement.type)}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedElement.description}
                </h3>
              </div>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="flex flex-col items-center">
                <img
                  src={selectedElement.fullUrl}
                  alt={selectedElement.description}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="mt-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    From: {selectedElement.metadata.documentTitle}
                    {selectedElement.metadata.pageNumber && ` (Page ${selectedElement.metadata.pageNumber})`}
                  </p>
                  {selectedElement.metadata.extractedText && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 max-w-2xl">
                      {selectedElement.metadata.extractedText}
                    </p>
                  )}
                </div>

                {/* AI Analysis Section */}
                {(analysisResults[selectedElement.id]?.visualAnalysis || analysisResults[selectedElement.id]?.documentAnalysis) && (
                  <div className="mt-6 w-full max-w-4xl">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      AI Analysis Results
                    </h4>
                    
                    {/* Visual Analysis */}
                    {(() => {
                      const analysis = analysisResults[selectedElement.id]?.visualAnalysis
                      if (!analysis) return null
                      
                      return (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Visual Content Analysis
                            {analysis.confidence && (
                              <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded-full">
                                {Math.round(analysis.confidence * 100)}% confidence
                              </span>
                            )}
                          </h5>
                          
                          {/* Main Numbers */}
                          {analysis.mainNumbers && analysis.mainNumbers.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Numbers:</h6>
                              <div className="flex flex-wrap gap-2">
                                {analysis.mainNumbers.map((number, index) => (
                                  <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                    {number}
                                </span>
                              ))}
                            </div>
                          </div>
                          )}

                          {/* Business Message */}
                          {analysis.businessMessage && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Main Message:</h6>
                              <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                                {analysis.businessMessage}
                              </p>
                            </div>
                          )}

                          {/* Business Drivers */}
                          {analysis.businessDrivers && analysis.businessDrivers.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Business Drivers:</h6>
                              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {analysis.businessDrivers.map((driver, index) => (
                                  <li key={index}>{driver}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Trends */}
                          {analysis.trends && analysis.trends.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Trends Identified:</h6>
                              <div className="flex flex-wrap gap-2">
                                {analysis.trends.map((trend, index) => (
                                  <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-sm">
                                    {trend}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Context */}
                        {analysis.context && (
                          <div className="mb-4">
                            <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Context:</h6>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {analysis.context}
                            </p>
                          </div>
                        )}

                        {/* Metadata Keywords */}
                        {analysis.metadata?.keywords && analysis.metadata.keywords.length > 0 && (
                          <div>
                            <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Keywords:</h6>
                            <div className="flex flex-wrap gap-1">
                              {analysis.metadata.keywords.map((keyword, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                      )
                    })()}

                    {/* Document Analysis */}
                    {(() => {
                      const docAnalysis = analysisResults[selectedElement.id]?.documentAnalysis
                      if (!docAnalysis) return null
                      
                      return (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Document Analysis
                            {docAnalysis.confidence && (
                              <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 rounded-full">
                                {Math.round(docAnalysis.confidence * 100)}% confidence
                              </span>
                            )}
                            {docAnalysis.priority && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                docAnalysis.priority === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                                docAnalysis.priority === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                                'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              }`}>
                                {docAnalysis.priority} priority
                              </span>
                            )}
                          </h5>

                          {/* Executive Summary */}
                          {docAnalysis.executiveSummary && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Executive Summary:</h6>
                              <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                                {docAnalysis.executiveSummary}
                              </p>
                            </div>
                          )}

                          {/* Business Recommendations */}
                          {docAnalysis.businessRecommendations && docAnalysis.businessRecommendations.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Business Recommendations:</h6>
                              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {docAnalysis.businessRecommendations.map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Insights */}
                          {docAnalysis.keyInsights && docAnalysis.keyInsights.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Insights:</h6>
                              <div className="space-y-2">
                                {docAnalysis.keyInsights.map((insight, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 text-sm">{insight}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up Actions */}
                          {docAnalysis.followUpActions && docAnalysis.followUpActions.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Follow-up Actions:</h6>
                              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {docAnalysis.followUpActions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Business Context */}
                          {docAnalysis.contextualFactors && docAnalysis.contextualFactors.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Contextual Factors:</h6>
                              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {docAnalysis.contextualFactors.map((factor, index) => (
                                  <li key={index}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Metadata Keywords */}
                          {docAnalysis.metadata?.keywords && docAnalysis.metadata.keywords.length > 0 && (
                            <div>
                              <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Document Keywords:</h6>
                              <div className="flex flex-wrap gap-1">
                                {docAnalysis.metadata.keywords.map((keyword, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </HydrationBoundary>
  )
}
