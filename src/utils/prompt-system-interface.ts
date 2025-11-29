/**
 * PROMPT SYSTEM INTERFACE
 * 
 * Unified interface for both legacy and new prompt systems
 * Ensures smooth migration and backward compatibility
 */

import { UnifiedPromptManager, UnifiedPromptVariables } from './unified-prompt-manager'
import { PromptTemplate as LegacyPromptTemplate } from '../contexts/PromptTemplateContext'

export interface PromptSystemResult {
  systemPrompt: string
  userPrompt: string
  source: 'unified' | 'legacy' | 'fallback'
  templateName: string
}

export interface PromptSystemConfig {
  useUnifiedPrompt: boolean
  domainSpecificPrompts: boolean
  enableFallbacks: boolean
}

export interface AdditionalVariables {
  visualContentCount?: number
  customInstructions?: string
  [key: string]: string | number | undefined
}

/**
 * Unified Prompt System Manager
 * Handles both legacy and new prompt systems with graceful fallbacks
 */
export class PromptSystemManager {
  private static instance: PromptSystemManager | null = null

  static getInstance(): PromptSystemManager {
    if (!this.instance) {
      this.instance = new PromptSystemManager()
    }
    return this.instance
  }

  /**
   * Get the best available prompt for document processing
   */
  generatePrompt(
    content: string,
    filename: string,
    domain: string,
    config: PromptSystemConfig,
    additionalVariables?: AdditionalVariables
  ): PromptSystemResult {
    
    // Priority 1: Unified Prompt System (if enabled)
    if (config.useUnifiedPrompt) {
      try {
        const result = this.generateUnifiedPrompt(content, filename, domain, additionalVariables)
        if (result) return result
      } catch (error) {
        console.warn('Unified prompt failed, falling back:', error)
      }
    }

    // Priority 2: Legacy Domain-Specific Prompts (if enabled)
    if (config.domainSpecificPrompts && config.enableFallbacks) {
      try {
        const result = this.generateLegacyPrompt(content, filename, domain, additionalVariables)
        if (result) return result
      } catch (error) {
        console.warn('Legacy prompt failed, falling back:', error)
      }
    }

    // Priority 3: Basic Fallback Prompt
    return this.generateFallbackPrompt(content, filename, domain)
  }

  /**
   * Generate prompt using new unified system
   */
  private generateUnifiedPrompt(
    content: string,
    filename: string,
    domain: string,
    additionalVariables?: AdditionalVariables
  ): PromptSystemResult | null {
    try {
      const variables: UnifiedPromptVariables = {
        filename,
        content,
        documentType: this.getDocumentTypeFromName(filename),
        wordCount: content.split(/\s+/).length,
        domain,
        visualContentCount: additionalVariables?.visualContentCount || 0,
        customInstructions: additionalVariables?.customInstructions || ''
      }

      const userPrompt = UnifiedPromptManager.generatePrompt(variables)
      const systemPrompt = UnifiedPromptManager.getSystemPrompt()
      const template = UnifiedPromptManager.getCurrentPrompt()

      return {
        systemPrompt,
        userPrompt,
        source: 'unified',
        templateName: template.name
      }
    } catch (error) {
      console.error('Unified prompt generation failed:', error)
      return null
    }
  }

  /**
   * Generate prompt using legacy domain-specific system
   */
  private generateLegacyPrompt(
    content: string,
    filename: string,
    domain: string,
    _additionalVariables?: AdditionalVariables
  ): PromptSystemResult | null {
    try {
      // Note: This would need to be called from a React context
      // For now, we'll use the enhanced-document-processing fallback
      const userPrompt = this.buildLegacyDomainPrompt(content, filename, domain)
      const systemPrompt = this.getLegacyDomainSystemPrompt(domain)

      return {
        systemPrompt,
        userPrompt,
        source: 'legacy',
        templateName: `${domain}-domain-prompt`
      }
    } catch (error) {
      console.error('Legacy prompt generation failed:', error)
      return null
    }
  }

  /**
   * Generate basic fallback prompt when all else fails
   */
  private generateFallbackPrompt(
    content: string,
    filename: string,
    domain: string
  ): PromptSystemResult {
    const userPrompt = `Analyze this document and provide a comprehensive summary:

Document: ${filename}
Domain: ${domain}
Content: ${content}

Please provide:
1. A clear summary of the main content
2. Key insights and findings
3. Important numbers and data points
4. Recommendations or next steps
5. Keywords for categorization

Respond in JSON format with: summary, keywords, insights, numbers, recommendations`

    const systemPrompt = "You are an expert document analyst. Provide comprehensive analysis in valid JSON format."

    return {
      systemPrompt,
      userPrompt,
      source: 'fallback',
      templateName: 'basic-fallback'
    }
  }

