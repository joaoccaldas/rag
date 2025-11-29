/**
 * Real-time Suggestions Component
 * 
 * Provides intelligent query suggestions with auto-completion, spell checking,
 * and related topic recommendations.
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SuggestionEngine, Suggestion, SuggestionConfig } from '../rag/utils/suggestions'

interface SuggestionsProps {
  query: string
  onQueryChange: (query: string) => void
  onSuggestionSelect: (suggestion: Suggestion) => void
  context?: { documentId?: string; category?: string }
  config?: Partial<SuggestionConfig>
  className?: string
}

export const RealTimeSuggestions: React.FC<SuggestionsProps> = ({
  query,
  onQueryChange,
  onSuggestionSelect,
  context,
  config = {},
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [engine] = useState(() => new SuggestionEngine(config))
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < (config.minQueryLength || 2)) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        const newSuggestions = await engine.getSuggestions(searchQuery, context)
        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    },
    [engine, context, config.minQueryLength]
  )

  // Handle query changes with debouncing
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, config.debounceMs || 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, fetchSuggestions, config.debounceMs])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      case 'Tab':
        if (selectedIndex >= 0) {
          event.preventDefault()
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: Suggestion) => {
    onQueryChange(suggestion.text)
    onSuggestionSelect(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    // Record analytics
    engine.recordSuggestionSelection(suggestion, query)
    
    // Focus back to input
    inputRef.current?.focus()
  }

  // Handle input focus/blur
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = (event: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(event.relatedTarget as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }

  // Get suggestion icon based on type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'correction':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        )
      case 'topic':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      case 'related':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  // Get suggestion type label
  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'completion': return 'Auto-complete'
      case 'correction': return 'Suggestion'
      case 'topic': return 'Topic'
      case 'related': return 'Related'
      default: return 'Search'
    }
  }

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search documents... (start typing for suggestions)"
          className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                   rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0
                         ${index === selectedIndex 
                           ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                           : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                         }
                         transition-colors duration-150`}
            >
              {/* Suggestion icon */}
              <div className="flex-shrink-0">
                {getSuggestionIcon(suggestion.type)}
              </div>

              {/* Suggestion content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {highlightMatch(suggestion.text, query)}
                  </span>
                  
                  {/* Type badge */}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                                 ${suggestion.type === 'completion' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                   suggestion.type === 'correction' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                   suggestion.type === 'topic' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                   'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </div>

                {/* Context information */}
                {suggestion.context && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {suggestion.context}
                  </p>
                )}
              </div>

              {/* Suggestion score/popularity */}
              <div className="flex-shrink-0 text-right">
                {suggestion.metadata?.popularity && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {suggestion.metadata.popularity} searches
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        i < Math.floor(suggestion.score * 5)
                          ? 'bg-blue-400'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Suggestion controls help text */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ↑↓ to navigate • Enter to select • Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeSuggestions
