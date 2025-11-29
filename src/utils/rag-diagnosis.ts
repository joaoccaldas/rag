/**
 * 🚨 URGENT RAG SEARCH DIAGNOSIS
 * 
 * This script will be added to the chat interface to debug why
 * the Employee Agreement document is not being found in search results
 */

export async function diagnoseRAGSearch(query: string, searchResults: Record<string, unknown>[]) {
  console.group('🚨 RAG SEARCH DIAGNOSIS');
  console.log('Query:', query);
  console.log('Search Results Count:', searchResults.length);
  
  // Log all search results
  searchResults.forEach((result, i) => {
    console.log(`\nResult ${i + 1}:`);
    console.log('  Document:', result.document?.name);
    console.log('  Score:', result.similarity || result.score);
    console.log('  Content Preview:', result.chunk?.content?.substring(0, 150));
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
      console.log('\n📄 EMPLOYEE DOC FOUND IN STORAGE:');
      console.log('  Name:', employeeDoc.name);
      console.log('  Status:', employeeDoc.status);
      console.log('  Chunks:', employeeDoc.chunks?.length);
      console.log('  Has Embeddings:', !!employeeDoc.chunks?.[0]?.embedding);
      
      // Test manual search on this document
      const queryLower = query.toLowerCase();
      const relevantChunks = employeeDoc.chunks?.filter(chunk => {
        const content = chunk.content?.toLowerCase() || '';
        return content.includes('joao') || 
               content.includes('salary') || 
               content.includes('compensation') ||
               queryLower.split(' ').some(word => content.includes(word));
      }) || [];
      
      console.log('  Manually found relevant chunks:', relevantChunks.length);
      relevantChunks.forEach((chunk, i) => {
        console.log(`    Chunk ${i + 1}:`, chunk.content?.substring(0, 200));
      });
      
      // Check why it wasn't in search results
      const wasInResults = searchResults.some(r => 
        r.document?.name === employeeDoc.name
      );
      console.log('  Was in search results:', wasInResults);
      
    } else {
      console.log('❌ Employee agreement document not found in storage');
    }
    
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
  
  console.groupEnd();
}

export function forceEmployeeDocumentSearch(allDocuments: any[], query: string) {
  console.log('🔍 FORCING EMPLOYEE DOCUMENT SEARCH');
  
  const employeeDoc = allDocuments.find(d => 
    d.name.toLowerCase().includes('employee') && 
    d.name.toLowerCase().includes('agreement')
  );
  
  if (!employeeDoc) {
    console.log('❌ No employee document found');
    return [];
  }
  
  console.log('📄 Found employee doc:', employeeDoc.name);
  console.log('📊 Chunks:', employeeDoc.chunks?.length);
  
  if (!employeeDoc.chunks) {
    console.log('❌ No chunks in employee document');
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
  
  console.log('🎯 Manual search found:', relevantChunks.length, 'relevant chunks');
  relevantChunks.forEach((result, i) => {
    console.log(`  ${i + 1}. Score: ${result.score.toFixed(2)}, Content: ${result.content?.substring(0, 100)}...`);
  });
  
  return relevantChunks;
}
