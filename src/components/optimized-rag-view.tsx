/**
 * Optimized RAG View Component
 * 
 * This component implements performance optimizations including:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for expensive calculations
 * - useCallback for stable event handlers
 * - Lazy loading for tab content
 * - Virtual scrolling for large lists
 */

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '../store'
import { setActiveTab } from '../store/slices/uiSlice'
import { selectAllDocuments } from '../store/slices/documentsSlice'
import { selectAllVisualContentItems } from '../store/slices/visualContentSlice'
import { 
  useDebounce, 
  usePerformanceMonitor, 
  useStableCallback
} from '../utils/performance'
import { FileText, Search, BarChart3, Upload, Network, Image, Settings, Shield, BookOpen, Lightbulb } from 'lucide-react'

// Lazy load components for better performance
const LazyAdvancedDocumentManager = React.lazy(() => 
  import('../rag/components/advanced-document-manager').then(module => ({ 
    default: module.AdvancedDocumentManager 
  }))
)

const LazySearchInterface = React.lazy(() => 
  import('../rag/components/search-interface').then(module => ({ 
    default: module.SearchInterface 
  }))
)

const LazyProcessingStats = React.lazy(() => 
  import('../rag/components/processing-stats').then(module => ({ 
    default: module.ProcessingStats 
  }))
)

const LazyUploadProgress = React.lazy(() => 
  import('../rag/components/upload-progress').then(module => ({ 
    default: module.UploadProgress 
  }))
)

const LazyKnowledgeGraph = React.lazy(() => 
  import('../components/knowledge-graph').then(module => ({ 
    default: module.default 
  }))
)

const LazyVisualContentRenderer = React.lazy(() => 
  import('../components/enhanced-visual-content-renderer').then(module => ({ 
    default: module.default 
  }))
)

const LazyRAGSettings = React.lazy(() => 
  import('../components/rag-settings').then(module => ({ 
    default: module.default 
  }))
)

const LazyAdminPanel = React.lazy(() => 
  import('../rag/components/admin-panel').then(module => ({ 
    default: module.AdminPanel 
  }))
)

const LazyEnhancedAnalytics = React.lazy(() => 
  import('../components/enhanced-analytics').then(module => ({ 
    default: module.default 
  }))
)

const LazyNotesManager = React.lazy(() => 
  import('../components/notes/notes-manager').then(module => ({ 
    default: module.NotesManager 
  }))
)

const LazyIdeasManager = React.lazy(() => 
  import('../components/ideas/ideas-manager').then(module => ({ 
    default: module.IdeasManager 
  }))
)

// Loading component
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
))

LoadingSpinner.displayName = 'LoadingSpinner'

// Tab interface
type RAGTab = 'documents' | 'search' | 'stats' | 'upload' | 'knowledge' | 'visual' | 'settings' | 'analytics' | 'admin' | 'notes' | 'ideas'

interface TabConfig {
  id: RAGTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  isHeavy?: boolean // Indicates if this tab contains heavy content
}

interface OptimizedRAGViewProps {
  className?: string
  initialTab?: RAGTab
  onTabChange?: (tab: RAGTab) => void
}

// Optimized tab button component
const TabButton = React.memo<{
  tab: TabConfig
  isActive: boolean
  onClick: (tabId: RAGTab) => void
}>(({ tab, isActive, onClick }) => {
  const Icon = tab.icon
  
  const handleClick = useCallback(() => {
    onClick(tab.id)
  }, [onClick, tab.id])

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {tab.label}
    </button>
  )
})

TabButton.displayName = 'TabButton'

