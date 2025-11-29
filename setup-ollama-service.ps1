# 🚀 Ollama Service Setup Script
# Fixes 503 Service Unavailable errors

Write-Host "🔍 Checking Ollama installation..." -ForegroundColor Yellow

# Check if Ollama is installed
$ollamaVersion = ollama --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama installed: $ollamaVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Ollama not found. Please install from https://ollama.ai" -ForegroundColor Red
    Write-Host "📥 Download: https://ollama.ai/download" -ForegroundColor Blue
    exit 1
}

Write-Host "`n🔄 Starting Ollama service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "ollama serve" -WindowStyle Minimized

# Wait for service to start
Start-Sleep -Seconds 3

Write-Host "`n🧪 Testing service connection..." -ForegroundColor Yellow
$response = curl -s http://localhost:11434/api/tags 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama service is running on localhost:11434" -ForegroundColor Green
} else {
    Write-Host "❌ Service not responding. Waiting longer..." -ForegroundColor Red
    Start-Sleep -Seconds 5
    $response = curl -s http://localhost:11434/api/tags 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Service failed to start. Check logs." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📦 Pulling required model: llama3.1:70b..." -ForegroundColor Yellow
Write-Host "⏳ This may take several minutes for first-time download..." -ForegroundColor Cyan
ollama pull llama3.1:70b

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Model ready!" -ForegroundColor Green
    Write-Host "`n🎉 Ollama setup complete!" -ForegroundColor Green
    Write-Host "🌐 Service: http://localhost:11434" -ForegroundColor Blue
    Write-Host "🤖 Model: llama3.1:70b" -ForegroundColor Blue
} else {
    Write-Host "❌ Model pull failed. Check internet connection." -ForegroundColor Red
    exit 1
}
