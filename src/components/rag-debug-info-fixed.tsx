'use client'

import React, { useState } from 'react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { X, ChevronUp, ChevronDown } from 'lucide-react'

interface RAGDebugInfoProps {
  activeView?: string
}

export function RAGDebugInfo({ activeView }: RAGDebugInfoProps) {
  const { documents } = useRAG()
  const [isVisible, setIsVisible] = useState(false) // Changed to false by default
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 z-50 max-w-sm max-h-96 overflow-auto text-xs rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">RAG Debug Info</h3>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white"
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div>
          <p><strong>Current View:</strong> {activeView || 'unknown'}</p>
          <p><strong>Total Documents:</strong> {documents.length}</p>
          
          {documents.map((doc, index) => (
            <div key={doc.id} className="mb-2 border-b border-gray-600 pb-2">
              <p><strong>#{index + 1}:</strong> {doc.name}</p>
              <p><strong>Status:</strong> {doc.status}</p>
              <p><strong>Type:</strong> {doc.type}</p>
              <p><strong>Chunks:</strong> {doc.chunks?.length || 0}</p>
              <p><strong>Has Embeddings:</strong> {doc.chunks?.some(c => c.embedding) ? 'Yes' : 'No'}</p>
              <p><strong>Size:</strong> {(doc.size / 1024).toFixed(1)}KB</p>
              {doc.chunks && doc.chunks.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-blue-400">Chunk Preview</summary>
                  <p className="text-gray-300 text-xs mt-1">
                    {doc.chunks[0].content.substring(0, 100)}...
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
