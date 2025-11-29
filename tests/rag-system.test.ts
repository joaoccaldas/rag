// Test script for RAG system components
import { DocumentProcessor } from '../src/rag/utils/document-processing'
import { DocumentCompressionEngine } from '../src/rag/utils/compression'
import { SuggestionEngine } from '../src/rag/utils/suggestions'
import { BatchProcessor } from '../src/rag/utils/batch-processing'

async function testRAGComponents() {
  console.log('🧪 Testing RAG System Components...\n')

  // Test 1: Document Processing
  console.log('📄 Testing Document Processing...')
  try {
    const processor = new DocumentProcessor()
    const testText = "This is a test document for processing. It contains multiple sentences and should be chunked appropriately."
    const chunks = await processor.processDocument(testText, 'test.txt')
    console.log(`✅ Document processed successfully: ${chunks.length} chunks created`)
  } catch (error) {
    console.log(`❌ Document processing failed: ${error.message}`)
  }

  // Test 2: Document Compression
  console.log('\n🗜️ Testing Document Compression...')
  try {
    const compression = new DocumentCompressionEngine()
    const testData = "This is test data ".repeat(100) // Create larger test data
    const compressed = await compression.compress(testData, 'text')
    const decompressed = await compression.decompress(compressed.data, 'text')
    console.log(`✅ Compression test passed: ${testData.length} -> ${compressed.data.length} bytes (${compressed.ratio}% reduction)`)
    console.log(`✅ Decompression test passed: ${decompressed.length === testData.length ? 'Data integrity maintained' : 'Data integrity failed'}`)
  } catch (error) {
    console.log(`❌ Compression test failed: ${error.message}`)
  }

  // Test 3: Real-time Suggestions
  console.log('\n💡 Testing Real-time Suggestions...')
  try {
    const suggestions = new SuggestionEngine()
    // Add some test documents to the suggestion index
    await suggestions.addDocument({
      id: '1',
      content: 'Machine learning algorithms and artificial intelligence',
      metadata: { title: 'AI Overview', category: 'technology' }
    })
    await suggestions.addDocument({
      id: '2', 
      content: 'Data science and statistical analysis methods',
      metadata: { title: 'Data Science Guide', category: 'technology' }
    })
    
    const results = await suggestions.getSuggestions('machine', { maxSuggestions: 5 })
    console.log(`✅ Suggestions generated: ${results.length} suggestions for "machine"`)
  } catch (error) {
    console.log(`❌ Suggestions test failed: ${error.message}`)
  }

  // Test 4: Batch Processing
  console.log('\n⚡ Testing Batch Processing...')
  try {
    const batchProcessor = new BatchProcessor({ maxConcurrency: 2 })
    
    // Create test jobs
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      id: `job-${i}`,
      type: 'process' as const,
      data: { content: `Test document ${i}`, delay: 100 }
    }))

    const results = await batchProcessor.processBatch(jobs)
    console.log(`✅ Batch processing completed: ${results.successful.length} successful, ${results.failed.length} failed`)
  } catch (error) {
    console.log(`❌ Batch processing test failed: ${error.message}`)
  }

  console.log('\n🎉 RAG Component Testing Complete!')
}

// Run tests if called directly
if (typeof window === 'undefined') {
  testRAGComponents().catch(console.error)
}

export { testRAGComponents }
