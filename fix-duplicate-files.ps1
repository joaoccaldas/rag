# Safe Duplicate File Deletion Script
# Fixes duplicate element IDs and removes redundant files
# Run this script from the dashboard root directory

Write-Host "🧹 Starting Duplicate File Cleanup..." -ForegroundColor Cyan
Write-Host "⚠️  This will backup files before deletion" -ForegroundColor Yellow

# Create backup directory
$backupDir = ".\backup-duplicates-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "📦 Created backup directory: $backupDir" -ForegroundColor Green

# Function to backup and delete file
function Remove-DuplicateFile {
    param([string]$FilePath, [string]$Reason)
    
    if (Test-Path $FilePath) {
        $fileName = Split-Path $FilePath -Leaf
        $backupPath = Join-Path $backupDir $fileName
        
        # Backup file
        Copy-Item $FilePath $backupPath -Force
        Write-Host "💾 Backed up: $fileName" -ForegroundColor Blue
        
        # Delete original
        Remove-Item $FilePath -Force
        Write-Host "🗑️  Deleted: $FilePath" -ForegroundColor Red
        Write-Host "   Reason: $Reason" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "⚠️  File not found: $FilePath" -ForegroundColor Yellow
    }
}

# Step 1: Update imports before deletion
Write-Host "🔄 Step 1: Updating import statements..." -ForegroundColor Cyan

# Update visual-content-storage imports to enhanced-visual-content-manager
$filesToUpdate = @(
    "src\components\visual-content-library.tsx",
    "src\rag\contexts\UploadProcessingContext.tsx", 
    "src\rag\components\rag-view.tsx",
    "src\components\chat\renderers\enhanced-message-renderer.tsx",
    "src\components\bot-message-renderer.tsx",
    "src\rag\services\document-upload.ts",
    "src\rag\components\processing-stats.tsx"
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        # Read file content
        $content = Get-Content $file -Raw
        
        # Replace old imports with enhanced manager
        $content = $content -replace "from '\.\./utils/visual-content-storage'", "from '../utils/enhanced-visual-content-manager'"
        $content = $content -replace "from '\.\./\.\./\.\./rag/utils/visual-content-storage'", "from '../../../utils/enhanced-visual-content-manager'"
        $content = $content -replace "from '\.\./rag/utils/visual-content-storage'", "from '../utils/enhanced-visual-content-manager'"
        
        # Update function calls to enhanced manager methods
        $content = $content -replace "getStoredVisualContent\(\)", "visualContentManager.getVisualContent()"
        $content = $content -replace "storeVisualContent\(", "visualContentManager.storeVisualContent("
        $content = $content -replace "getVisualContentByIds\(", "visualContentManager.getVisualContentByIds("
        
        # Write updated content
        Set-Content $file -Value $content -NoNewline
        Write-Host "✅ Updated: $file" -ForegroundColor Green
    }
}

# Step 2: Delete duplicate files
Write-Host "🗑️  Step 2: Removing duplicate files..." -ForegroundColor Cyan

# 1. Remove old visual content renderer (keep enhanced version)
Remove-DuplicateFile "src\components\visual-content-renderer.tsx" "Replaced by enhanced-visual-content-renderer.tsx"

# 2. Remove old visual content storage (keep enhanced manager)
Remove-DuplicateFile "src\rag\utils\visual-content-storage.ts" "Replaced by enhanced-visual-content-manager.ts"

# 3. Remove duplicate visual analysis view (functionality integrated in enhanced renderer)
Remove-DuplicateFile "src\components\enhanced-visual-analysis-view.tsx" "Functionality integrated into enhanced-visual-content-renderer.tsx"

# 4. Remove visual content processing (keep extractor)
Remove-DuplicateFile "src\storage\utils\visual-content-processing.ts" "Functionality integrated into visual-content-extractor.ts"

# 5. Remove old visual content library (keep unlimited version)
if (Test-Path "src\lib\visual-content.ts") {
    Remove-DuplicateFile "src\lib\visual-content.ts" "Replaced by unlimited-visual-content.ts"
}

# Step 3: Fix duplicate visual content IDs in localStorage
Write-Host "🔧 Step 3: Fixing duplicate visual content IDs..." -ForegroundColor Cyan

$fixScript = @"
// Fix duplicate visual content IDs
const VISUAL_CONTENT_KEY = 'rag_visual_content';
const stored = localStorage.getItem(VISUAL_CONTENT_KEY);

