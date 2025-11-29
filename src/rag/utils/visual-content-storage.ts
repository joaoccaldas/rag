// Visual content storage utilities for RAG system
// Handles storing and retrieving extracted visual elements from documents

import { VisualContent } from '../types'

// Storage key for visual content
const VISUAL_CONTENT_KEY = 'rag_visual_content';

/**
 * Check storage size to prevent quota exceeded errors
 */
function checkStorageQuota(newData: string): boolean {
  try {
    const currentSize = JSON.stringify(localStorage).length
    const newSize = currentSize + newData.length
    const quotaLimit = 5 * 1024 * 1024 // 5MB conservative limit
    
    return newSize < quotaLimit
  } catch {
    return false
  }
}

/**
 * Store visual content extracted from documents with quota management
 */
export async function storeVisualContent(visuals: VisualContent[]): Promise<void> {
  try {
    // Only try file system storage on server side
    if (typeof window === 'undefined') {
      try {
        const { storeVisualContentToFiles } = await import('./file-system-visual-storage')
        await storeVisualContentToFiles(visuals)
        console.log('✅ Visual content stored to file system')
        return
      } catch (fileError) {
        console.warn('File system storage failed, falling back to localStorage:', fileError)
      }
    }
    
    // Fallback to localStorage with quota management
    const existing = await getStoredVisualContent();
    const updated = [...existing, ...visuals];
    
    const dataString = JSON.stringify(updated)
    
    // Check if we'll exceed quota
    if (!checkStorageQuota(dataString)) {
      console.warn('Storage quota would be exceeded, attempting cleanup...')
      
      // Try to clean up old or large items while preserving thumbnails
      const cleanedData = updated
        .map(item => {
          // Preserve small thumbnails (< 50KB), remove large base64 data
          const thumbnail = item.thumbnail?.startsWith('data:') && item.thumbnail.length < 50000
            ? item.thumbnail
            : item.source?.startsWith('data:') && item.source.length < 50000
            ? item.source
            : item.data?.base64?.startsWith('data:') && item.data.base64.length < 50000
            ? item.data.base64
            : undefined
          
          return {
            ...item,
            // Keep lightweight thumbnail for display
            thumbnail,
            // Remove large source data
            source: item.source && !item.source.startsWith('data:') ? item.source : undefined,
            // Remove large base64 data but keep other metadata
            data: item.data ? {
              ...item.data,
              base64: undefined, // Remove large base64
              url: item.data.url // Keep URLs if any
            } : undefined
          }
        })
      
      const cleanedString = JSON.stringify(cleanedData)
      
      if (!checkStorageQuota(cleanedString)) {
        throw new Error('Storage quota exceeded even after cleanup. Please clear existing visual content or use file system storage.')
      }
      
      localStorage.setItem(VISUAL_CONTENT_KEY, cleanedString);
      console.warn('⚠️ Stored visual content with reduced data due to quota limits')
      console.log(`📊 Preserved ${cleanedData.filter(item => item.thumbnail).length} thumbnails out of ${cleanedData.length} items`)
    } else {
      localStorage.setItem(VISUAL_CONTENT_KEY, dataString);
      console.log('✅ Visual content stored to localStorage')
    }
    
    // Also index by document and type for quick retrieval
    await indexVisualContent(visuals);
  } catch (error) {
    console.error('Error storing visual content:', error);
    throw new Error(`Storage failed: ${error}. Consider using file system storage or clearing existing content.`)
  }
}

/**
 * Get all stored visual content with file system fallback
 */
export async function getStoredVisualContent(): Promise<VisualContent[]> {
  try {
    // Only try file system storage on server side
    if (typeof window === 'undefined') {
      try {
        const { getVisualContentFromFiles } = await import('./file-system-visual-storage')
        const fileSystemContent = await getVisualContentFromFiles()
        if (fileSystemContent.length > 0) {
          return fileSystemContent
        }
      } catch {
        console.log('File system storage not available, using localStorage')
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(VISUAL_CONTENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving visual content:', error);
    return [];
  }
}

/**
 * Get visual content for a specific document
 */
export async function getVisualContentByDocument(documentId: string): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => visual.documentId === documentId);
}

/**
 * Get visual content by type
 */
export async function getVisualContentByType(type: VisualContent['type']): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => visual.type === type);
}

/**
 * Get visual content by IDs
 */
export async function getVisualContentByIds(ids: string[]): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => ids.includes(visual.id));
}

/**
 * Search visual content by query
 */
