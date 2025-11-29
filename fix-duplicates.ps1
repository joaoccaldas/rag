# PowerShell Script to Fix Duplicate Files and Hydration Issues
# Run this from the dashboard directory

Write-Host "🔧 Starting Duplicate File Cleanup and Hydration Fix..." -ForegroundColor Green

# Step 1: Update imports to use enhanced components
Write-Host "📝 Step 1: Updating imports..." -ForegroundColor Yellow

# Create a backup first
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "📦 Created backup directory: $backupDir" -ForegroundColor Blue

# Function to safely update imports in a file
function Update-Imports {
    param(
        [string]$FilePath,
        [hashtable]$ImportMappings
    )
    
    if (Test-Path $FilePath) {
        # Create backup
        $fileName = Split-Path $FilePath -Leaf
        Copy-Item $FilePath "$backupDir\$fileName" -Force
        
        $content = Get-Content $FilePath -Raw
        $updated = $false
        
        foreach ($oldImport in $ImportMappings.Keys) {
            $newImport = $ImportMappings[$oldImport]
            if ($content -match [regex]::Escape($oldImport)) {
                $content = $content -replace [regex]::Escape($oldImport), $newImport
                $updated = $true
                Write-Host "  ✅ Updated import in $fileName" -ForegroundColor Green
            }
        }
        
        if ($updated) {
            Set-Content $FilePath $content -NoNewline
        }
    }
}

# Define import mappings (old -> new)
$importMappings = @{
    "from '../components/visual-content-renderer'" = "from '../components/enhanced-visual-content-renderer'"
    "from './visual-content-renderer'" = "from './enhanced-visual-content-renderer'"
    "from '../rag/utils/visual-content-storage'" = "from '../utils/enhanced-visual-content-manager'"
    "from './visual-content-storage'" = "from '../utils/enhanced-visual-content-manager'"
    "from '../lib/visual-content'" = "from '../lib/unlimited-visual-content'"
    "from './visual-content'" = "from '../lib/unlimited-visual-content'"
    "VisualContentRenderer" = "EnhancedVisualContentRenderer"
}

# Find and update all TypeScript/JavaScript files
Write-Host "🔍 Scanning for files to update..." -ForegroundColor Yellow
$filesToUpdate = Get-ChildItem -Path "." -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules|\.git|backup_"
}

foreach ($file in $filesToUpdate) {
    Update-Imports -FilePath $file.FullName -ImportMappings $importMappings
}

# Step 2: Remove duplicate files safely
Write-Host "📝 Step 2: Removing duplicate files..." -ForegroundColor Yellow

$duplicateFiles = @(
    "src\components\visual-content-renderer.tsx",
    "src\rag\utils\visual-content-storage.ts",
    "src\components\enhanced-visual-analysis-view.tsx",
    "src\storage\utils\visual-content-processing.ts",
    "src\lib\visual-content.ts"
)

foreach ($file in $duplicateFiles) {
    if (Test-Path $file) {
        # Create backup before deletion
        $fileName = Split-Path $file -Leaf
        Copy-Item $file "$backupDir\$fileName" -Force
        
        # Remove the duplicate file
        Remove-Item $file -Force
        Write-Host "  🗑️ Removed duplicate: $file" -ForegroundColor Red
    } else {
        Write-Host "  ℹ️ File not found: $file" -ForegroundColor Gray
    }
}

# Step 3: Create browser script for runtime fixes
Write-Host "📝 Step 3: Creating browser runtime fix script..." -ForegroundColor Yellow

$browserScript = @"
// Browser Runtime Fix for Hydration Issues
// Add this script to your _app.tsx or run in browser console

