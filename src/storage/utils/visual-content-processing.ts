import { VisualContent } from '../../rag/types'
import { VisualContentExtractor } from './visual-content-extractor'

/**
 * Enhanced visual content processing function
 * Extracts visual content from files without duplicate file storage
 * (File storage is handled separately by FileStorageManager)
 */
export async function processVisualContent(file: File, documentId: string): Promise<VisualContent[]> {
  try {
    console.log(`🎨 Processing visual content for: ${file.name}`)
    
    // Extract visual content (thumbnails, etc.)
    // Note: File storage is handled elsewhere by FileStorageManager
    const visualContent = await VisualContentExtractor.extractVisualContent(file, documentId)
    
    console.log(`✅ Visual processing complete for ${file.name}`)
    console.log(`📊 Generated ${visualContent.length} visual elements`)
    
    return visualContent
    
  } catch (error) {
    console.error('Error in visual content processing:', error)
    return []
  }
}
