/**
 * ENHANCED DOCUMENT SUMMARY COMPONENT
 * 
 * Displays AI-powered document analysis with:
 * - Executive summary and key messages
 * - Business recommendations and drivers
 * - Follow-up actions and insights
 * - Contextual metadata and keywords
 */

import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Brain, 
  Target, 
  CheckCircle, 
  Clock, 
  Users,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BarChart3
} from 'lucide-react'
import { Document } from '../rag/types'
import { aiAnalysisEngine, DocumentAnalysis } from '../ai/analysis-engine'

interface DocumentSummaryProps {
  document: Document
  className?: string
  expandedByDefault?: boolean
}

export const EnhancedDocumentSummary: React.FC<DocumentSummaryProps> = ({
  document,
  className = '',
  expandedByDefault = false
}) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(expandedByDefault)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))

  // Load existing analysis
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const existingAnalysis = await aiAnalysisEngine.getDocumentAnalysis(document.id)
        if (existingAnalysis) {
          setAnalysis(existingAnalysis)
        }
      } catch (error) {
        console.warn('Failed to load document analysis:', error)
      }
    }

    loadAnalysis()
  }, [document.id])

  // Generate new analysis
  const generateAnalysis = async () => {
    setLoading(true)
    try {
      const newAnalysis = await aiAnalysisEngine.analyzeDocument(document)
      setAnalysis(newAnalysis)
      setExpanded(true)
    } catch (error) {
      console.error('Failed to generate analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'operational': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'financial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'risk': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Document Analysis</h3>
            {analysis && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                Analyzed
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!analysis && !loading && (
              <button
                onClick={generateAnalysis}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
              >
                <Brain className="w-4 h-4" />
                Analyze Document
              </button>
            )}
            
            {analysis && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Analyzing document content...</span>
          </div>
        </div>
      )}

      {/* Analysis Content */}
      {analysis && expanded && (
        <div className="p-4 space-y-4">
          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Executive Summary
            </h4>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Main Messages */}
          {analysis.mainMessages.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('messages')}
                className="flex items-center gap-2 w-full text-left font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSections.has('messages') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Key Messages ({analysis.mainMessages.length})
              </button>
              
              {expandedSections.has('messages') && (
                <div className="ml-6 space-y-2">
                  {analysis.mainMessages.map((message, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Business Recommendations */}
          {analysis.businessRecommendations.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('recommendations')}
                className="flex items-center gap-2 w-full text-left font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSections.has('recommendations') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Business Recommendations ({analysis.businessRecommendations.length})
              </button>
              
              {expandedSections.has('recommendations') && (
                <div className="ml-6 space-y-3">
                  {analysis.businessRecommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{rec.recommendation}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${getCategoryColor(rec.category)}`}>
                          {rec.category}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">
                          {rec.timeframe}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">
                          {rec.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Actions */}
          {analysis.followUpActions.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('actions')}
                className="flex items-center gap-2 w-full text-left font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSections.has('actions') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Follow-up Actions ({analysis.followUpActions.length})
              </button>
              
              {expandedSections.has('actions') && (
                <div className="ml-6 space-y-2">
                  {analysis.followUpActions.map((action, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{action.action}</div>
                      {action.owner && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-3 h-3" />
                          Owner: {action.owner}
                        </div>
                      )}
                      {action.deadline && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          Deadline: {action.deadline}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Insights */}
          {analysis.keyInsights.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('insights')}
                className="flex items-center gap-2 w-full text-left font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSections.has('insights') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Key Insights ({analysis.keyInsights.length})
              </button>
              
              {expandedSections.has('insights') && (
                <div className="ml-6 space-y-3">
                  {analysis.keyInsights.map((insight, idx) => (
                    <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">{insight.insight}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </div>
                      {insight.supporting_evidence.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Evidence:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {insight.supporting_evidence.map((evidence, evidenceIdx) => (
                              <li key={evidenceIdx}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keywords */}
              {analysis.keywords.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Keywords</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {analysis.topics.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Topics</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysis.topics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Metadata */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>Sentiment: {analysis.sentiment}</span>
                <span>Complexity: {analysis.complexity}</span>
              </div>
              <span>Analyzed: {new Date(analysis.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* No Analysis State */}
      {!analysis && !loading && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No AI analysis available. Click &ldquo;Analyze Document&rdquo; to generate insights.</p>
        </div>
      )}
    </div>
  )
}

export default EnhancedDocumentSummary
