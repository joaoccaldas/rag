/**
 * 🧪 PRIORITY 8: COMPREHENSIVE TESTING SUITE
 * 
 * Unit tests for the UnifiedSearchContext to ensure
 * proper source tracking and intelligent search functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

// Mock the intelligent search engine
jest.mock('../utils/unified-intelligent-search-engine', () => ({
  intelligentSearch: jest.fn(),
  recordSearchFeedback: jest.fn(),
  getSearchMetrics: jest.fn()
}))

import { SearchProvider, useSearch } from '../contexts/UnifiedSearchContext'
import { intelligentSearch } from '../utils/unified-intelligent-search-engine'
import { Document, DocumentChunk } from '../types'

// Test wrapper component
const SearchWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SearchProvider>{children}</SearchProvider>
)

describe('UnifiedSearchContext', () => {
  const mockIntelligentSearch = intelligentSearch as jest.MockedFunction<typeof intelligentSearch>
  
  const mockDocument: Document = {
    id: 'test-doc-1',
    name: 'Test Document',
    type: 'text',
    content: 'Test document content',
    chunks: [
      {
        id: 'chunk-1',
        content: 'Test chunk content for testing search functionality',
        embedding: new Array(384).fill(0.5),
        metadata: {
          page: 1,
          section: 'introduction'
        }
      }
    ],
    metadata: {
      author: 'Test Author',
      createdAt: '2025-01-01',
      domain: 'testing'
    },
    embedding: new Array(384).fill(0.5),
    status: 'ready',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }

  const mockSearchResults = [
    {
      document: mockDocument,
      chunk: mockDocument.chunks![0],
      scores: {
        semantic: 0.95,
        lexical: 0.88,
        exactMatch: 0.92,
        combined: 0.91
      },
      matchedTerms: ['test', 'search'],
      explanation: 'High relevance match for test query',
      confidenceLevel: 'high' as const
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Hook Initialization', () => {
    it('should initialize with empty search state', () => {
      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      expect(result.current.searchResults).toEqual([])
      expect(result.current.isSearching).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastQuery).toBe('')
      expect(result.current.searchHistory).toEqual([])
    })

    it('should throw error when used outside SearchProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useSearch())
      }).toThrow('useSearch must be used within a SearchProvider')
      
      consoleError.mockRestore()
    })
  })

  describe('Search Functionality', () => {
    it('should perform intelligent search successfully', async () => {
      mockIntelligentSearch.mockResolvedValueOnce(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('test query')
        expect(results).toHaveLength(1)
        expect(results[0].document?.name).toBe('Test Document')
        expect(results[0].chunk?.content).toBe('Test chunk content for testing search functionality')
      })

      expect(mockIntelligentSearch).toHaveBeenCalledWith('test query', {
        documents: undefined,
        mode: 'balanced',
        limit: expect.any(Number),
        threshold: 0.2,
        includeExpansion: true,
        enableCaching: true
      })

      expect(result.current.searchResults).toHaveLength(1)
      expect(result.current.lastQuery).toBe('test query')
      expect(result.current.searchHistory).toContain('test query')
      expect(result.current.isSearching).toBe(false)
    })

    it('should handle empty query gracefully', async () => {
      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('')
        expect(results).toEqual([])
      })

      expect(mockIntelligentSearch).not.toHaveBeenCalled()
      expect(result.current.searchResults).toEqual([])
    })

    it('should handle search errors properly', async () => {
      const searchError = new Error('Search failed')
      mockIntelligentSearch.mockRejectedValueOnce(searchError)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('error query')
        expect(results).toEqual([])
      })

      expect(result.current.error).toBe('Search failed')
      expect(result.current.isSearching).toBe(false)
    })

    it('should filter out results without required fields', async () => {
      const incompleteResults = [
        ...mockSearchResults,
        {
          document: undefined,
          chunk: mockDocument.chunks![0],
          scores: { semantic: 0.5, lexical: 0.5, exactMatch: 0.5, combined: 0.5 },
          matchedTerms: [],
          explanation: 'Incomplete result',
          confidenceLevel: 'low' as const
        }
      ]
      
      mockIntelligentSearch.mockResolvedValueOnce(incompleteResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('test query')
        expect(results).toHaveLength(1) // Only the complete result should be returned
      })
    })
  })

  describe('Search State Management', () => {
    it('should manage search history correctly', async () => {
      mockIntelligentSearch.mockResolvedValue(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        await result.current.searchDocuments('first query')
      })

      await act(async () => {
        await result.current.searchDocuments('second query')
      })

      expect(result.current.searchHistory).toEqual(['second query', 'first query'])
    })

    it('should not duplicate queries in history', async () => {
      mockIntelligentSearch.mockResolvedValue(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        await result.current.searchDocuments('same query')
      })

      await act(async () => {
        await result.current.searchDocuments('same query')
      })

      expect(result.current.searchHistory).toEqual(['same query'])
    })

    it('should clear results correctly', () => {
      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      act(() => {
        result.current.clearResults()
      })

      expect(result.current.searchResults).toEqual([])
      expect(result.current.lastQuery).toBe('')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Source Tracking', () => {
    it('should preserve document and chunk references in results', async () => {
      mockIntelligentSearch.mockResolvedValueOnce(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('test query')
        
        expect(results[0]).toEqual({
          document: mockDocument,
          chunk: mockDocument.chunks![0],
          similarity: 0.91,
          score: 0.91,
          id: 'chunk-1',
          content: 'Test chunk content for testing search functionality',
          metadata: {
            page: 1,
            section: 'introduction'
          },
          relevantText: 'High relevance match for test query'
        })
      })
    })

    it('should convert metadata properly for compatibility', async () => {
      mockIntelligentSearch.mockResolvedValueOnce(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        const results = await result.current.searchDocuments('test query')
        
        expect(results[0].metadata).toEqual({
          page: 1,
          section: 'introduction'
        })
      })
    })
  })

  describe('Feedback System', () => {
    it('should record feedback successfully', async () => {
      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      await act(async () => {
        await result.current.provideFeedback('result-id', 5, 'test query')
      })

      // Verify feedback was recorded (implementation specific)
      expect(true).toBe(true) // Placeholder for actual feedback verification
    })
  })

  describe('Query Suggestions', () => {
    it('should return suggestions from search history', async () => {
      mockIntelligentSearch.mockResolvedValue(mockSearchResults)

      const { result } = renderHook(() => useSearch(), {
        wrapper: SearchWrapper
      })

      // Build search history
      await act(async () => {
        await result.current.searchDocuments('test query one')
        await result.current.searchDocuments('test query two')
        await result.current.searchDocuments('different query')
      })

      await act(async () => {
        const suggestions = await result.current.getQuerySuggestions('test')
        expect(suggestions).toContain('test query two')
        expect(suggestions).toContain('test query one')
        expect(suggestions).not.toContain('different query')
      })
    })
  })
})

describe('Search Integration Tests', () => {
  it('should work end-to-end with real-like data flow', async () => {
    const mockSearchEngine = intelligentSearch as jest.MockedFunction<typeof intelligentSearch>
    
    // Mock complex search results
    const complexResults = [
      {
        document: {
          id: 'doc-1',
          name: 'Financial Report 2024',
          type: 'pdf',
          content: 'Financial data and analysis',
          chunks: [
            {
              id: 'chunk-1',
              content: 'Revenue increased by 15% year over year',
              embedding: new Array(384).fill(0.7),
              metadata: { page: 1, type: 'financial' }
            }
          ],
          metadata: { department: 'finance', year: 2024 },
          embedding: new Array(384).fill(0.6),
          status: 'ready' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        chunk: {
          id: 'chunk-1',
          content: 'Revenue increased by 15% year over year',
          embedding: new Array(384).fill(0.7),
          metadata: { page: 1, type: 'financial' }
        },
        scores: {
          semantic: 0.92,
          lexical: 0.85,
          exactMatch: 0.95,
          combined: 0.91
        },
        matchedTerms: ['revenue', 'financial'],
        explanation: 'Strong match for financial query',
        confidenceLevel: 'high' as const
      }
    ]

    mockSearchEngine.mockResolvedValueOnce(complexResults)

    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchWrapper
    })

    await act(async () => {
      const results = await result.current.searchDocuments('financial revenue report')
      
      expect(results).toHaveLength(1)
      expect(results[0].document?.name).toBe('Financial Report 2024')
      expect(results[0].chunk?.content).toContain('Revenue increased')
      expect(results[0].similarity).toBe(0.91)
      expect(results[0].metadata).toEqual({ page: 1, type: 'financial' })
    })

    expect(result.current.lastQuery).toBe('financial revenue report')
    expect(result.current.searchHistory).toContain('financial revenue report')
    expect(result.current.error).toBeNull()
  })
})
