// Enhanced Visual Content Inspection - Run this in browser console
console.clear();
console.log('🔍 ENHANCED VISUAL CONTENT INSPECTION');
console.log('====================================');

(function() {
  try {
    const visualContent = localStorage.getItem('rag_visual_content');
    if (!visualContent) {
      console.log('❌ No rag_visual_content found');
      return;
    }

  const data = JSON.parse(visualContent);
  console.log(`📊 Total items: ${data.length}`);

  // Detailed analysis of first 5 items
  console.log('\n🔍 DETAILED ANALYSIS (First 5 items):');
  console.log('=====================================');
  
  data.slice(0, 5).forEach((item, index) => {
    console.log(`\n📄 ITEM ${index + 1}:`);
    console.log('├─ ID:', item.id);
    console.log('├─ Type:', item.type);
    console.log('├─ Title:', item.title || 'No title');
    console.log('├─ Document ID:', item.documentId || 'No document ID');
    
    // Check all possible image sources
    const hasThumbnail = !!item.thumbnail;
    const hasSource = !!item.source;
    const hasDataBase64 = !!(item.data && item.data.base64);
    const hasDataUrl = !!(item.data && item.data.url);
    
    console.log('├─ Has thumbnail:', hasThumbnail);
    console.log('├─ Has source:', hasSource);
    console.log('├─ Has data.base64:', hasDataBase64);
    console.log('├─ Has data.url:', hasDataUrl);
    
    // Show actual data previews
    if (hasThumbnail) {
      console.log('├─ Thumbnail type:', typeof item.thumbnail);
      console.log('├─ Thumbnail starts with:', item.thumbnail.substring(0, 30));
      console.log('├─ Is data URL:', item.thumbnail.startsWith('data:'));
    }
    
    if (hasSource) {
      console.log('├─ Source type:', typeof item.source);
      console.log('├─ Source starts with:', item.source.substring(0, 30));
      console.log('├─ Is data URL:', item.source.startsWith('data:'));
    }
    
    if (hasDataBase64) {
      console.log('├─ Data.base64 type:', typeof item.data.base64);
      console.log('├─ Data.base64 starts with:', item.data.base64.substring(0, 30));
      console.log('├─ Is data URL:', item.data.base64.startsWith('data:'));
    }
    
    if (hasDataUrl) {
      console.log('├─ Data.url:', item.data.url);
    }
    
    // Show what data structure exists
    console.log('├─ Data structure:');
    if (item.data) {
      console.log('│  ├─ Keys:', Object.keys(item.data));
      if (item.data.chartType) console.log('│  ├─ Chart type:', item.data.chartType);
      if (item.data.dataPoints) console.log('│  ├─ Data points:', item.data.dataPoints.length);
      if (item.data.headers) console.log('│  ├─ Table headers:', item.data.headers);
      if (item.data.rows) console.log('│  └─ Table rows:', item.data.rows.length);
    } else {
      console.log('│  └─ No data object');
    }
    
    console.log('└─────────────────────');
  });

  // Overall statistics
  const stats = {
    total: data.length,
    withThumbnails: data.filter(item => item.thumbnail).length,
    withSources: data.filter(item => item.source).length,
    withBase64: data.filter(item => item.data && item.data.base64).length,
    withUrls: data.filter(item => item.data && item.data.url).length,
    withValidDataUrls: data.filter(item => 
      (item.thumbnail && item.thumbnail.startsWith('data:')) ||
      (item.source && item.source.startsWith('data:')) ||
      (item.data && item.data.base64 && item.data.base64.startsWith('data:'))
    ).length,
    byType: {}
  };

  data.forEach(item => {
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
  });

  console.log('\n📈 STATISTICS:');
  console.log('==============');
  console.log('├─ Total items:', stats.total);
  console.log('├─ With thumbnails:', stats.withThumbnails);
  console.log('├─ With sources:', stats.withSources);
  console.log('├─ With base64 data:', stats.withBase64);
  console.log('├─ With URLs:', stats.withUrls);
  console.log('├─ With valid data URLs:', stats.withValidDataUrls);
  console.log('└─ By type:', JSON.stringify(stats.byType, null, 2));

  // Diagnosis
  console.log('\n🩺 DIAGNOSIS:');
  console.log('=============');
  
  if (stats.withValidDataUrls === 0) {
    console.log('❌ CRITICAL: No valid data URLs found!');
    console.log('💡 All items appear to be metadata-only without actual image data');
    console.log('🔧 This means:');
    console.log('   1. OCR extraction is not generating real images');
    console.log('   2. Visual content is using mock/sample data');
    console.log('   3. PDF processing may not be working correctly');
  } else if (stats.withValidDataUrls < stats.total * 0.5) {
    console.log('⚠️  PARTIAL: Some items have image data, others don\'t');
    console.log('💡 Mixed data suggests some documents processed correctly, others didn\'t');
  } else {
    console.log('✅ GOOD: Most items have valid image data');
    console.log('💡 Problem is likely in the display component');
  }

  // Check for specific data patterns
  const sampleItem = data.find(item => 
    item.data && 
    item.data.chartType && 
    item.data.dataPoints && 
    !item.data.base64
  );
  
  if (sampleItem) {
    console.log('\n⚠️  FOUND PATTERN: Items with chart data but no images');
    console.log('💡 This indicates mock data generation instead of real extraction');
    console.log('🔧 Check if documents are being processed with real OCR vs mock data');
  }

} catch (error) {
  console.error('❌ Error during inspection:', error);
}

console.log('\n====================================');
})();
