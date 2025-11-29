/**
 * Enhanced Document Processing Pipeline with Integrated AI Summarization
 * 
 * This module extends the base document processing to include automatic
 * AI summarization and semantic analysis during document upload.
 */

import { processDocument as baseProcessDocument } from './document-processing'
import { extractKeywords, extractRAGKeywords } from '../../ai/keywords/semantic-extractor'
import { storeVisualContent } from './visual-content-storage'
import UnifiedPromptManager, { UnifiedPromptVariables } from '../../utils/unified-prompt-manager'
import PromptSystemManager, { PromptSystemConfig, AdditionalVariables } from '../../utils/prompt-system-interface'
import type { SummaryData } from '../../workers/types'
import type { DocumentChunk, VisualContent } from '../types'

// Import prompt template utilities
interface PromptTemplate {
  id: string
  name: string
  domain: string
  systemPrompt: string
  userPrompt: string
  description: string
  variables: string[]
  isDefault: boolean
  isActive: boolean
  createdAt: string
  lastModified: string
}

/**
 * Get the useUnifiedPrompt setting from AI settings
 */
function getUseUnifiedPromptSetting(): boolean {
  try {
    const settings = localStorage.getItem('miele-ai-settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.useUnifiedPrompt ?? true // Default to true for new unified system
    }
  } catch (error) {
    console.warn('Failed to load AI settings for unified prompt check:', error)
  }
  return true // Default to unified prompt
}

function getCustomPromptTemplates(): PromptTemplate[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('miele-prompt-templates')
      if (stored) {
        const data = JSON.parse(stored)
        return data.templates || []
      }
    } catch (error) {
      console.warn('Failed to load custom prompt templates:', error)
    }
  }
  return []
}

function getActivePromptTemplate(domain: string): PromptTemplate | null {
  const templates = getCustomPromptTemplates()
  
  // Find active template for this domain
  const activeTemplate = templates.find((t: PromptTemplate) => t.domain === domain && t.isActive)
  if (activeTemplate) {
    return activeTemplate
  }
  
  // Fallback to default template for domain
  return templates.find((t: PromptTemplate) => t.domain === domain && t.isDefault) || null
}

interface ProcessingOptions {
  enableAISummarization?: boolean
  enableKeywordExtraction?: boolean
  enableDomainDetection?: boolean
  aiModel?: string
  temperature?: number
  maxTokens?: number
  validationLevel?: 'basic' | 'standard' | 'strict'
  retryAttempts?: number
}

interface EnhancedProcessingResult {
  content: string
  chunks: DocumentChunk[]
  wordCount: number
  visualContent?: VisualContent[]
  aiSummary?: SummaryData
  extractedKeywords?: {
    conceptual: string[]
    technical: string[]
    entities: string[]
    contextual: string[]
  }
  processingMetadata: {
    duration: number
    aiAnalysisTime?: number
    keywordExtractionTime?: number
    visualExtractionTime?: number
    status: 'complete' | 'partial' | 'failed'
    errors?: string[]
  }
}

/**
 * Process document with integrated AI summarization and analysis
 * Uses AI settings from context if not provided in options
 */
