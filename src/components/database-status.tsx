"use client"

import React from 'react'
import { useRAG } from '@/rag/contexts/RAGContext'

interface DatabaseStatusProps {
  className?: string
}

export function DatabaseStatus({ className = "" }: DatabaseStatusProps) {
  const { documents } = useRAG()
  
  const readyDocuments = documents.filter(doc => doc.status === 'ready')
  const totalChunks = readyDocuments.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0)
  
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        📊 Knowledge Base Status
      </h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Documents Ready:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {readyDocuments.length}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Chunks:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {totalChunks}
          </span>
        </div>
        
        {readyDocuments.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Available Files:
            </h4>
            <div className="space-y-1">
              {readyDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 dark:text-gray-400 truncate pr-2">
                    📄 {doc.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 whitespace-nowrap">
                    {doc.chunks?.length || 0} chunks
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {readyDocuments.length === 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            No documents ready for search yet
          </div>
        )}
      </div>
    </div>
  )
}
