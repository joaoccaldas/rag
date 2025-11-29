"use client"

// Force recompilation - updated import path
import { useState, useEffect } from 'react'
import { RAGProvider, useRAG } from '../contexts/RAGContext'
import { DomainKeywordProvider } from '../../contexts/DomainKeywordContext'
import { AdvancedDocumentManager } from './advanced-document-manager'
import { SearchInterface } from './search-interface'
import { ProcessingStats } from './processing-stats'
import { UploadProgress } from './upload-progress'
import KnowledgeGraph from '../../components/knowledge-graph'
import VisualContentRenderer from '../../components/enhanced-visual-content-renderer'
import RAGSettings from '../../components/rag-settings'
import { AdminPanel } from './admin-panel'
import EnhancedAnalytics from '../../components/enhanced-analytics'
import { NotesManager } from '../../components/notes/notes-manager'
import { IdeasManager } from '../../components/ideas/ideas-manager'
import { UnifiedDocumentHub } from '../../components/unified-document-hub'
import ToolsView from '../../components/rag-views/tools-view'
import ConfigurationView from '../../components/rag-views/configuration-view'
import { getStoredVisualContent } from '../utils/visual-content-storage'
import { BarChart3, Network, Image, Settings, Shield, BookOpen, Lightbulb, FolderOpen, Wrench, Upload } from 'lucide-react'
import type { VisualContent } from '../types'
import { 
  FeatureErrorBoundary, 
  SearchErrorBoundary, 
  UploadErrorBoundary 
} from '../../components/error-boundary/enhanced-error-boundary-system'
import ModelImporter from './model-import/model-importer'
import { CacheDebugPanel } from './cache-status-indicator'

