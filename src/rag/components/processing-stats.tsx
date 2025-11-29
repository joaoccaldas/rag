"use client"

import { useRAG } from '../contexts/RAGContext'
import { Document } from '../types'
import { StorageStatus } from './storage-status'
import { VisualContentLibrary } from '../../components/visual-content-library'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { FileText, Database, HardDrive, Activity, Clock, CheckCircle, AlertCircle, Zap, FileImage, Table, TrendingUp, ImageIcon, Brain, Target, AlertTriangle, Smile } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredVisualContent } from '../utils/visual-content-storage'

export function ProcessingStats() {
  const { documents, processingStats } = useRAG()
  const [isMounted, setIsMounted] = useState(false)
  const [visualStats, setVisualStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    byDocument: {} as Record<string, number>
  })
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [libraryFilter, setLibraryFilter] = useState<{ type?: string; document?: string }>({})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load visual content statistics
  useEffect(() => {
    const loadVisualStats = async () => {
      try {
        const visualContent = await getStoredVisualContent()
        console.log('📊 Loading visual stats:', visualContent.length, 'items')
        
        const stats = {
          total: visualContent.length,
          byType: {} as Record<string, number>,
          byDocument: {} as Record<string, number>
        }
        
        visualContent.forEach(item => {
          // Count by type
          stats.byType[item.type] = (stats.byType[item.type] || 0) + 1
          
          // Count by document
          const docTitle = item.metadata?.documentTitle || 'Unknown'
          stats.byDocument[docTitle] = (stats.byDocument[docTitle] || 0) + 1
        })
        
        console.log('📈 Visual stats calculated:', stats)
        setVisualStats(stats)
      } catch (error) {
        console.error('Error loading visual stats:', error)
      }
    }
    
    loadVisualStats()
    
    // Refresh stats when documents change
    const interval = setInterval(loadVisualStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [documents])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Prepare chart data
  const statusData = [
    { name: 'Ready', value: processingStats?.readyDocuments || 0, color: '#10b981' },
    { name: 'Processing', value: processingStats?.processingDocuments || 0, color: '#3b82f6' },
    { name: 'Error', value: processingStats?.errorDocuments || 0, color: '#ef4444' }
  ].filter(item => item.value > 0)

  const documentTypeData = documents.reduce((acc: Array<{ name: string; value: number }>, doc: Document) => {
    const type = doc.type.toUpperCase()
    const existing = acc.find((item: { name: string; value: number }) => item.name === type)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: type, value: 1 })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  const sizeDistribution = documents.reduce((acc: Array<{ name: string; value: number }>, doc: Document) => {
    const sizeCategory = doc.size < 1024 * 1024 
      ? 'Small (<1MB)' 
      : doc.size < 10 * 1024 * 1024 
      ? 'Medium (1-10MB)' 
      : 'Large (>10MB)'
    
    const existing = acc.find((item: { name: string; value: number }) => item.name === sizeCategory)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: sizeCategory, value: 1 })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  // Mock processing timeline data
  const timelineData = [
    { time: '00:00', documents: 0, chunks: 0 },
    { time: '04:00', documents: 2, chunks: 45 },
    { time: '08:00', documents: 5, chunks: 120 },
    { time: '12:00', documents: 8, chunks: 180 },
    { time: '16:00', documents: processingStats?.readyDocuments || 0, chunks: processingStats?.totalChunks || 0 },
    { time: '20:00', documents: processingStats?.totalDocuments || 0, chunks: processingStats?.totalChunks || 0 }
  ]

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle,
    onClick 
  }: { 
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color: string
    subtitle?: string
    onClick?: () => void
  }) => (
    <div 
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {onClick && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Click to explore →
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Processing Statistics
        </h2>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Documents"
            value={processingStats?.totalDocuments || 0}
            icon={FileText}
            color="bg-blue-500"
            subtitle={`${processingStats?.readyDocuments || 0} ready`}
          />
          <StatCard
            title="Total Chunks"
            value={processingStats?.totalChunks || 0}
            icon={Database}
            color="bg-green-500"
            subtitle="Searchable pieces"
          />
          <StatCard
            title="Storage Used"
            value={formatFileSize(processingStats?.storageUsed || 0)}
            icon={HardDrive}
            color="bg-purple-500"
          />
          <StatCard
            title="Processing Rate"
            value="~2.5/min"
            icon={Zap}
            color="bg-orange-500"
            subtitle="Average speed"
          />
        </div>

        {/* Visual Content Statistics */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Visual Content Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Visual Elements"
              value={visualStats.total.toString()}
              icon={FileImage}
              color="bg-purple-500"
              subtitle="Extracted elements"
              onClick={() => {
                setLibraryFilter({})
                setIsLibraryOpen(true)
              }}
            />
            <StatCard
              title="Charts & Graphs"
              value={(visualStats.byType.chart || 0) + (visualStats.byType.graph || 0)}
              icon={TrendingUp}
              color="bg-blue-500"
              subtitle="Data visualizations"
              onClick={() => {
                setLibraryFilter({ type: 'chart' })
                setIsLibraryOpen(true)
              }}
            />
            <StatCard
              title="Tables"
              value={visualStats.byType.table || 0}
              icon={Table}
              color="bg-green-500"
              subtitle="Structured data"
              onClick={() => {
                setLibraryFilter({ type: 'table' })
                setIsLibraryOpen(true)
              }}
            />
            <StatCard
              title="Images & Diagrams"
              value={(visualStats.byType.image || 0) + (visualStats.byType.diagram || 0)}
              icon={ImageIcon}
              color="bg-indigo-500"
              subtitle="Visual content"
              onClick={() => {
                setLibraryFilter({ type: 'image' })
                setIsLibraryOpen(true)
              }}
            />
          </div>

          {/* Visual Content Type Distribution */}
          {visualStats.total > 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Visual Content Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(visualStats.byType).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {type}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Visual Content Distribution
              </h4>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileImage className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No visual content extracted yet</p>
                <p className="text-xs mt-1">Upload documents with images, charts, or tables to see visual analysis</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Statistics */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            AI Analysis Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Documents with AI Analysis"
              value={documents.filter(doc => doc.aiAnalysis).length}
              icon={Brain}
              color="bg-purple-500"
              subtitle={`of ${documents.length} total`}
            />
            <StatCard
              title="Average Confidence"
              value={(() => {
                const analyzed = documents.filter(doc => doc.aiAnalysis)
                if (analyzed.length === 0) return '0%'
                const avgConfidence = analyzed.reduce((sum, doc) => sum + (doc.aiAnalysis?.confidence || 0), 0) / analyzed.length
                return `${Math.round(avgConfidence * 100)}%`
              })()}
              icon={Target}
              color="bg-green-500"
            />
            <StatCard
              title="High Complexity Docs"
              value={documents.filter(doc => doc.aiAnalysis?.complexity === 'high').length}
              icon={AlertTriangle}
              color="bg-orange-500"
            />
            <StatCard
              title="Most Common Sentiment"
              value={(() => {
                const sentiments = documents
                  .filter(doc => doc.aiAnalysis?.sentiment)
                  .map(doc => doc.aiAnalysis!.sentiment)
                
                if (sentiments.length === 0) return 'N/A'
                
                const counts = sentiments.reduce((acc, sentiment) => {
                  acc[sentiment] = (acc[sentiment] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                
                return Object.entries(counts)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
              })()}
              icon={Smile}
              color="bg-blue-500"
            />
          </div>
        </div>

        {/* Storage System Status */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Storage System
          </h3>
          <StorageStatus />
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Processing Status</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ready</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {processingStats?.readyDocuments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {processingStats?.processingDocuments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Errors</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {processingStats?.errorDocuments || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Document Status Chart */}
          {statusData.length > 0 && isMounted && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Document Types */}
          {documentTypeData.length > 0 && isMounted && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Document Types</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={documentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Processing Timeline and Size Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {isMounted && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Processing Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="documents" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="chunks" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {sizeDistribution.length > 0 && isMounted && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">File Size Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sizeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc: Document) => (
                <div key={doc.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'ready'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : doc.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>

        {/* Visual Content Library Modal */}
        <VisualContentLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          filterByType={libraryFilter.type}
          filterByDocument={libraryFilter.document}
        />
      </div>
    </div>
  )
}
