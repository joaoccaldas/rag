"use client"

import React, { useState, useEffect } from 'react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { useSearch } from '@/rag/contexts/UnifiedSearchContext'
import { 
  Brain, 
  BarChart3, 
  Target, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react'

interface AnalyticsData {
  searchPerformance: {
    averageRelevanceScore: number
    totalSearches: number
    successRate: number
    averageResponseTime: number
    topQueries: Array<{ query: string; count: number; avgScore: number }>
  }
  documentInsights: {
    mostReferencedDocs: Array<{ id: string; name: string; referenceCount: number }>
    contentGaps: string[]
    qualityScores: Array<{ docId: string; name: string; score: number }>
  }
  feedbackAnalytics: {
    totalFeedback: number
    positiveRating: number
    negativeRating: number
    satisfactionRate: number
    avgScore: number
    topIssueCategories: Array<{ category: string; count: number }>
    topPerformingSources: Array<{ title: string; avgScore: number; feedbackCount: number; relevanceBoost: number }>
    sourcesWithFeedback: number
    recentQueries: Array<{ query: string; rating: string; score: number; timestamp: string }>
  }
  modelRecommendations: {
    embeddingModelSuggestions: Array<{ model: string; reason: string; impact: string }>
    chunkingSuggestions: Array<{ strategy: string; reason: string; expectedImprovement: string }>
    retrievalOptimizations: Array<{ technique: string; description: string; benefit: string }>
  }
  trainingDataInsights: {
    dataQuality: number
    diversityScore: number
    coverageGaps: string[]
    recommendedDataSources: Array<{ source: string; reason: string; priority: 'high' | 'medium' | 'low' }>
  }
  fineTuningRecommendations: {
    readiness: number
    suggestedApproach: string
    estimatedImprovement: string
    dataRequirements: Array<{ type: string; current: number; recommended: number }>
  }
}

export function AnalyticsMLInsights() {
  const { documents } = useRAG()
  const { searchHistory } = useSearch()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState<'performance' | 'insights' | 'recommendations' | 'training' | 'feedback'>('performance')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate analytics data generation
    const generateAnalytics = async () => {
      setLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockAnalytics: AnalyticsData = {
        searchPerformance: {
          averageRelevanceScore: 0.87,
          totalSearches: Math.max(searchHistory.length, 1247),
          successRate: 0.92,
          averageResponseTime: 450,
          topQueries: [
            { query: "Miele company history", count: 89, avgScore: 0.94 },
            { query: "product specifications", count: 67, avgScore: 0.83 },
            { query: "financial performance", count: 54, avgScore: 0.91 },
            { query: "market analysis", count: 43, avgScore: 0.79 },
            { query: "strategic initiatives", count: 38, avgScore: 0.88 }
          ]
        },
        documentInsights: {
          mostReferencedDocs: [
            { id: "doc1", name: "Miele_Company_Overview.pdf", referenceCount: 156 },
            { id: "doc2", name: "Financial_Report_2023.pdf", referenceCount: 134 },
            { id: "doc3", name: "Product_Catalog_2024.pdf", referenceCount: 98 },
            { id: "doc4", name: "Market_Analysis.pdf", referenceCount: 87 },
            { id: "doc5", name: "Strategic_Plan.pdf", referenceCount: 76 }
          ],
          contentGaps: [
            "Competitor analysis and positioning",
            "Customer satisfaction metrics",
            "Supply chain optimization details",
            "Sustainability and ESG initiatives",
            "Digital transformation roadmap"
          ],
          qualityScores: [
            { docId: "doc1", name: "Miele_Company_Overview.pdf", score: 0.94 },
            { docId: "doc2", name: "Financial_Report_2023.pdf", score: 0.91 },
            { docId: "doc3", name: "Product_Catalog_2024.pdf", score: 0.88 },
            { docId: "doc4", name: "Market_Analysis.pdf", score: 0.85 },
            { docId: "doc5", name: "Strategic_Plan.pdf", score: 0.82 }
          ]
        },
        feedbackAnalytics: (() => {
          // Mock feedback analytics for now - to be replaced with real analytics
          
          // Merge with mock data for demonstration
          return {
            totalFeedback: 47,
            positiveRating: 34,
            negativeRating: 13,
            satisfactionRate: 72.3,
            avgScore: 3.8,
            topIssueCategories: [
              { category: "relevance", count: 8 },
              { category: "sources", count: 5 },
              { category: "completeness", count: 4 },
              { category: "accuracy", count: 3 },
              { category: "clarity", count: 2 }
            ],
            topPerformingSources: [
              { title: "Miele_Company_Overview.pdf", avgScore: 4.2, feedbackCount: 12, relevanceBoost: 0.15 },
              { title: "Financial_Report_2023.pdf", avgScore: 3.9, feedbackCount: 8, relevanceBoost: 0.08 },
              { title: "Product_Catalog_2024.pdf", avgScore: 3.7, feedbackCount: 6, relevanceBoost: 0.05 }
            ],
            sourcesWithFeedback: 15,
            recentQueries: [
              { query: "Miele financial performance", rating: "positive", score: 4, timestamp: new Date().toISOString() },
              { query: "product specifications washing machines", rating: "positive", score: 5, timestamp: new Date().toISOString() },
              { query: "company history timeline", rating: "negative", score: 2, timestamp: new Date().toISOString() }
            ]
          }
        })(),
        modelRecommendations: {
          embeddingModelSuggestions: [
            { 
              model: "text-embedding-3-large", 
              reason: "Better semantic understanding for technical content",
              impact: "15-20% improvement in retrieval accuracy"
            },
            { 
              model: "sentence-transformers/all-mpnet-base-v2", 
              reason: "Cost-effective alternative with good performance",
              impact: "5-10% improvement with 60% cost reduction"
            }
          ],
          chunkingSuggestions: [
            { 
              strategy: "Adaptive chunking by document structure", 
              reason: "Better preservation of context in technical documents",
              expectedImprovement: "12% improvement in answer quality"
            },
            { 
              strategy: "Increase overlap to 300 tokens", 
              reason: "Current 200-token overlap causes context loss",
              expectedImprovement: "8% improvement in cross-chunk queries"
            }
          ],
          retrievalOptimizations: [
            { 
              technique: "Hybrid search (semantic + keyword)", 
              description: "Combine embedding similarity with BM25 scoring",
              benefit: "25% improvement in precise fact retrieval"
            },
            { 
              technique: "Query expansion with synonyms", 
              description: "Automatically expand queries with domain-specific terms",
              benefit: "18% improvement in coverage for technical queries"
            }
          ]
        },
        trainingDataInsights: {
          dataQuality: 0.84,
          diversityScore: 0.76,
          coverageGaps: [
            "Industry-specific terminology",
            "Recent market developments",
            "Technical specifications details",
            "Customer use cases and scenarios"
          ],
          recommendedDataSources: [
            { source: "Industry reports and whitepapers", reason: "Fill knowledge gaps in market trends", priority: "high" },
            { source: "Customer support documentation", reason: "Improve practical query handling", priority: "high" },
            { source: "Technical manuals and specifications", reason: "Enhance technical accuracy", priority: "medium" },
            { source: "News articles and press releases", reason: "Keep information current", priority: "medium" }
          ]
        },
        fineTuningRecommendations: {
          readiness: 0.78,
          suggestedApproach: "Domain-specific fine-tuning with retrieval-augmented training",
          estimatedImprovement: "20-30% improvement in domain-specific queries",
          dataRequirements: [
            { type: "Question-Answer pairs", current: 450, recommended: 2000 },
            { type: "Domain-specific documents", current: documents.length, recommended: 150 },
            { type: "Query-Result relevance ratings", current: 120, recommended: 1000 },
            { type: "Negative examples", current: 80, recommended: 500 }
          ]
        }
      }
      
      setAnalyticsData(mockAnalytics)
      setLoading(false)
    }

    generateAnalytics()
  }, [documents.length, searchHistory.length])

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 dark:text-green-400'
    if (score >= 0.8) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 0.9) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (score >= 0.8) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return <AlertCircle className="w-4 h-4 text-red-600" />
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyzing data and generating insights...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-display-large text-foreground mb-2">
            Analytics & ML Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Advanced analytics, performance metrics, and machine learning recommendations to optimize your RAG system
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Relevance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(analyticsData.searchPerformance.averageRelevanceScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(analyticsData.searchPerformance.successRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.searchPerformance.averageResponseTime}ms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Brain className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ML Readiness</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(analyticsData.fineTuningRecommendations.readiness * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'performance', label: 'Performance', icon: BarChart3 },
                { id: 'insights', label: 'Document Insights', icon: FileText },
                { id: 'feedback', label: 'User Feedback', icon: MessageSquare },
                { id: 'recommendations', label: 'ML Recommendations', icon: Brain },
                { id: 'training', label: 'Training Data', icon: Target }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'performance' | 'insights' | 'recommendations' | 'training' | 'feedback')}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Performance Analytics</h3>
                
                {/* Top Queries */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Top Performing Queries</h4>
                  <div className="space-y-3">
                    {analyticsData.searchPerformance.topQueries.map((query, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{query.query}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{query.count} searches</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getScoreColor(query.avgScore)}`}>
                            {(query.avgScore * 100).toFixed(1)}%
                          </span>
                          {getScoreIcon(query.avgScore)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Insights & Quality</h3>
                
                {/* Most Referenced Documents */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Most Referenced Documents</h4>
                  <div className="space-y-3">
                    {analyticsData.documentInsights.mostReferencedDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doc.referenceCount} references</p>
                        </div>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(doc.referenceCount / analyticsData.documentInsights.mostReferencedDocs[0].referenceCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Gaps */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-4">Identified Content Gaps</h4>
                  <div className="space-y-2">
                    {analyticsData.documentInsights.contentGaps.map((gap, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ML Model Recommendations</h3>
                
                {/* Embedding Model Suggestions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4">Embedding Model Upgrades</h4>
                  <div className="space-y-4">
                    {analyticsData.modelRecommendations.embeddingModelSuggestions.map((suggestion, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white">{suggestion.model}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.reason}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">{suggestion.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retrieval Optimizations */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-4">Retrieval Optimizations</h4>
                  <div className="space-y-4">
                    {analyticsData.modelRecommendations.retrievalOptimizations.map((optimization, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white">{optimization.technique}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{optimization.description}</p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">{optimization.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'training' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Data Analysis</h3>
                
                {/* Data Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Data Quality Score</h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full" 
                          style={{ width: `${analyticsData.trainingDataInsights.dataQuality * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {(analyticsData.trainingDataInsights.dataQuality * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Diversity Score</h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full" 
                          style={{ width: `${analyticsData.trainingDataInsights.diversityScore * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {(analyticsData.trainingDataInsights.diversityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fine-tuning Readiness */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-4">Fine-tuning Recommendations</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                        <strong>Approach:</strong> {analyticsData.fineTuningRecommendations.suggestedApproach}
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                        <strong>Expected Improvement:</strong> {analyticsData.fineTuningRecommendations.estimatedImprovement}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Data Requirements</h5>
                      <div className="space-y-3">
                        {analyticsData.fineTuningRecommendations.dataRequirements.map((req, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{req.type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900 dark:text-white">{req.current} / {req.recommended}</span>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${req.current >= req.recommended ? 'bg-green-600' : 'bg-yellow-600'}`} 
                                  style={{ width: `${Math.min((req.current / req.recommended) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="p-6 space-y-6">
                {/* Feedback Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Feedback</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {analyticsData.feedbackAnalytics.totalFeedback}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Positive</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {analyticsData.feedbackAnalytics.positiveRating}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-3">
                      <ThumbsDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Negative</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {analyticsData.feedbackAnalytics.negativeRating}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Satisfaction</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {analyticsData.feedbackAnalytics.satisfactionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Issues Categories */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-4">Top Issue Categories</h4>
                  <div className="space-y-3">
                    {analyticsData.feedbackAnalytics.topIssueCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 capitalize">
                          {category.category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full" 
                              style={{ width: `${(category.count / Math.max(...analyticsData.feedbackAnalytics.topIssueCategories.map(c => c.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            {category.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Performing Sources */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-4">Top Performing Sources</h4>
                  <div className="space-y-3">
                    {analyticsData.feedbackAnalytics.topPerformingSources.map((source, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {source.title}
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-400 font-bold">
                            {source.avgScore.toFixed(1)}/5
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{source.feedbackCount} feedback entries</span>
                          <span>Boost: +{(source.relevanceBoost * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Queries */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Feedback</h4>
                  <div className="space-y-3">
                    {analyticsData.feedbackAnalytics.recentQueries.map((query, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                            &ldquo;{query.query}&rdquo;
                          </span>
                          <div className="flex items-center space-x-2">
                            {query.rating === 'positive' ? (
                              <ThumbsUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <ThumbsDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">
                              {query.score}/5
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(query.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
