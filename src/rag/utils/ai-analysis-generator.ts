// Utility to enhance documents with AI analysis data
import { Document, AIAnalysisData } from '../types'

/**
 * Generates mock AI analysis for a document based on content and metadata
 */
export function generateMockAIAnalysis(document: Document): AIAnalysisData {
  const filename = document.name.toLowerCase()
  const content = document.content.toLowerCase()
  
  let analysis: AIAnalysisData

  // Determine document type and generate appropriate analysis
  if (filename.includes('financial') || content.includes('revenue') || content.includes('profit')) {
    analysis = {
      summary: "Financial performance analysis document covering revenue trends, market share data, profitability metrics, and growth projections. Contains detailed breakdown of financial KPIs, regional performance variations, and competitive positioning in the premium appliance market.",
      keywords: ['financial analysis', 'revenue', 'profitability', 'market share', 'growth projections', 'KPIs'],
      tags: ['financial', 'performance', 'analysis', 'metrics', 'business intelligence'],
      topics: ['financial performance', 'market analysis', 'business metrics', 'profitability analysis'],
      sentiment: 'neutral',
      complexity: 'high',
      documentType: 'financial report',
      confidence: 0.92,
      analyzedAt: new Date(),
      model: 'gpt-oss:20b'
    }
  } else if (filename.includes('history') || content.includes('founded') || content.includes('established')) {
    analysis = {
      summary: "Comprehensive historical overview of Miele's journey from its founding in 1899 to its current position as a global leader in premium home appliances. The document traces key milestones, strategic decisions, product innovations, and market expansion that have shaped the company's evolution over more than a century.",
      keywords: ['miele history', 'founding', 'innovation', 'premium appliances', 'company evolution', 'milestones'],
      tags: ['company history', 'corporate heritage', 'innovation', 'premium brand', 'timeline'],
      topics: ['company founding', 'historical milestones', 'innovation timeline', 'brand evolution'],
      sentiment: 'positive',
      complexity: 'medium',
      documentType: 'historical document',
      confidence: 0.95,
      analyzedAt: new Date(),
      model: 'gpt-oss:20b'
    }
  } else if (filename.includes('strategy') || content.includes('strategic') || content.includes('vision')) {
    analysis = {
      summary: "Strategic planning document outlining Miele's long-term vision, competitive positioning, market opportunities, and operational excellence initiatives. Contains detailed analysis of market trends, customer insights, innovation roadmap, and strategic imperatives for sustainable growth in the premium appliance segment.",
      keywords: ['strategic planning', 'market positioning', 'competitive advantage', 'innovation roadmap', 'operational excellence'],
      tags: ['strategy', 'planning', 'market analysis', 'competitive intelligence', 'business development'],
      topics: ['strategic planning', 'market positioning', 'competitive analysis', 'innovation strategy'],
      sentiment: 'positive',
      complexity: 'high',
      documentType: 'strategic document',
      confidence: 0.88,
      analyzedAt: new Date(),
      model: 'gpt-oss:20b'
    }
  } else if (filename.includes('market') || content.includes('market research') || content.includes('consumer')) {
    analysis = {
      summary: "Market research and analysis document providing insights into industry trends, consumer behavior, competitive landscape, and market opportunities. Contains statistical data, trend analysis, and strategic recommendations for market positioning.",
      keywords: ['market research', 'consumer behavior', 'industry trends', 'competitive analysis', 'market opportunities'],
      tags: ['market research', 'consumer insights', 'industry analysis', 'competitive intelligence'],
      topics: ['market trends', 'consumer behavior', 'competitive landscape', 'market opportunities'],
      sentiment: 'neutral',
      complexity: 'medium',
      documentType: 'market research',
      confidence: 0.85,
      analyzedAt: new Date(),
      model: 'gpt-oss:20b'
    }
  } else {
    // Generic analysis for unknown document types
    analysis = {
      summary: "Business document containing relevant information for knowledge base retrieval and analysis. The content covers various aspects of business operations, strategy, or technical information that contributes to organizational knowledge.",
      keywords: ['business document', 'information', 'analysis', 'operations', 'knowledge'],
      tags: ['business document', 'general information', 'knowledge base'],
      topics: ['business operations', 'informational content', 'organizational knowledge'],
      sentiment: 'neutral',
      complexity: 'medium',
      documentType: 'business document',
      confidence: 0.75,
      analyzedAt: new Date(),
      model: 'gpt-oss:20b'
    }
  }
  
  return analysis
}

/**
 * Enhance existing documents with AI analysis if missing
 * Only adds mock analysis to documents that don't already have real AI analysis
 */
export function enhanceDocumentsWithAI(documents: Document[]): Document[] {
  return documents.map(doc => {
    // Only add mock analysis if the document doesn't already have real AI analysis
    if (!doc.aiAnalysis) {
      console.log(`📝 Adding mock AI analysis for document: ${doc.name}`)
      return {
        ...doc,
        aiAnalysis: generateMockAIAnalysis(doc)
      }
    }
    
    // Document already has real AI analysis, keep it
    console.log(`✅ Document already has AI analysis: ${doc.name}`)
    return doc
  })
}

/**
 * Update a single document with AI analysis
 */
export function addAIAnalysisToDocument(document: Document): Document {
  return {
    ...document,
    aiAnalysis: generateMockAIAnalysis(document)
  }
}
