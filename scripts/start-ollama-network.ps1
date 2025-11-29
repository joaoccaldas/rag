#!/usr/bin/env pwsh

# Ollama Network Configuration Script
# Configures Ollama service for cross-machine access

Write-Host "🔧 Configuring Ollama for Network Access..." -ForegroundColor Green

# Get local IP address
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"})[0].IPAddress
    Write-Host "🌐 Local IP detected: $localIP" -ForegroundColor Cyan
} catch {
    $localIP = "0.0.0.0"
    Write-Host "⚠️  Could not detect local IP, using 0.0.0.0" -ForegroundColor Yellow
}

# Check if Ollama is currently running
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "🛑 Stopping existing Ollama process..." -ForegroundColor Yellow
    Stop-Process -Name "ollama" -Force
    Start-Sleep -Seconds 3
}

# Set environment variables for network access
$env:OLLAMA_HOST = "0.0.0.0"
$env:OLLAMA_ORIGINS = "*"

Write-Host "🌐 Network Configuration:" -ForegroundColor Cyan
Write-Host "   OLLAMA_HOST: $env:OLLAMA_HOST" -ForegroundColor Gray
Write-Host "   OLLAMA_ORIGINS: $env:OLLAMA_ORIGINS" -ForegroundColor Gray

# Start Ollama with network configuration
Write-Host "🚀 Starting Ollama with network access..." -ForegroundColor Green
Write-Host "📡 Ollama will be available at:" -ForegroundColor Cyan
Write-Host "   Local:   http://localhost:11434" -ForegroundColor Gray
Write-Host "   Network: http://${localIP}:11434" -ForegroundColor Gray

# Start Ollama server
Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow

# Wait for service to start
Write-Host "⏳ Waiting for Ollama service to start..." -ForegroundColor Yellow
$attempts = 0
$maxAttempts = 10

do {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
        Write-Host "✅ Ollama service is running and accessible!" -ForegroundColor Green
        
        # Test network access
        try {
            $networkResponse = Invoke-RestMethod -Uri "http://${localIP}:11434/api/tags" -TimeoutSec 3
            Write-Host "✅ Ollama network access confirmed!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Ollama may not be accessible from other machines" -ForegroundColor Yellow
        }
        
        break
    } catch {
        Write-Host "⏳ Attempt $attempts/$maxAttempts - waiting for Ollama..." -ForegroundColor Gray
    }
} while ($attempts -lt $maxAttempts)

if ($attempts -eq $maxAttempts) {
    Write-Host "❌ Failed to start Ollama service. Please check installation." -ForegroundColor Red
    Write-Host "💡 Manual start command: `$env:OLLAMA_HOST='0.0.0.0'; ollama serve" -ForegroundColor Yellow
}
