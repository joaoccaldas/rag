"use client"

import { useState } from 'react'
import { Search, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
}

interface OnlineSearchProps {
  isEnabled?: boolean
  onResults?: (results: SearchResult[], query: string) => void
  provider?: string
  className?: string
}

export function OnlineSearch({ 
  isEnabled = true, 
  onResults, 
  provider = 'google',
  className = '' 
}: OnlineSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !isEnabled) return

    setIsSearching(true)
    setError(null)
    setLastQuery(searchQuery)

    try {
      // For now, simulate web search results since we don't have a real API
      // In production, this would call a search API like Serper, SerpAPI, etc.
      const mockResults: SearchResult[] = [
        {
          title: `${searchQuery} - Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQuery)}`,
          content: `Information about ${searchQuery} from Wikipedia. This would contain relevant details and context.`,
          engine: provider
        },
        {
          title: `${searchQuery} - Official Documentation`,
          url: `https://docs.example.com/${encodeURIComponent(searchQuery)}`,
          content: `Official documentation and technical details about ${searchQuery}.`,
          engine: provider
        },
        {
          title: `Recent news about ${searchQuery}`,
          url: `https://news.example.com/search?q=${encodeURIComponent(searchQuery)}`,
          content: `Latest news and updates related to ${searchQuery}.`,
          engine: provider
        }
      ]

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setResults(mockResults)
      if (onResults) {
        onResults(mockResults, searchQuery)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      console.error('Online search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-5 h-5 text-blue-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">Web Search</h3>
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {provider}
        </span>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web..."
            disabled={!isEnabled || isSearching}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isEnabled || isSearching || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Results
            </h4>
            <span className="text-xs text-gray-500">
              {results.length} results for &ldquo;{lastQuery}&rdquo;
            </span>
          </div>
          
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {result.title}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {result.url}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {result.content}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {!isEnabled && (
        <div className="mt-3 text-xs text-gray-500 italic">
          Web search is disabled
        </div>
      )}
    </div>
  )
}

export type { SearchResult }
export default OnlineSearch
