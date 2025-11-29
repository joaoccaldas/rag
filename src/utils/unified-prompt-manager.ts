/**
 * Unified Prompt Manager
 * Centralizes all AI prompts into a single, comprehensive "trailer-style" prompt
 * that gives users a complete understanding of document content
 */

export interface UnifiedPromptVariables {
  filename: string
  content: string
  documentType: string
  wordCount: number
  domain?: string
  customInstructions?: string
  visualContentCount?: number
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  userPrompt: string
  variables: string[]
  isDefault: boolean
  isActive: boolean
  createdAt: string
  lastModified: string
}

export class UnifiedPromptManager {
  private static readonly STORAGE_KEY = 'miele-unified-prompt-template'
  private static readonly TEMPLATES_KEY = 'miele-prompt-templates-unified'
  
  /**
   * Default unified "trailer-style" prompt that replaces all domain-specific prompts
   */
  private static readonly DEFAULT_TRAILER_PROMPT = `
Analyze this document and create a comprehensive "trailer" that gives viewers a complete understanding of the content:

## DOCUMENT ANALYSIS
**File**: {filename}
**Type**: {documentType}
**Length**: {wordCount} words
**Domain**: {domain}

## CONTENT TO ANALYZE
{content}

## YOUR MISSION: Create a Content Trailer
Think of this as creating a movie trailer - but for a document. Give the viewer everything they need to understand what's inside, what's important, and why it matters.

### 📋 MAIN MESSAGES & SUMMARY
- What are the 3-5 key messages this document conveys?
- Provide a compelling 2-4 sentence summary that captures the essence
- What is the primary purpose and audience of this document?

### 📊 MAIN NUMBERS & DATA POINTS
- Extract all important numbers, percentages, dates, quantities, financial figures
- Include context: what do these numbers represent and why they matter?
- Format as: "Revenue: $2.5M (Q3 2024)", "Efficiency: 85% improvement", "Deadline: March 15, 2025"

### 🎯 MAIN ANALYSIS & INSIGHTS
- What analysis, conclusions, or findings does this document present?
- What patterns, trends, or relationships are identified?
- What business/technical/strategic implications are highlighted?
- What problems are being solved or opportunities identified?

### 💡 EXPLANATIONS & CONTEXT
- How does this document explain complex concepts or processes?
- What background context, assumptions, or methodologies are provided?
- What industry or domain knowledge is required to understand this?

### ⚡ ACTIONS & RECOMMENDATIONS
- What specific actions, next steps, or recommendations are outlined?
- What decisions need to be made or approvals required?
- What timelines, deadlines, or milestones are mentioned?
- Who is responsible for what actions?

### 🔍 KEYWORDS & METADATA
- 8-12 most important and searchable keywords
- 5-8 relevant tags for categorization
- 3-6 main topics or themes
- Document complexity level (low/medium/high)
- Sentiment analysis (positive/negative/neutral)

### 🖼️ VISUAL CONTENT ANALYSIS
{visualContentCount} visual elements detected in this document.
- Describe any charts, graphs, tables, diagrams, or images
- What story do the visuals tell? What data do they present?
- How do visuals support or enhance the main message?
- What insights can be gained from the visual elements?

{customInstructions}

## OUTPUT REQUIREMENTS
Provide your analysis in valid JSON format matching this exact structure:

{
  "summary": "A comprehensive 2-4 sentence summary that serves as the document trailer",
  "keywords": ["8-12 most important keywords and terms"],
  "tags": ["5-8 relevant tags for categorization"],
  "topics": ["3-6 main topics or themes"],
  "sentiment": "positive|negative|neutral",
  "complexity": "low|medium|high",
  "documentType": "specific description of document type",
  "confidence": 0.85,
  "mainMessages": ["3-5 key messages this document conveys"],
  "mainNumbers": [{"key": "Revenue", "value": "$2.5M", "context": "Q3 2024 performance"}],
  "mainAnalysis": ["Key insights and conclusions from the document"],
  "explanations": ["How complex concepts are explained"],
  "actions": ["Specific recommended actions and next steps"],
  "visualInsights": ["Insights from charts, graphs, and visual elements"]
}

Remember: This is a TRAILER - make it engaging, informative, and complete enough that someone could understand the document's value and content without reading the full text!
`;

  private static readonly DEFAULT_SYSTEM_PROMPT = `
You are an expert document analyst and content summarizer. Your specialty is creating comprehensive "trailers" for documents - concise but complete summaries that give readers everything they need to understand the content, importance, and actionable insights of any document.

You have expertise across all domains: business strategy, technical documentation, financial reports, operational procedures, marketing materials, legal documents, research papers, and more.

Your analysis should be:
- Comprehensive yet concise
- Actionable and practical
- Focused on what matters most to the reader
- Rich in context and insights
- Properly structured and easy to scan

Always respond with valid JSON only. Do not include any text outside the JSON structure.
`;

  /**
   * Get the current active prompt template
   */
  static getCurrentPrompt(): PromptTemplate {
    const customPrompt = this.getCustomPrompt()
    if (customPrompt) {
      return customPrompt
    }
    
    return this.getDefaultPrompt()
  }

