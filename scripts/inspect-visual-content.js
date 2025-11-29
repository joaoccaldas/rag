// Visual Content Data Inspector
// Add this to your browser console to check actual stored data

window.inspectVisualContent = function() {
  console.clear();
  console.log('🔍 VISUAL CONTENT INSPECTION REPORT');
  console.log('=====================================');

  try {
    // Check what's in localStorage
    const visualContent = localStorage.getItem('rag_visual_content');
    if (!visualContent) {
      console.log('❌ No rag_visual_content found in localStorage');
      
      // Check for alternative keys
      const allKeys = Object.keys(localStorage);
      const visualKeys = allKeys.filter(key => 
        key.includes('visual') || key.includes('rag') || key.includes('content')
      );
      console.log('📦 Available storage keys:', visualKeys);
      return;
    }

    const data = JSON.parse(visualContent);
    console.log(`📊 Found ${data.length} visual content items`);

    if (data.length === 0) {
      console.log('⚠️  Visual content array is empty');
      return;
    }

    // Inspect first 3 items
    console.log('\n🔍 Inspecting first 3 items:');
    data.slice(0, 3).forEach((item, index) => {
      console.log(`\n📄 Item ${index + 1}:`);
      console.log('├─ ID:', item.id);
      console.log('├─ Type:', item.type);
      console.log('├─ Title:', item.title || 'No title');
      console.log('├─ Document ID:', item.documentId || 'No document ID');
      
      // Check for image data
      const hasThumbnail = !!item.thumbnail;
      const hasSource = !!item.source;
      const hasDataBase64 = !!(item.data && item.data.base64);
      const hasDataUrl = !!(item.data && item.data.url);
      
      console.log('├─ Has thumbnail:', hasThumbnail);
      console.log('├─ Has source:', hasSource);
      console.log('├─ Has data.base64:', hasDataBase64);
      console.log('├─ Has data.url:', hasDataUrl);
      
      // Show preview of image data
      if (hasThumbnail) {
        const preview = item.thumbnail.substring(0, 30) + '...';
        console.log('├─ Thumbnail preview:', preview);
      }
      if (hasDataBase64) {
        const preview = item.data.base64.substring(0, 30) + '...';
        console.log('├─ Base64 preview:', preview);
      }
      
      // Check metadata
      if (item.metadata) {
        console.log('├─ Metadata:');
        console.log('│  ├─ Page:', item.metadata.pageNumber || 'N/A');
        console.log('│  ├─ Document:', item.metadata.documentTitle || 'N/A');
        console.log('│  └─ Confidence:', item.metadata.confidence || 'N/A');
      }
      console.log('└─────────────────────');
    });

    // Summary statistics
    const stats = {
      total: data.length,
      withThumbnails: data.filter(item => item.thumbnail).length,
      withSources: data.filter(item => item.source).length,
      withBase64: data.filter(item => item.data && item.data.base64).length,
      withUrls: data.filter(item => item.data && item.data.url).length,
      byType: {}
    };

    data.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });

    console.log('\n📈 SUMMARY STATISTICS:');
    console.log('├─ Total items:', stats.total);
    console.log('├─ Items with thumbnails:', stats.withThumbnails);
    console.log('├─ Items with sources:', stats.withSources);
    console.log('├─ Items with base64 data:', stats.withBase64);
    console.log('├─ Items with URLs:', stats.withUrls);
    console.log('└─ Types:', JSON.stringify(stats.byType, null, 2));

    // Diagnosis
    console.log('\n🩺 DIAGNOSIS:');
    if (stats.withThumbnails === 0 && stats.withBase64 === 0 && stats.withSources === 0) {
      console.log('❌ PROBLEM: No image data found in any items!');
      console.log('💡 This means visual extraction is not generating actual images');
      console.log('🔧 Fix: Check OCR extraction service and document upload process');
    } else if (stats.withThumbnails > 0 || stats.withBase64 > 0) {
      console.log('✅ Image data exists in storage');
      console.log('💡 Problem is likely in display component or thumbnail URL generation');
      console.log('🔧 Fix: Check Visual Content Library thumbnail mapping');
    }

  } catch (error) {
    console.error('❌ Error inspecting visual content:', error);
  }

  console.log('\n=====================================');
  console.log('💡 Run window.inspectVisualContent() again to re-inspect');
};

// Auto-run the inspection
window.inspectVisualContent();
