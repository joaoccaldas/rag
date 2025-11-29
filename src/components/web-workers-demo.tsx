/**
 * Web Workers Demo Component
 * Demonstrates the usage of Web Workers for document processing and vector operations
 */

import React, { useState } from 'react'
import { useDocumentProcessor, useVectorProcessor, useRAGProcessor, useWorkerPerformance } from '../workers/hooks/useWorkers'

interface ProcessingResult {
  document?: unknown
  embeddings?: unknown
  error?: string
}

export const WebWorkersDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  
  // Individual worker hooks
  const documentProcessor = useDocumentProcessor()
  const vectorProcessor = useVectorProcessor()
  
  // Combined RAG processor
  const ragProcessor = useRAGProcessor()
  
  // Performance monitoring
  const { metrics, getMetrics } = useWorkerPerformance()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
    }
  }

  const processDocumentOnly = async () => {
    if (!selectedFile) return
    
    try {
      const documentResult = await documentProcessor.processDocument(
        selectedFile,
        {
          enableAI: true,
          enableKeywords: true,
          chunkSize: 1000,
          chunkOverlap: 200
        },
        (progress, message, stage) => {
          console.log(`Document Processing: ${stage} - ${progress}% - ${message}`)
        }
      )
      
      setResult({ document: documentResult })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const processWithEmbeddings = async () => {
    if (!selectedFile) return
    
    try {
      const pipelineResult = await ragProcessor.processFullPipeline(
        selectedFile,
        {
          enableAI: true,
          generateEmbeddings: true,
          chunkSize: 1000,
          chunkOverlap: 200,
          embeddingModel: 'text-embedding-ada-002'
        }
      )
      
      setResult(pipelineResult)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const generateEmbeddingsOnly = async () => {
    const sampleTexts = [
      "This is a sample document about machine learning.",
      "Web Workers allow JavaScript to run code in background threads.",
      "Vector embeddings represent text as numerical vectors in high-dimensional space.",
      "React hooks provide a way to use state and lifecycle features in functional components."
    ]
    
    try {
      const embeddingResult = await vectorProcessor.computeEmbeddings(
        sampleTexts,
        {
          model: 'text-embedding-ada-002',
          batchSize: 2
        },
        (progress, message) => {
          console.log(`Vector Processing: ${progress}% - ${message}`)
        }
      )
      
      setResult({ embeddings: embeddingResult })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Web Workers Demo</h1>
      
      {/* Performance Metrics */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Worker Performance</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Active Tasks:</span> {metrics.activeTasks}
          </div>
          <div>
            <span className="font-medium">Total Tasks:</span> {metrics.totalTasks}
          </div>
        </div>
        <button 
          onClick={getMetrics}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh Metrics
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select a document to process:
        </label>
        <input
          type="file"
          onChange={handleFileSelect}
          accept=".txt,.md,.pdf,.doc,.docx,.pptx,.ppt"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Document Processing</h3>
          <button
            onClick={processDocumentOnly}
            disabled={!selectedFile || documentProcessor.isLoading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {documentProcessor.isLoading ? 'Processing...' : 'Process Document'}
          </button>
          {documentProcessor.isLoading && (
            <div className="text-sm">
              Progress: {Math.round(documentProcessor.progress)}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Full RAG Pipeline</h3>
          <button
            onClick={processWithEmbeddings}
            disabled={!selectedFile || ragProcessor.isProcessing}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {ragProcessor.isProcessing ? 'Processing...' : 'Full Pipeline'}
          </button>
          {ragProcessor.isProcessing && (
            <div className="text-sm">
              Stage: {ragProcessor.currentStage}<br/>
              Progress: {Math.round(ragProcessor.overallProgress)}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Vector Operations</h3>
          <button
            onClick={generateEmbeddingsOnly}
            disabled={vectorProcessor.isLoading}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {vectorProcessor.isLoading ? 'Computing...' : 'Generate Embeddings'}
          </button>
          {vectorProcessor.isLoading && (
            <div className="text-sm">
              Progress: {Math.round(vectorProcessor.progress)}%
            </div>
          )}
        </div>
      </div>

      {/* Abort Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={documentProcessor.abort}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Abort Document
        </button>
        <button
          onClick={vectorProcessor.abort}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Abort Vector
        </button>
        <button
          onClick={ragProcessor.abort}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Abort Pipeline
        </button>
      </div>

      {/* Results Display */}
      {result && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {result.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {result.error}
            </div>
          )}
          
          {result.document && typeof result.document === 'object' ? (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Document Processing Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.document, null, 2)}
              </pre>
            </div>
          ) : null}
          
          {result.embeddings && typeof result.embeddings === 'object' ? (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Embeddings Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.embeddings, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      )}

      {/* Error States */}
      {documentProcessor.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Document Processing Error:</strong> {documentProcessor.error}
        </div>
      )}
      
      {vectorProcessor.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Vector Processing Error:</strong> {vectorProcessor.error}
        </div>
      )}
    </div>
  )
}

export default WebWorkersDemo
