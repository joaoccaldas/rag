# Expose Ollama to Network
# Simple script to start Ollama with network access

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Exposing Ollama to Local Network  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "^192\.168\." }).IPAddress
Write-Host "Your IP: $localIP" -ForegroundColor Green
Write-Host "Ollama will be accessible at: http://$localIP:11434" -ForegroundColor Green
Write-Host ""

Write-Host "WARNING: This exposes Ollama to your local network!" -ForegroundColor Yellow
Write-Host "Only proceed on trusted private networks." -ForegroundColor Yellow
Write-Host ""

# Set environment variable to expose Ollama
$env:OLLAMA_HOST = "0.0.0.0:11434"

Write-Host "Starting Ollama service..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start Ollama
ollama serve
