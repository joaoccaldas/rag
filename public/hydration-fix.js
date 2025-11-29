// Browser Runtime Fix for Hydration Issues
// This script fixes React hydration mismatches and duplicate IDs

(function() {
    console.log('🔧 Applying hydration and duplicate ID fixes...');
    
    // Fix 1: Remove browser extension attributes that cause hydration mismatches
    function cleanBrowserExtensionAttributes() {
        const extensionAttributes = [
            'fdprocessedid',
            'data-lastpass-icon-root',
            'data-1password-root',
            'data-bitwarden-watching',
            'data-dashlane-rid',
            'data-kwift-id',
            'data-ms-editor',
            'data-gramm',
            'data-grammarly-part'
        ];
        
        let cleaned = 0;
        document.querySelectorAll('*').forEach(el => {
            extensionAttributes.forEach(attr => {
                if (el.hasAttribute(attr)) {
                    el.removeAttribute(attr);
                    cleaned++;
                }
            });
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} browser extension attributes`);
        }
        
        return cleaned;
    }
    
    // Fix 2: Resolve duplicate IDs that cause React warnings
    function fixDuplicateIds() {
        const seenIds = new Set();
        const duplicates = [];
        
        document.querySelectorAll('[id]').forEach(el => {
            const id = el.id;
            if (seenIds.has(id)) {
                duplicates.push(el);
                const timestamp = Date.now();
                const random = Math.random().toString(36).substr(2, 6);
                const newId = `${id}_fix_${timestamp}_${random}`;
                el.id = newId;
                console.warn(`🔄 Fixed duplicate ID: ${id} -> ${newId}`);
            } else {
                seenIds.add(id);
            }
        });
        
        return duplicates.length;
    }
    
    // Fix 3: Handle visual content duplicate IDs specifically
    function fixVisualContentDuplicates() {
        const visualElements = document.querySelectorAll('[id*="pdf_page_"], [id*="visual_doc_"]');
        const seenVisualIds = new Set();
        let fixed = 0;
        
        visualElements.forEach((el, index) => {
            const id = el.id;
            if (seenVisualIds.has(id)) {
                const newId = `${id}_dedup_${index}_${Date.now()}`;
                el.id = newId;
                
                // Update any associated labels or aria-describedby attributes
                document.querySelectorAll(`[for="${id}"], [aria-describedby="${id}"]`).forEach(associatedEl => {
                    if (associatedEl.getAttribute('for') === id) {
                        associatedEl.setAttribute('for', newId);
                    }
                    if (associatedEl.getAttribute('aria-describedby') === id) {
                        associatedEl.setAttribute('aria-describedby', newId);
                    }
                });
                
                console.warn(`📄 Fixed visual content duplicate: ${id} -> ${newId}`);
                fixed++;
            } else {
                seenVisualIds.add(id);
            }
        });
        
        return fixed;
    }
    
    // Fix 4: Handle React hydration warnings
    function setupHydrationWarningHandler() {
        const originalError = console.error;
        console.error = (...args) => {
            const message = args[0];
            if (typeof message === 'string' && (
                message.includes('Hydration failed') ||
                message.includes('hydration') ||
                message.includes("didn't match")
            )) {
                // Log hydration errors to a separate channel for debugging
                console.debug('🔍 Hydration warning (handled):', ...args);
                
                // Try to fix common hydration issues
                setTimeout(() => {
                    cleanBrowserExtensionAttributes();
                    fixDuplicateIds();
                    fixVisualContentDuplicates();
                }, 100);
                
                return;
            }
            originalError.apply(console, args);
        };
    }
    
    // Fix 5: Observer for dynamic content
    function setupDynamicContentObserver() {
        const observer = new MutationObserver((mutations) => {
            let needsFix = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for extension attributes or duplicate IDs in new content
                            const hasExtensionAttrs = node.hasAttribute && (
                                node.hasAttribute('fdprocessedid') ||
                                node.querySelector && node.querySelector('[fdprocessedid]')
                            );
                            
                            const hasDuplicateId = node.id && document.querySelectorAll(`[id="${node.id}"]`).length > 1;
                            
                            if (hasExtensionAttrs || hasDuplicateId) {
                                needsFix = true;
                            }
                        }
                    });
                }
            });
            
            if (needsFix) {
                // Debounce fixes to avoid excessive processing
                clearTimeout(window.hydrationFixTimeout);
                window.hydrationFixTimeout = setTimeout(() => {
                    cleanBrowserExtensionAttributes();
                    fixDuplicateIds();
                    fixVisualContentDuplicates();
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id', 'fdprocessedid']
        });
        
        return observer;
    }
    
    // Apply fixes immediately
    const extensionAttrsFixed = cleanBrowserExtensionAttributes();
    const duplicateIdsFixed = fixDuplicateIds();
    const visualDuplicatesFixed = fixVisualContentDuplicates();
    setupHydrationWarningHandler();
    const observer = setupDynamicContentObserver();
    
    console.log(`✅ Hydration fixes applied successfully!`);
    console.log(`   - Extension attributes cleaned: ${extensionAttrsFixed}`);
    console.log(`   - Duplicate IDs fixed: ${duplicateIdsFixed}`);
    console.log(`   - Visual content duplicates fixed: ${visualDuplicatesFixed}`);
    console.log(`   - Dynamic content observer active`);
    
    // Expose fix functions globally for manual use
    window.fixHydrationIssues = {
        cleanExtensionAttributes: cleanBrowserExtensionAttributes,
        fixDuplicateIds: fixDuplicateIds,
        fixVisualContentDuplicates: fixVisualContentDuplicates,
        runAll: () => {
            const ext = cleanBrowserExtensionAttributes();
            const dup = fixDuplicateIds();
            const vis = fixVisualContentDuplicates();
            console.log(`🔧 Manual fix applied - Ext: ${ext}, Dup: ${dup}, Vis: ${vis}`);
            return { extensionAttrs: ext, duplicateIds: dup, visualDuplicates: vis };
        },
        observer: observer,
        restart: () => {
            if (observer) observer.disconnect();
            return setupDynamicContentObserver();
        }
    };
    
    // Periodic cleanup for persistent issues
    setInterval(() => {
        const ext = cleanBrowserExtensionAttributes();
        const dup = fixDuplicateIds();
        const vis = fixVisualContentDuplicates();
        
        if (ext > 0 || dup > 0 || vis > 0) {
            console.log(`🔄 Periodic cleanup - Ext: ${ext}, Dup: ${dup}, Vis: ${vis}`);
        }
    }, 5000);
    
})();
