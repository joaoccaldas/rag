// YAML File Processor

import { BaseProcessor } from './base'

export class YAMLProcessor extends BaseProcessor {
  readonly supportedTypes = ['yaml', 'yml']

  async process(file: File): Promise<string> {
    this.validate(file)
    
    return this.withTimeout(this.extractYAMLText(file))
  }

  private async extractYAMLText(file: File): Promise<string> {
    try {
      const text = await this.readTextFile(file)
      
      // For YAML files, we'll extract both the raw content and structured data
      const structuredData = this.parseYAMLToText(text)
      
      return `=== YAML Content ===\n\n${text}\n\n=== Structured Data ===\n\n${structuredData}`
      
    } catch (error) {
      console.error('Error processing YAML file:', error)
      throw new Error(`Failed to process YAML file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private parseYAMLToText(yamlContent: string): string {
    try {
      // Simple YAML-to-text conversion for better searchability
      const lines = yamlContent.split('\n')
      const textContent: string[] = []
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue
        }
        
        // Extract key-value pairs
        if (trimmedLine.includes(':')) {
          const [key, ...valueParts] = trimmedLine.split(':')
          const value = valueParts.join(':').trim()
          
          if (key && value) {
            const cleanKey = key.replace(/^[\s-]*/, '').trim()
            const cleanValue = value.replace(/^[\s"']*|[\s"']*$/g, '')
            
            if (cleanValue && cleanValue !== '|' && cleanValue !== '>') {
              textContent.push(`${cleanKey}: ${cleanValue}`)
            }
          }
        }
        
        // Extract list items
        if (trimmedLine.startsWith('-')) {
          const listItem = trimmedLine.replace(/^-\s*/, '').trim()
          if (listItem) {
            textContent.push(`• ${listItem}`)
          }
        }
      }
      
      return textContent.join('\n')
      
    } catch (error) {
      console.warn('Failed to parse YAML structure:', error)
      return 'YAML file content (structure could not be parsed)'
    }
  }

  async extractMetadata(file: File): Promise<Record<string, unknown>> {
    const baseMetadata = await super.extractMetadata(file)
    
    try {
      const content = await this.readTextFile(file)
      const lines = content.split('\n')
      
      const metadata: Record<string, unknown> = { ...baseMetadata }
      
      // Look for common metadata fields in YAML
      for (const line of lines.slice(0, 20)) { // Check first 20 lines
        const trimmedLine = line.trim()
        
        if (trimmedLine.includes(':')) {
          const [key, ...valueParts] = trimmedLine.split(':')
          const value = valueParts.join(':').trim().replace(/^[\s"']*|[\s"']*$/g, '')
          const cleanKey = key.replace(/^[\s-]*/, '').trim().toLowerCase()
          
          if (value && ['title', 'name', 'description', 'author', 'version'].includes(cleanKey)) {
            metadata[cleanKey] = value
          }
        }
      }
      
      // Count entries
      const keyCount = (content.match(/^\s*[^#\s-].*?:/gm) || []).length
      metadata.keyCount = keyCount
      
      return metadata
      
    } catch (error) {
      console.warn('Failed to extract YAML metadata:', error)
      return baseMetadata
    }
  }
}
