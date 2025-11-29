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
