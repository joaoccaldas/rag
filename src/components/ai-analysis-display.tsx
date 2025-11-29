"use client"

import React from 'react'
import { Brain, Tag, Hash, MessageSquare, TrendingUp, Zap, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import type { SummaryData } from '../workers/types'

interface AIAnalysisDisplayProps {
  summary: SummaryData
  fileName?: string
  showDetails?: boolean
  className?: string
}

export function AIAnalysisDisplay({ summary, showDetails = true, className = '' }: AIAnalysisDisplayProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'neutral': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            AI Analysis Results
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getConfidenceColor(summary.confidence)}`}>
            {(summary.confidence * 100).toFixed(0)}% confidence
          </span>
          {summary.confidence >= 0.8 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {summary.summary}
        </p>
      </div>

      {showDetails && (
        <>
          {/* Document Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Type</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {summary.documentType}
              </span>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Complexity</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getComplexityColor(summary.complexity)}`}>
                {summary.complexity}
              </span>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sentiment</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(summary.sentiment)}`}>
                {summary.sentiment}
              </span>
            </div>
          </div>

          {/* Keywords */}
          {summary.keywords.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({summary.keywords.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded-md"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {summary.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({summary.tags.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {summary.topics.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Topics</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({summary.topics.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.topics.map((topic: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 rounded-md"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AIAnalysisDisplay
