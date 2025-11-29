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
  isEnabled: boolean
  onResults: (results: SearchResult[], query: string) => void
  className?: string
}

export function OnlineSearch({ isEnabled, onResults, className = '' }: OnlineSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const performSearch = async (query: string) => {
    if (!query.trim() || !isEnabled) return

    setIsSearching(true)
    setError(null)
    setLastQuery(query)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      onResults(data.results || [], query)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => {
          const query = prompt('Enter search query:')
          if (query) performSearch(query)
        }}
        disabled={!isEnabled || isSearching}
        className={`
          ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isSearching ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
          transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
        `}
        title="Search the web"
      >
        {isSearching ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Search className="w-5 h-5" />
        )}
      </button>

      {error && (
        <div className="flex items-center space-x-1 text-red-500" title={error}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Search failed</span>
        </div>
      )}

      {lastQuery && !isSearching && !error && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last search: &ldquo;{lastQuery.length > 20 ? lastQuery.substring(0, 20) + '...' : lastQuery}&rdquo;
        </span>
      )}
    </div>
  )
}

// Search results display component
interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onClose: () => void
}

export function SearchResults({ results, query, onClose }: SearchResultsProps) {
  if (results.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Results for &ldquo;{query}&rdquo;
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                        <span>{result.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">
                      {result.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{result.url}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {result.engine}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Found {results.length} results • Powered by open-source search
          </p>
        </div>
      </div>
    </div>
  )
}
