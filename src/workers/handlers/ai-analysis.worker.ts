/**
 * AI Analysis Web Worker
 * Handles AI-powered content analysis and insights generation
 */

import type { 
  BaseWorkerMessage
} from '../types'

// AI Analysis specific message types (simplified for now)
interface AIAnalysisRequest extends BaseWorkerMessage {
  type: 'AI_ANALYSIS_REQUEST'
  payload: {
    content: string
    analysisType: 'summary' | 'sentiment' | 'keywords' | 'entities' | 'classification'
    options?: {
      model?: string
      maxTokens?: number
      temperature?: number
    }
  }
}

interface AIAnalysisProgress extends BaseWorkerMessage {
  type: 'AI_ANALYSIS_PROGRESS'
  payload: {
    stage: 'preprocessing' | 'analysis' | 'postprocessing'
    progress: number
    message: string
  }
}

interface AIAnalysisSuccess extends BaseWorkerMessage {
  type: 'AI_ANALYSIS_SUCCESS'
  payload: {
    analysisType: string
    result: unknown
    confidence: number
    processingTime: number
  }
}

interface AIAnalysisError extends BaseWorkerMessage {
  type: 'AI_ANALYSIS_ERROR'
  payload: {
    error: string
    stage?: string
  }
}

// Import processing utilities (will need to be worker-compatible versions)
declare const self: Worker & {
  postMessage(message: AIAnalysisSuccess | AIAnalysisError | AIAnalysisProgress): void
  onmessage: ((this: Worker, ev: MessageEvent<AIAnalysisRequest>) => void) | null
}

// Analysis functions
async function generateSummary(content: string): Promise<string> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500))
  
  // Simple extractive summary - take first few sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const summaryLength = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.3)))
  
  return sentences.slice(0, summaryLength).join('. ') + '.'
}

async function analyzeSentiment(content: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  scores: { positive: number; negative: number; neutral: number }
}> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300))
  
  // Simple keyword-based sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'enjoy']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'poor', 'worst', 'fail']
  
  const words = content.toLowerCase().split(/\W+/)
  let positiveScore = 0
  let negativeScore = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++
    if (negativeWords.includes(word)) negativeScore++
  })
  
  const total = positiveScore + negativeScore
  if (total === 0) {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      scores: { positive: 0.33, negative: 0.33, neutral: 0.34 }
    }
  }
  
  const posRatio = positiveScore / total
  const negRatio = negativeScore / total
  
  if (posRatio > negRatio) {
    return {
      sentiment: 'positive',
      confidence: posRatio,
      scores: { positive: posRatio, negative: negRatio, neutral: 1 - posRatio - negRatio }
    }
  } else if (negRatio > posRatio) {
    return {
      sentiment: 'negative',
      confidence: negRatio,
      scores: { positive: posRatio, negative: negRatio, neutral: 1 - posRatio - negRatio }
    }
  } else {
    return {
      sentiment: 'neutral',
      confidence: 0.6,
      scores: { positive: posRatio, negative: negRatio, neutral: 1 - posRatio - negRatio }
    }
  }
}

async function extractKeywords(content: string): Promise<Array<{ keyword: string; frequency: number; relevance: number }>> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Simple TF-IDF-like keyword extraction
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'])
  
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  const totalWords = words.length
  const keywords = Object.entries(frequency)
    .map(([keyword, freq]) => ({
      keyword,
      frequency: freq,
      relevance: Math.min(1, (freq / totalWords) * 100) // Simple relevance score
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10) // Top 10 keywords
  
  return keywords
}

async function extractEntities(content: string): Promise<Array<{ entity: string; type: string; confidence: number }>> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 180 + Math.random() * 400))
  
  // Simple pattern-based entity extraction
  const entities: Array<{ entity: string; type: string; confidence: number }> = []
  
  // Extract potential names (capitalized words)
  const names = content.match(/\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g) || []
  names.forEach(name => {
    entities.push({ entity: name, type: 'PERSON', confidence: 0.7 })
  })
  
  // Extract potential organizations (words with Corp, Inc, Ltd, etc.)
  const orgs = content.match(/\b[A-Z][a-z\s]*(?:Corp|Inc|Ltd|LLC|Company|Organization)\b/g) || []
  orgs.forEach(org => {
    entities.push({ entity: org, type: 'ORGANIZATION', confidence: 0.8 })
  })
  
  // Extract dates
  const dates = content.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g) || []
  dates.forEach(date => {
    entities.push({ entity: date, type: 'DATE', confidence: 0.9 })
  })
  
  // Extract emails
  const emails = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []
  emails.forEach(email => {
    entities.push({ entity: email, type: 'EMAIL', confidence: 0.95 })
  })
  
  return entities.slice(0, 20) // Limit to top 20 entities
}

