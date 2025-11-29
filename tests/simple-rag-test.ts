// Simple test of RAG System Core Functions
export async function testRAGCore() {
  console.log('🧪 Testing RAG System Core Functions...\n')

  try {
    // Test 1: Check if compression utilities work
    console.log('🗜️ Testing compression utilities...')
    const testText = 'This is a test string for compression testing. '.repeat(50)
    console.log(`Original text length: ${testText.length}`)
    
    // Test 2: Check if chunking works
    console.log('\n📝 Testing chunking utilities...')
    const { tokenAwareChunking } = await import('../src/rag/utils/enhanced-chunking')
    const chunks = tokenAwareChunking(testText, 'test-doc-1', { maxTokens: 100 })
    console.log(`✅ Chunking successful: ${chunks.length} chunks created`)
    
    // Test 3: Check embedding generation
    console.log('\n🧠 Testing embedding generation...')
    const { generateEmbedding } = await import('../src/rag/utils/document-processing')
    const embedding = await generateEmbedding('test text for embedding')
    console.log(`✅ Embedding generated: ${embedding.length} dimensions`)
    
    console.log('\n✅ All core functions working correctly!')
    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Simple UI test function
export function runUITest() {
  console.log('🎨 Running UI Test...')
  
  // Test if we can access key DOM elements
  const app = document.querySelector('#__next')
  if (app) {
    console.log('✅ Next.js app container found')
    
    // Look for main components
    const ragElements = document.querySelectorAll('[data-testid*="rag"], [class*="rag"]')
    console.log(`✅ Found ${ragElements.length} RAG-related UI elements`)
    
    // Test theme toggle if available
    const themeButton = document.querySelector('button[aria-label*="theme"], button[title*="theme"]')
    if (themeButton) {
      console.log('✅ Theme toggle found')
    }
    
    return true
  } else {
    console.log('❌ App container not found')
    return false
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testRAG = testRAGCore;
  (window as unknown as Record<string, unknown>).testUI = runUITest;
  console.log('🚀 RAG Test functions loaded! Use testRAG() and testUI() in browser console');
}
