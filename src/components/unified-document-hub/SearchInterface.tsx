/**
 * Search Interface Component - Handles document search functionality
 */

"use client"

import React, { useState } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { SearchInterfaceProps } from './types'

export function SearchInterface({
  query,
  results,
  isSearching,
  suggestions,
  searchHistory,
  onSearch,
  onClearSearch,
  onSuggestionClick
}: SearchInterfaceProps) {
  const [localQuery, setLocalQuery] = useState(query)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(localQuery)
    setShowSuggestions(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    setShowSuggestions(value.length > 0)
  }

  const handleClear = () => {
    setLocalQuery('')
    onClearSearch()
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion)
    onSuggestionClick(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(localQuery.length > 0)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {(localQuery || isSearching) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isSearching ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                Recent Searches
              </h4>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(historyItem)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {historyItem}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                Suggestions
              </h4>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                >
                  <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results Summary */}
      {results.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
