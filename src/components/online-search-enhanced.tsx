"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Globe, ExternalLink, Clock, BookOpen, Zap, Loader2, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  source: string
  timestamp: number
  relevanceScore: number
}

interface OnlineSearchProps {
  query: string
  onResultSelect?: (result: SearchResult) => void
  onResultsChange?: (results: SearchResult[]) => void
  enableVoice?: boolean
}

export function OnlineSearchEnhanced({ 
  query: initialQuery = '', 
  onResultSelect, 
  onResultsChange,
  enableVoice = true 
}: OnlineSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  
  // Voice features
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setQuery(transcript)
          setIsListening(false)
          // Auto-search when voice input is complete
          handleSearch(transcript)
        }
        
        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
      
      // Check for speech synthesis support
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
        setSpeechSupported(true)
      }
    }
  }, [])

  const speakText = useCallback((text: string) => {
    if (synthRef.current && !isSpeaking) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      synthRef.current.speak(utterance)
    }
  }, [isSpeaking])

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSelectedResultIndex(-1)
    
    try {
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10)
        return newHistory
      })
      
      // Simulate online search API call
      const searchResults = await simulateOnlineSearch(searchQuery)
      setResults(searchResults)
      
      if (onResultsChange) {
        onResultsChange(searchResults)
      }
      
      // Announce results via speech if enabled
      if (enableVoice && speechSupported && searchResults.length > 0) {
        speakText(`Found ${searchResults.length} results for ${searchQuery}`)
      }
      
    } catch (error) {
      console.error('Search error:', error)
      if (enableVoice && speechSupported) {
        speakText('Search failed. Please try again.')
      }
    } finally {
      setIsSearching(false)
    }
  }, [query, onResultsChange, enableVoice, speechSupported, speakText])

  // Live search functionality
  useEffect(() => {
    if (query.trim() && query !== initialQuery) {
      const debounceTimer = setTimeout(() => {
        handleSearch(query)
      }, 500) // 500ms debounce for live search
      
      return () => clearTimeout(debounceTimer)
    }
  }, [query, initialQuery, handleSearch])

  // Simulate online search (replace with actual API in production)
  const simulateOnlineSearch = async (searchQuery: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: `${searchQuery} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQuery)}`,
        snippet: `Comprehensive information about ${searchQuery} including definitions, history, and related topics.`,
        source: 'Wikipedia',
        timestamp: Date.now(),
        relevanceScore: 0.95
      },
      {
        id: '2',
        title: `Latest research on ${searchQuery}`,
        url: `https://scholar.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        snippet: `Recent academic papers and research findings related to ${searchQuery}.`,
        source: 'Google Scholar',
        timestamp: Date.now(),
        relevanceScore: 0.87
      },
      {
        id: '3',
        title: `${searchQuery} Documentation`,
        url: `https://docs.example.com/${searchQuery.toLowerCase()}`,
        snippet: `Official documentation and guides for ${searchQuery}.`,
        source: 'Official Docs',
        timestamp: Date.now(),
        relevanceScore: 0.82
      }
    ]
    
    return mockResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speakText = (text: string) => {
    if (synthRef.current && !isSpeaking) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [isSpeaking])

  const handleResultClick = (result: SearchResult, index: number) => {
    setSelectedResultIndex(index)
    if (onResultSelect) {
      onResultSelect(result)
    }
    
    // Speak result title if voice is enabled
    if (enableVoice && speechSupported) {
      speakText(`Opening ${result.title}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedResultIndex(prev => 
        prev < results.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedResultIndex(prev => 
        prev > 0 ? prev - 1 : results.length - 1
      )
    } else if (e.key === 'Escape') {
      setSelectedResultIndex(-1)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Input with Voice Controls */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search online resources..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          
          {/* Voice Controls */}
          {enableVoice && speechSupported && (
            <div className="flex items-center space-x-1">
              <button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isSearching}
                className={`p-2 rounded-lg border ${
                  isListening 
                    ? 'bg-red-500 border-red-500 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                } hover:bg-opacity-80 transition-colors`}
                title={isListening ? 'Stop listening' : 'Start voice search'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <button
                onClick={isSpeaking ? stopSpeaking : () => speakText(query)}
                disabled={!query.trim() || isSearching}
                className={`p-2 rounded-lg border ${
                  isSpeaking 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                } hover:bg-opacity-80 transition-colors disabled:opacity-50`}
                title={isSpeaking ? 'Stop speaking' : 'Speak query'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          )}
          
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
        
        {/* Voice Status Indicator */}
        {isListening && (
          <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 
                          border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Listening... speak now</span>
            </div>
          </div>
        )}
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Recent:
          </span>
          {searchHistory.slice(0, 5).map((historyQuery, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(historyQuery)
                handleSearch(historyQuery)
              }}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                         rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {historyQuery}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Results ({results.length})
            </h3>
            {enableVoice && speechSupported && (
              <button
                onClick={() => speakText(`Reading ${results.length} search results`)}
                disabled={isSpeaking}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Read results
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result, index)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResultIndex === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } bg-white dark:bg-gray-800`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {result.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {result.source} • {result.url}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {result.snippet}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Relevance: {Math.round(result.relevanceScore * 100)}%
                      </span>
                      {enableVoice && speechSupported && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            speakText(result.snippet)
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Read snippet
                        </button>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && query.trim() && results.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs mt-1">Try different keywords or check your spelling</p>
        </div>
      )}

      {/* Live Search Indicator */}
      {query.trim() && !isSearching && (
        <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
          <Zap className="w-3 h-3" />
          <span className="text-xs">Live search active</span>
        </div>
      )}
    </div>
  )
}
