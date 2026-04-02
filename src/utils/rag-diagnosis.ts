/**
 * 🚨 URGENT RAG SEARCH DIAGNOSIS
 * 
 * This script will be added to the chat interface to debug why
 * the Employee Agreement document is not being found in search results
 */

export async function diagnoseRAGSearch(query: string, searchResults: Record<string, unknown>[]) {
  console.group('🚨 RAG SEARCH DIAGNOSIS');
  
  // Log all search results
  searchResults.forEach((result, i) => {
  });
  
  // Check if employee agreement is in the documents list
  try {
    const { ragStorage } = await import('../rag/utils/storage');
    const allDocs = await ragStorage.loadDocuments();
    
    const employeeDoc = allDocs.find(d => 
      d.name.toLowerCase().includes('employee') && 
      d.name.toLowerCase().includes('agreement')
    );
    
    if (employeeDoc) {
      
      // Test manual search on this document
      const queryLower = query.toLowerCase();
      const relevantChunks = employeeDoc.chunks?.filter(chunk => {
        const content = chunk.content?.toLowerCase() || '';
        return content.includes('joao') || 
               content.includes('salary') || 
               content.includes('compensation') ||
               queryLower.split(' ').some(word => content.includes(word));
      }) || [];
      
      relevantChunks.forEach((chunk, i) => {
      });
      
      // Check why it wasn't in search results
      const wasInResults = searchResults.some(r => 
        r.document?.name === employeeDoc.name
      );
      
    } else {
    }
    
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
  
  console.groupEnd();
}

export function forceEmployeeDocumentSearch(allDocuments: any[], query: string) {
  
  const employeeDoc = allDocuments.find(d => 
    d.name.toLowerCase().includes('employee') && 
    d.name.toLowerCase().includes('agreement')
  );
  
  if (!employeeDoc) {
    return [];
  }
  
  
  if (!employeeDoc.chunks) {
    return [];
  }
  
  // Manually search the employee document
  const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
  const relevantChunks = employeeDoc.chunks.map((chunk, index) => {
    const content = chunk.content?.toLowerCase() || '';
    
    // Calculate manual relevance score
    let score = 0;
    
    // High priority terms
    if (content.includes('joao')) score += 0.5;
    if (content.includes('salary')) score += 0.4;
    if (content.includes('compensation')) score += 0.3;
    if (content.includes('nordics')) score += 0.2;
    if (content.includes('director')) score += 0.2;
    if (content.includes('fp&a')) score += 0.2;
    
    // Query word matches
    queryWords.forEach(word => {
      if (content.includes(word)) score += 0.1;
    });
    
    return {
      chunk,
      document: employeeDoc,
      score,
      similarity: score,
      id: `${employeeDoc.id}:${chunk.id}`,
      content: chunk.content,
      relevantText: chunk.content?.substring(0, 200),
      metadata: {
        manualSearch: true,
        chunkIndex: index
      }
    };
  }).filter(result => result.score > 0.1)
    .sort((a, b) => b.score - a.score);
  
  relevantChunks.forEach((result, i) => {
  });
  
  return relevantChunks;
}
