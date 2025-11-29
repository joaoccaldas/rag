// EPUB (Electronic Publication) File Processor

import { BaseProcessor } from './base'

export class EPUBProcessor extends BaseProcessor {
  readonly supportedTypes = ['epub']

  async process(file: File): Promise<string> {
    this.validate(file)
    
    return this.withTimeout(this.extractEPUBText(file))
  }

  private async extractEPUBText(file: File): Promise<string> {
    try {
      // Dynamic import to avoid build issues
      const JSZip = (await import('jszip')).default
      
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      // Find and read content files
      const contentFiles = Object.keys(contents.files).filter(name => 
        (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm')) &&
        !name.includes('META-INF') &&
        !name.includes('toc.')
      )

      const textContent: string[] = []
      
      for (const contentFile of contentFiles.sort()) {
        try {
          const htmlContent = await contents.files[contentFile].async('text')
          const textFromHtml = this.extractTextFromHTML(htmlContent)
          
          if (textFromHtml.trim()) {
            textContent.push(`=== Chapter: ${contentFile} ===\n\n${textFromHtml}`)
          }
        } catch (error) {
          console.warn(`Failed to process EPUB content file ${contentFile}:`, error)
        }
      }

      // Also try to extract from any text files
      const textFiles = Object.keys(contents.files).filter(name => 
        name.endsWith('.txt') && !name.includes('META-INF')
      )

      for (const textFile of textFiles) {
        try {
          const textContent2 = await contents.files[textFile].async('text')
          if (textContent2.trim()) {
            textContent.push(`=== Text File: ${textFile} ===\n\n${textContent2}`)
          }
        } catch (error) {
          console.warn(`Failed to process EPUB text file ${textFile}:`, error)
        }
      }

      return textContent.length > 0 
        ? textContent.join('\n\n--- \n\n')
        : 'No readable content found in EPUB file'

    } catch (error) {
      console.error('Error processing EPUB file:', error)
      throw new Error(`Failed to process EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractTextFromHTML(html: string): string {
    // Remove script and style elements
    let cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')

    // Remove HTML tags but preserve some structure
    cleanHtml = cleanHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>/gi, '\n## ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')

    // Decode HTML entities
    cleanHtml = cleanHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

    // Clean up whitespace
    return cleanHtml
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  async extractMetadata(file: File): Promise<Record<string, unknown>> {
    const baseMetadata = await super.extractMetadata(file)
    
    try {
      // Dynamic import to avoid build issues
      const JSZip = (await import('jszip')).default
      
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      const metadata: Record<string, unknown> = { ...baseMetadata }
      
      // Try to read OPF (Open Packaging Format) file for metadata
      const opfFiles = Object.keys(contents.files).filter(name => 
        name.endsWith('.opf') || name.includes('content.opf')
      )

      if (opfFiles.length > 0) {
        const opfContent = await contents.files[opfFiles[0]].async('text')
        
        // Extract title
        const titleMatch = opfContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/i)
        if (titleMatch) metadata.title = this.decodeXMLEntities(titleMatch[1])
        
        // Extract author
        const authorMatch = opfContent.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/i)
        if (authorMatch) metadata.author = this.decodeXMLEntities(authorMatch[1])
        
        // Extract description
        const descMatch = opfContent.match(/<dc:description[^>]*>(.*?)<\/dc:description>/i)
        if (descMatch) metadata.description = this.decodeXMLEntities(descMatch[1])
        
        // Extract language
        const langMatch = opfContent.match(/<dc:language[^>]*>(.*?)<\/dc:language>/i)
        if (langMatch) metadata.language = this.decodeXMLEntities(langMatch[1])
        
        // Extract publisher
        const pubMatch = opfContent.match(/<dc:publisher[^>]*>(.*?)<\/dc:publisher>/i)
        if (pubMatch) metadata.publisher = this.decodeXMLEntities(pubMatch[1])
        
        // Extract date
        const dateMatch = opfContent.match(/<dc:date[^>]*>(.*?)<\/dc:date>/i)
        if (dateMatch) metadata.publishedDate = this.decodeXMLEntities(dateMatch[1])
      }

      // Count chapters
      const chapterFiles = Object.keys(contents.files).filter(name => 
        (name.endsWith('.html') || name.endsWith('.xhtml')) &&
        !name.includes('META-INF') &&
        !name.includes('toc.')
      )
      metadata.chapterCount = chapterFiles.length

      return metadata
      
    } catch (error) {
      console.warn('Failed to extract EPUB metadata:', error)
      return baseMetadata
    }
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
}
