/**
 * Debug script to inspect the Employee Agreement document
 */

const path = require('path');

// Add the src directory to the path for imports
const srcPath = path.join(__dirname, '..', 'src');
require.main.paths.unshift(srcPath);

async function debugEmployeeDocument() {
  try {
    console.log('🔍 Loading RAG storage...');
    
    // Dynamic import of the storage module
    const { ragStorage } = await import('../src/rag/utils/storage.js');
    
    console.log('📚 Loading documents...');
    const docs = await ragStorage.loadDocuments();
    
    console.log(`📊 Total documents: ${docs.length}`);
    
    // Find employee agreement document
    const employeeDoc = docs.find(d => 
      d.name.toLowerCase().includes('employee') && 
      d.name.toLowerCase().includes('agreement')
    );
    
    if (employeeDoc) {
      console.log('\n📄 EMPLOYEE AGREEMENT DOCUMENT FOUND:');
      console.log('Name:', employeeDoc.name);
      console.log('Status:', employeeDoc.status);
      console.log('Chunks:', employeeDoc.chunks?.length || 0);
      console.log('Content length:', employeeDoc.content?.length || 0);
      console.log('Has embeddings:', !!employeeDoc.chunks?.[0]?.embedding);
      
      if (employeeDoc.chunks && employeeDoc.chunks.length > 0) {
        console.log('\n📝 CHUNK ANALYSIS:');
        employeeDoc.chunks.forEach((chunk, i) => {
          console.log(`\nChunk ${i + 1}:`);
          console.log('  ID:', chunk.id);
          console.log('  Length:', chunk.content?.length || 0);
          console.log('  Has embedding:', !!chunk.embedding);
          console.log('  Content preview:', chunk.content?.substring(0, 300) + '...');
          
          // Check for salary-related content
          const content = chunk.content?.toLowerCase() || '';
          const hasSalary = content.includes('salary') || content.includes('joao') || content.includes('compensation');
          console.log('  Contains salary/joao/compensation:', hasSalary);
        });
      }
      
      // Also check the raw content
      if (employeeDoc.content) {
        const content = employeeDoc.content.toLowerCase();
        console.log('\n🔍 CONTENT ANALYSIS:');
        console.log('Contains "joao":', content.includes('joao'));
        console.log('Contains "salary":', content.includes('salary'));
        console.log('Contains "compensation":', content.includes('compensation'));
        console.log('Contains "nordics":', content.includes('nordics'));
        console.log('Contains "director":', content.includes('director'));
        console.log('Contains "fp&a":', content.includes('fp&a'));
      }
    } else {
      console.log('❌ Employee agreement document not found');
      console.log('\n📋 Available documents:');
      docs.forEach((doc, i) => {
        console.log(`${i + 1}. "${doc.name}" (${doc.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugEmployeeDocument();