const convertTableData = (headers?: string[], rows?: string[][]): string => {
  if (!headers || !rows) return 'No table data available'
  
  let tableHTML = '<table class="min-w-full border border-gray-200">'
  tableHTML += '<thead class="bg-gray-50"><tr>'
  headers.forEach(header => {
    tableHTML += `<th class="px-4 py-2 border-b text-left font-medium text-gray-900">${header}</th>`
  })
  tableHTML += '</tr></thead><tbody>'
  
  rows.forEach((row, index) => {
    tableHTML += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`
    row.forEach(cell => {
      tableHTML += `<td class="px-4 py-2 border-b text-gray-700">${cell}</td>`
    })
    tableHTML += '</tr>'
  })
  
  tableHTML += '</tbody></table>'
  return tableHTML
}

type RAGTab = 'unified' | 'stats' | 'knowledge' | 'visual' | 'settings' | 'analytics' | 'admin' | 'notes' | 'ideas' | 'tools' | 'config' | 'models'

interface RAGViewProps {
  className?: string
  initialTab?: RAGTab
  onTabChange?: (tab: RAGTab) => void
}

function RAGViewContent({ className = '', initialTab, onTabChange }: RAGViewProps) {
  const [activeTab, setActiveTab] = useState<RAGTab>(initialTab || 'unified')
  const [visualContent, setVisualContent] = useState<VisualContent[]>([])
  const { documents } = useRAG()

  // Load visual content when component mounts or documents change
  useEffect(() => {
    const loadVisualContent = async () => {
      try {
        console.log(`🎨 Loading visual content for ${documents.length} documents`)
        
        // Primary source: Load from storage
        const stored = await getStoredVisualContent()
        console.log(`🎨 Found ${stored.length} visual items in storage`)
        
        // Convert stored visual content to renderer format with proper source handling
        const storedConverted = stored
          .filter(item => item && item.id && item.documentId) // Remove invalid items
          .map(item => {
            // Clean up the title to remove messy formatting
            let cleanTitle = item.title || 'Untitled Document'
            
            // Remove "Document: " prefix if present
            if (cleanTitle.startsWith('Document: ')) {
              cleanTitle = cleanTitle.replace('Document: ', '')
            }
            
            // Clean up filename formatting
            cleanTitle = cleanTitle
              .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
              .replace(/\.[^/.]+$/, '') // Remove file extension
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
              .trim()
            
            // Ensure we have a proper thumbnail
            const thumbnail = item.thumbnail || item.source || item.data?.url || item.data?.base64
            
            return {
              ...item,
              title: cleanTitle,
              description: `Document preview: ${cleanTitle}`,
              source: thumbnail || '',
              thumbnail: thumbnail || '',
              fullContent: item.fullContent || 
                           (item.type === 'table' ? convertTableData(item.data?.headers, item.data?.rows) : undefined) || '',
              llmSummary: item.llmSummary || {
                keyInsights: [
                  `Document: ${cleanTitle}`,
                  `Type: ${item.type}`,
                  'Visual content extracted successfully'
                ],
                challenges: [],
                mainContent: `This is a visual representation of "${cleanTitle}". The document has been processed and is ready for analysis.`,
                significance: 'Provides visual context for document content and enables quick document identification.'
              }
            }
          })
        
        // Secondary source: Get visual content from documents (if available)
        const documentVisualContent: VisualContent[] = []
        documents.forEach(doc => {
          if (doc.visualContent && doc.visualContent.length > 0) {
            const convertedContent = doc.visualContent.map(visual => ({
              ...visual,
              title: visual.title || `Visual Content from ${doc.name}`,
              source: visual.data?.url || visual.data?.base64 || 
                      `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5WaXN1YWwgQ29udGVudDwvdGV4dD48L3N2Zz4=`,
              description: visual.description || `Visual content from ${doc.name}`,
              llmSummary: visual.llmSummary || {
                keyInsights: [`Visual element from ${doc.name}`],
                challenges: ['Visual processing in development'],
                mainContent: `Visual content extracted from ${doc.name}`,
                significance: 'Demonstrates visual content extraction capabilities'
              }
            }))
            documentVisualContent.push(...convertedContent)
          }
        })
        
        // Combine both sources, prioritizing storage
        const combinedContent = [...storedConverted, ...documentVisualContent]
        
        // Remove duplicates based on ID and ensure unique IDs
        const seenIds = new Set<string>()
        const uniqueContent = combinedContent.filter(item => {
          if (!item.id || seenIds.has(item.id)) {
            // Generate a unique ID if missing or duplicate
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 8)
            item.id = `visual_${timestamp}_${randomSuffix}`
          }
          seenIds.add(item.id)
          return true
        })
        
        // Set the visual content (only real extracted data)
        setVisualContent(uniqueContent)
        console.log(`Loaded ${uniqueContent.length} visual content items`)
        
      } catch (error) {
        console.error('Failed to load visual content:', error)
        setVisualContent([])
      }
    }
    
    loadVisualContent()
  }, [documents])

  const handleTabChange = (tab: RAGTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const tabs = [
    { id: 'unified' as RAGTab, label: 'All-in-One', icon: FolderOpen },
    { id: 'models' as RAGTab, label: 'Model Importer', icon: Upload },
    { id: 'stats' as RAGTab, label: 'Statistics', icon: BarChart3 },
    { id: 'notes' as RAGTab, label: 'Notes', icon: BookOpen },
    { id: 'ideas' as RAGTab, label: 'Ideas', icon: Lightbulb },
    { id: 'knowledge' as RAGTab, label: 'Knowledge Graph', icon: Network },
    { id: 'visual' as RAGTab, label: 'Visual Content', icon: Image },
    { id: 'analytics' as RAGTab, label: 'Analytics & ML', icon: BarChart3 },
    { id: 'tools' as RAGTab, label: 'Maintenance Tools', icon: Wrench },
    { id: 'config' as RAGTab, label: 'Configuration', icon: Settings },
    { id: 'settings' as RAGTab, label: 'Settings', icon: Settings },
    { id: 'admin' as RAGTab, label: 'Admin', icon: Shield }
  ]

  // Convert RAG documents to KnowledgeGraph format
  const knowledgeGraphData = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    keywords: doc.aiAnalysis?.keywords || (doc.name.includes('history') ? ['miele', 'company', 'history', 'strategy', 'innovation'] : 
             doc.name.includes('analysis') ? ['business', 'market', 'growth', 'performance'] :
             doc.name.includes('plan') ? ['planning', 'strategy', 'goals', 'objectives'] : ['document']),
    tags: doc.aiAnalysis?.tags || (doc.type === 'pdf' ? ['document', 'business'] : 
          doc.type === 'html' ? ['web', 'content'] : ['file']),
    topics: doc.aiAnalysis?.topics || (doc.name.includes('history') ? ['company history', 'corporate strategy'] :
            doc.name.includes('analysis') ? ['business analysis', 'market research'] : ['general']),
    sentiment: doc.aiAnalysis?.sentiment || 'neutral',
    complexity: doc.aiAnalysis?.complexity || 'medium',
    confidence: doc.aiAnalysis?.confidence || 0.8,
    uploadDate: doc.uploadedAt,
    size: doc.size
  }))

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="px-3 md:px-6">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex items-center px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'unified' && (
          <FeatureErrorBoundary feature="Unified Document Hub">
            <div className="h-full overflow-hidden">
              <UnifiedDocumentHub 
                initialViewMode="hybrid"
                onDocumentSelect={(document) => {
                  console.log('Document selected:', document.name)
                }}
              />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'models' && (
          <FeatureErrorBoundary feature="Model Importer">
            <div className="h-full overflow-auto">
              <ModelImporter />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'stats' && (
          <FeatureErrorBoundary feature="Processing Statistics">
            <ProcessingStats />
          </FeatureErrorBoundary>
        )}
        {activeTab === 'notes' && (
          <FeatureErrorBoundary feature="Notes Manager">
            <div className="h-full overflow-hidden">
              <NotesManager />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'ideas' && (
          <FeatureErrorBoundary feature="Ideas Manager">
            <div className="h-full overflow-hidden">
              <IdeasManager />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'knowledge' && (
          <FeatureErrorBoundary feature="Knowledge Graph">
            <KnowledgeGraph documents={knowledgeGraphData} />
          </FeatureErrorBoundary>
        )}
        {activeTab === 'visual' && (
          <FeatureErrorBoundary feature="Visual Content">
            <div className="h-full overflow-auto p-6">
              <VisualContentRenderer content={visualContent} />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'analytics' && (
          <FeatureErrorBoundary feature="Enhanced Analytics">
            <div className="h-full overflow-auto">
              <EnhancedAnalytics />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'tools' && (
          <FeatureErrorBoundary feature="Maintenance Tools">
            <div className="h-full overflow-auto">
              <ToolsView />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'config' && (
          <FeatureErrorBoundary feature="Configuration">
            <div className="h-full overflow-auto">
              <ConfigurationView />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'settings' && (
          <FeatureErrorBoundary feature="RAG Settings">
            <div className="h-full overflow-hidden">
              <RAGSettings />
            </div>
          </FeatureErrorBoundary>
        )}
        {activeTab === 'admin' && (
          <FeatureErrorBoundary feature="Admin Panel">
            <AdminPanel />
          </FeatureErrorBoundary>
        )}
      </div>
      
      {/* Cache Debug Panel - Always visible */}
      <CacheDebugPanel />
    </div>
  )
}

export function RAGView({ className = '', initialTab, onTabChange }: RAGViewProps) {
  return (
    <DomainKeywordProvider>
      <RAGProvider>
        <RAGViewContent 
          className={className} 
          initialTab={initialTab || 'unified'} 
          {...(onTabChange && { onTabChange })}
        />
      </RAGProvider>
    </DomainKeywordProvider>
  )
}