  /**
   * Get the default prompt template
   */
  static getDefaultPrompt(): PromptTemplate {
    return {
      id: 'default-unified-trailer',
      name: 'Default Trailer Prompt',
      description: 'Comprehensive document analysis prompt that creates engaging content trailers',
      systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      userPrompt: this.DEFAULT_TRAILER_PROMPT,
      variables: ['filename', 'content', 'documentType', 'wordCount', 'domain', 'customInstructions', 'visualContentCount'],
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  }

  /**
   * Get custom prompt template from storage
   */
  static getCustomPrompt(): PromptTemplate | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...this.getDefaultPrompt(),
          ...parsed,
          isDefault: false,
          lastModified: new Date().toISOString()
        }
      }
    } catch (error) {
      console.warn('Failed to load custom prompt template:', error)
    }
    return null
  }

  /**
   * Save custom prompt template
   */
  static saveCustomPrompt(template: Partial<PromptTemplate>): void {
    try {
      const promptToSave = {
        ...this.getDefaultPrompt(),
        ...template,
        id: template.id || `custom-${Date.now()}`,
        isDefault: false,
        isActive: true,
        lastModified: new Date().toISOString()
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(promptToSave))
      console.log('✅ Custom prompt template saved')
    } catch (error) {
      console.error('Failed to save custom prompt template:', error)
      throw error
    }
  }

  /**
   * Reset to default prompt and clear any cached templates
   */
  static resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.TEMPLATES_KEY)
    console.log('✅ Prompt template reset to default and cache cleared')
  }

  /**
   * Force refresh of the current prompt template
   */
  static refreshTemplate(): void {
    // Clear cache and force reload
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('✅ Template cache cleared, will reload default')
  }

  /**
   * Debug method to check current template validation
   */
  static debugCurrentTemplate(): void {
    const template = this.getCurrentPrompt()
    const validation = this.validateTemplate(template)
    
    console.log('🔍 Current Template Debug:', {
      name: template.name,
      isValid: validation.isValid,
      errors: validation.errors,
      hasContentVariable: template.userPrompt.includes('{content}'),
      hasFilenameVariable: template.userPrompt.includes('{filename}'),
      hasDocumentTypeVariable: template.userPrompt.includes('{documentType}'),
      promptPreview: template.userPrompt.substring(0, 200) + '...'
    })
  }

  /**
   * Generate the complete prompt with variable substitution
   */
  static generatePrompt(variables: UnifiedPromptVariables): string {
    const template = this.getCurrentPrompt()
    let prompt = template.userPrompt

    // Substitute all variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g')
      prompt = prompt.replace(placeholder, String(value || ''))
    })

    // Clean up any remaining placeholders
    prompt = prompt.replace(/\{[^}]*\}/g, '')

    return prompt
  }

  /**
   * Get system prompt for AI context
   */
  static getSystemPrompt(): string {
    const template = this.getCurrentPrompt()
    return template.systemPrompt
  }

  /**
   * Validate prompt template
   */
  static validateTemplate(template: Partial<PromptTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.name || template.name.trim().length < 3) {
      errors.push('Name must be at least 3 characters long')
    }

    if (!template.userPrompt || template.userPrompt.trim().length < 50) {
      errors.push('User prompt must be at least 50 characters long')
    }

    if (!template.systemPrompt || template.systemPrompt.trim().length < 20) {
      errors.push('System prompt must be at least 20 characters long')
    }

    // Check for required variable placeholders
    const requiredVariables = ['filename', 'content', 'documentType']
    const promptText = template.userPrompt || ''
    
    requiredVariables.forEach(variable => {
      if (!promptText.includes(`{${variable}}`)) {
        errors.push(`Missing required variable: {${variable}}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get available variables for template creation
   */
  static getAvailableVariables(): Array<{ name: string; description: string; example: string }> {
    return [
      {
        name: 'filename',
        description: 'The name of the uploaded file',
        example: 'quarterly-report-q3-2024.pdf'
      },
      {
        name: 'content',
        description: 'The extracted text content of the document',
        example: 'This report covers our Q3 performance...'
      },
      {
        name: 'documentType',
        description: 'The detected type of document',
        example: 'Financial Report, Technical Manual, Business Plan'
      },
      {
        name: 'wordCount',
        description: 'The number of words in the document',
        example: '2,847'
      },
      {
        name: 'domain',
        description: 'The detected content domain',
        example: 'business, technical, appliance, general'
      },
      {
        name: 'customInstructions',
        description: 'Additional user-provided instructions',
        example: 'Focus on financial metrics and compliance issues'
      },
      {
        name: 'visualContentCount',
        description: 'Number of visual elements (charts, images, etc.) found',
        example: '5'
      }
    ]
  }

  /**
   * Export prompt template for sharing
   */
  static exportTemplate(): string {
    const template = this.getCurrentPrompt()
    return JSON.stringify(template, null, 2)
  }

  /**
   * Import prompt template from JSON
   */
  static importTemplate(jsonString: string): void {
    try {
      const template = JSON.parse(jsonString)
      const validation = this.validateTemplate(template)
      
      if (!validation.isValid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`)
      }

      this.saveCustomPrompt(template)
      console.log('✅ Prompt template imported successfully')
    } catch (error) {
      console.error('Failed to import prompt template:', error)
      throw error
    }
  }
}

export default UnifiedPromptManager