  /**
   * Migration helper: Convert legacy template to unified format
   */
  migrateLegacyTemplate(legacyTemplate: LegacyPromptTemplate): boolean {
    try {
      const unifiedTemplate = {
        id: `migrated-${legacyTemplate.id}`,
        name: `Migrated: ${legacyTemplate.name}`,
        description: `Migrated from legacy ${legacyTemplate.domain} domain template`,
        systemPrompt: legacyTemplate.systemPrompt,
        userPrompt: this.convertLegacyToUnifiedPrompt(legacyTemplate.userPrompt),
        variables: ['filename', 'content', 'documentType', 'wordCount', 'domain'],
        isDefault: false,
        isActive: false
      }

      UnifiedPromptManager.saveCustomPrompt(unifiedTemplate)
      console.log(`✅ Migrated legacy template: ${legacyTemplate.name}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to migrate template ${legacyTemplate.name}:`, error)
      return false
    }
  }

  /**
   * Convert legacy prompt variables to unified format
   */
  private convertLegacyToUnifiedPrompt(legacyPrompt: string): string {
    return legacyPrompt
      .replace(/\{content\}/g, '{content}')
      .replace(/\{filename\}/g, '{filename}')
      .replace(/\{domain\}/g, '{domain}')
      .replace(/\{documentType\}/g, '{documentType}')
      .replace(/\{wordCount\}/g, '{wordCount}')
  }

  /**
   * Get document type from filename
   */
  private getDocumentTypeFromName(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || ''
    const name = filename.toLowerCase()

    if (ext === 'pdf') return 'PDF Document'
    if (['doc', 'docx'].includes(ext)) return 'Word Document'
    if (['xls', 'xlsx'].includes(ext)) return 'Excel Spreadsheet'
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint Presentation'
    if (['txt', 'md'].includes(ext)) return 'Text Document'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'Image File'

    // Content-based detection
    if (name.includes('manual')) return 'Manual Document'
    if (name.includes('report')) return 'Report Document'
    if (name.includes('spec')) return 'Specification Document'
    if (name.includes('guide')) return 'Guide Document'

    return 'Document'
  }

  /**
   * Legacy domain prompt builders (extracted from enhanced-document-processing)
   */
  private buildLegacyDomainPrompt(content: string, filename: string, domain: string): string {
    const prompts = {
      appliance: `Analyze this appliance-related document and provide insights:

Document: ${filename}
Content: ${content}

Focus on:
- Product specifications and features
- Installation and setup requirements
- Maintenance procedures
- Troubleshooting information
- Safety considerations
- Performance metrics

Provide structured analysis with clear sections.`,

      business: `Analyze this business document:

Document: ${filename}
Content: ${content}

Focus on:
- Key business metrics and KPIs
- Strategic insights and recommendations
- Market analysis and trends
- Financial implications
- Risk assessment
- Action items and next steps

Provide executive summary and detailed analysis.`,

      technical: `Analyze this technical document:

Document: ${filename}
Content: ${content}

Focus on:
- Technical specifications
- Implementation details
- System requirements
- Best practices
- Performance considerations
- Integration points

Provide technical summary and recommendations.`,

      general: `Analyze this document comprehensively:

Document: ${filename}
Content: ${content}

Provide:
- Clear summary of main content
- Key insights and findings
- Important data points
- Recommendations
- Keywords for categorization

Structure your response clearly.`
    }

    return prompts[domain as keyof typeof prompts] || prompts.general
  }

  /**
   * Legacy domain system prompts
   */
  private getLegacyDomainSystemPrompt(domain: string): string {
    const prompts = {
      appliance: 'You are an expert in appliance technology, installation, and maintenance. Provide detailed technical analysis with focus on practical applications.',
      business: 'You are a business analyst expert. Focus on strategic insights, metrics, and actionable business intelligence.',
      technical: 'You are a technical expert. Provide detailed technical analysis with focus on implementation and system design.',
      general: 'You are an expert document analyst. Provide comprehensive analysis suitable for general audiences.'
    }

    return prompts[domain as keyof typeof prompts] || prompts.general
  }

  /**
   * Check if migration is needed
   */
  shouldMigrate(config: PromptSystemConfig): boolean {
    return config.domainSpecificPrompts && !config.useUnifiedPrompt
  }

  /**
   * Get migration recommendations
   */
  getMigrationRecommendations(): string[] {
    return [
      'Enable unified prompt system for better consistency',
      'Migrate existing domain-specific templates',
      'Test unified prompts with sample documents',
      'Gradually disable legacy system',
      'Remove deprecated code after verification'
    ]
  }
}

export default PromptSystemManager
