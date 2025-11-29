"use client"

import React, { useState } from 'react'
import { Bot, Brain, Hash, Tag, FileText, Loader2, Settings, ChevronDown, ChevronUp } from 'lucide-react'

interface SummaryData {
  summary: string
  keywords: string[]
  tags: string[]
  topics: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  complexity?: 'low' | 'medium' | 'high'
  documentType?: string
  confidence: number
}

interface AISummarizerProps {
  content: string
  fileName: string
  onSummaryComplete: (data: SummaryData) => void
  className?: string
}

export function AISummarizer({ content, fileName, onSummaryComplete, className = "" }: AISummarizerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [selectedModel, setSelectedModel] = useState('llama3:latest')
  const [availableModels, setAvailableModels] = useState<string[]>(['llama3:latest'])
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available models on component mount
  React.useEffect(() => {
    loadAvailableModels()
  }, [])

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        if (data.models && Array.isArray(data.models)) {
          const models = data.models.map((m: { name?: string; model?: string } | string) => 
            typeof m === 'string' ? m : (m.name || m.model || 'unknown')
          )
          setAvailableModels(models)
        }
      }
    } catch (error) {
      console.warn('Failed to load models:', error)
    }
  }

  const generateSummary = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Truncate content if too long (keep first 8000 chars for processing)
      const processContent = content.length > 8000 ? content.substring(0, 8000) + '...' : content
      
      const prompt = `Analyze the following document content and provide a structured analysis:

DOCUMENT: ${fileName}
CONTENT: ${processContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the main content",
  "keywords": ["5-10 most important keywords/terms"],
  "tags": ["3-7 relevant tags for categorization"],
  "topics": ["2-5 main topics/themes"],
  "sentiment": "positive|negative|neutral",
  "complexity": "low|medium|high", 
  "documentType": "description of document type",
  "confidence": 0.85
}

Focus on extracting actionable metadata that would be useful for knowledge graph construction and document correlation. Be precise and specific.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          settings: {
            model: selectedModel,
            temperature: 0.3, // Lower temperature for more consistent analysis
            maxTokens: 1000,
            systemPrompt: 'You are a document analysis AI that extracts structured metadata. Always respond with valid JSON only, no additional text.'
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Try to parse JSON from the response
      let parsedData: SummaryData
      try {
        // Clean the response to extract JSON
        const jsonMatch = result.message.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        // Fallback: create basic analysis if JSON parsing fails
        console.warn('Failed to parse AI response as JSON:', parseError)
        parsedData = {
          summary: result.message.substring(0, 200) + '...',
          keywords: extractBasicKeywords(content),
          tags: ['document', 'analysis'],
          topics: ['general'],
          sentiment: 'neutral',
          complexity: 'medium',
          documentType: getDocumentTypeFromName(fileName),
          confidence: 0.5
        }
      }

      setSummaryData(parsedData)
      onSummaryComplete(parsedData)
      
    } catch (error) {
      console.error('AI summarization failed:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback keyword extraction using basic NLP
  const extractBasicKeywords = (text: string): string[] => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const frequency: { [key: string]: number } = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word)
  }

  const getDocumentTypeFromName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'PDF Document'
      case 'docx': case 'doc': return 'Word Document'
      case 'xlsx': case 'xls': return 'Spreadsheet'
      case 'txt': return 'Text File'
      case 'html': return 'HTML Document'
      default: return 'Document'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-gray-900 dark:text-white">AI Document Analysis</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Model Selection */}
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <button
              onClick={generateSummary}
              disabled={isLoading || !content.trim()}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {summaryData && (
            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              {/* Summary */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary</span>
                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-1 rounded">
                    {(summaryData.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>

              {/* Keywords */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <Hash className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {summaryData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <Tag className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {summaryData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-700 dark:text-gray-300">{summaryData.documentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sentiment:</span>
                  <span className={`${
                    summaryData.sentiment === 'positive' ? 'text-green-600' :
                    summaryData.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {summaryData.sentiment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Complexity:</span>
                  <span className="text-gray-700 dark:text-gray-300">{summaryData.complexity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Topics:</span>
                  <span className="text-gray-700 dark:text-gray-300">{summaryData.topics.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AISummarizer
