import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Bot, Tag, Hash, TrendingUp, Award, Brain } from 'lucide-react'
import { Badge } from '../../design-system/components'
import { AIAnalysisData } from '../../rag/types'

interface AIAnalysisSectionProps {
  aiAnalysis: AIAnalysisData
  isCompact?: boolean
  className?: string
}

export const AIAnalysisSection: React.FC<AIAnalysisSectionProps> = ({
  aiAnalysis,
  isCompact = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(!isCompact)
  
  if (!aiAnalysis) return null

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  if (isCompact) {
    return (
      <div className={`rounded-xl border border-blue-200/60 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/15 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-[11px] font-semibold tracking-wide uppercase text-blue-700 dark:text-blue-300">
              AI Analysis
            </div>
            {aiAnalysis.confidence && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                {Math.round(aiAnalysis.confidence * 100)}%
              </Badge>
            )}
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-blue-700/85 dark:text-blue-300 hover:underline flex items-center gap-1"
          >
            {expanded ? 'Show less' : 'Show more'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        
        {aiAnalysis.summary && (
          <p className={`mt-1.5 text-sm text-gray-800 dark:text-gray-300 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {aiAnalysis.summary}
          </p>
        )}

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Quick metrics */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className={`${getComplexityColor(aiAnalysis.complexity)} border-none text-[10px] px-2 py-1`}>
                {aiAnalysis.complexity} complexity
              </Badge>
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none text-[10px] px-2 py-1">
                {getSentimentIcon(aiAnalysis.sentiment)} {aiAnalysis.sentiment}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-none text-[10px] px-2 py-1">
                {aiAnalysis.documentType}
              </Badge>
            </div>

            {/* Keywords preview */}
            {aiAnalysis.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {aiAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    {keyword.length > 12 ? `${keyword.slice(0, 12)}...` : keyword}
                  </Badge>
                ))}
                {aiAnalysis.keywords.length > 5 && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-gray-500 border-dashed">
                    +{aiAnalysis.keywords.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full expanded view for preview modal
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis & Insights</h3>
        <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {aiAnalysis.model || 'LLM'}
        </Badge>
      </div>
      
      {/* Summary */}
      {aiAnalysis.summary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Document Summary</h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {aiAnalysis.summary}
          </p>
        </div>
      )}
      
      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Type</div>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{aiAnalysis.documentType}</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Complexity</div>
          <Badge className={`${getComplexityColor(aiAnalysis.complexity)} text-xs font-medium`}>
            {aiAnalysis.complexity}
          </Badge>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sentiment</div>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {getSentimentIcon(aiAnalysis.sentiment)} {aiAnalysis.sentiment}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence</div>
          <div className={`font-medium text-sm ${getConfidenceColor(aiAnalysis.confidence)}`}>
            {Math.round(aiAnalysis.confidence * 100)}%
          </div>
        </div>
      </div>
      
      {/* Keywords */}
      {aiAnalysis.keywords?.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h4 className="font-medium text-green-900 dark:text-green-100">Key Terms & Keywords</h4>
            <Badge variant="outline" className="text-xs">{aiAnalysis.keywords.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.keywords.map((keyword, index) => (
              <Badge 
                key={index}
                className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium border-green-200 dark:border-green-700"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Tags */}
      {aiAnalysis.tags?.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="font-medium text-purple-900 dark:text-purple-100">Content Tags</h4>
            <Badge variant="outline" className="text-xs">{aiAnalysis.tags.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.tags.map((tag, index) => (
              <Badge 
                key={index}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs font-medium border-purple-200 dark:border-purple-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Topics */}
      {aiAnalysis.topics?.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h4 className="font-medium text-orange-900 dark:text-orange-100">Topics Covered</h4>
            <Badge variant="outline" className="text-xs">{aiAnalysis.topics.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.topics.map((topic, index) => (
              <Badge 
                key={index}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 text-xs font-medium border-orange-200 dark:border-orange-700"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Analysis metadata */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-3 h-3" />
          <span className="font-medium">Analysis Details</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>Model: {aiAnalysis.model || 'Unknown'}</div>
          <div>Analyzed: {new Date(aiAnalysis.analyzedAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )
}
