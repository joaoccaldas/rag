// PowerPoint (PPTX) File Processor

import { BaseProcessor } from './base'

export class PowerPointProcessor extends BaseProcessor {
  readonly supportedTypes = ['pptx']

  async process(file: File): Promise<string> {
    this.validate(file)
    
    return this.withTimeout(this.extractPowerPointText(file))
  }

  private async extractPowerPointText(file: File): Promise<string> {
    try {
      // Dynamic import to avoid build issues
      const JSZip = (await import('jszip')).default
      
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      let extractedText = ''
      const slideTexts: string[] = []

      // Extract text from slides
      const slideFiles = Object.keys(contents.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      )

      for (const slideFile of slideFiles.sort()) {
        try {
          const slideXml = await contents.files[slideFile].async('text')
          const slideText = this.extractTextFromSlideXML(slideXml)
          if (slideText.trim()) {
            slideTexts.push(slideText)
          }
        } catch (error) {
          console.warn(`Failed to process slide ${slideFile}:`, error)
        }
      }

      // Extract notes if available
      const notesFiles = Object.keys(contents.files).filter(name => 
        name.startsWith('ppt/notesSlides/notesSlide') && name.endsWith('.xml')
      )

      const notesTexts: string[] = []
      for (const notesFile of notesFiles.sort()) {
        try {
          const notesXml = await contents.files[notesFile].async('text')
          const notesText = this.extractTextFromNotesXML(notesXml)
          if (notesText.trim()) {
            notesTexts.push(notesText)
          }
        } catch (error) {
          console.warn(`Failed to process notes ${notesFile}:`, error)
        }
      }

      // Combine slide content and notes
      extractedText = slideTexts.join('\n\n--- New Slide ---\n\n')
      
      if (notesTexts.length > 0) {
        extractedText += '\n\n=== Speaker Notes ===\n\n' + notesTexts.join('\n\n--- Notes for Next Slide ---\n\n')
      }

      return extractedText || 'No text content found in PowerPoint file'

    } catch (error) {
      console.error('Error processing PowerPoint file:', error)
      throw new Error(`Failed to process PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractTextFromSlideXML(xml: string): string {
    const textElements: string[] = []
    
    // Extract text from <a:t> elements (text runs)
    const textMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g)
    if (textMatches) {
      for (const match of textMatches) {
        const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '')
        const decodedText = this.decodeXMLEntities(text)
        if (decodedText.trim()) {
          textElements.push(decodedText.trim())
        }
      }
    }

    // Extract text from <a:p> elements (paragraphs) 
    const paragraphMatches = xml.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/g)
    if (paragraphMatches) {
      for (const match of paragraphMatches) {
        const innerTextMatches = match.match(/<a:t[^>]*>(.*?)<\/a:t>/g)
        if (innerTextMatches) {
          const paragraphText = innerTextMatches
            .map(t => this.decodeXMLEntities(t.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '')))
            .filter(t => t.trim())
            .join(' ')
          
          if (paragraphText.trim()) {
            textElements.push(paragraphText.trim())
          }
        }
      }
    }

    return textElements.join('\n')
  }

  private extractTextFromNotesXML(xml: string): string {
    // Similar to slide extraction but for notes
    const textElements: string[] = []
    
    const textMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g)
    if (textMatches) {
      for (const match of textMatches) {
        const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '')
        const decodedText = this.decodeXMLEntities(text)
        if (decodedText.trim()) {
          textElements.push(decodedText.trim())
        }
      }
    }

    return textElements.join('\n')
  }

  private decodeXMLEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  }

  async extractMetadata(file: File): Promise<Record<string, any>> {
    const baseMetadata = await super.extractMetadata(file)
    
    try {
      // Dynamic import to avoid build issues
      const JSZip = (await import('jszip')).default
      
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      // Extract basic presentation metadata
      const corePropsFile = contents.files['docProps/core.xml']
      let metadata: Record<string, any> = { ...baseMetadata }
      
      if (corePropsFile) {
        const corePropsXml = await corePropsFile.async('text')
        
        // Extract title, author, creation date, etc.
        const titleMatch = corePropsXml.match(/<dc:title>(.*?)<\/dc:title>/)
        if (titleMatch) metadata.title = this.decodeXMLEntities(titleMatch[1])
        
        const authorMatch = corePropsXml.match(/<dc:creator>(.*?)<\/dc:creator>/)
        if (authorMatch) metadata.author = this.decodeXMLEntities(authorMatch[1])
        
        const createdMatch = corePropsXml.match(/<dcterms:created[^>]*>(.*?)<\/dcterms:created>/)
        if (createdMatch) metadata.createdAt = new Date(createdMatch[1])
        
        const modifiedMatch = corePropsXml.match(/<dcterms:modified[^>]*>(.*?)<\/dcterms:modified>/)
        if (modifiedMatch) metadata.lastModified = new Date(modifiedMatch[1])
      }

      // Count slides
      const slideFiles = Object.keys(contents.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      )
      metadata.slideCount = slideFiles.length

      return metadata
      
    } catch (error) {
      console.warn('Failed to extract PowerPoint metadata:', error)
      return baseMetadata
    }
  }
}
