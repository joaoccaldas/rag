// Script to fix duplicate visual content IDs in localStorage
// Run this in the browser console to clean up existing data

function fixVisualContentIds() {
  try {
    const VISUAL_CONTENT_KEY = 'rag_visual_content';
    const stored = localStorage.getItem(VISUAL_CONTENT_KEY);
    
    if (!stored) {
      console.log('No visual content found in storage');
      return;
    }
    
    const content = JSON.parse(stored);
    console.log(`Found ${content.length} visual content items`);
    
    // Check for duplicates
    const seenIds = new Set();
    const duplicates = [];
    
    content.forEach((item, index) => {
      if (seenIds.has(item.id)) {
        duplicates.push({ index, id: item.id });
      } else {
        seenIds.add(item.id);
      }
    });
    
    if (duplicates.length === 0) {
      console.log('No duplicates found!');
      return;
    }
    
    console.log(`Found ${duplicates.length} duplicate IDs:`, duplicates);
    
    // Fix duplicates by generating new IDs
    const fixedContent = content.map((item, index) => {
      const isDuplicate = duplicates.some(dup => dup.index === index);
      if (isDuplicate || !item.id) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const newId = `visual_fixed_${timestamp}_${randomSuffix}_${index}`;
        console.log(`Fixing item ${index}: ${item.id} -> ${newId}`);
        return { ...item, id: newId };
      }
      return item;
    });
    
    // Verify no duplicates remain
    const finalIds = new Set();
    const stillDuplicated = [];
    fixedContent.forEach((item, index) => {
      if (finalIds.has(item.id)) {
        stillDuplicated.push({ index, id: item.id });
      } else {
        finalIds.add(item.id);
      }
    });
    
    if (stillDuplicated.length > 0) {
      console.error('Still have duplicates after fix:', stillDuplicated);
      return;
    }
    
    // Save fixed content
    localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(fixedContent));
    console.log(`Fixed and saved ${fixedContent.length} visual content items`);
    
    // Clear old inconsistent keys
    localStorage.removeItem('visual_content');
    console.log('Cleared old inconsistent storage key');
    
    console.log('Visual content IDs fixed! Refresh the page to see changes.');
    
  } catch (error) {
    console.error('Error fixing visual content IDs:', error);
  }
}

// Run the fix
fixVisualContentIds();