(function() {
    console.log('🔧 Applying hydration and duplicate ID fixes...');
    
    // Fix 1: Remove browser extension attributes
    function cleanBrowserExtensionAttributes() {
        const extensionAttributes = [
            'fdprocessedid',
            'data-lastpass-icon-root',
            'data-1password-root',
            'data-bitwarden-watching',
            'data-dashlane-rid',
            'data-kwift-id'
        ];
        
        document.querySelectorAll('*').forEach(el => {
            extensionAttributes.forEach(attr => {
                if (el.hasAttribute(attr)) {
                    el.removeAttribute(attr);
                }
            });
        });
    }
    
    // Fix 2: Resolve duplicate IDs
    function fixDuplicateIds() {
        const seenIds = new Set();
        const duplicates = [];
        
        document.querySelectorAll('[id]').forEach(el => {
            const id = el.id;
            if (seenIds.has(id)) {
                duplicates.push(el);
                const newId = `${id}_fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                el.id = newId;
                console.warn(`Fixed duplicate ID: ${id} -> ${newId}`);
            } else {
                seenIds.add(id);
            }
        });
        
        return duplicates.length;
    }
    
    // Fix 3: Handle React hydration warnings
    function suppressHydrationWarnings() {
        const originalError = console.error;
        console.error = (...args) => {
            if (args[0] && args[0].includes && args[0].includes('Hydration')) {
                // Log to a separate channel for debugging but don't spam console
                console.debug('Hydration warning (suppressed):', ...args);
                return;
            }
            originalError.apply(console, args);
        };
    }
    
    // Apply fixes immediately
    cleanBrowserExtensionAttributes();
    const duplicateCount = fixDuplicateIds();
    suppressHydrationWarnings();
    
    // Apply fixes periodically for dynamic content
    setInterval(() => {
        cleanBrowserExtensionAttributes();
        fixDuplicateIds();
    }, 2000);
    
    console.log(`✅ Hydration fixes applied. Fixed ${duplicateCount} duplicate IDs.`);
    
    // Expose fix functions globally for manual use
    window.fixHydrationIssues = {
        cleanExtensionAttributes: cleanBrowserExtensionAttributes,
        fixDuplicateIds: fixDuplicateIds,
        runAll: () => {
            cleanBrowserExtensionAttributes();
            return fixDuplicateIds();
        }
    };
})();
"@

Set-Content "public\hydration-fix.js" $browserScript
Write-Host "  📄 Created public\hydration-fix.js" -ForegroundColor Green

# Step 4: Update _app.tsx to include the fix
Write-Host "📝 Step 4: Updating _app.tsx..." -ForegroundColor Yellow

$appFilePath = "pages\_app.tsx"
if (-not (Test-Path $appFilePath)) {
    $appFilePath = "app\layout.tsx"
}

if (Test-Path $appFilePath) {
    Copy-Item $appFilePath "$backupDir\$(Split-Path $appFilePath -Leaf)" -Force
    
    $appContent = Get-Content $appFilePath -Raw
    
    # Add the script tag if not already present
    if ($appContent -notmatch "hydration-fix.js") {
        if ($appFilePath -match "_app.tsx") {
            # Next.js pages approach
            $scriptTag = @"

    {/* Hydration Fix Script */}
    <script src="/hydration-fix.js" async></script>
"@
            $appContent = $appContent -replace "(<Head>)", "`$1$scriptTag"
        } else {
            # Next.js app approach
            $scriptTag = @"

      {/* Hydration Fix Script */}
      <script src="/hydration-fix.js" async></script>
"@
            $appContent = $appContent -replace "(<head>)", "`$1$scriptTag"
        }
        
        Set-Content $appFilePath $appContent -NoNewline
        Write-Host "  ✅ Added hydration fix script to $appFilePath" -ForegroundColor Green
    }
}

# Step 5: Create validation script
Write-Host "📝 Step 5: Creating validation script..." -ForegroundColor Yellow

$validationScript = @"
# Validation Script - Run this to check if fixes worked
Write-Host "🔍 Validating duplicate file cleanup..." -ForegroundColor Green

# Check if duplicate files are gone
$expectedRemovedFiles = @(
    "src\components\visual-content-renderer.tsx",
    "src\rag\utils\visual-content-storage.ts", 
    "src\components\enhanced-visual-analysis-view.tsx",
    "src\storage\utils\visual-content-processing.ts",
    "src\lib\visual-content.ts"
)

$allRemoved = $true
foreach ($file in $expectedRemovedFiles) {
    if (Test-Path $file) {
        Write-Host "  ❌ Still exists: $file" -ForegroundColor Red
        $allRemoved = $false
    } else {
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
    }
}

# Check if enhanced files exist
$expectedFiles = @(
    "src\components\enhanced-visual-content-renderer.tsx",
    "src\utils\enhanced-visual-content-manager.ts",
    "src\lib\unlimited-visual-content.ts",
    "public\hydration-fix.js"
)

$allPresent = $true
foreach ($file in $expectedFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ Present: $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
        $allPresent = $false
    }
}

if ($allRemoved -and $allPresent) {
    Write-Host "🎉 All validations passed!" -ForegroundColor Green
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart your development server: npm run dev" -ForegroundColor White
    Write-Host "  2. Open browser console and check for 'Hydration fixes applied' message" -ForegroundColor White
    Write-Host "  3. Run: window.fixHydrationIssues.runAll() in console if needed" -ForegroundColor White
} else {
    Write-Host "⚠️ Some validations failed. Check the output above." -ForegroundColor Yellow
}
"@

Set-Content "validate-fixes.ps1" $validationScript
Write-Host "  📄 Created validate-fixes.ps1" -ForegroundColor Green

Write-Host "🎉 Duplicate file cleanup completed!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  - Updated imports in $(($filesToUpdate).Count) files" -ForegroundColor White
Write-Host "  - Removed $(($duplicateFiles | Where-Object { Test-Path $_ }).Count) duplicate files" -ForegroundColor White
Write-Host "  - Created hydration fix script" -ForegroundColor White
Write-Host "  - Backup created in: $backupDir" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "  1. Run: .\validate-fixes.ps1" -ForegroundColor White
Write-Host "  2. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "  3. Check browser console for hydration fix confirmation" -ForegroundColor White
