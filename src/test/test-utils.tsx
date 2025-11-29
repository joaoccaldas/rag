/**
 * Testing Utilities
 * 
 * This module provides comprehensive testing utilities for the RAG application
 * including Redux testing, component testing, and mock factories.
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import documentsReducer from '../store/slices/documentsSlice'
import uiReducer from '../store/slices/uiSlice'
import searchReducer from '../store/slices/searchSlice'
import visualContentReducer from '../store/slices/visualContentSlice'

// Test store setup
export function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      documents: documentsReducer,
      ui: uiReducer,
      search: searchReducer,
      visualContent: visualContentReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for testing
      }),
  })
}

// Custom render function with Redux Provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any
  store?: ReturnType<typeof createTestStore>
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialState = {},
    store = createTestStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Mock data factories
export const mockDocument = {
  id: 'doc-1',
  name: 'Test Document.pdf',
  type: 'application/pdf',
  size: 1024000,
  content: 'This is test document content',
  extractedText: 'This is extracted text from the document',
  uploadedAt: '2024-01-01T00:00:00.000Z',
  status: 'ready' as const,
  metadata: {
    pageCount: 5,
    wordCount: 500,
    language: 'en',
  },
  aiAnalysis: {
    keywords: ['test', 'document', 'sample'],
    tags: ['pdf', 'document'],
    topics: ['testing', 'documentation'],
    sentiment: 'neutral' as const,
    complexity: 'medium' as const,
    confidence: 0.85,
    summary: 'This is a test document for testing purposes',
  },
}

export const mockVisualContent = {
  id: 'visual-1',
  documentId: 'doc-1',
  type: 'image' as const,
  title: 'Test Image',
  description: 'A test image for testing',
  source: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  processingStatus: 'completed' as const,
  llmSummary: {
    keyInsights: ['Test insight 1', 'Test insight 2'],
    challenges: ['Test challenge 1'],
    mainContent: 'This is test visual content',
    significance: 'Important for testing',
  },
  metadata: {
    width: 800,
    height: 600,
    format: 'png',
    createdAt: '2024-01-01T00:00:00.000Z',
    confidence: 0.9,
  },
  tags: ['test', 'image'],
  isVisible: true,
  isFavorite: false,
}

export const mockSearchResult = {
  id: 'result-1',
  documentId: 'doc-1',
  documentName: 'Test Document.pdf',
  documentType: 'application/pdf',
  relevanceScore: 0.85,
  matchedText: 'test query',
  context: 'This is the context around the matched text',
  highlights: ['test', 'query'],
  metadata: {
    keywords: ['test', 'document'],
    sentiment: 'neutral' as const,
  },
}

// Test utilities for different scenarios
export const createMockDocuments = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockDocument,
    id: `doc-${index + 1}`,
    name: `Test Document ${index + 1}.pdf`,
  }))
}

export const createMockVisualContent = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockVisualContent,
    id: `visual-${index + 1}`,
    title: `Test Image ${index + 1}`,
  }))
}

// Mock API responses
export const mockApiResponses = {
  uploadSuccess: {
    success: true,
    data: mockDocument,
    message: 'Document uploaded successfully',
  },
  uploadError: {
    success: false,
    error: 'Upload failed',
    message: 'Failed to upload document',
  },
  searchSuccess: {
    success: true,
    data: {
      results: [mockSearchResult],
      totalResults: 1,
      searchTime: 150,
    },
  },
  searchError: {
    success: false,
    error: 'Search failed',
    message: 'Failed to perform search',
  },
}

// Mock Redux state
export const mockInitialState = {
  documents: {
    items: [mockDocument],
    loading: false,
    error: null,
    totalDocuments: 1,
    totalSize: 1024000,
    uploadProgress: {},
    selectedDocumentId: null,
    filters: {
      type: [],
      status: [],
      dateRange: { start: null, end: null },
    },
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
    searchQuery: '',
  },
  ui: {
    activeTab: 'documents',
    sidebarCollapsed: false,
    sidebarWidth: 280,
    modals: {
      documentUpload: false,
      settings: false,
      help: false,
      confirmation: false,
    },
    globalLoading: false,
    componentLoading: {},
    notifications: [],
    theme: 'system' as const,
    fontSize: 'medium' as const,
    layout: {
      showPreview: true,
      previewPosition: 'right' as const,
      gridView: false,
      compactMode: false,
    },
    quickActions: {
      dragAndDrop: true,
      bulkSelection: true,
      quickSearch: true,
    },
    confirmationDialog: {
      open: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    },
  },
  search: {
    currentQuery: '',
    isSearching: false,
    results: [],
    totalResults: 0,
    searchTime: 0,
    recentQueries: [],
    suggestions: [],
    popularQueries: [],
    filters: {
      documentTypes: [],
      dateRange: { start: null, end: null },
      authors: [],
      tags: [],
      sentiment: [],
      complexity: [],
      minConfidence: 0.5,
    },
    sortBy: 'relevance' as const,
    sortOrder: 'desc' as const,
    currentPage: 1,
    resultsPerPage: 20,
    searchMode: 'simple' as const,
    semanticThreshold: 0.7,
    includeVisualContent: true,
    includeMetadata: true,
    analytics: {
      totalSearches: 0,
      averageResultsPerSearch: 0,
      mostSearchedTerms: [],
      searchSuccessRate: 0,
    },
    error: null,
    lastSearchFailed: false,
  },
  visualContent: {
    items: [mockVisualContent],
    loading: false,
    error: null,
    selectedItemIds: [],
    previewItemId: null,
    filters: {
      types: [],
      statuses: [],
      tags: [],
      categories: [],
      documentIds: [],
      dateRange: { start: null, end: null },
      minConfidence: 0,
      showFavoritesOnly: false,
      showVisibleOnly: true,
    },
    searchQuery: '',
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
    viewMode: 'grid' as const,
    gridSize: 'medium' as const,
    showDetails: false,
    processingQueue: [],
    batchOperationProgress: {},
    analytics: {
      totalItems: 1,
      byType: { image: 1 },
      byStatus: { completed: 1 },
      averageConfidence: 0.9,
      recentlyAdded: 1,
      topCategories: [],
    },
    thumbnailCache: {},
    lazyLoadOffset: 0,
  },
}

// Test assertion helpers
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectToHaveTextContent = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

// Async testing utilities
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react')
  return waitForElementToBeRemoved(element)
}

export const waitFor = async (callback: () => void | Promise<void>) => {
  const { waitFor } = await import('@testing-library/react')
  return waitFor(callback)
}

// User interaction utilities
export const userEvent = {
  async click(element: HTMLElement) {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    return user.click(element)
  },
  
  async type(element: HTMLElement, text: string) {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    return user.type(element, text)
  },
  
  async upload(element: HTMLElement, file: File) {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    return user.upload(element, file)
  },
}

// Export everything for easy imports
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