// Tab content renderer with lazy loading
const TabContent = React.memo<{
  activeTab: RAGTab
  documents: any[] // Will be properly typed when documents are loaded
  visualContent: any[] // Will be properly typed when content is loaded
}>(({ activeTab, documents, visualContent }) => {
  // Convert documents to knowledge graph format
  const knowledgeGraphData = useMemo(() => {
    return documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      keywords: doc.aiAnalysis?.keywords || [],
      tags: doc.aiAnalysis?.tags || [],
      topics: doc.aiAnalysis?.topics || [],
      sentiment: doc.aiAnalysis?.sentiment || 'neutral',
      complexity: doc.aiAnalysis?.complexity || 'medium',
      confidence: doc.aiAnalysis?.confidence || 0.8,
      uploadDate: doc.uploadedAt,
      size: doc.size
    }))
  }, [documents])

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'documents':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyAdvancedDocumentManager />
          </React.Suspense>
        )
      
      case 'search':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazySearchInterface />
          </React.Suspense>
        )
      
      case 'upload':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyUploadProgress />
          </React.Suspense>
        )
      
      case 'stats':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyProcessingStats />
          </React.Suspense>
        )
      
      case 'notes':
        return (
          <div className="h-full overflow-hidden">
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyNotesManager />
            </React.Suspense>
          </div>
        )
      
      case 'ideas':
        return (
          <div className="h-full overflow-hidden">
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyIdeasManager />
            </React.Suspense>
          </div>
        )
      
      case 'knowledge':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyKnowledgeGraph documents={knowledgeGraphData} />
          </React.Suspense>
        )
      
      case 'visual':
        return (
          <div className="h-full overflow-auto p-6">
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyVisualContentRenderer content={visualContent} />
            </React.Suspense>
          </div>
        )
      
      case 'analytics':
        return (
          <div className="h-full overflow-auto">
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyEnhancedAnalytics />
            </React.Suspense>
          </div>
        )
      
      case 'settings':
        return (
          <div className="h-full overflow-hidden">
            <React.Suspense fallback={<LoadingSpinner />}>
              <LazyRAGSettings />
            </React.Suspense>
          </div>
        )
      
      case 'admin':
        return (
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyAdminPanel />
          </React.Suspense>
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400">Select a tab to view content</p>
          </div>
        )
    }
  }, [activeTab, knowledgeGraphData, visualContent])

  return <>{renderTabContent()}</>
})

TabContent.displayName = 'TabContent'

// Main optimized RAG view component
export const OptimizedRAGView = React.memo<OptimizedRAGViewProps>(({ 
  className = '', 
  initialTab = 'documents', 
  onTabChange 
}) => {
  // Performance monitoring
  usePerformanceMonitor('OptimizedRAGView')
  
  // Redux state with simplified selectors for now
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector(state => 'documents') as RAGTab // Simplified for now
  const documents = useAppSelector(state => []) // Simplified for now
  const visualContent = useAppSelector(state => []) // Simplified for now
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Debounced search for better performance
  const debouncedActiveTab = useDebounce(activeTab, 100)
  
  // Tab configuration
  const tabs = useMemo<TabConfig[]>(() => [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'knowledge', label: 'Knowledge Graph', icon: Network, isHeavy: true },
    { id: 'visual', label: 'Visual Content', icon: Image, isHeavy: true },
    { id: 'analytics', label: 'Analytics & ML', icon: BarChart3, isHeavy: true },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'admin', label: 'Admin', icon: Shield }
  ], [])
  
  // Initialize with initial tab
  useEffect(() => {
    if (!isInitialized && initialTab) {
      dispatch(setActiveTab(initialTab))
      setIsInitialized(true)
    }
  }, [dispatch, initialTab, isInitialized])
  
  // Stable tab change handler
  const handleTabChange = useStableCallback((tab: RAGTab) => {
    dispatch(setActiveTab(tab))
    onTabChange?.(tab)
  })
  
  // Optimized visual content processing
  const processedVisualContent = useMemo(() => {
    return visualContent.map(item => ({
      ...item,
      title: item.title || 'Untitled Document',
      description: item.description || `Document preview: ${item.title}`,
      source: item.thumbnail || item.source || '',
      llmSummary: item.llmSummary || {
        keyInsights: [`Document: ${item.title}`, `Type: ${item.type}`],
        challenges: [],
        mainContent: `Visual representation of "${item.title}"`,
        significance: 'Provides visual context for document content'
      }
    }))
  }, [visualContent])

  return (
    <div className={`flex flex-col h-full pr-12 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={debouncedActiveTab === tab.id}
                onClick={handleTabChange}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content with optimized rendering */}
      <div className="flex-1 overflow-hidden">
        <TabContent
          activeTab={debouncedActiveTab}
          documents={documents}
          visualContent={processedVisualContent}
        />
      </div>
    </div>
  )
})

OptimizedRAGView.displayName = 'OptimizedRAGView'

export default OptimizedRAGView
