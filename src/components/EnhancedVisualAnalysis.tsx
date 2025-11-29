/**
 * Enhanced Visual Content Analysis with LLM Integration
 * Provides advanced visual analysis using local LLM models
 */

import React, { useState, useCallback } from 'react'
import { Brain, Camera, FileImage, BarChart3, Table, Sparkles, Download, RefreshCw } from 'lucide-react'
import { VisualContent } from '../rag/types'
import { getStoredVisualContent } from '../rag/utils/visual-content-storage'
import { getOllamaApiUrl } from '../utils/network-config'

interface OllamaModel {
  name: string
}

interface AnalysisResult {
  id: string
  visualContent: VisualContent
  analysis: {
    description: string
    insights: string[]
    dataPoints?: string[]
    businessValue?: string
    recommendations?: string[]
  }
  confidence: number
  processingTime: number
}

interface LLMAnalysisProps {
  className?: string
}

export const EnhancedVisualAnalysis: React.FC<LLMAnalysisProps> = ({ className = '' }) => {
  const [visualContent, setVisualContent] = useState<VisualContent[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>(['llama3.2:latest', 'llama3:latest'])

  const loadVisualContent = useCallback(async () => {
    try {
      setLoadingMessage('Loading visual content...')
      const stored = await getStoredVisualContent()
      setVisualContent(stored)
      setLoadingMessage('')
    } catch (error) {
      console.error('Failed to load visual content:', error)
      setLoadingMessage('Failed to load visual content')
    }
  }, [])

  React.useEffect(() => {
    loadVisualContent()
    loadAvailableModels()
  }, [loadVisualContent])

  const loadAvailableModels = async () => {
    try {
      const ollamaUrl = getOllamaApiUrl('/api/tags')
      const response = await fetch(ollamaUrl)
      
      if (response.ok) {
        const data = await response.json()
        const models = data.models?.map((m: OllamaModel) => m.name) || []
        setAvailableModels(models.length > 0 ? models : ['llama3.2:latest', 'llama3:latest'])
      }
    } catch {
      console.log('Using default models - Ollama API not available')
    }
  }

  const analyzeWithLLM = async (content: VisualContent): Promise<AnalysisResult> => {
    const startTime = Date.now()
    
    try {
      // Construct analysis prompt based on content type
      let prompt = ''
      
      switch (content.type) {
        case 'image':
          prompt = `You are analyzing an image document titled "${content.title}". 

EXTRACTED TEXT: "${content.metadata?.extractedText || 'No text extracted'}"

Please provide a comprehensive analysis in the following format:

DESCRIPTION: [What does this image show? Be specific about visual elements, text content, layout, and document type. Mention specific details like charts, tables, text blocks, or diagrams.]

KEY INSIGHTS: 
- [Specific insight #1 - identify key data points, trends, or important information visible]
- [Specific insight #2 - note relationships between elements or significant patterns]
- [Specific insight #3 - highlight any numerical data, percentages, or quantitative information]
- [Specific insight #4 - mention any workflow, process, or structural information shown]

BUSINESS VALUE: [Explain specifically how this visual content supports business operations, decision-making, reporting, or strategic planning. Be concrete about use cases.]

RECOMMENDATIONS:
- [Actionable step #1 - what should be done with this information]
- [Actionable step #2 - how to integrate this into business processes or reporting]

Focus on extracting actionable, specific information rather than generic observations.`
          break

        case 'diagram':
          prompt = `You are analyzing a diagram titled "${content.title}".

EXTRACTED TEXT: "${content.metadata?.extractedText || 'No text extracted'}"

Please provide detailed analysis in this format:

DESCRIPTION: [Describe the specific diagram type (flowchart, org chart, process diagram, etc.), structure, main components, and overall purpose. Be specific about what you see.]

KEY INSIGHTS: 
- [Process insight #1 - identify key workflows, relationships, or hierarchies shown]
- [Data insight #2 - note important connections, dependencies, or decision points]
- [Structural insight #3 - highlight organizational aspects, roles, or system components]
- [Performance insight #4 - identify potential bottlenecks, efficiencies, or improvement areas]

BUSINESS VALUE: [Explain how this diagram supports business process optimization, organizational understanding, system design, or strategic planning. Be specific about operational benefits.]

RECOMMENDATIONS:
- [Process improvement #1 - specific actions to optimize workflows or relationships shown]
- [Implementation step #2 - how to use this diagram for training, planning, or documentation]

Focus on process optimization and organizational insights.`
          break
          
        case 'chart':
        case 'graph':
          prompt = `You are analyzing a ${content.type} titled "${content.title}".

EXTRACTED DATA: "${content.metadata?.extractedText || 'No data extracted'}"

Please provide detailed analysis in this format:

DESCRIPTION: [Describe the chart type, axes, data series, and overall structure]

KEY INSIGHTS: [Identify 3-5 important trends, patterns, peaks, or anomalies in the data]

BUSINESS VALUE: [What business decisions or strategies does this chart support? What questions does it answer?]

RECOMMENDATIONS: [Specific actions based on the chart analysis - what should be done with this information?]

Focus on quantitative insights and data-driven recommendations.`
          break
          
        case 'table':
          const tableData = content.fullContent || content.metadata?.extractedText || 'No data'
          const dataPreview = typeof tableData === 'string' ? tableData : JSON.stringify(tableData).substring(0, 500)
          
          prompt = `You are analyzing a data table titled "${content.title}".

TABLE DATA PREVIEW: "${dataPreview}"
${content.metadata?.columns ? `COLUMNS: ${content.metadata.columns.join(', ')}` : ''}

Please provide comprehensive analysis in this format:

DESCRIPTION: [Describe the table structure, data types, and scope]

KEY INSIGHTS: [Identify 4-6 important patterns, relationships, correlations, or outliers in the data]

BUSINESS VALUE: [What business questions does this data answer? How can it drive decisions?]

RECOMMENDATIONS: [Specific actions based on data analysis - what should stakeholders do with this information?]

Focus on data relationships and actionable business insights.`
          break
          
        default:
          prompt = `You are analyzing visual content titled "${content.title}" of type "${content.type}".

AVAILABLE INFORMATION: "${content.metadata?.extractedText || content.description || 'Limited information available'}"

Please provide structured analysis in this format:

DESCRIPTION: [Describe what this content shows and its key elements]

KEY INSIGHTS: [Identify 3-4 important findings or observations]

BUSINESS VALUE: [How can this content be useful for business purposes?]

RECOMMENDATIONS: [2-3 specific suggestions for using or acting on this content]
          
          Be practical and specific.`
      }

      // Call Ollama API
      const ollamaUrl = getOllamaApiUrl('/api/generate')
      
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            max_tokens: 500
          }
        })
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`)
      }

      const result = await response.json()
      const analysisText = result.response || 'No analysis available'
      
      // Parse the LLM response into structured format
      const analysis = parseAnalysisResponse(analysisText)
      
      return {
        id: `analysis_${content.id}_${Date.now()}`,
        visualContent: content,
        analysis,
        confidence: 0.85, // Placeholder confidence score
        processingTime: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('LLM analysis failed:', error)
      
      // Fallback analysis
      return {
        id: `analysis_${content.id}_${Date.now()}`,
        visualContent: content,
        analysis: {
          description: `Visual content of type ${content.type}: ${content.title || 'Untitled'}`,
          insights: [
            'LLM analysis unavailable - using fallback',
            `Content type: ${content.type}`,
            `Has extracted text: ${!!content.metadata?.extractedText}`
          ],
          businessValue: 'Analysis requires LLM connection',
          recommendations: ['Ensure Ollama service is running', 'Check network connectivity']
        },
        confidence: 0.3,
        processingTime: Date.now() - startTime
      }
    }
  }

  const parseAnalysisResponse = (text: string) => {
    // Simple parsing logic - in production, this could be more sophisticated
    const lines = text.split('\n').filter(line => line.trim())
    
    const analysis = {
      description: '',
      insights: [] as string[],
      dataPoints: [] as string[],
      businessValue: '',
      recommendations: [] as string[]
    }
    
    let currentSection = 'description'
    
    for (const line of lines) {
      const lower = line.toLowerCase().trim()
      
      if (lower.includes('insight') || lower.includes('key') || lower.includes('trend')) {
        currentSection = 'insights'
        continue
      } else if (lower.includes('business') || lower.includes('value') || lower.includes('signif')) {
        currentSection = 'businessValue'
        continue
      } else if (lower.includes('recommend') || lower.includes('suggest')) {
        currentSection = 'recommendations'
        continue
      } else if (lower.includes('data point') || lower.includes('metric')) {
        currentSection = 'dataPoints'
        continue
      }
      
      const cleanLine = line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim()
      if (cleanLine) {
        if (currentSection === 'description' && !analysis.description) {
          analysis.description = cleanLine
        } else if (currentSection === 'businessValue' && !analysis.businessValue) {
          analysis.businessValue = cleanLine
        } else if (currentSection === 'insights') {
          analysis.insights.push(cleanLine)
        } else if (currentSection === 'recommendations') {
          analysis.recommendations.push(cleanLine)
        } else if (currentSection === 'dataPoints') {
          analysis.dataPoints.push(cleanLine)
        }
      }
    }
    
    // Fallbacks
    if (!analysis.description) {
      analysis.description = 'Visual content analysis completed'
    }
    if (analysis.insights.length === 0) {
      analysis.insights.push('No specific insights extracted')
    }
    
    return analysis
  }

  const runAnalysis = async () => {
    if (visualContent.length === 0) {
      setLoadingMessage('No visual content available for analysis')
      return
    }
    
    setIsAnalyzing(true)
    setAnalysisResults([])
    const results: AnalysisResult[] = []
    
    try {
      for (let i = 0; i < Math.min(visualContent.length, 5); i++) { // Limit to 5 items for demo
        const content = visualContent[i]
        if (!content) continue
        
        setLoadingMessage(`Analyzing ${content.title || `Item ${i + 1}`}... (${i + 1}/${Math.min(visualContent.length, 5)})`)
        
        const result = await analyzeWithLLM(content)
        results.push(result)
        setAnalysisResults([...results]) // Update progressively
      }
      
      setLoadingMessage('')
    } catch (error) {
      console.error('Analysis failed:', error)
      setLoadingMessage('Analysis failed - check console for details')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportAnalysis = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      model: selectedModel,
      totalItems: visualContent.length,
      analyzedItems: analysisResults.length,
      results: analysisResults.map(r => ({
        contentTitle: r.visualContent.title,
        contentType: r.visualContent.type,
        analysis: r.analysis,
        confidence: r.confidence,
        processingTime: r.processingTime
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `visual-analysis-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: VisualContent['type']) => {
    switch (type) {
      case 'image': return <FileImage className="w-4 h-4" />
      case 'chart':
      case 'graph': return <BarChart3 className="w-4 h-4" />
      case 'table': return <Table className="w-4 h-4" />
      default: return <Camera className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
              <Brain className="w-6 h-6 mr-2 text-purple-600" />
              Enhanced Visual Content Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              AI-powered analysis of visual content using local LLM models
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || visualContent.length === 0}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Visual Content</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{visualContent.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Items available</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Analyzed</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analysisResults.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">LLM analyses complete</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Model</h3>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedModel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Current LLM</p>
        </div>
      </div>

      {/* Loading Message */}
      {loadingMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200">{loadingMessage}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
            <button
              onClick={exportAnalysis}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </button>
          </div>
          
          <div className="space-y-4">
            {analysisResults.map((result) => (
              <div key={result.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(result.visualContent.type)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {result.visualContent.title || 'Untitled'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.visualContent.type} • {result.processingTime}ms • {Math.round(result.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{result.analysis.description}</p>
                  </div>
                  
                  {result.analysis.insights.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Key Insights</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {result.analysis.insights.slice(0, 3).map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.analysis.businessValue && (
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Business Value</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.analysis.businessValue}</p>
                    </div>
                  )}
                  
                  {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {result.analysis.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {visualContent.length === 0 && !loadingMessage && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Visual Content Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload documents with images, charts, or tables to begin analysis
          </p>
          <button
            onClick={loadVisualContent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Content
          </button>
        </div>
      )}
    </div>
  )
}

export default EnhancedVisualAnalysis
