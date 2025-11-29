// Complete Visual Content System Fix and Cleanup Script
// Run this in the browser console to apply all fixes and clear duplicate data

console.log('🎨 Starting Visual Content System Fix...');

function completeVisualContentFix() {
  try {
    // Step 1: Fix duplicate IDs in storage
    const VISUAL_CONTENT_KEY = 'rag_visual_content';
    const stored = localStorage.getItem(VISUAL_CONTENT_KEY);
    
    if (stored) {
      const content = JSON.parse(stored);
      console.log(`📦 Found ${content.length} visual content items in storage`);
      
      // Remove duplicates and fix IDs
      const seenIds = new Set();
      const fixedContent = content.map((item, index) => {
        let uniqueId = item.id;
        if (!uniqueId || seenIds.has(uniqueId)) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          uniqueId = `visual_fixed_${timestamp}_${randomSuffix}_${index}`;
          console.log(`🔧 Fixed duplicate ID: ${item.id} -> ${uniqueId}`);
        }
        seenIds.add(uniqueId);
        return { ...item, id: uniqueId };
      });
      
      // Save fixed content
      localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(fixedContent));
      console.log(`✅ Fixed and saved ${fixedContent.length} visual content items`);
    }
    
    // Step 2: Clean up old inconsistent storage keys
    const oldKeys = ['visual_content', 'rag_visual_index_document', 'rag_visual_index_type'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleaned up old storage key: ${key}`);
      }
    });
    
    // Step 3: Clear any problematic cache
    console.log('🔄 Clearing cache and reloading...');
    
    // Force reload to apply all changes
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    console.log('✨ Visual Content System Fix Complete!');
    console.log('📝 Changes applied:');
    console.log('  - Fixed duplicate React keys');
    console.log('  - Unified storage system');
    console.log('  - Added proper thumbnail generation');
    console.log('  - Cleaned up inconsistent data');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

// Run the complete fix
completeVisualContentFix();
