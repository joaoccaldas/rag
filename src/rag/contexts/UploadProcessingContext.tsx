"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { Document, UploadProgress, DocumentStatus, ProcessingStage } from '../types'
import { generateEmbedding } from '../utils/document-processing'
import processDocumentWithAI from '../utils/enhanced-document-processing'
import { ragStorage } from '../utils/storage'
import { storeVisualContent } from '../utils/visual-content-storage'
import { FileStorageManager } from '../utils/file-storage'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { getDocumentType } from './DocumentManagementContext'
import { processVisualContent } from '../../storage/utils/visual-content-processing'
import { unifiedFileStorage } from '../../storage/managers/unified-file-storage'

interface UploadProcessingState {
  uploadProgress: Record<string, UploadProgress>
  isProcessing: boolean
  error: string | null
}

type UploadProcessingAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: UploadProgress }
  | { type: 'REMOVE_UPLOAD_PROGRESS'; payload: string }

const initialState: UploadProcessingState = {
  uploadProgress: {},
  isProcessing: false,
  error: null
}

function uploadProcessingReducer(state: UploadProcessingState, action: UploadProcessingAction): UploadProcessingState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isProcessing: false }
    
    case 'UPDATE_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.documentId]: action.payload
        }
      }
    
    case 'REMOVE_UPLOAD_PROGRESS':
      const newProgress = { ...state.uploadProgress }
      delete newProgress[action.payload]
      return { ...state, uploadProgress: newProgress }
    
    default:
      return state
  }
}

interface UploadProcessingContextType {
  state: UploadProcessingState
  uploadProgress: Record<string, UploadProgress>
  processDocument: (file: File, onDocumentReady: (document: Document) => void) => Promise<void>
}

const UploadProcessingContext = createContext<UploadProcessingContextType | null>(null)

