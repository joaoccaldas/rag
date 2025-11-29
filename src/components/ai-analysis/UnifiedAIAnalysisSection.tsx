import React, { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Hash, 
  TrendingUp, 
  Award, 
  Brain, 
  MessageSquare, 
  Calculator, 
  Target, 
  BookOpen, 
  Zap, 
  Eye, 
  Star
} from 'lucide-react'
import { Badge } from '../../design-system/components'
import { AIAnalysisData } from '../../rag/types'

interface UnifiedAIAnalysisSectionProps {
  aiAnalysis: AIAnalysisData
  isCompact?: boolean
  className?: string
}

export const UnifiedAIAnalysisSection: React.FC<UnifiedAIAnalysisSectionProps> = ({
  aiAnalysis,
  isCompact = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(!isCompact)
  const [activeTab, setActiveTab] = useState<'summary' | 'insights' | 'metadata'>('summary')
  
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
      <div className={`rounded-xl border border-blue-200/60 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/15 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-[11px] font-semibold tracking-wide uppercase text-blue-700 dark:text-blue-300">
              AI Analysis - Unified Prompt
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
        
        {/* Main Summary */}
        {aiAnalysis.summary && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Document Summary
            </h4>
            <p className={`text-sm text-gray-800 dark:text-gray-300 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {aiAnalysis.summary}
            </p>
          </div>
        )}

        {/* Main Messages Preview */}
        {expanded && aiAnalysis.mainMessages && aiAnalysis.mainMessages.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Key Messages
            </h4>
            <div className="space-y-1">
              {aiAnalysis.mainMessages.slice(0, 2).map((message, index) => (
                <div key={index} className="text-xs text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border-l-2 border-emerald-400">
                  {message}
                </div>
              ))}
              {aiAnalysis.mainMessages.length > 2 && (
                <div className="text-xs text-gray-500 italic">
                  +{aiAnalysis.mainMessages.length - 2} more messages
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Numbers Preview */}
        {expanded && aiAnalysis.mainNumbers && aiAnalysis.mainNumbers.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Key Numbers
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {aiAnalysis.mainNumbers.slice(0, 4).map((number, index) => (
                <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                  <div className="text-xs font-bold text-purple-800 dark:text-purple-200">{number.value}</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400">{number.key}</div>
                </div>
              ))}
            </div>
            {aiAnalysis.mainNumbers.length > 4 && (
              <div className="text-xs text-gray-500 italic mt-1">
                +{aiAnalysis.mainNumbers.length - 4} more data points
              </div>
            )}
          </div>
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
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis - Unified System</h3>
        <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {aiAnalysis.model || 'Unified LLM'}
        </Badge>
        <Badge variant="outline" className={`text-xs ${getConfidenceColor(aiAnalysis.confidence)}`}>
          {Math.round(aiAnalysis.confidence * 100)}% confidence
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'summary' as const, label: 'Summary & Messages', icon: Brain },
          { id: 'insights' as const, label: 'Analysis & Actions', icon: Target },
          { id: 'metadata' as const, label: 'Keywords & Metadata', icon: Hash }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Document Summary */}
          {aiAnalysis.summary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Document Summary</h4>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                {aiAnalysis.summary}
              </p>
            </div>
          )}

          {/* Main Messages */}
          {aiAnalysis.mainMessages && aiAnalysis.mainMessages.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-medium text-emerald-900 dark:text-emerald-100">Main Messages</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.mainMessages.length}</Badge>
              </div>
              <div className="space-y-3">
                {aiAnalysis.mainMessages.map((message, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-200 dark:bg-emerald-800 rounded-full flex items-center justify-center text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {index + 1}
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                      {message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Numbers */}
          {aiAnalysis.mainNumbers && aiAnalysis.mainNumbers.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Key Numbers & Data Points</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.mainNumbers.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiAnalysis.mainNumbers.map((number, index) => (
                  <div key={index} className="bg-white dark:bg-purple-800/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">{number.value}</div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">{number.key}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{number.context}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Main Analysis */}
          {aiAnalysis.mainAnalysis && aiAnalysis.mainAnalysis.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-medium text-amber-900 dark:text-amber-100">Main Analysis & Insights</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.mainAnalysis.length}</Badge>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.mainAnalysis.map((analysis, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-800 dark:text-amber-200">{analysis}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanations */}
          {aiAnalysis.explanations && aiAnalysis.explanations.length > 0 && (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="font-medium text-cyan-900 dark:text-cyan-100">Explanations & Context</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.explanations.length}</Badge>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.explanations.map((explanation, index) => (
                  <li key={index} className="text-sm text-cyan-800 dark:text-cyan-200 leading-relaxed">
                    • {explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions & Recommendations */}
          {aiAnalysis.actions && aiAnalysis.actions.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h4 className="font-medium text-rose-900 dark:text-rose-100">Actions & Recommendations</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.actions.length}</Badge>
              </div>
              <div className="space-y-3">
                {aiAnalysis.actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-rose-200 dark:bg-rose-800 rounded-full flex items-center justify-center text-xs font-bold text-rose-800 dark:text-rose-200">
                      {index + 1}
                    </div>
                    <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Insights */}
          {aiAnalysis.visualInsights && aiAnalysis.visualInsights.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Visual Content Insights</h4>
                <Badge variant="outline" className="text-xs">{aiAnalysis.visualInsights.length}</Badge>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.visualInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                    📊 {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="space-y-4">
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
                <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
              <div>Model: {aiAnalysis.model || 'Unified LLM'}</div>
              <div>Analyzed: {aiAnalysis.analyzedAt ? 
                typeof aiAnalysis.analyzedAt === 'string' 
                  ? new Date(aiAnalysis.analyzedAt).toLocaleDateString()
                  : aiAnalysis.analyzedAt.toLocaleDateString()
                : 'Today'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
