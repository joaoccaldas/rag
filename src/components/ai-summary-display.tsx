"use client"

import { Document } from '@/rag/types'
import { Brain, Clock, Lightbulb, Tag, TrendingUp } from 'lucide-react'

interface AISummaryDisplayProps {
  document: Document
  className?: string
}

export function AISummaryDisplay({ document, className = "" }: AISummaryDisplayProps) {
  if (!document.aiAnalysis) {
    return null
  }

  const { aiAnalysis } = document

  return (
    <div className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Analysis Summary</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full">
          {(aiAnalysis.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {aiAnalysis.summary}
        </p>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">
            {aiAnalysis.sentiment}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Sentiment</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">
            {aiAnalysis.complexity}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Complexity</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {aiAnalysis.documentType}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Type</div>
        </div>
      </div>

      {/* Keywords */}
      {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Concepts</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {aiAnalysis.keywords.slice(0, 6).map((keyword, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200 rounded-full">
                {keyword}
              </span>
            ))}
            {aiAnalysis.keywords.length > 6 && (
              <span className="px-2 py-1 text-xs border rounded-full">
                +{aiAnalysis.keywords.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {aiAnalysis.tags && aiAnalysis.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {aiAnalysis.tags.slice(0, 5).map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200 rounded-full">
                {tag}
              </span>
            ))}
            {aiAnalysis.tags.length > 5 && (
              <span className="px-2 py-1 text-xs border rounded-full">
                +{aiAnalysis.tags.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Topics */}
      {aiAnalysis.topics && aiAnalysis.topics.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Main Topics</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {aiAnalysis.topics.slice(0, 4).map((topic, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-purple-50 border border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200 rounded-full">
                {topic}
              </span>
            ))}
            {aiAnalysis.topics.length > 4 && (
              <span className="px-2 py-1 text-xs border rounded-full">
                +{aiAnalysis.topics.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Analysis metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Analyzed {new Date(aiAnalysis.analyzedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Model: {aiAnalysis.model}</span>
        </div>
      </div>
    </div>
  )
}
