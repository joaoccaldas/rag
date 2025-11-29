'use client'

import React, { useState } from 'react'
import { Search, Filter, SortDesc, Clock, FileText, Image } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  content: string
  type: string
  score: number
  timestamp: string
}

interface SearchViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const SearchView: React.FC<SearchViewProps> = ({ actionContext }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('semantic')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchTypes = [
    { id: 'semantic', label: 'Semantic Search', icon: Search },
    { id: 'keyword', label: 'Keyword Search', icon: Filter },
    { id: 'visual', label: 'Visual Search', icon: Image },
    { id: 'hybrid', label: 'Hybrid Search', icon: SortDesc }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      // Simulate search based on action context
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock results based on search type and context
      const mockResults = [
        {
          id: '1',
          title: `${searchType} result for "${searchQuery}"`,
          content: 'Sample content matching your search query...',
          type: 'document',
          score: 0.95,
          timestamp: new Date().toISOString()
        }
      ]
      
      setResults(mockResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            RAG Search Engine
          </h1>
          <p className="text-gray-600">
            {actionContext ? `Context: ${actionContext}` : 'Search through your knowledge base'}
          </p>
        </div>

        {/* Search Interface */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          {/* Search Type Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {searchTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSearchType(type.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === type.id
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Enter your ${searchType} search query...`}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results ({results.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {result.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Score: {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{result.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {result.type}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isLoading && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search query or search type
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchView
