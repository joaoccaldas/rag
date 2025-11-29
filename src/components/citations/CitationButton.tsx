/**
 * Citation Button Component
 * Provides citation copying with style selection
 */

"use client"

import React, { useState } from 'react'
import { Copy, Check, BookOpen, ChevronDown } from 'lucide-react'
import { CitationFormatter, CitationStyle, DocumentMetadata } from '../../utils/citations'
import type { Document } from '../../rag/types'

interface CitationButtonProps {
  document: Document
  className?: string
  variant?: 'button' | 'icon' | 'dropdown'
  defaultStyle?: CitationStyle
  showStyleSelector?: boolean
}

// Convert Document to DocumentMetadata
function convertToDocumentMetadata(doc: Document): DocumentMetadata {
  const metadata: Record<string, unknown> = (doc.metadata || {}) as Record<string, unknown>
  const result: DocumentMetadata = {
    id: doc.id,
    title: doc.name || 'Untitled Document',
    authors: (metadata['authors'] as string[]) || (metadata['author'] ? [metadata['author'] as string] : []),
    publishDate: doc.uploadedAt,
    type: doc.type as 'pdf' | 'book' | 'article' | 'webpage' | 'report' | 'other' || 'other'
  }
  
  // Only add optional properties if they exist
  if (metadata['publisher']) result.publisher = metadata['publisher'] as string
  if (metadata['url']) result.url = metadata['url'] as string
  if (metadata['doi']) result.doi = metadata['doi'] as string
  
  return result
}

export function CitationButton({
  document,
  className = '',
  variant = 'button',
  defaultStyle = 'APA',
  showStyleSelector = true
}: CitationButtonProps) {
  const [copied, setCopied] = useState(false)
  const [selectedStyle] = useState<CitationStyle>(defaultStyle)
  const [showDropdown, setShowDropdown] = useState(false)

  const styles: CitationStyle[] = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard', 'Vancouver']

  const handleCopy = async (style: CitationStyle) => {
    const metadata = convertToDocumentMetadata(document)
    const result = CitationFormatter.format(metadata, {
      style,
      includeUrl: true,
      includeDoi: true
    })

    const success = await CitationFormatter.copyToClipboard(result.citation)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    
    setShowDropdown(false)
  }

  // Icon variant - just the icon
  if (variant === 'icon') {
    return (
      <button
        onClick={() => handleCopy(selectedStyle)}
        className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition ${className}`}
        title={`Copy ${selectedStyle} citation`}
        aria-label={`Copy ${selectedStyle} citation`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
      </button>
    )
  }

  // Button variant - simple button with text
  if (variant === 'button') {
    return (
      <button
        onClick={() => handleCopy(selectedStyle)}
        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition ${className}`}
        aria-label="Copy citation"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Cite ({selectedStyle})
          </>
        )}
      </button>
    )
  }

  // Dropdown variant - with style selection
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        aria-label="Citation options"
        aria-expanded={showDropdown}
        aria-haspopup="menu"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <BookOpen className="h-4 w-4 mr-2" />
            Cite
            {showStyleSelector && <ChevronDown className="h-4 w-4 ml-1" />}
          </>
        )}
      </button>

      {showDropdown && showStyleSelector && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1" role="menu" aria-label="Citation styles">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => handleCopy(style)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                role="menuitem"
              >
                <div className="flex items-center justify-between">
                  <span>{style}</span>
                  {selectedStyle === style && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default CitationButton
