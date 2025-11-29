// Rich Text Format (RTF) File Processor

import { BaseProcessor } from './base'

export class RTFProcessor extends BaseProcessor {
  readonly supportedTypes = ['rtf']

  async process(file: File): Promise<string> {
    this.validate(file)
    
    return this.withTimeout(this.extractRTFText(file))
  }

  private async extractRTFText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const rtfContent = new TextDecoder('utf-8').decode(arrayBuffer)
      
      return this.parseRTF(rtfContent)
    } catch (error) {
      console.error('Error processing RTF file:', error)
      throw new Error(`Failed to process RTF file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseRTF(rtfContent: string): string {
    let text = ''
    let skipChars = 0
    
    for (let i = 0; i < rtfContent.length; i++) {
      if (skipChars > 0) {
        skipChars--
        continue
      }
      
      const char = rtfContent[i]
      
      if (char === '\\') {
        // Control word or symbol
        const nextChar = rtfContent[i + 1]
        
        if (nextChar === '\\' || nextChar === '{' || nextChar === '}') {
          // Escaped character
          text += nextChar
          i++ // Skip next character
        } else {
          // Control word
          let controlWord = ''
          let j = i + 1
          
          // Read control word
          while (j < rtfContent.length && /[a-zA-Z]/.test(rtfContent[j])) {
            controlWord += rtfContent[j]
            j++
          }
          
          // Read parameter if present
          let parameter = ''
          if (j < rtfContent.length && /[-\d]/.test(rtfContent[j])) {
            while (j < rtfContent.length && /[-\d]/.test(rtfContent[j])) {
              parameter += rtfContent[j]
              j++
            }
          }
          
          // Skip delimiter space if present
          if (j < rtfContent.length && rtfContent[j] === ' ') {
            j++
          }
          
          // Handle specific control words
          if (controlWord === 'par' || controlWord === 'line') {
            text += '\n'
          } else if (controlWord === 'tab') {
            text += '\t'
          } else if (controlWord === 'u' && parameter) {
            // Unicode character
            const unicodeValue = parseInt(parameter, 10)
            if (!isNaN(unicodeValue)) {
              text += String.fromCharCode(unicodeValue)
            }
            // Skip replacement character
            if (j < rtfContent.length && rtfContent[j] === '?') {
              j++
            }
          }
          
          i = j - 1 // Set position (will be incremented by loop)
        }
      } else if (char === '{') {
        // Start of group - continue processing
        continue
      } else if (char === '}') {
        // End of group - continue processing
        continue
      } else {
        // Plain text
        text += char
      }
    }
    
    return this.cleanupText(text)
  }

  private cleanupText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple newlines
      .replace(/\n\s*\n/g, '\n\n')
      // Trim
      .trim()
  }

  async extractMetadata(file: File): Promise<Record<string, unknown>> {
    const baseMetadata = await super.extractMetadata(file)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const rtfContent = new TextDecoder('utf-8').decode(arrayBuffer)
      
      const metadata: Record<string, unknown> = { ...baseMetadata }
      
      // Extract basic RTF metadata
      const titleMatch = rtfContent.match(/\\title\s+([^}]+)/)
      if (titleMatch) metadata.title = titleMatch[1].trim()
      
      const authorMatch = rtfContent.match(/\\author\s+([^}]+)/)
      if (authorMatch) metadata.author = authorMatch[1].trim()
      
      const subjectMatch = rtfContent.match(/\\subject\s+([^}]+)/)
      if (subjectMatch) metadata.subject = subjectMatch[1].trim()
      
      const keywordsMatch = rtfContent.match(/\\keywords\s+([^}]+)/)
      if (keywordsMatch) metadata.keywords = keywordsMatch[1].trim()
      
      return metadata
      
    } catch (error) {
      console.warn('Failed to extract RTF metadata:', error)
      return baseMetadata
    }
  }
}
