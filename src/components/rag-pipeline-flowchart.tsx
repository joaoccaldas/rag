/**
 * RAG PIPELINE VISUAL FLOWCHART COMPONENT
 * Shows the complete document processing flow
 */

"use client"

import { useState } from 'react'
import { FileUp, FileText, Scissors, Database, Eye, Brain, Search, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import { LucideIcon } from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  description: string
  icon: LucideIcon
  files: string[]
  dependencies: string[]
  status: 'active' | 'processing' | 'completed' | 'pending'
  details: string[]
}

export function RAGPipelineFlowchart() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const stages: PipelineStage[] = [
    {
      id: 'upload',
      name: 'File Upload',
      description: 'Drag & drop files, validation, queue management',
      icon: FileUp,
      files: [
        'app/upload-demo/page.tsx',
        'src/components/upload/ComprehensiveUploadDashboard.tsx',
        'src/hooks/useFileUpload.ts'
      ],
      dependencies: ['React', 'Tailwind CSS', 'Lucide Icons'],
      status: 'completed',
      details: [
        '✅ 20 file upload limit',
        '✅ Drag & drop interface',
        '✅ File type validation (.pdf, .docx, .txt, .jpg, .png)',
        '✅ Progress tracking',
        '✅ Error handling & retry'
      ]
    },
    {
      id: 'parsing',
      name: 'Document Parsing',
      description: 'Extract text from PDFs, DOCX, images using OCR',
      icon: FileText,
      files: [
        'src/rag/services/document-processor.ts',
        'src/rag/services/ocr-extraction.ts',
        'public/pdf.worker.min.mjs'
      ],
      dependencies: ['PDF.js', 'Mammoth', 'Tesseract.js', 'JSZip'],
      status: 'completed',
      details: [
        '✅ PDF text extraction (PDF.js)',
        '✅ DOCX processing (Mammoth)',
        '✅ OCR for images (Tesseract.js)',
        '✅ ZIP archive handling',
        '✅ Lazy loading of dependencies'
      ]
    },
    {
      id: 'chunking',
      name: 'Smart Chunking',
      description: 'Split documents into token-aware chunks with semantic boundaries',
      icon: Scissors,
      files: [
        'src/rag/utils/enhanced-chunking.ts',
        'src/rag/utils/advanced-chunking.ts'
      ],
      dependencies: ['Token estimation', 'Semantic analysis'],
      status: 'completed',
      details: [
        '✅ Token-aware chunking (512 tokens max)',
        '✅ Semantic boundary preservation',
        '✅ Document structure preservation',
        '✅ Chunk overlap (50 tokens)',
        '✅ Importance scoring'
      ]
    },
    {
      id: 'embedding',
      name: 'Vector Embeddings',
      description: 'Generate embeddings for semantic search',
      icon: Database,
      files: [
        'src/rag/utils/multi-model-embedding.ts',
        'src/rag/utils/enhanced-vector-storage.ts'
      ],
      dependencies: ['OpenAI API', 'Local models', 'Ollama'],
      status: 'completed',
      details: [
        '✅ Multi-model embedding support',
        '✅ text-embedding-ada-002 (OpenAI)',
        '✅ Local embedding models',
        '✅ Fallback mechanisms',
        '✅ Vector similarity search'
      ]
    },
    {
      id: 'storage',
      name: 'Unlimited Storage',
      description: 'Store in IndexedDB with 2GB+ capacity',
      icon: Database,
      files: [
        'src/storage/unlimited-rag-storage.ts',
        'src/components/storage-migration-panel.tsx'
      ],
      dependencies: ['IndexedDB', 'Browser storage APIs'],
      status: 'completed',
      details: [
        '🚀 2GB+ storage capacity (vs 5-10MB localStorage)',
        '✅ Automatic compression',
        '✅ Full-text search indexing',
        '✅ Migration from localStorage',
        '✅ Storage analytics'
      ]
    },
    {
      id: 'visual',
      name: 'Visual Processing',
      description: 'Extract and analyze visual content from documents',
      icon: Eye,
      files: [
        'src/components/visual-content-library.tsx',
        'src/lib/unlimited-visual-content.ts',
        'src/storage/utils/visual-content-processing.ts'
      ],
      dependencies: ['Canvas API', 'Image processing'],
      status: 'completed',
      details: [
        '✅ PDF page thumbnails',
        '✅ Chart/graph detection',
        '✅ Image metadata extraction',
        '✅ Visual content cataloging',
        '✅ Unlimited visual storage'
      ]
    },
    {
      id: 'analysis',
      name: 'AI Analysis',
      description: 'Generate insights using Ollama LLM',
      icon: Brain,
      files: [
        'src/ai/browser-analysis-engine.ts',
        'app/api/ai-analysis/route.ts',
        'src/ai/summarization/ai-summarizer.tsx'
      ],
      dependencies: ['Ollama', 'llama3.1:70b model'],
      status: 'completed',
      details: [
        '✅ Visual content analysis',
        '✅ Document summarization',
        '✅ Business insight extraction',
        '✅ Structured JSON responses',
        '✅ Fallback analysis'
      ]
    },
    {
      id: 'retrieval',
      name: 'Search & Retrieval',
      description: 'Semantic search with AI-enhanced results',
      icon: Search,
      files: [
        'src/rag/components/search-interface.tsx',
        'app/api/rag-search/route.ts',
        'src/rag/utils/unified-intelligent-search-engine.ts'
      ],
      dependencies: ['Vector similarity', 'Query processing'],
      status: 'completed',
      details: [
        '✅ Semantic similarity search',
        '✅ Hybrid keyword + vector search',
        '✅ Context-aware ranking',
        '✅ Real-time suggestions',
        '✅ Multi-modal search'
      ]
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing': return <Clock className="w-4 h-4 text-orange-600 animate-spin" />
      case 'active': return <AlertCircle className="w-4 h-4 text-blue-600" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50'
      case 'processing': return 'border-orange-200 bg-orange-50'
      case 'active': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 Complete RAG Pipeline Flow
        </h1>
        <p className="text-lg text-gray-600">
          From file upload to AI-powered retrieval - your complete document intelligence system
        </p>
      </div>

      {/* Pipeline Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center">
            {/* Stage Card */}
            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                getStatusColor(stage.status)
              } ${selectedStage === stage.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            >
              {/* Status indicator */}
              <div className="absolute -top-2 -right-2">
                {getStatusIcon(stage.status)}
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-2">
                <stage.icon className="w-8 h-8 text-gray-700" />
              </div>

              {/* Name */}
              <h3 className="text-sm font-semibold text-center text-gray-900 mb-1">
                {stage.name}
              </h3>

              {/* Brief description */}
              <p className="text-xs text-gray-600 text-center">
                {stage.description.slice(0, 40)}...
              </p>
            </div>

            {/* Arrow (except last item) */}
            {index < stages.length - 1 && (
              <div className="hidden lg:block mt-4">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed View */}
      {selectedStage && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          {(() => {
            const stage = stages.find(s => s.id === selectedStage)
            if (!stage) return null

            return (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <stage.icon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{stage.name}</h2>
                  {getStatusIcon(stage.status)}
                </div>

                <p className="text-gray-600 mb-6">{stage.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Implementation Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">✅ Features</h3>
                    <ul className="space-y-2">
                      {stage.details.map((detail, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Files */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📁 Key Files</h3>
                    <ul className="space-y-2">
                      {stage.files.map((file, idx) => (
                        <li key={idx} className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dependencies */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🔗 Dependencies</h3>
                    <ul className="space-y-2">
                      {stage.dependencies.map((dep, idx) => (
                        <li key={idx} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {dep}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-sm text-green-700">Pipeline Stages</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">2GB+</div>
          <div className="text-sm text-blue-700">Storage Capacity</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">20+</div>
          <div className="text-sm text-purple-700">File Types Supported</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">100%</div>
          <div className="text-sm text-orange-700">Pipeline Complete</div>
        </div>
      </div>
    </div>
  )
}