async function classifyContent(content: string): Promise<{
  category: string
  confidence: number
  subcategories: Array<{ name: string; confidence: number }>
}> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 500))
  
  // Simple keyword-based classification
  const categories = {
    'Technical': ['code', 'software', 'programming', 'algorithm', 'development', 'technology', 'computer', 'system'],
    'Business': ['market', 'sales', 'revenue', 'profit', 'customer', 'business', 'strategy', 'company'],
    'Academic': ['research', 'study', 'analysis', 'theory', 'academic', 'university', 'paper', 'journal'],
    'News': ['breaking', 'report', 'announced', 'according', 'sources', 'update', 'latest', 'today'],
    'Legal': ['law', 'legal', 'court', 'judge', 'attorney', 'contract', 'agreement', 'compliance'],
    'Medical': ['health', 'medical', 'patient', 'treatment', 'diagnosis', 'doctor', 'hospital', 'medicine']
  }
  
  const words = content.toLowerCase().split(/\W+/)
  const scores: Record<string, number> = {}
  
  Object.entries(categories).forEach(([category, keywords]) => {
    let score = 0
    keywords.forEach(keyword => {
      const count = words.filter(word => word.includes(keyword)).length
      score += count
    })
    scores[category] = score / words.length // Normalize by content length
  })
  
  // Find the category with highest score
  const sortedCategories = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([name, confidence]) => ({ name, confidence: Math.min(1, confidence * 100) }))
  
  const topCategory = sortedCategories[0] || { name: 'General', confidence: 0.5 }
  
  return {
    category: topCategory.name,
    confidence: topCategory.confidence,
    subcategories: sortedCategories.slice(1, 4) // Top 3 alternative categories
  }
}

// Main processing function
async function processAnalysisRequest(request: AIAnalysisRequest): Promise<void> {
  const { id, payload } = request
  const { content, analysisType } = payload
  
  try {
    // Send initial progress
    sendProgress(id, 'preprocessing', 10, 'Preprocessing content...')
    
    let result: unknown
    let confidence = 0.8 // Default confidence
    
    // Perform the requested analysis
    switch (analysisType) {
      case 'summary':
        sendProgress(id, 'analysis', 30, 'Generating summary...')
        result = await generateSummary(content)
        confidence = Math.min(1, content.length / 1000) // Confidence based on content length
        break
        
      case 'sentiment':
        sendProgress(id, 'analysis', 30, 'Analyzing sentiment...')
        const sentimentResult = await analyzeSentiment(content)
        result = sentimentResult
        confidence = (sentimentResult as { confidence?: number })?.confidence || 0.5
        break
        
      case 'keywords':
        sendProgress(id, 'analysis', 30, 'Extracting keywords...')
        result = await extractKeywords(content)
        confidence = Array.isArray(result) && result.length > 0 ? 0.9 : 0.3
        break
        
      case 'entities':
        sendProgress(id, 'analysis', 30, 'Extracting entities...')
        result = await extractEntities(content)
        confidence = Array.isArray(result) && result.length > 0 ? 0.85 : 0.4
        break
        
      case 'classification':
        sendProgress(id, 'analysis', 30, 'Classifying content...')
        result = await classifyContent(content)
        confidence = (result as { confidence?: number })?.confidence || 0.5
        break
        
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`)
    }
    
    sendProgress(id, 'postprocessing', 80, 'Finalizing results...')
    
    // Send success response
    const successResponse: AIAnalysisSuccess = {
      id,
      type: 'AI_ANALYSIS_SUCCESS',
      timestamp: Date.now(),
      payload: {
        analysisType,
        result,
        confidence,
        processingTime: Date.now() - startTime
      }
    }
    
    self.postMessage(successResponse)
    
  } catch (error) {
    const errorResponse: AIAnalysisError = {
      id,
      type: 'AI_ANALYSIS_ERROR',
      timestamp: Date.now(),
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    self.postMessage(errorResponse)
  }
}

function sendProgress(
  taskId: string,
  stage: 'preprocessing' | 'analysis' | 'postprocessing',
  progress: number,
  message: string
): void {
  const response: AIAnalysisProgress = {
    id: taskId,
    type: 'AI_ANALYSIS_PROGRESS',
    timestamp: Date.now(),
    payload: {
      stage,
      progress: Math.round(progress),
      message
    }
  }

  self.postMessage(response)
}

let startTime = Date.now()

// Worker message handler
self.onmessage = (event: MessageEvent<AIAnalysisRequest>) => {
  startTime = Date.now()
  processAnalysisRequest(event.data)
}

// Handle worker errors
self.onerror = (error) => {
  console.error('AI analysis worker error:', error)
}
