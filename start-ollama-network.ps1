# 🌐 Start Ollama with Network Access
# Allows other devices on local network to use Ollama

Write-Host "🚀 Starting Ollama with network access..." -ForegroundColor Cyan

# Set environment variable to allow network connections
$env:OLLAMA_HOST = "0.0.0.0:11434"

Write-Host "📡 Ollama will listen on: 0.0.0.0:11434" -ForegroundColor Yellow
Write-Host "🌐 Accessible from: http://192.168.86.31:11434" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  WARNING: This exposes Ollama to your local network" -ForegroundColor Red
Write-Host "   Only do this on a trusted private network!" -ForegroundColor Red
Write-Host ""

# Start Ollama service
ollama serve