export function UploadProcessingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uploadProcessingReducer, initialState)
  const { timeOperation } = usePerformanceMonitor()

  const processDocumentUpload = useCallback(async (file: File, onDocumentReady: (document: Document) => void) => {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Starting upload process for ${file.name} (${file.type}, ${file.size} bytes)`)
    
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Initialize file storage manager
      const fileStorage = new FileStorageManager()
      
      // Stage 1: Upload and Store Original File
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          documentId,
          filename: file.name,
          status: 'uploading' as DocumentStatus,
          progress: 0,
          stage: 'upload' as ProcessingStage
        }
      })

      // Store the original file
      console.log(`💾 Storing original file: ${file.name}`)
      const storedFile = await fileStorage.storeFile(file, documentId)
      console.log(`✅ Original file stored with ID: ${storedFile.id}`)

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        dispatch({
          type: 'UPDATE_UPLOAD_PROGRESS',
          payload: {
            documentId,
            filename: file.name,
            status: 'uploading' as DocumentStatus,
            progress: i,
            stage: 'upload' as ProcessingStage
          }
        })
      }

      // Stage 2: Enhanced Processing with AI
      console.log(`🤖 Processing document with AI analysis: ${file.name}`)
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          documentId,
          filename: file.name,
          status: 'processing' as DocumentStatus,
          progress: 0,
          stage: 'parse' as ProcessingStage
        }
      })

      // Use enhanced processing with AI analysis
      const enhancedResult = await timeOperation('enhanced-document-processing', 
        () => processDocumentWithAI(file, documentId, {
          enableAISummarization: true,
          enableKeywordExtraction: true,
          aiModel: 'llama3:latest'
        })
      )

      const { content, chunks, wordCount, visualContent, aiSummary, extractedKeywords, processingMetadata } = enhancedResult

      console.log(`📊 Enhanced processing complete:`)
      console.log(`   - ${chunks.length} chunks, ${wordCount} words`)
      console.log(`   - ${visualContent?.length || 0} visual elements`)
      console.log(`   - AI Summary: ${aiSummary ? '✅' : '❌'}`)
      console.log(`   - Keywords: ${extractedKeywords ? '✅' : '❌'}`)
      console.log(`   - Processing time: ${processingMetadata.duration}ms`)
      console.log(`   - Status: ${processingMetadata.status}`)

      // Update progress based on processing status
      const progressValue = processingMetadata.status === 'complete' ? 50 : 
                           processingMetadata.status === 'partial' ? 40 : 30

      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          documentId,
          filename: file.name,
          status: 'chunking' as DocumentStatus,
          progress: progressValue,
          stage: 'chunk' as ProcessingStage
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Stage 3: Create document with enhanced metadata and original file reference
      const document: Document = {
        id: documentId,
        name: file.name,
        type: getDocumentType(file.name),
        content,
        metadata: {
          title: file.name,
          createdAt: new Date(),
          wordCount,
          originalFileId: storedFile.id, // Reference to stored original file
          originalFileName: storedFile.originalName,
          originalFileSize: storedFile.size,
          originalFilePath: storedFile.storedPath,
          ...(aiSummary && {
            summary: aiSummary.summary,
            tags: aiSummary.tags
          }),
          ...(extractedKeywords && {
            keywords: extractedKeywords.conceptual.concat(extractedKeywords.technical)
          })
        },
        status: 'embedding' as DocumentStatus,
        uploadedAt: new Date(),
        lastModified: new Date(),
        size: file.size,
        chunks,
        visualContent: visualContent || [],
        ...(aiSummary && {
          aiAnalysis: {
            summary: aiSummary.summary,
            keywords: aiSummary.keywords || [],
            tags: aiSummary.tags || [],
            topics: aiSummary.topics || [],
            sentiment: aiSummary.sentiment || 'neutral',
            complexity: aiSummary.complexity || 'medium',
            documentType: aiSummary.documentType || 'Document',
            confidence: aiSummary.confidence || 0.5,
            analyzedAt: new Date(),
            model: 'llama3:latest'
          }
        })
      }

      // Stage 4: Embedding generation
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          documentId,
          filename: file.name,
          status: 'embedding' as DocumentStatus,
          progress: 75,
          stage: 'embed' as ProcessingStage
        }
      })

      // Generate embeddings for chunks
      const chunksWithEmbeddings = await Promise.all(
        chunks.map(async (chunk) => ({
          ...chunk,
          embedding: await generateEmbedding(chunk.content)
        }))
      )

      await new Promise(resolve => setTimeout(resolve, 1500))

      // Stage 5: Finalize with enhanced metadata
      const finalDocument: Document = {
        ...document,
        chunks: chunksWithEmbeddings,
        status: 'ready' as DocumentStatus,
        embedding: await generateEmbedding(content),
        visualContent: visualContent && visualContent.length > 0 ? visualContent : undefined  // ✅ ATTACH visual content to document
      }

      // Store visual content separately for the visual content system (with enhanced processing)
      if (visualContent && visualContent.length > 0) {
        console.log(`📸 Processing ${visualContent.length} visual elements from ${file.name}`)
        try {
          // Use enhanced visual content processing for real thumbnails
          const { processDocumentWithRealThumbnails } = await import('../utils/enhanced-visual-processing')
          const enhancedVisualContent = await processDocumentWithRealThumbnails(file, documentId)
          
          // Store the enhanced visual content directly
          if (enhancedVisualContent.length > 0) {
            await storeVisualContent(enhancedVisualContent)
            console.log(`✅ Stored ${enhancedVisualContent.length} enhanced visual items`)
          }
          
          // Also store original visual content if available
          if (visualContent.length > 0) {
            const compatibleVisualContent = visualContent.map(vc => ({
              ...vc,
              title: vc.title || `Visual from ${file.name}`,
              source: vc.source || '',
              data: {
                ...vc.data,
                base64: vc.data?.base64 || '',
                url: vc.data?.url || ''
              }
            }))
            await storeVisualContent(compatibleVisualContent as any)
          }
          console.log(`✅ Stored enhanced visual elements for ${file.name}`)
          
          // File already stored by FileStorageManager above
          console.log(`💾 File ${file.name} stored for UI access`)
          
          // Log details about the visual content
          const contentTypes = enhancedVisualContent.reduce((acc: Record<string, number>, vc) => {
            acc[vc.type] = (acc[vc.type] || 0) + 1
            return acc
          }, {})
          console.log(`📊 Enhanced visual content breakdown:`, contentTypes)
          
        } catch (error) {
          console.error('❌ Failed to process enhanced visual content:', error)
          // Fallback to original processing
          try {
            const storageVisualContent = visualContent.map(vc => ({
              id: vc.id,
              documentId: vc.documentId,
              type: vc.type as 'chart' | 'table' | 'graph' | 'diagram' | 'image',
              title: vc.title,
              data: {
                chartType: vc.data?.chartType,
                dataPoints: vc.data?.dataPoints,
                headers: vc.data?.headers,
                rows: vc.data?.rows,
                base64: vc.data?.base64,
                url: vc.data?.url
              },
              metadata: {
                pageNumber: vc.metadata?.pageNumber,
                boundingBox: vc.metadata?.boundingBox,
                extractedAt: vc.metadata?.extractedAt || new Date().toISOString(),
                confidence: vc.metadata?.confidence || 0.8,
                documentTitle: vc.metadata?.documentTitle || file.name
              }
            }))
            await storeVisualContent(storageVisualContent)
            console.log(`✅ Stored ${visualContent.length} visual elements for ${file.name} (fallback)`)
          } catch (fallbackError) {
            console.error('❌ Failed to store visual content with fallback:', fallbackError)
          }
        }
      } else {
        console.log('ℹ️ No visual content extracted from document, trying enhanced extraction...')
        try {
          // Try enhanced visual extraction even if none was found initially
          const enhancedVisualContent = await processVisualContent(file, documentId)
          if (enhancedVisualContent.length > 0) {
            console.log(`🎯 Enhanced extraction found ${enhancedVisualContent.length} additional visual elements`)
            
            const storageVisualContent = enhancedVisualContent.map((vc: { id: string; type: string; content?: string; title?: string; metadata?: Record<string, unknown> }) => ({
              id: vc.id,
              documentId: documentId,
              type: vc.type === 'text' ? 'image' : vc.type as 'chart' | 'table' | 'graph' | 'diagram' | 'image',
              title: vc.title || `${vc.type} from ${file.name}`,
              data: {
                content: vc.content,
                base64: vc.type === 'image' ? vc.content : undefined
              },
              metadata: {
                extractedAt: vc.metadata?.extractedAt || new Date().toISOString(),
                confidence: vc.metadata?.confidence || 0.8,
                documentTitle: vc.metadata?.documentTitle || file.name
              }
            }))
            
            await storeVisualContent(storageVisualContent)
            
            // File already stored by FileStorageManager above
            console.log(`✅ Stored ${enhancedVisualContent.length} enhanced visual elements`)
          }
        } catch (error) {
          console.error('❌ Enhanced visual content extraction failed:', error)
        }
      }

      // Save to storage
      try {
        const existingDocuments = await ragStorage.loadDocuments()
        const updatedDocuments = [...existingDocuments, finalDocument]
        await ragStorage.saveDocuments(updatedDocuments)
        console.log(`Document ${file.name} saved to storage successfully`)
      } catch (error) {
        console.error('Failed to save document to storage:', error)
      }

      // Complete processing
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          documentId,
          filename: file.name,
          status: 'ready' as DocumentStatus,
          progress: 100,
          stage: 'store' as ProcessingStage
        }
      })

      // Notify parent with the ready document
      onDocumentReady(finalDocument)
      
      // Clean up progress after a short delay
      setTimeout(() => {
        dispatch({ type: 'REMOVE_UPLOAD_PROGRESS', payload: documentId })
      }, 2000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      dispatch({ type: 'REMOVE_UPLOAD_PROGRESS', payload: documentId })
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false })
    }
  }, [timeOperation])

  const value: UploadProcessingContextType = {
    state,
    uploadProgress: state.uploadProgress,
    processDocument: processDocumentUpload
  }

  return (
    <UploadProcessingContext.Provider value={value}>
      {children}
    </UploadProcessingContext.Provider>
  )
}

export function useUploadProcessing() {
  const context = useContext(UploadProcessingContext)
  if (!context) {
    throw new Error('useUploadProcessing must be used within an UploadProcessingProvider')
  }
  return context
}
