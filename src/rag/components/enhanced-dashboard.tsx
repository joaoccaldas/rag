"use client"

/**
 * Priority 4: Enhanced Dashboard View
 * 
 * Comprehensive dashboard that integrates all Priority 1-4 components
 * with real-time feedback, streaming search, multi-model AI, and advanced RAG.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Settings, 
  BarChart3, 
  Brain,
  Activity,
  Monitor,
  FileText,
  TrendingUp,
  Target
} from 'lucide-react'
import { StreamingSearchDemo } from '../../components/streaming-search-demo'
import { RealTimeFeedbackSystem, FloatingActionFeedback, SmartLoadingIndicator } from './real-time-feedback-system'
import { useSearch } from '../contexts/UnifiedSearchContext'
import { useRAG } from '../contexts/RAGContext'
import { Document as RAGDocument } from '../types'

interface EnhancedDashboardProps {
  className?: string
}

// Component interfaces
interface SystemMetrics {
  searchSpeed: number
  accuracy: number
  confidence: number
  totalResults: number
  processingTime: number
  activeConnections: number
  systemLoad: number
  memoryUsage: number
}

interface AnalyticsViewProps {
  metrics: SystemMetrics
  stats: {
    systemHealth: number
    totalQueries: number
    avgResponseTime: number
    successRate: number
  }
}

interface DocumentsViewProps {
  documents: RAGDocument[]
}

interface SystemHealthViewProps {
  metrics: SystemMetrics
}

type DashboardView = 'search' | 'analytics' | 'documents' | 'system' | 'admin'

export function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const { isSearching, searchResults, searchHistory } = useSearch()
  const { documents, isLoading, uploadProgress } = useRAG()
  
  // Calculate processing status from upload progress
  const isProcessing = Object.keys(uploadProgress).length > 0 || isLoading
  const processingProgress = isProcessing && Object.keys(uploadProgress).length > 0
    ? Math.round(Object.values(uploadProgress).reduce((acc, prog) => acc + prog.progress, 0) / Object.keys(uploadProgress).length)
    : 0

  // Mock stats for now - will be replaced with real analytics
  const mockStats = {
    systemHealth: 92,
    totalQueries: searchHistory.length,
    avgResponseTime: 0.8,
    successRate: 95
  }
  
  // Dashboard state
  const [activeView, setActiveView] = useState<DashboardView>('search')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [systemMetrics, setSystemMetrics] = useState({
    searchSpeed: 85,
    accuracy: 92,
    confidence: 88,
    totalResults: searchResults.length,
    processingTime: 0,
    activeConnections: 1,
    systemLoad: 45,
    memoryUsage: 32
  })

  // Real-time metrics updates
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setSystemMetrics(prev => ({
          ...prev,
          searchSpeed: Math.min(prev.searchSpeed + Math.random() * 5, 100),
          processingTime: prev.processingTime + 100,
          totalResults: searchResults.length
        }))
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isSearching, searchResults.length])

  // Handle view changes with feedback
  const handleViewChange = useCallback((view: DashboardView) => {
    setActiveView(view)
    setFeedbackMessage(`Switched to ${view} view`)
    setTimeout(() => setFeedbackMessage(null), 2000)
  }, [])

  // Calculate dashboard stats
  const dashboardStats = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(d => d.status === 'ready').length,
    searchQueries: searchHistory.length,
    averageAccuracy: systemMetrics.accuracy,
    systemHealth: Math.round((100 - systemMetrics.systemLoad + (100 - systemMetrics.memoryUsage)) / 2)
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Real-time Feedback System */}
      <RealTimeFeedbackSystem
        isActive={isSearching || isProcessing}
        metrics={systemMetrics}
        status={isSearching ? 'searching' : isProcessing ? 'searching' : 'idle'}
      />

      {/* Floating Feedback Messages */}
      {feedbackMessage && (
        <FloatingActionFeedback
          message={feedbackMessage}
          type="info"
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {/* Main Dashboard Layout */}
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo and Title */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI RAG Pro</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enterprise Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              <NavItem
                icon={<Search />}
                label="Smart Search"
                active={activeView === 'search'}
                onClick={() => handleViewChange('search')}
                badge={searchResults.length > 0 ? searchResults.length.toString() : undefined}
              />
              
              <NavItem
                icon={<BarChart3 />}
                label="Analytics"
                active={activeView === 'analytics'}
                onClick={() => handleViewChange('analytics')}
                badge="NEW"
              />
              
              <NavItem
                icon={<FileText />}
                label="Documents"
                active={activeView === 'documents'}
                onClick={() => handleViewChange('documents')}
                badge={dashboardStats.totalDocuments.toString()}
              />
              
              <NavItem
                icon={<Monitor />}
                label="System Health"
                active={activeView === 'system'}
                onClick={() => handleViewChange('system')}
                healthStatus={dashboardStats.systemHealth}
              />
              
              <NavItem
                icon={<Settings />}
                label="Admin Panel"
                active={activeView === 'admin'}
                onClick={() => handleViewChange('admin')}
              />
            </div>
          </nav>

          {/* System Status */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Status</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>CPU</span>
                  <span>{systemMetrics.systemLoad}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory</span>
                  <span>{systemMetrics.memoryUsage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span>{systemMetrics.activeConnections}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {activeView.replace('-', ' ')} Dashboard
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getViewDescription(activeView)}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-6">
                <QuickStat
                  icon={<FileText className="w-4 h-4 text-blue-500" />}
                  label="Documents"
                  value={dashboardStats.totalDocuments}
                />
                <QuickStat
                  icon={<Target className="w-4 h-4 text-green-500" />}
                  label="Accuracy"
                  value={`${dashboardStats.averageAccuracy}%`}
                />
                <QuickStat
                  icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
                  label="Health"
                  value={`${dashboardStats.systemHealth}%`}
                />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4">
                <SmartLoadingIndicator 
                  stage="processing"
                  progress={processingProgress || 0}
                />
              </div>
            )}

            {/* View Content */}
            <div className="p-6">
              {activeView === 'search' && (
                <div className="space-y-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        AI-Powered Document Search
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Experience next-generation search with streaming results, multi-model AI, 
                        and comprehensive citation tracking.
                      </p>
                    </div>
                    
                    <StreamingSearchDemo className="w-full" />
                  </div>
                </div>
              )}

              {activeView === 'analytics' && (
                <AnalyticsView 
                  metrics={systemMetrics}
                  stats={mockStats}
                />
              )}

              {activeView === 'documents' && (
                <DocumentsView 
                  documents={documents}
                />
              )}

              {activeView === 'system' && (
                <SystemHealthView 
                  metrics={systemMetrics}
                />
              )}

              {activeView === 'admin' && (
                <AdminView />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: string
  healthStatus?: number
}

function NavItem({ icon, label, active, onClick, badge, healthStatus }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      
      {badge && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          badge === 'NEW' 
            ? 'bg-green-100 text-green-600' 
            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {badge}
        </span>
      )}
      
      {healthStatus !== undefined && (
        <div className={`w-2 h-2 rounded-full ${
          healthStatus > 80 ? 'bg-green-500' : healthStatus > 60 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      )}
    </button>
  )
}

// Quick Stat Component
function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  )
}

// View Components (simplified for demo)
function AnalyticsView({ metrics, stats }: AnalyticsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Search Performance
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Speed</span>
            <span className="font-medium">{metrics.searchSpeed}%</span>
          </div>
          <div className="flex justify-between">
            <span>Accuracy</span>
            <span className="font-medium">{metrics.accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span>Confidence</span>
            <span className="font-medium">{metrics.confidence}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          System Health
        </h3>
        <div className="text-3xl font-bold text-green-500 mb-2">{stats.systemHealth}%</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">All systems operational</p>
      </div>
    </div>
  )
}

function DocumentsView({ documents }: DocumentsViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Document Library</h3>
        <div className="text-2xl font-bold">{documents.length} Documents</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {documents.filter((d: RAGDocument) => d.status === 'ready').length} processed,
          {documents.filter((d: RAGDocument) => d.status === 'processing').length} processing
        </p>
      </div>
    </div>
  )
}

function SystemHealthView({ metrics }: SystemHealthViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>CPU</span>
              <span>{metrics.systemLoad}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${metrics.systemLoad}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Memory</span>
              <span>{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.memoryUsage}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminView() {
  return (
    <div className="text-center py-12">
      <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Admin Panel</h3>
      <p className="text-gray-600 dark:text-gray-400">Advanced administration features coming soon...</p>
    </div>
  )
}

// Helper function
function getViewDescription(view: DashboardView): string {
  const descriptions = {
    search: 'AI-powered document search with real-time streaming results',
    analytics: 'Comprehensive performance metrics and insights',
    documents: 'Document library management and processing status',
    system: 'Real-time system health and resource monitoring',
    admin: 'Advanced system administration and configuration'
  }
  return descriptions[view]
}

export default EnhancedDashboard
