// Debug Visual Content Storage
// Run this in browser console to see what data is actually stored

console.log('🔍 Visual Content Storage Debug Report');
console.log('=====================================');

try {
  // Check localStorage keys
  const keys = Object.keys(localStorage);
  const visualKeys = keys.filter(key => key.includes('visual') || key.includes('rag'));
  console.log('📦 Storage keys:', visualKeys);

  // Check main visual content storage
  const VISUAL_CONTENT_KEY = 'rag_visual_content';
  const stored = localStorage.getItem(VISUAL_CONTENT_KEY);
  
  if (!stored) {
    console.log('❌ No visual content found in storage');
    console.log('💡 This means documents were not processed with visual extraction enabled');
    return;
  }

  const content = JSON.parse(stored);
  console.log(`📊 Found ${content.length} visual content items`);

  // Analyze the first few items
  content.slice(0, 3).forEach((item, index) => {
    console.log(`\n📋 Item ${index + 1}:`);
    console.log('  ID:', item.id);
    console.log('  Type:', item.type);
    console.log('  Title:', item.title);
    console.log('  Has thumbnail:', !!item.thumbnail);
    console.log('  Has source:', !!item.source);
    console.log('  Has data.base64:', !!(item.data && item.data.base64));
    console.log('  Has data.url:', !!(item.data && item.data.url));
    
    if (item.thumbnail) {
      console.log('  Thumbnail type:', item.thumbnail.substring(0, 20) + '...');
    }
    if (item.source) {
      console.log('  Source type:', item.source.substring(0, 20) + '...');
    }
    if (item.data && item.data.base64) {
      console.log('  Data.base64 type:', item.data.base64.substring(0, 20) + '...');
    }
  });

  // Check for common issues
  const itemsWithThumbnails = content.filter(item => item.thumbnail);
  const itemsWithSources = content.filter(item => item.source);
  const itemsWithBase64 = content.filter(item => item.data && item.data.base64);
  
  console.log('\n📈 Summary:');
  console.log(`  Items with thumbnails: ${itemsWithThumbnails.length}/${content.length}`);
  console.log(`  Items with sources: ${itemsWithSources.length}/${content.length}`);
  console.log(`  Items with base64 data: ${itemsWithBase64.length}/${content.length}`);

  if (itemsWithThumbnails.length === 0 && itemsWithSources.length === 0 && itemsWithBase64.length === 0) {
    console.log('⚠️  ISSUE: No visual data found in any items!');
    console.log('💡 The items are metadata-only, without actual image data');
  }

} catch (error) {
  console.error('❌ Error analyzing visual content:', error);
}

console.log('\n=====================================');
