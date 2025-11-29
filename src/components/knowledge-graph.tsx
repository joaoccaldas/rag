"use client"

import React, { useState, useMemo } from 'react'
import { Network, Filter, Eye, EyeOff, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface DocumentMetadata {
  id: string
  name: string
  type: string
  keywords: string[]
  tags: string[]
  topics: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  complexity: 'low' | 'medium' | 'high'
  confidence: number
  uploadDate: Date
  size: number
}

interface CorrelationData {
  keyword: string
  documents: string[]
  frequency: number
  avgConfidence: number
  relatedKeywords: string[]
}

interface KnowledgeGraphProps {
  documents: DocumentMetadata[]
  className?: string
}

export function KnowledgeGraph({ documents, className = "" }: KnowledgeGraphProps) {
  const [viewMode, setViewMode] = useState<'correlations' | 'timeline' | 'network' | 'clusters'>('correlations')
  const [filterBy, setFilterBy] = useState<'all' | 'topic' | 'sentiment' | 'complexity'>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showDetails, setShowDetails] = useState(false)
  
  // Calculate correlations and insights
  const insights = useMemo(() => {
    if (!documents.length) return null

    // Keyword correlations
    const keywordMap = new Map<string, CorrelationData>()
    documents.forEach(doc => {
      doc.keywords.forEach(keyword => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            keyword,
            documents: [],
            frequency: 0,
            avgConfidence: 0,
            relatedKeywords: []
          })
        }
        const data = keywordMap.get(keyword)!
        data.documents.push(doc.name)
        data.frequency += 1
      })
    })

    // Calculate related keywords and confidence
    keywordMap.forEach((data, keyword) => {
      const relatedDocs = documents.filter(doc => doc.keywords.includes(keyword))
      data.avgConfidence = relatedDocs.reduce((sum, doc) => sum + doc.confidence, 0) / relatedDocs.length
      
      // Find keywords that appear in same documents
      const relatedKeywords = new Set<string>()
      relatedDocs.forEach(doc => {
        doc.keywords.forEach(k => {
          if (k !== keyword) relatedKeywords.add(k)
        })
      })
      data.relatedKeywords = Array.from(relatedKeywords).slice(0, 5)
    })

    const correlations = Array.from(keywordMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)

    // Timeline data
    const timelineData = documents
      .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
      .map(doc => ({
        name: doc.name.length > 15 ? doc.name.substring(0, 15) + '...' : doc.name,
        date: new Date(doc.uploadDate).toLocaleDateString(),
        keywordCount: doc.keywords.length,
        confidence: Math.round(doc.confidence * 100),
        complexity: doc.complexity,
        sentiment: doc.sentiment
      }))

    // Topic clusters
    const topicClusters = new Map<string, { count: number; docs: string[]; avgConfidence: number }>()
    documents.forEach(doc => {
      doc.topics.forEach(topic => {
        if (!topicClusters.has(topic)) {
          topicClusters.set(topic, { count: 0, docs: [], avgConfidence: 0 })
        }
        const cluster = topicClusters.get(topic)!
        cluster.count += 1
        cluster.docs.push(doc.name)
      })
    })

    topicClusters.forEach((cluster, topic) => {
      const relatedDocs = documents.filter(doc => doc.topics.includes(topic))
      cluster.avgConfidence = relatedDocs.reduce((sum, doc) => sum + doc.confidence, 0) / relatedDocs.length
    })

    const clusters = Array.from(topicClusters.entries()).map(([topic, data]) => ({
      topic,
      count: data.count,
      avgConfidence: Math.round(data.avgConfidence * 100),
      docs: data.docs.length
    }))

    // Sentiment distribution
    const sentimentData = [
      { name: 'Positive', value: documents.filter(d => d.sentiment === 'positive').length, color: '#10b981' },
      { name: 'Neutral', value: documents.filter(d => d.sentiment === 'neutral').length, color: '#6b7280' },
      { name: 'Negative', value: documents.filter(d => d.sentiment === 'negative').length, color: '#ef4444' }
    ].filter(item => item.value > 0)

    // Complexity distribution
    const complexityData = [
      { name: 'Low', value: documents.filter(d => d.complexity === 'low').length },
      { name: 'Medium', value: documents.filter(d => d.complexity === 'medium').length },
      { name: 'High', value: documents.filter(d => d.complexity === 'high').length }
    ].filter(item => item.value > 0)

    return {
      correlations,
      timeline: timelineData,
      clusters,
      sentimentData,
      complexityData,
      totalDocuments: documents.length,
      uniqueKeywords: keywordMap.size,
      uniqueTopics: topicClusters.size
    }
  }, [documents])

  // Filter options based on current filter type
  const filterOptions = useMemo(() => {
    if (!documents.length) return []
    
    switch (filterBy) {
      case 'topic':
        return ['all', ...new Set(documents.flatMap(d => d.topics))]
      case 'sentiment':
        return ['all', 'positive', 'neutral', 'negative']
      case 'complexity':
        return ['all', 'low', 'medium', 'high']
      default:
        return ['all']
    }
  }, [documents, filterBy])

  // Apply filters
  const filteredDocuments = useMemo(() => {
    if (filterBy === 'all' || selectedFilter === 'all') return documents
    
    return documents.filter(doc => {
      switch (filterBy) {
        case 'topic':
          return doc.topics.includes(selectedFilter)
        case 'sentiment':
          return doc.sentiment === selectedFilter
        case 'complexity':
          return doc.complexity === selectedFilter
        default:
          return true
      }
    })
  }, [documents, filterBy, selectedFilter])

  if (!insights) {
    return (
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Network className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No documents available for analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge Graph Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title={showDetails ? "Hide details" : "Show details"}
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Export data">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.totalDocuments}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Documents</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.uniqueKeywords}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Keywords</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.uniqueTopics}</div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Topics</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Math.round(documents.reduce((sum, d) => sum + d.confidence, 0) / documents.length * 100)}%
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Avg Confidence</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'correlations' | 'timeline' | 'network' | 'clusters')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
          >
            <option value="correlations">Keyword Correlations</option>
            <option value="timeline">Document Timeline</option>
            <option value="network">Topic Clusters</option>
            <option value="clusters">Sentiment & Complexity</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => {
              setFilterBy(e.target.value as 'all' | 'topic' | 'sentiment' | 'complexity')
              setSelectedFilter('all')
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
          >
            <option value="all">No Filter</option>
            <option value="topic">By Topic</option>
            <option value="sentiment">By Sentiment</option>
            <option value="complexity">By Complexity</option>
          </select>
          
          {filterBy !== 'all' && (
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All' : option}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Visualization Area */}
      <div className="h-96">
        {viewMode === 'correlations' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.correlations.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="keyword" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as CorrelationData
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">Frequency: {data.frequency}</p>
                        <p className="text-sm">Confidence: {Math.round(data.avgConfidence * 100)}%</p>
                        <p className="text-sm">Documents: {data.documents.length}</p>
                        {showDetails && data.relatedKeywords.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            Related: {data.relatedKeywords.join(', ')}
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="frequency" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={insights.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence %" />
              <Line type="monotone" dataKey="keywordCount" stroke="#82ca9d" name="Keywords" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'network' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.clusters}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Document Count" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'clusters' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div>
              <h4 className="text-sm font-medium mb-2">Sentiment Distribution</h4>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={insights.sentimentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {insights.sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Complexity Distribution</h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={insights.complexityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-2">Filtered Documents ({filteredDocuments.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {filteredDocuments.slice(0, 12).map(doc => (
              <div key={doc.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium truncate">{doc.name}</div>
                <div className="text-gray-500 space-x-2">
                  <span className={`px-1 rounded ${
                    doc.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                    doc.sentiment === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.sentiment}
                  </span>
                  <span>{doc.complexity}</span>
                  <span>{Math.round(doc.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeGraph
