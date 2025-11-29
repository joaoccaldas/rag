/**
 * Enhanced Type Definitions
 * 
 * This module provides enhanced type definitions for better type safety
 * throughout the RAG application.
 */

// Base utility types
export type NonEmptyArray<T> = [T, ...T[]]
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Document-related types with strict validation
export interface DocumentMetadata {
  readonly pageCount?: number
  readonly wordCount?: number
  readonly language?: string
  readonly author?: string
  readonly createdAt?: string
  readonly modifiedAt?: string
  readonly fileSize: number
  readonly mimeType: string
}

export interface AIAnalysis {
  readonly keywords: NonEmptyArray<string>
  readonly tags: NonEmptyArray<string>
  readonly topics: NonEmptyArray<string>
  readonly sentiment: 'positive' | 'negative' | 'neutral'
  readonly complexity: 'low' | 'medium' | 'high'
  readonly confidence: number // 0 to 1
  readonly summary?: string
  readonly extractedEntities?: Array<{
    text: string
    type: 'person' | 'organization' | 'location' | 'date' | 'other'
    confidence: number
  }>
}

export interface Document {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly size: number
  readonly content: string
  readonly extractedText?: string
  readonly uploadedAt: string
  readonly lastModified?: string
  readonly status: 'processing' | 'ready' | 'error'
  readonly progress?: number
  readonly metadata?: DocumentMetadata
  readonly aiAnalysis?: AIAnalysis
  readonly visualContent?: readonly VisualContent[]
  readonly file?: File
}

// Visual content types with strict validation
export interface VisualContentMetadata {
  readonly width?: number
  readonly height?: number
  readonly format?: string
  readonly fileSize?: number
  readonly createdAt: string
  readonly lastAnalyzed?: string
  readonly confidence?: number
}

export interface LLMSummary {
  readonly keyInsights: NonEmptyArray<string>
  readonly challenges: readonly string[]
  readonly mainContent: string
  readonly significance: string
  readonly technicalDetails?: readonly string[]
}

export interface VisualContent {
  readonly id: string
  readonly documentId: string
  readonly type: 'image' | 'chart' | 'table' | 'diagram' | 'screenshot'
  readonly title: string
  readonly description?: string
  readonly source: string
  readonly thumbnail?: string
  readonly data?: {
    readonly url?: string
    readonly base64?: string
    readonly headers?: readonly string[]
    readonly rows?: readonly (readonly string[])[]
    readonly elements?: readonly unknown[]
  }
  readonly extractedText?: string
  readonly ocrConfidence?: number
  readonly processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  readonly processingError?: string
  readonly llmSummary?: LLMSummary
  readonly metadata: VisualContentMetadata
  readonly tags: readonly string[]
  readonly category?: string
  readonly isVisible: boolean
  readonly isFavorite: boolean
}

// Search-related types
export interface SearchFilters {
  readonly documentTypes: readonly string[]
  readonly dateRange: {
    readonly start: string | null
    readonly end: string | null
  }
  readonly authors: readonly string[]
  readonly tags: readonly string[]
  readonly sentiment: readonly string[]
  readonly complexity: readonly string[]
  readonly minConfidence: number
}

export interface SearchResult {
  readonly id: string
  readonly documentId: string
  readonly documentName: string
  readonly documentType: string
  readonly relevanceScore: number
  readonly matchedText: string
  readonly context: string
  readonly highlights: readonly string[]
  readonly metadata: {
    readonly pageNumber?: number
    readonly section?: string
    readonly keywords: readonly string[]
    readonly sentiment: string
  }
}

export interface SearchQuery {
  readonly id: string
  readonly query: string
  readonly timestamp: string
  readonly resultsCount: number
  readonly executionTime: number
  readonly filters?: SearchFilters
}

// UI State types
export interface NotificationAction {
  readonly label: string
  readonly action: string
}

export interface Notification {
  readonly id: string
  readonly type: 'success' | 'error' | 'warning' | 'info'
  readonly title: string
  readonly message: string
  readonly timestamp: string
  readonly duration?: number
  readonly actions?: readonly NotificationAction[]
}

export interface ConfirmationDialog {
  readonly open: boolean
  readonly title: string
  readonly message: string
  readonly onConfirm: string | null
  readonly onCancel: string | null
}

// Form validation types
export interface ValidationRule<T = unknown> {
  readonly required?: boolean
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: RegExp
  readonly min?: number
  readonly max?: number
  readonly custom?: (value: T) => string | null
}

export interface FieldValidation {
  readonly isValid: boolean
  readonly error?: string
}

export interface FormState<T extends Record<string, unknown>> {
  readonly values: T
  readonly errors: Partial<Record<keyof T, string>>
  readonly touched: Partial<Record<keyof T, boolean>>
  readonly isValid: boolean
  readonly isSubmitting: boolean
}

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>

// Component prop types
export interface BaseProps {
  readonly className?: string
  readonly children?: React.ReactNode
  readonly 'data-testid'?: string
}

export interface LoadingProps {
  readonly loading?: boolean
  readonly loadingText?: string
}

export interface ErrorProps {
  readonly error?: string | null
  readonly onRetry?: () => void
}

// Redux action types
export interface AsyncAction<T = unknown> {
  readonly type: string
  readonly payload?: T
  readonly meta?: {
    readonly requestId: string
    readonly arg: unknown
  }
}

export interface RejectedAction extends AsyncAction {
  readonly error: {
    readonly name: string
    readonly message: string
    readonly stack?: string
  }
}

// Utility type guards
export const isNotNull = <T>(value: T | null): value is T => value !== null
export const isNotUndefined = <T>(value: T | undefined): value is T => value !== undefined
export const isDefined = <T>(value: T | null | undefined): value is T => 
  value !== null && value !== undefined

export const isNonEmptyArray = <T>(array: T[]): array is NonEmptyArray<T> => 
  array.length > 0

export const isValidDocument = (doc: unknown): doc is Document => {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'id' in doc &&
    'name' in doc &&
    'type' in doc &&
    'size' in doc &&
    'content' in doc &&
    'uploadedAt' in doc &&
    'status' in doc
  )
}

export const isValidVisualContent = (content: unknown): content is VisualContent => {
  return (
    typeof content === 'object' &&
    content !== null &&
    'id' in content &&
    'documentId' in content &&
    'type' in content &&
    'title' in content &&
    'source' in content &&
    'processingStatus' in content &&
    'metadata' in content &&
    'tags' in content &&
    'isVisible' in content &&
    'isFavorite' in content
  )
}

// Environment variable types
export interface EnvironmentConfig {
  readonly NODE_ENV: 'development' | 'production' | 'test'
  readonly NEXT_PUBLIC_API_URL?: string
  readonly NEXT_PUBLIC_APP_VERSION?: string
  readonly DATABASE_URL?: string
  readonly JWT_SECRET?: string
}

// Performance monitoring types
export interface PerformanceMetrics {
  readonly renderTime: number
  readonly renderCount: number
  readonly averageRenderTime: number
  readonly lastRenderTime: number
}

export interface LoadingState {
  readonly isLoading: boolean
  readonly progress?: number
  readonly message?: string
}

// File upload types
export interface UploadConfig {
  readonly maxFileSize: number
  readonly allowedTypes: readonly string[]
  readonly maxFiles: number
  readonly validateFile?: (file: File) => string | null
}

export interface UploadProgress {
  readonly fileId: string
  readonly fileName: string
  readonly progress: number
  readonly status: 'pending' | 'uploading' | 'completed' | 'error'
  readonly error?: string
}
