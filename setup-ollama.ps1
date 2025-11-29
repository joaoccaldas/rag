# 🚀 Quick Ollama Setup for Windows

Write-Host "=== Ollama Installation Guide ===" -ForegroundColor Cyan

# Check if Ollama is already installed
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaPath) {
    Write-Host "✅ Ollama is already installed at: $($ollamaPath.Source)" -ForegroundColor Green
    
    # Check if it's running
    $process = Get-Process ollama -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "✅ Ollama is currently running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Ollama is installed but not running" -ForegroundColor Yellow
        Write-Host "Starting Ollama..." -ForegroundColor Yellow
        Start-Process ollama -ArgumentList "serve" -NoNewWindow
        Start-Sleep 3
    }
} else {
    Write-Host "❌ Ollama is not installed" -ForegroundColor Red
    Write-Host "" 
    Write-Host "📥 To install Ollama:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://ollama.com/download" -ForegroundColor White
    Write-Host "2. Download the Windows installer" -ForegroundColor White
    Write-Host "3. Run the installer as Administrator" -ForegroundColor White
    Write-Host "4. Restart your terminal" -ForegroundColor White
    Write-Host ""
    Write-Host "⚡ Quick install (requires admin):" -ForegroundColor Yellow
    Write-Host "   winget install Ollama.Ollama" -ForegroundColor White
    exit 1
}

# Test connection
Write-Host ""
Write-Host "🔍 Testing Ollama connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Ollama API is responding on localhost:11434" -ForegroundColor Green
        
        # Parse and show models
        $models = ($response.Content | ConvertFrom-Json).models
        if ($models.Count -gt 0) {
            Write-Host "📦 Installed models:" -ForegroundColor Cyan
            foreach ($model in $models) {
                Write-Host "   - $($model.name)" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️ No models installed yet" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📦 Installing recommended models..." -ForegroundColor Cyan
            Write-Host "   ollama pull llama3:latest" -ForegroundColor White
            & ollama pull llama3:latest
        }
    }
} catch {
    Write-Host "❌ Cannot connect to Ollama API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Ollama is running: ollama serve" -ForegroundColor White
    Write-Host "2. Check firewall settings" -ForegroundColor White
    Write-Host "3. Restart Ollama service" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure Ollama is running: ollama serve" -ForegroundColor White
Write-Host "2. Restart your development server" -ForegroundColor White
Write-Host "3. Test the chat functionality" -ForegroundColor White