export async function searchVisualContent(query: string): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  const lowercaseQuery = query.toLowerCase();
  
  return allVisuals.filter(visual => 
    visual.title?.toLowerCase().includes(lowercaseQuery) ||
    visual.metadata?.documentTitle?.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Delete visual content for a document
 */
export async function deleteVisualContentByDocument(documentId: string): Promise<void> {
  try {
    const allVisuals = await getStoredVisualContent();
    const filtered = allVisuals.filter(visual => visual.documentId !== documentId);
    
    localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting visual content:', error);
  }
}

/**
 * Index visual content for faster retrieval
 */
async function indexVisualContent(visuals: VisualContent[]): Promise<void> {
  try {
    // Create indexes by document and type
    const documentIndex = new Map<string, string[]>();
    const typeIndex = new Map<string, string[]>();
    
    visuals.forEach(visual => {
      // Document index
      if (!documentIndex.has(visual.documentId)) {
        documentIndex.set(visual.documentId, []);
      }
      documentIndex.get(visual.documentId)!.push(visual.id);
      
      // Type index
      if (!typeIndex.has(visual.type)) {
        typeIndex.set(visual.type, []);
      }
      typeIndex.get(visual.type)!.push(visual.id);
    });
    
    // Store indexes
    localStorage.setItem('rag_visual_index_document', JSON.stringify(Array.from(documentIndex.entries())));
    localStorage.setItem('rag_visual_index_type', JSON.stringify(Array.from(typeIndex.entries())));
  } catch (error) {
    console.error('Error indexing visual content:', error);
  }
}

/**
 * Extract visual references from text content
 */
export function extractVisualReferences(content: string): string[] {
  const visualRefPattern = /\[visual:([^\]]+)\]/g;
  const matches = content.matchAll(visualRefPattern);
  return Array.from(matches, m => m[1]).filter((id): id is string => id !== undefined);
}

/**
 * Mock function to simulate visual content extraction from files
 * In a real implementation, this would use libraries like PDF.js, 
 * xlsx, or other document parsing tools
 */
export async function extractVisualContent(file: File): Promise<VisualContent[]> {
  const visuals: VisualContent[] = [];
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`Extracting visual content from: ${file.name}`);
  
  // Simulate visual content extraction based on file type
  if (file.type === 'application/pdf') {
    // Mock PDF visual extraction
    visuals.push({
      id: `visual_${Date.now()}_1`,
      documentId,
      type: 'chart',
      title: 'Sample Revenue Chart',
      data: {
        chartType: 'bar',
        dataPoints: [
          { x: 'Q1', y: 100, label: 'Q1 2024' },
          { x: 'Q2', y: 150, label: 'Q2 2024' },
          { x: 'Q3', y: 200, label: 'Q3 2024' },
          { x: 'Q4', y: 180, label: 'Q4 2024' }
        ]
      },
      metadata: {
        pageNumber: 1,
        extractedAt: new Date().toISOString(),
        confidence: 0.95,
        documentTitle: file.name
      }
    });
    
    visuals.push({
      id: `visual_${Date.now()}_2`,
      documentId,
      type: 'table',
      title: 'Financial Summary Table',
      data: {
        headers: ['Quarter', 'Revenue', 'Expenses', 'Profit'],
        rows: [
          ['Q1 2024', '$100K', '$70K', '$30K'],
          ['Q2 2024', '$150K', '$90K', '$60K'],
          ['Q3 2024', '$200K', '$120K', '$80K'],
          ['Q4 2024', '$180K', '$110K', '$70K']
        ]
      },
      metadata: {
        pageNumber: 2,
        extractedAt: new Date().toISOString(),
        confidence: 0.92,
        documentTitle: file.name
      }
    });
  }
  
  if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    // Mock Excel visual extraction
    visuals.push({
      id: `visual_${Date.now()}_3`,
      documentId,
      type: 'chart',
      title: 'Sales Performance Chart',
      data: {
        chartType: 'line',
        dataPoints: [
          { x: 'Jan', y: 50 },
          { x: 'Feb', y: 75 },
          { x: 'Mar', y: 100 },
          { x: 'Apr', y: 85 },
          { x: 'May', y: 120 }
        ]
      },
      metadata: {
        extractedAt: new Date().toISOString(),
        confidence: 0.89,
        documentTitle: file.name
      }
    });
  }
  
  return visuals;
}

/**
 * Clear all visual content from storage
 */
export async function clearAllVisualContent(): Promise<void> {
  try {
    localStorage.removeItem(VISUAL_CONTENT_KEY);
    
    // Clear indexed visual content
    if (typeof window !== 'undefined') {
      const deleteDB = indexedDB.deleteDatabase('rag_visual_content');
      deleteDB.onsuccess = () => console.log('Visual content database cleared');
      deleteDB.onerror = () => console.error('Failed to clear visual content database');
    }
  } catch (error) {
    console.error('Error clearing visual content:', error);
  }
}

/**
 * Get visual content statistics
 */
export async function getVisualContentStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byDocument: Record<string, number>;
}> {
  const allVisuals = await getStoredVisualContent();
  
  const byType: Record<string, number> = {};
  const byDocument: Record<string, number> = {};
  
  allVisuals.forEach(visual => {
    byType[visual.type] = (byType[visual.type] || 0) + 1;
    byDocument[visual.documentId] = (byDocument[visual.documentId] || 0) + 1;
  });
  
  return {
    total: allVisuals.length,
    byType,
    byDocument
  };
}
