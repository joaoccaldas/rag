// Clear mock data and test real OCR extraction
console.clear();
console.log('🧹 CLEARING MOCK DATA');
console.log('====================');

try {
  // Clear all visual content storage
  localStorage.removeItem('rag_visual_content');
  localStorage.removeItem('visual_content');
  localStorage.removeItem('rag_documents');
  
  console.log('✅ Cleared all stored data');
  console.log('📋 Now upload a new document to test real OCR extraction');
  console.log('🔍 The system will now use the real OCR service instead of mock data');
  
} catch (error) {
  console.error('❌ Error clearing data:', error);
}

console.log('====================');
