/**
 * Fix Duplicate Visual Content Element IDs
 * Run this script in the browser console to resolve duplicate element ID warnings
 * This addresses the "Duplicate element ID found: pdf_page_XX_XXXXX, skipping..." warnings
 */

console.log('🔧 Starting Visual Content ID Fix...');

function fixDuplicateVisualContentIds() {
    try {
        // Fix localStorage visual content
        const VISUAL_CONTENT_KEY = 'rag_visual_content';
        const stored = localStorage.getItem(VISUAL_CONTENT_KEY);
        
        if (stored) {
            console.log('📦 Found stored visual content, checking for duplicates...');
            const content = JSON.parse(stored);
            const seenIds = new Set();
            const duplicates = [];
            let fixedCount = 0;
            
            // Identify duplicates
            content.forEach((item, index) => {
                if (seenIds.has(item.id) || !item.id) {
                    duplicates.push({ index, oldId: item.id });
                } else {
                    seenIds.add(item.id);
                }
            });
            
            if (duplicates.length === 0) {
                console.log('✅ No duplicate IDs found in localStorage');
            } else {
                console.log(`⚠️  Found ${duplicates.length} duplicate/missing IDs`);
                
                // Fix duplicates
                const fixed = content.map((item, index) => {
                    const isDuplicate = duplicates.some(dup => dup.index === index);
                    if (isDuplicate || !item.id) {
                        const timestamp = Date.now();
                        const randomSuffix = Math.random().toString(36).substring(2, 8);
                        const newId = `visual_fixed_${timestamp}_${randomSuffix}_${index}`;
                        
                        console.log(`🔧 Fixed item ${index}: "${item.id}" -> "${newId}"`);
                        fixedCount++;
                        
                        return { ...item, id: newId };
                    }
                    return item;
                });
                
                // Save fixed content
                localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(fixed));
                console.log(`✅ Fixed ${fixedCount} duplicate IDs in localStorage`);
            }
        } else {
            console.log('📭 No visual content found in localStorage');
        }
        
        // Fix unlimited storage visual content
        const UNLIMITED_KEY = 'miele-visual-content-analyzed';
        const unlimitedStored = localStorage.getItem(UNLIMITED_KEY);
        
        if (unlimitedStored) {
            console.log('📦 Found analyzed visual content, checking for duplicates...');
            const analyzedContent = JSON.parse(unlimitedStored);
            const seenIds = new Set();
            const duplicates = [];
            let fixedCount = 0;
            
            // Identify duplicates
            analyzedContent.forEach((item, index) => {
                if (seenIds.has(item.id) || !item.id) {
                    duplicates.push({ index, oldId: item.id });
                } else {
                    seenIds.add(item.id);
                }
            });
            
            if (duplicates.length === 0) {
                console.log('✅ No duplicate IDs found in analyzed content');
            } else {
                console.log(`⚠️  Found ${duplicates.length} duplicate/missing IDs in analyzed content`);
                
                // Fix duplicates
                const fixed = analyzedContent.map((item, index) => {
                    const isDuplicate = duplicates.some(dup => dup.index === index);
                    if (isDuplicate || !item.id) {
                        const timestamp = Date.now();
                        const randomSuffix = Math.random().toString(36).substring(2, 8);
                        const newId = `visual_analyzed_${timestamp}_${randomSuffix}_${index}`;
                        
                        console.log(`🔧 Fixed analyzed item ${index}: "${item.id}" -> "${newId}"`);
                        fixedCount++;
                        
                        return { ...item, id: newId };
                    }
                    return item;
                });
                
                // Save fixed content
                localStorage.setItem(UNLIMITED_KEY, JSON.stringify(fixed));
                console.log(`✅ Fixed ${fixedCount} duplicate IDs in analyzed content`);
            }
        }
        
        // Clear any old inconsistent storage keys that might cause conflicts
        const keysToCheck = [
            'visual_content',
            'visualContent',
            'rag_visual_content_temp',
            'visual_elements',
            'miele_visual_cache'
        ];
        
        let clearedCount = 0;
        keysToCheck.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                clearedCount++;
                console.log(`🗑️  Cleared old storage key: ${key}`);
            }
        });
        
        if (clearedCount > 0) {
            console.log(`✅ Cleared ${clearedCount} old storage keys`);
        }
        
        // Fix any remaining duplicate IDs in the current page DOM
        const elementsWithDuplicateIds = document.querySelectorAll('[id]');
        const seenDomIds = new Set();
        const duplicateElements = [];
        
        elementsWithDuplicateIds.forEach(element => {
            if (seenDomIds.has(element.id)) {
                duplicateElements.push(element);
            } else {
                seenDomIds.add(element.id);
            }
        });
        
        if (duplicateElements.length > 0) {
            console.log(`⚠️  Found ${duplicateElements.length} elements with duplicate IDs in DOM`);
            
            duplicateElements.forEach((element, index) => {
                const oldId = element.id;
                const newId = `${oldId}_fixed_${Date.now()}_${index}`;
                element.id = newId;
                console.log(`🔧 Fixed DOM element: "${oldId}" -> "${newId}"`);
            });
            
            console.log(`✅ Fixed ${duplicateElements.length} duplicate DOM element IDs`);
        } else {
            console.log('✅ No duplicate DOM element IDs found');
        }
        
        console.log('');
        console.log('✅ Visual Content ID Fix Complete!');
        console.log('📋 Summary:');
        console.log('   - Checked localStorage for duplicate visual content IDs');
        console.log('   - Checked analyzed content for duplicate IDs');
        console.log('   - Cleared old/inconsistent storage keys');
        console.log('   - Fixed duplicate DOM element IDs');
        console.log('');
        console.log('🔄 Refresh the page to see the changes take effect.');
        
        return {
            success: true,
            message: 'All duplicate visual content IDs have been fixed'
        };
        
    } catch (error) {
        console.error('❌ Error fixing visual content IDs:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the fix
const result = fixDuplicateVisualContentIds();

if (result.success) {
    console.log('🎉 Fix completed successfully!');
} else {
    console.error('💥 Fix failed:', result.error);
}

// Export function for manual use
window.fixDuplicateVisualContentIds = fixDuplicateVisualContentIds;