export async function processDocumentWithAI(
  file: File, 
  documentId: string, 
  options: ProcessingOptions = {}
): Promise<EnhancedProcessingResult> {
  const startTime = Date.now()
  const errors: string[] = []
  
  // Load AI settings from localStorage if not provided in options
  const savedAISettings = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('miele-ai-settings') || '{}') : {}
  
  const {
    enableAISummarization = savedAISettings.enableAISummarization ?? true,
    enableKeywordExtraction = savedAISettings.enableKeywordExtraction ?? true,
    enableDomainDetection = savedAISettings.enableDomainDetection ?? true,
    aiModel = savedAISettings.summarizationModel || 'llama3:latest',
    temperature = savedAISettings.temperature ?? 0.3,
    maxTokens = savedAISettings.maxTokens ?? 2000,
    validationLevel = savedAISettings.validationLevel || 'standard',
    retryAttempts = savedAISettings.retryAttempts ?? 3
  } = options

  console.log(`🔄 Starting enhanced processing for: ${file.name}`)
  console.log(`📊 AI Settings: model=${aiModel}, temp=${temperature}, validation=${validationLevel}`)
  console.log(`🎛️ Features: AI=${enableAISummarization}, Keywords=${enableKeywordExtraction}, Domain=${enableDomainDetection}`)

  try {
    // Step 1: Base document processing (content extraction, chunking, visual content)
    console.log('📄 Extracting content and creating chunks...')
    const baseResult = await baseProcessDocument(file, documentId)
    
    const visualExtractionTime = Date.now() - startTime
    console.log(`✅ Base processing complete (${visualExtractionTime}ms)`)

    // Step 1.5: Enhanced Visual Content Extraction with OCR
    console.log('🖼️ Extracting visual content and performing OCR...')
    const visualContentStartTime = Date.now()
    let extractedVisualContent: VisualContent[] = []
    
    try {
      // Use OCR extraction service for real visual content extraction
      const { ocrExtractionService } = await import('../services/ocr-extraction')
      
      try {
        await ocrExtractionService.initialize()
        console.log('🤖 OCR service initialized, performing OCR extraction...')
        
        const ocrResult = await ocrExtractionService.extractFromFile(file, {
          enableThumbnails: true,
          extractVisualElements: true,
          confidenceThreshold: 0.5
        })
        
        console.log(`🎯 OCR Results: ${ocrResult.text.length} chars, ${ocrResult.visualElements.length} visuals, confidence: ${ocrResult.confidence}`)
        
        // Store OCR visual elements if any
        if (ocrResult.visualElements && ocrResult.visualElements.length > 0) {
          await storeVisualContent(ocrResult.visualElements)
          extractedVisualContent = ocrResult.visualElements
          console.log(`✅ Visual content extracted and stored: ${ocrResult.visualElements.length} elements`)
          
          // Step 1.6: AI-Powered Visual Content Analysis
          console.log('🎨 Analyzing visual elements with AI for semantic insights...')
          const visualAnalysisStartTime = Date.now()
          
          try {
            // Import browser analysis engine for visual semantic analysis
            const { browserAnalysisEngine } = await import('../../ai/browser-analysis-engine')
            
            // Analyze each visual element to extract semantic insights
            const visualAnalysisPromises = ocrResult.visualElements.map(async (visual) => {
              try {
                // Transform visual to browser-analysis-engine VisualContent format
                const browserVisual = {
                  id: visual.id,
                  type: visual.type as 'image' | 'chart' | 'graph' | 'table' | 'diagram' | 'infographic',
                  description: visual.description || visual.title || 'Visual content',
                  metadata: {
                    extractedText: visual.metadata?.extractedText,
                    documentTitle: visual.metadata?.documentTitle,
                    pageNumber: visual.metadata?.pageNumber,
                    confidence: visual.metadata?.confidence
                  } as { extractedText?: string; documentTitle?: string; [key: string]: string | number | boolean | undefined }
                }
                const analysis = await browserAnalysisEngine.analyzeVisualContent(browserVisual)
                return { visual, analysis, success: true }
              } catch (error) {
                console.warn(`⚠️ Visual analysis failed for ${visual.id}:`, error)
                return { visual, analysis: null, success: false }
              }
            })
            
            const visualAnalysesResults = await Promise.all(visualAnalysisPromises)
            const successfulAnalyses = visualAnalysesResults.filter(r => r.success && r.analysis)
            
            console.log(`✅ Visual analysis complete: ${successfulAnalyses.length}/${ocrResult.visualElements.length} analyzed`)
            
            // Step 1.7: Embed Visual Insights into Document Content for RAG
            if (successfulAnalyses.length > 0) {
              console.log('📝 Embedding visual insights into document content for RAG...')
              
              let visualInsightsContent = '\n\n--- VISUAL CONTENT INSIGHTS ---\n'
              
              successfulAnalyses.forEach(({ visual, analysis }, index) => {
                if (!analysis) return
                
                visualInsightsContent += `\n[Visual ${index + 1}: ${visual.type}]`
                if (visual.title) visualInsightsContent += ` ${visual.title}`
                if (visual.metadata?.pageNumber) visualInsightsContent += ` (Page ${visual.metadata.pageNumber})`
                visualInsightsContent += '\n'
                
                // Add main numbers/metrics
                if (analysis.mainNumbers && analysis.mainNumbers.length > 0) {
                  visualInsightsContent += `Key Numbers: ${analysis.mainNumbers.join(', ')}\n`
                }
                
                // Add business message
                if (analysis.businessMessage) {
                  visualInsightsContent += `Summary: ${analysis.businessMessage}\n`
                }
                
                // Add key findings
                if (analysis.keyFindings && analysis.keyFindings.length > 0) {
                  visualInsightsContent += `Insights:\n${analysis.keyFindings.map(f => `  - ${f}`).join('\n')}\n`
                }
                
                // Add trends
                if (analysis.trends && analysis.trends.length > 0) {
                  visualInsightsContent += `Trends: ${analysis.trends.join(', ')}\n`
                }
                
                // Add business drivers
                if (analysis.businessDrivers && analysis.businessDrivers.length > 0) {
                  visualInsightsContent += `Business Drivers: ${analysis.businessDrivers.join(', ')}\n`
                }
                
                // Add context
                if (analysis.context) {
                  visualInsightsContent += `Context: ${analysis.context}\n`
                }
                
                // Add recommendations
                if (analysis.recommendations && analysis.recommendations.length > 0) {
                  visualInsightsContent += `Recommendations:\n${analysis.recommendations.map(r => `  - ${r}`).join('\n')}\n`
                }
                
                visualInsightsContent += '\n'
              })
              
              // Append visual insights to document content for chunking and embedding
              baseResult.content += visualInsightsContent
              
              const visualAnalysisTime = Date.now() - visualAnalysisStartTime
              console.log(`✅ Visual insights embedded into document (${visualAnalysisTime}ms)`)
              console.log(`📊 Total visual insights: ${visualInsightsContent.length} characters added for RAG indexing`)
            }
            
          } catch (error) {
            console.warn('⚠️ Visual analysis engine unavailable:', error)
            errors.push(`Visual analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        
        // If OCR extracted text, append it to the document content
        if (ocrResult.text && ocrResult.text.trim().length > 0) {
          baseResult.content += `\n\n--- OCR Extracted Text ---\n${ocrResult.text}`
          console.log(`✅ OCR text appended to document content: ${ocrResult.text.length} characters`)
        }
        
      } catch (ocrError) {
        console.warn('⚠️ OCR extraction failed, continuing with basic visual extraction:', ocrError)
        errors.push(`OCR extraction failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'}`)
      }
      
      const visualStorageTime = Date.now() - visualContentStartTime
      console.log(`✅ Visual content processing complete (${visualStorageTime}ms)`)
      
    } catch (error) {
      console.warn('⚠️ Visual content extraction failed:', error)
      errors.push(`Visual content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Step 2: AI Summarization (if enabled and content is sufficient)
    let aiSummary: SummaryData | undefined
    let aiAnalysisTime: number | undefined
    
    if (enableAISummarization && baseResult.content.length > 100) {
      const aiStartTime = Date.now()
      console.log('🤖 Generating AI summary...')
      
      try {
        aiSummary = await generateAISummary(baseResult.content, file.name, {
          model: aiModel,
          temperature,
          maxTokens,
          enableDomainDetection,
          validationLevel,
          retryAttempts
        })
        aiAnalysisTime = Date.now() - aiStartTime
        console.log(`✅ AI summary generated (${aiAnalysisTime}ms)`)
      } catch (error) {
        console.warn('⚠️ AI summarization failed:', error)
        errors.push(`AI summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Step 3: Keyword Extraction (if enabled)
    let extractedKeywords: EnhancedProcessingResult['extractedKeywords']
    let keywordExtractionTime: number | undefined
    
    if (enableKeywordExtraction && baseResult.content.length > 50) {
      const keywordStartTime = Date.now()
      console.log('🔍 Extracting semantic keywords...')
      
      try {
        extractedKeywords = extractRAGKeywords(baseResult.content)
        keywordExtractionTime = Date.now() - keywordStartTime
        console.log(`✅ Keywords extracted (${keywordExtractionTime}ms):`, {
          conceptual: extractedKeywords.conceptual.length,
          technical: extractedKeywords.technical.length,
          entities: extractedKeywords.entities.length,
          contextual: extractedKeywords.contextual.length
        })
      } catch (error) {
        console.warn('⚠️ Keyword extraction failed:', error)
        errors.push(`Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const totalDuration = Date.now() - startTime
    
    // Determine processing status
    let status: 'complete' | 'partial' | 'failed' = 'complete'
    if (errors.length > 0) {
      status = errors.length < 2 ? 'partial' : 'failed'
    }

    console.log(`🎉 Enhanced processing complete for ${file.name}:`)
    console.log(`   Duration: ${totalDuration}ms`)
    console.log(`   Status: ${status}`)
    console.log(`   AI Summary: ${aiSummary ? '✅' : '❌'}`)
    console.log(`   Keywords: ${extractedKeywords ? '✅' : '❌'}`)
    console.log(`   Visual Content: ${extractedVisualContent?.length || baseResult.visualContent?.length || 0} elements`)

    return {
      ...baseResult,
      visualContent: extractedVisualContent.length > 0 ? extractedVisualContent : baseResult.visualContent,
      aiSummary,
      extractedKeywords,
      processingMetadata: {
        duration: totalDuration,
        aiAnalysisTime,
        keywordExtractionTime,
        visualExtractionTime,
        status,
        errors: errors.length > 0 ? errors : undefined
      }
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('❌ Enhanced document processing failed:', error)
    
    // Return minimal result on complete failure
    return {
      content: '',
      chunks: [],
      wordCount: 0,
      visualContent: [],
      processingMetadata: {
        duration: totalDuration,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown processing error']
      }
    }
  }
}

/**
 * Generate AI summary for document content with domain-specific prompts and validation
 */
async function generateAISummary(
  content: string, 
  filename: string, 
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    enableDomainDetection?: boolean
    validationLevel?: 'basic' | 'standard' | 'strict'
    retryAttempts?: number
  } = {}
): Promise<SummaryData> {
  const {
    model = 'llama3:latest',
    temperature = 0.3,
    maxTokens = 2000,
    enableDomainDetection = true,
    validationLevel = 'standard',
    retryAttempts = 3
  } = options

  console.log(`🤖 Starting AI analysis for ${filename}`)
  console.log(`📊 Settings: model=${model}, temp=${temperature}, tokens=${maxTokens}`)

  // Truncate content if too long, but keep important sections
  const processContent = intelligentContentTruncation(content, maxTokens)
  
  // Detect document domain for specialized prompting
  const domain = enableDomainDetection ? detectDocumentDomain(content, filename) : 'general'
  console.log(`🔍 Detected domain: ${domain}`)

  // Use new unified prompt system interface
  const promptSystemManager = PromptSystemManager.getInstance()
  const promptConfig: PromptSystemConfig = {
    useUnifiedPrompt: getUseUnifiedPromptSetting(),
    domainSpecificPrompts: true, // Allow fallback to legacy
    enableFallbacks: true
  }

  const additionalVars: AdditionalVariables = {
    visualContentCount: 0, // Will be updated if visual content is processed
    customInstructions: ''
  }

  const promptResult = promptSystemManager.generatePrompt(
    processContent,
    filename,
    domain,
    promptConfig,
    additionalVars
  )

  console.log(`🎯 Using ${promptResult.source} prompt: ${promptResult.templateName}`)
  const prompt = promptResult.userPrompt
  const systemPrompt = promptResult.systemPrompt

  let lastError: Error | null = null
  
  // Retry logic for reliability
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      console.log(`🔄 Analysis attempt ${attempt}/${retryAttempts}`)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          settings: {
            model,
            temperature,
            maxTokens,
            systemPrompt
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(`AI service error: ${result.error}`)
      }

      // Extract and validate the AI response
      const aiMessage = result.response || result.message || result.content || ''
      const summaryData = parseAndValidateResponse(aiMessage, content, filename, validationLevel)
      
      console.log(`✅ AI analysis successful on attempt ${attempt}`)
      console.log(`📊 Generated summary (${summaryData.summary.length} chars, confidence: ${summaryData.confidence})`)
      
      return summaryData

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.warn(`⚠️ Analysis attempt ${attempt} failed:`, lastError.message)
      
      if (attempt < retryAttempts) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All attempts failed, generate fallback summary
  console.error(`❌ All ${retryAttempts} attempts failed, generating fallback summary`)
  return generateFallbackSummary(content, filename, lastError)
}

/**
 * Intelligent content truncation that preserves important sections
 */
function intelligentContentTruncation(content: string, maxTokens: number): string {
  // Rough estimation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 3 // Conservative estimate for content extraction
  
  if (content.length <= maxChars) {
    return content
  }

  // Try to extract key sections if content is structured
  const sections = extractKeySections(content)
  if (sections.length > 0) {
    const truncated = sections.join('\n\n')
    if (truncated.length <= maxChars) {
      return truncated
    }
  }

  // Fallback: take beginning and end with middle indicator
  const partSize = Math.floor(maxChars / 2) - 50
  const beginning = content.substring(0, partSize)
  const ending = content.substring(content.length - partSize)
  
  return `${beginning}\n\n[... content truncated for analysis ...]\n\n${ending}`
}

/**
 * Extract key sections from structured content
 */
function extractKeySections(content: string): string[] {
  const sections: string[] = []
  
  // Extract headers and their content (Markdown style)
  const headerMatches = content.match(/^#{1,6}\s+.+$/gm)
  if (headerMatches && headerMatches.length > 0) {
    sections.push(...headerMatches.slice(0, 5)) // First 5 headers
  }
  
  // Extract first paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50)
  if (paragraphs.length > 0) {
    sections.push(paragraphs[0])
  }
  
  // Extract any bullet points or lists
  const listMatches = content.match(/^\s*[-*•]\s+.+$/gm)
  if (listMatches && listMatches.length > 0) {
    sections.push(listMatches.slice(0, 10).join('\n')) // First 10 list items
  }
  
  return sections
}

/**
 * Detect document domain based on content and filename
 */
function detectDocumentDomain(content: string, filename: string): string {
  const lowerContent = content.toLowerCase()
  const lowerFilename = filename.toLowerCase()
  
  // Business domain indicators
  const businessKeywords = [
    'business', 'strategy', 'market', 'customer', 'sales', 'revenue', 'profit',
    'management', 'operations', 'service', 'product', 'brand', 'marketing',
    'policy', 'procedure', 'guidelines', 'manual', 'warranty', 'support'
  ]
  
  // Technical domain indicators
  const technicalKeywords = [
    'technical', 'specification', 'installation', 'configuration', 'api',
    'system', 'software', 'hardware', 'code', 'development', 'architecture',
    'database', 'server', 'network', 'security', 'protocol', 'algorithm'
  ]
  
  // Appliance/Miele specific indicators
  const applianceKeywords = [
    'appliance', 'washing', 'dryer', 'dishwasher', 'oven', 'refrigerator',
    'miele', 'temperature', 'cycle', 'program', 'maintenance', 'cleaning',
    'troubleshooting', 'repair', 'parts', 'model', 'serial'
  ]
  
  let businessScore = 0
  let technicalScore = 0
  let applianceScore = 0
  
  // Check content
  businessKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) businessScore++
  })
  
  technicalKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) technicalScore++
  })
  
  applianceKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) applianceScore++
  })
  
  // Check filename
  if (businessKeywords.some(keyword => lowerFilename.includes(keyword))) businessScore += 2
  if (technicalKeywords.some(keyword => lowerFilename.includes(keyword))) technicalScore += 2
  if (applianceKeywords.some(keyword => lowerFilename.includes(keyword))) applianceScore += 2
  
  // Determine domain
  if (applianceScore > Math.max(businessScore, technicalScore)) {
    return 'appliance'
  } else if (technicalScore > businessScore) {
    return 'technical'
  } else if (businessScore > 0) {
    return 'business'
  }
  
  return 'general'
}

/**
 * Build domain-specific prompts for better analysis
 */
function buildDomainPrompt(content: string, filename: string, domain: string): string {
  // First, try to get custom prompt template
  const customTemplate = getActivePromptTemplate(domain)
  
  if (customTemplate) {
    console.log(`🎯 Using custom prompt template: ${customTemplate.name} for domain: ${domain}`)
    
    // Replace variables in the custom template
    const variables = {
      content,
      filename,
      domain,
      documentType: getDocumentTypeFromName(filename),
      wordCount: content.split(/\s+/).length
    }
    
    let prompt = customTemplate.userPrompt
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return prompt
  }
  
  // Fallback to built-in domain prompts
  console.log(`📝 Using built-in prompt for domain: ${domain}`)
  
  const baseInstruction = `Analyze the following document and provide a structured analysis in JSON format:`

  const domainInstructions = {
    appliance: `Focus on appliance-specific information including:
- Product features and specifications
- Installation and setup procedures
- Operating instructions and programs
- Maintenance and cleaning requirements
- Troubleshooting and error resolution
- Safety guidelines and warnings
- Parts and service information`,

    business: `Focus on business and operational information including:
- Business objectives and strategies
- Customer service procedures
- Product information and positioning
- Operational guidelines and policies
- Market analysis and insights
- Performance metrics and KPIs
- Compliance and regulatory information`,

    technical: `Focus on technical specifications and implementation details including:
- System architecture and design
- Technical specifications and requirements
- Installation and configuration procedures
- API documentation and interfaces
- Security protocols and measures
- Performance optimization and tuning
- Integration guidelines and best practices`,

    general: `Provide a comprehensive analysis focusing on:
- Main topics and themes
- Key information and insights
- Important procedures or instructions
- Notable facts and figures
- Actionable items or recommendations`
  }

  const outputSchema = `{
  "summary": "A comprehensive 2-4 sentence summary of the main content and purpose",
  "keywords": ["8-12 most important keywords and terms"],
  "tags": ["5-8 relevant tags for categorization"],
  "topics": ["3-6 main topics or themes"],
  "sentiment": "positive|negative|neutral",
  "complexity": "low|medium|high",
  "documentType": "specific description of document type",
  "confidence": 0.85
}`

  return `${baseInstruction}

DOCUMENT: ${filename}
DOMAIN: ${domain}

${domainInstructions[domain as keyof typeof domainInstructions]}

CONTENT:
${content}

Please provide your analysis in the following JSON structure:
${outputSchema}

Requirements:
- Be precise and specific in your analysis
- Extract actionable metadata useful for knowledge management
- Ensure all keywords are relevant to the content
- Base confidence score on content clarity and your analysis certainty
- Focus on information that would help users find and understand this document`
}

/**
 * Get domain-specific system prompts
 */
function getDomainSystemPrompt(domain: string): string {
  // First, try to get custom prompt template
  const customTemplate = getActivePromptTemplate(domain)
  
  if (customTemplate) {
    console.log(`🤖 Using custom system prompt from template: ${customTemplate.name}`)
    return customTemplate.systemPrompt
  }
  
  // Fallback to built-in system prompts
  console.log(`🤖 Using built-in system prompt for domain: ${domain}`)
  
  const prompts = {
    appliance: 'You are an expert in home appliances and Miele products. Analyze documents for technical specifications, user guidance, maintenance procedures, and product information. Always respond with valid JSON only.',
    business: 'You are a business analyst expert in customer service, operations, and business processes. Focus on extracting strategic insights, operational procedures, and business-relevant information. Always respond with valid JSON only.',
    technical: 'You are a technical documentation specialist. Focus on system specifications, implementation details, configuration procedures, and technical requirements. Always respond with valid JSON only.',
    general: 'You are a document analysis expert. Extract key information, themes, and metadata from any type of document. Always respond with valid JSON only.'
  }
  
  return prompts[domain as keyof typeof prompts] || prompts.general
}

/**
 * Parse and validate AI response with different validation levels
 */
function parseAndValidateResponse(aiMessage: string, content: string, filename: string, validationLevel: string): SummaryData {
  // Try to extract JSON from the response
  try {
    const jsonMatch = aiMessage.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate required fields
    const required = ['summary', 'keywords', 'tags', 'topics', 'sentiment', 'complexity', 'documentType', 'confidence']
    for (const field of required) {
      if (!(field in parsed)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Type validation and normalization
    const normalized: SummaryData = {
      summary: String(parsed.summary || '').trim(),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).filter(Boolean) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean) : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics.map(String).filter(Boolean) : [],
      sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      complexity: ['low', 'medium', 'high'].includes(parsed.complexity) ? parsed.complexity : 'medium',
      documentType: String(parsed.documentType || '').trim() || getDocumentTypeFromName(filename),
      confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
      // Enhanced unified prompt fields
      mainMessages: Array.isArray(parsed.mainMessages) ? parsed.mainMessages.map(String).filter(Boolean) : undefined,
      mainNumbers: Array.isArray(parsed.mainNumbers) ? parsed.mainNumbers.map((num: {key?: unknown, value?: unknown, context?: unknown}) => ({
        key: String(num.key || '').trim(),
        value: String(num.value || '').trim(),
        context: String(num.context || '').trim()
      })).filter((num: {key: string, value: string, context: string}) => num.key && num.value) : undefined,
      mainAnalysis: Array.isArray(parsed.mainAnalysis) ? parsed.mainAnalysis.map(String).filter(Boolean) : undefined,
      explanations: Array.isArray(parsed.explanations) ? parsed.explanations.map(String).filter(Boolean) : undefined,
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(String).filter(Boolean) : undefined,
      visualInsights: Array.isArray(parsed.visualInsights) ? parsed.visualInsights.map(String).filter(Boolean) : undefined
    }
    
    // Apply validation based on level
    if (validationLevel === 'strict') {
      validateStrictQuality(normalized)
    } else if (validationLevel === 'standard') {
      validateStandardQuality(normalized)
    }
    
    return normalized
    
  } catch (parseError) {
    console.warn('Failed to parse AI response as JSON:', parseError)
    console.warn('Raw AI response:', aiMessage.substring(0, 500))
    
    // Extract what we can from the response text
    return extractInfoFromText(aiMessage, content, filename)
  }
}

/**
 * Standard quality validation
 */
function validateStandardQuality(summary: SummaryData): void {
  // Check minimum summary length
  if (summary.summary.length < 50) {
    throw new Error('Summary too short (minimum 50 characters)')
  }
  
  // Check minimum keywords
  if (summary.keywords.length < 3) {
    throw new Error('Insufficient keywords (minimum 3)')
  }
  
  // Check for very low confidence
  if (summary.confidence < 0.3) {
    throw new Error('Confidence too low for reliable analysis')
  }
}

/**
 * Strict quality validation
 */
function validateStrictQuality(summary: SummaryData): void {
  validateStandardQuality(summary)
  
  // Additional strict checks
  if (summary.summary.length < 100) {
    throw new Error('Summary too brief for strict validation (minimum 100 characters)')
  }
  
  if (summary.keywords.length < 5) {
    throw new Error('Insufficient keywords for strict validation (minimum 5)')
  }
  
  if (summary.confidence < 0.6) {
    throw new Error('Confidence too low for strict validation')
  }
  
  // Check for generic or placeholder content
  const genericPhrases = ['this document', 'various topics', 'general information']
  if (genericPhrases.some(phrase => summary.summary.toLowerCase().includes(phrase))) {
    throw new Error('Summary appears too generic')
  }
}

/**
 * Extract information from text when JSON parsing fails
 */
function extractInfoFromText(text: string, content: string, filename: string): SummaryData {
  // Try to extract a summary from the text
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const summary = sentences.slice(0, 3).join('. ').trim() + '.'
  
  return {
    summary: summary || 'Document processed but detailed analysis unavailable',
    keywords: extractKeywords(content, 8),
    tags: ['document', 'analysis'],
    topics: ['general'],
    sentiment: 'neutral' as const,
    complexity: 'medium' as const,
    documentType: getDocumentTypeFromName(filename),
    confidence: 0.4
  }
}

/**
 * Generate fallback summary when AI fails
 */
function generateFallbackSummary(content: string, filename: string, error: Error | null): SummaryData {
  console.log('🔧 Generating fallback summary using rule-based analysis')
  
  const wordCount = content.split(/\s+/).length
  const charCount = content.length
  
  // Extract basic information
  const fallbackKeywords = extractKeywords(content, 8)
  const documentType = getDocumentTypeFromName(filename)
  
  // Determine complexity based on content
  let complexity: 'low' | 'medium' | 'high' = 'medium'
  if (wordCount < 500) complexity = 'low'
  else if (wordCount > 2000) complexity = 'high'
  
  // Generate a basic summary
  const summary = `This ${documentType.toLowerCase()} contains ${wordCount} words (${Math.round(charCount / 1024)}KB) covering various topics. ${error ? 'AI analysis failed, using rule-based summary.' : 'Basic content analysis applied.'}`
  
  return {
    summary,
    keywords: fallbackKeywords,
    tags: ['document', documentType.toLowerCase().replace(/\s+/g, '-'), 'fallback'],
    topics: ['general'],
    sentiment: 'neutral' as const,
    complexity,
    documentType,
    confidence: 0.3
  }
}

/**
 * Get document type from filename
 */
function getDocumentTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return 'PDF Document'
    case 'docx': case 'doc': return 'Word Document'
    case 'xlsx': case 'xls': return 'Spreadsheet'
    case 'txt': return 'Text File'
    case 'html': return 'HTML Document'
    case 'md': return 'Markdown Document'
    case 'csv': return 'CSV Data'
    case 'json': return 'JSON Data'
    default: return 'Document'
  }
}

/**
 * Batch process multiple documents with AI analysis
 */
export async function batchProcessDocumentsWithAI(
  files: File[], 
  options: ProcessingOptions = {}
): Promise<EnhancedProcessingResult[]> {
  console.log(`🔄 Starting batch processing for ${files.length} documents`)
  
  const results: EnhancedProcessingResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const documentId = `doc_${Date.now()}_${i}`
    
    console.log(`📄 Processing ${i + 1}/${files.length}: ${file.name}`)
    
    try {
      const result = await processDocumentWithAI(file, documentId, options)
      results.push(result)
      
      // Small delay between documents to avoid overwhelming the system
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file.name}:`, error)
      results.push({
        content: '',
        chunks: [],
        wordCount: 0,
        visualContent: [],
        processingMetadata: {
          duration: 0,
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      })
    }
  }
  
  console.log(`🎉 Batch processing complete: ${results.length} documents processed`)
  return results
}

export default processDocumentWithAI
