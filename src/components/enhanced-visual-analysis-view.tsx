/**
 * Enhanced Visual Analysis UI Component
 * 
 * Provides a user interface for viewing and managing enhanced visual analysis results
 */

import React, { useState, useEffect } from 'react'
import { Eye, BarChart3, Table, FileImage, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { VisualAnalysisStorage, type DocumentVisualAnalysisReport, type VisualElementAnalysis } from '../rag/utils/enhanced-visual-analysis'

interface EnhancedVisualAnalysisViewProps {
  documentId: string
  documentTitle: string
}

interface AnalysisStatsProps {
  report: DocumentVisualAnalysisReport
}

function AnalysisStats({ report }: AnalysisStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Total Elements</h3>
        </div>
        <div className="text-2xl font-bold text-blue-600">{report.totalElements}</div>
        <div className="text-sm text-gray-600">Visual elements detected</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="font-medium">Content Density</h3>
        </div>
        <div className="text-2xl font-bold text-green-600 capitalize">
          {report.overallInsights.visualContentDensity}
        </div>
        <div className="text-sm text-gray-600">Visual information density</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h3 className="font-medium">Critical Elements</h3>
        </div>
        <div className="text-2xl font-bold text-orange-600">
          {report.significanceDistribution.critical || 0}
        </div>
        <div className="text-sm text-gray-600">High-priority elements</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-purple-500" />
          <h3 className="font-medium">Analysis Time</h3>
        </div>
        <div className="text-2xl font-bold text-purple-600">
          {(report.analysisMetadata.processingDuration / 1000).toFixed(1)}s
        </div>
        <div className="text-sm text-gray-600">Processing duration</div>
      </div>
    </div>
  )
}

interface ElementCardProps {
  element: VisualElementAnalysis
}

function ElementCard({ element }: ElementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const getTypeIcon = (type: string) => {
    if (type.includes('chart')) return <BarChart3 className="h-4 w-4" />
    if (type.includes('table')) return <Table className="h-4 w-4" />
    return <FileImage className="h-4 w-4" />
  }
  
  const getSignificanceColor = (significance: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 border-gray-200',
      medium: 'bg-blue-100 text-blue-700 border-blue-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      critical: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[significance as keyof typeof colors] || colors.medium
  }
  
  const getComplexityColor = (complexity: string) => {
    const colors = {
      simple: 'bg-green-100 text-green-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      complex: 'bg-red-100 text-red-700'
    }
    return colors[complexity as keyof typeof colors] || colors.moderate
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon(element.type)}
            <h3 className="font-medium text-gray-900">{element.title}</h3>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getSignificanceColor(element.llmAnalysis.significance)}`}>
              {element.llmAnalysis.significance}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getComplexityColor(element.complexity)}`}>
              {element.complexity}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{element.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Confidence: {(element.confidence * 100).toFixed(0)}%</span>
            {element.contentAnalysis.dataPoints && (
              <span>Data Points: {element.contentAnalysis.dataPoints}</span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show Less' : 'Show Details'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-4">
            {element.llmAnalysis.keyInsights.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Key Insights</h4>
                <ul className="list-disc list-inside space-y-1">
                  {element.llmAnalysis.keyInsights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-600">{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {element.llmAnalysis.businessImplications.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Business Implications</h4>
                <ul className="list-disc list-inside space-y-1">
                  {element.llmAnalysis.businessImplications.map((implication, index) => (
                    <li key={index} className="text-sm text-gray-600">{implication}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {element.llmAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {element.llmAnalysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600">{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {element.contentAnalysis.trends && element.contentAnalysis.trends.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Detected Trends</h4>
                <div className="flex flex-wrap gap-2">
                  {element.contentAnalysis.trends.map((trend, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {trend}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function EnhancedVisualAnalysisView({ documentId, documentTitle }: EnhancedVisualAnalysisViewProps) {
  const [report, setReport] = useState<DocumentVisualAnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all')

  useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true)
      try {
        const analysisReport = VisualAnalysisStorage.get(documentId)
        setReport(analysisReport)
      } catch (error) {
        console.error('Failed to load visual analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visual analysis...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Visual Analysis Available</h3>
        <p className="text-gray-600">
          Enhanced visual analysis has not been performed on this document yet.
        </p>
      </div>
    )
  }

  const filteredElements = report.elements.filter(element => {
    if (filter === 'all') return true
    if (filter === 'critical') return element.llmAnalysis.significance === 'critical'
    if (filter === 'high') return element.llmAnalysis.significance === 'high'
    return false
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Visual Analysis</h2>
          <p className="text-gray-600">{documentTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-600">
            Analysis completed {new Date(report.analysisMetadata.processedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <AnalysisStats report={report} />

      {/* Element Type Distribution */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-medium text-gray-900 mb-3">Element Types</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(report.elementsByType).map(([type, count]) => (
            <span key={type} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {type.replace('_', ' ')}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Filter by significance:</span>
        <div className="flex gap-2">
          {['all', 'critical', 'high'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as 'all' | 'critical' | 'high')}
              className={`px-3 py-1 text-sm rounded ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {filteredElements.length} of {report.elements.length} elements
        </span>
      </div>

      {/* Elements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredElements.map((element) => (
          <ElementCard key={element.id} element={element} />
        ))}
      </div>

      {filteredElements.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No elements match the selected filter.</p>
        </div>
      )}
    </div>
  )
}

export default EnhancedVisualAnalysisView