if (stored) {
    const content = JSON.parse(stored);
    const seenIds = new Set();
    const fixed = content.map((item, index) => {
        if (seenIds.has(item.id) || !item.id) {
            const newId = 'visual_fixed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '_' + index;
            console.log('Fixed duplicate ID:', item.id, '->', newId);
            return { ...item, id: newId };
        }
        seenIds.add(item.id);
        return item;
    });
    
    localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(fixed));
    console.log('Fixed', fixed.length, 'visual content items');
}
"@

# Save fix script for browser execution
Set-Content "fix-visual-ids.js" -Value $fixScript
Write-Host "📝 Created fix-visual-ids.js - run this in browser console to fix duplicate IDs" -ForegroundColor Green

# Step 4: Create import compatibility layer
Write-Host "🔗 Step 4: Creating compatibility layer..." -ForegroundColor Cyan

$compatibilityLayer = @"
/**
 * Compatibility layer for old visual-content-storage imports
 * Redirects to enhanced-visual-content-manager
 */

import { visualContentManager } from '../utils/enhanced-visual-content-manager'

// Re-export enhanced manager functions with old names for compatibility
export const getStoredVisualContent = () => visualContentManager.getVisualContent()
export const storeVisualContent = (visuals) => visualContentManager.storeVisualContent(visuals)
export const getVisualContentByIds = (ids) => visualContentManager.getVisualContentByIds?.(ids) || []
export const extractVisualReferences = (content) => {
    // Extract visual content references from text
    const regex = /visual_\w+_\d+/g
    return content.match(regex) || []
}

// Deprecated - use enhanced manager directly
console.warn('⚠️ Using deprecated visual-content-storage compatibility layer. Update imports to use enhanced-visual-content-manager.')
"@

# Create compatibility file temporarily
New-Item -ItemType Directory -Path "src\rag\utils" -Force -ErrorAction SilentlyContinue | Out-Null
Set-Content "src\rag\utils\visual-content-storage-compat.ts" -Value $compatibilityLayer
Write-Host "🔗 Created compatibility layer at src\rag\utils\visual-content-storage-compat.ts" -ForegroundColor Green

# Step 5: Update file system storage to not depend on deleted file
Write-Host "🔧 Step 5: Updating file system storage..." -ForegroundColor Cyan

if (Test-Path "src\rag\utils\file-system-visual-storage.ts") {
    $fsContent = Get-Content "src\rag\utils\file-system-visual-storage.ts" -Raw
    $fsContent = $fsContent -replace "await import\('\./visual-content-storage'\)", "await import('../../utils/enhanced-visual-content-manager')"
    $fsContent = $fsContent -replace "storeVisualContent\(", "visualContentManager.storeVisualContent("
    $fsContent = $fsContent -replace "getStoredVisualContent\(", "visualContentManager.getVisualContent("
    Set-Content "src\rag\utils\file-system-visual-storage.ts" -Value $fsContent -NoNewline
    Write-Host "✅ Updated file-system-visual-storage.ts" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "✅ Duplicate File Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   🗑️  Removed 5 duplicate files"
Write-Host "   🔄 Updated import statements in 8+ files"
Write-Host "   🔧 Created compatibility layer for gradual migration"
Write-Host "   📝 Generated fix script for duplicate IDs"
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run fix-visual-ids.js in browser console to fix duplicate element IDs"
Write-Host "   2. Test visual content functionality" 
Write-Host "   3. Remove compatibility layer after all imports are updated"
Write-Host "   4. Restart the development server"
Write-Host ""
Write-Host "💾 Backup location: $backupDir" -ForegroundColor Blue

# Generate restoration script
$restoreScript = @"
# Restore duplicate files if needed
Write-Host "Restoring backed up files..."
Copy-Item "$backupDir\*" "src\components\" -Force -ErrorAction SilentlyContinue
Copy-Item "$backupDir\*" "src\rag\utils\" -Force -ErrorAction SilentlyContinue
Copy-Item "$backupDir\*" "src\storage\utils\" -Force -ErrorAction SilentlyContinue
Copy-Item "$backupDir\*" "src\lib\" -Force -ErrorAction SilentlyContinue
Write-Host "Files restored. You may need to restart the development server."
"@

Set-Content "restore-duplicates.ps1" -Value $restoreScript
Write-Host "🔄 Created restore-duplicates.ps1 for emergency rollback" -ForegroundColor Blue
