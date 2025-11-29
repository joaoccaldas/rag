#!/usr/bin/env pwsh

# Network Development Server Startup Script
# Configures both Next.js and Ollama for cross-machine access

Write-Host "🚀 Starting Network Development Server..." -ForegroundColor Green

# Get local IP address
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"})[0].IPAddress
    Write-Host "🌐 Local IP detected: $localIP" -ForegroundColor Cyan
} catch {
    $localIP = "localhost"
    Write-Host "⚠️  Could not detect local IP, using localhost" -ForegroundColor Yellow
}

# Set environment variables for cross-machine access
$env:NEXT_PUBLIC_OLLAMA_HOST = $localIP
$env:NEXT_PUBLIC_OLLAMA_PORT = "11434"
$env:NEXT_PUBLIC_OLLAMA_PROTOCOL = "http"

Write-Host "🔧 Environment Configuration:" -ForegroundColor Yellow
Write-Host "   OLLAMA_HOST: $env:NEXT_PUBLIC_OLLAMA_HOST" -ForegroundColor Gray
Write-Host "   OLLAMA_PORT: $env:NEXT_PUBLIC_OLLAMA_PORT" -ForegroundColor Gray

# Check if Ollama is running
Write-Host "🔍 Checking Ollama service..." -ForegroundColor Blue
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://${localIP}:11434/api/tags" -TimeoutSec 5
    Write-Host "✅ Ollama service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama service not accessible. Starting instructions:" -ForegroundColor Red
    Write-Host "   1. Set environment: `$env:OLLAMA_HOST='0.0.0.0'" -ForegroundColor Yellow
    Write-Host "   2. Start Ollama: ollama serve" -ForegroundColor Yellow
    Write-Host "   3. Or run: OLLAMA_HOST=0.0.0.0 ollama serve" -ForegroundColor Yellow
}

# Start Next.js development server
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green
Write-Host "📱 Dashboard will be available at:" -ForegroundColor Cyan
Write-Host "   Local:   http://localhost:3000" -ForegroundColor Gray
Write-Host "   Network: http://${localIP}:3000" -ForegroundColor Gray

# Run the development server
npm run dev:network -- --port 3000
