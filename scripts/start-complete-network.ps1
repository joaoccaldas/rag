#!/usr/bin/env pwsh

# Complete Network Development Environment Startup
# Configures and starts both Ollama and Next.js for cross-machine access

param(
    [switch]$SkipOllama,
    [switch]$OllamaOnly,
    [int]$Port = 3000
)

Write-Host "🌟 Starting Complete Network Development Environment" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Magenta

# Get local IP address
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"})[0].IPAddress
    Write-Host "🌐 Local IP detected: $localIP" -ForegroundColor Cyan
} catch {
    $localIP = "192.168.1.100"  # fallback
    Write-Host "⚠️  Could not detect local IP, using fallback: $localIP" -ForegroundColor Yellow
}

# Function to test port availability
function Test-Port {
    param($Host, $Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ConnectAsync($Host, $Port).Wait(1000)
        $result = $tcpClient.Connected
        $tcpClient.Close()
        return $result
    } catch {
        return $false
    }
}

# Configure Ollama if not skipped
if (-not $SkipOllama) {
    Write-Host "`n🔧 STEP 1: Configuring Ollama Service" -ForegroundColor Green
    Write-Host "-" * 40 -ForegroundColor Green
    
    # Kill existing Ollama processes
    $ollamaProcesses = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    if ($ollamaProcesses) {
        Write-Host "🛑 Stopping existing Ollama processes..." -ForegroundColor Yellow
        Stop-Process -Name "ollama" -Force
        Start-Sleep -Seconds 3
    }
    
    # Set environment variables
    $env:OLLAMA_HOST = "0.0.0.0"
    $env:OLLAMA_ORIGINS = "*"
    
    Write-Host "🌐 Ollama Configuration:" -ForegroundColor Cyan
    Write-Host "   OLLAMA_HOST: $env:OLLAMA_HOST" -ForegroundColor Gray
    Write-Host "   OLLAMA_ORIGINS: $env:OLLAMA_ORIGINS" -ForegroundColor Gray
    
    # Start Ollama
    Write-Host "🚀 Starting Ollama service..." -ForegroundColor Blue
    Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow
    
    # Wait and test Ollama
    Write-Host "⏳ Testing Ollama connectivity..." -ForegroundColor Yellow
    $ollamaReady = $false
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
            Write-Host "✅ Ollama local access: SUCCESS" -ForegroundColor Green
            
            # Test network access
            try {
                $networkResponse = Invoke-RestMethod -Uri "http://${localIP}:11434/api/tags" -TimeoutSec 3
                Write-Host "✅ Ollama network access: SUCCESS" -ForegroundColor Green
                $ollamaReady = $true
            } catch {
                Write-Host "⚠️  Ollama network access: FAILED (may work from other machines)" -ForegroundColor Yellow
                $ollamaReady = $true  # Still proceed
            }
            break
        } catch {
            Write-Host "⏳ Attempt $i/15 - waiting for Ollama..." -ForegroundColor Gray
        }
    }
    
    if (-not $ollamaReady) {
        Write-Host "❌ Ollama failed to start properly" -ForegroundColor Red
        Write-Host "💡 Manual command: `$env:OLLAMA_HOST='0.0.0.0'; `$env:OLLAMA_ORIGINS='*'; ollama serve" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping Ollama configuration" -ForegroundColor Gray
}

# Exit if Ollama-only mode
if ($OllamaOnly) {
    Write-Host "`n✅ Ollama-only mode complete. Service should be accessible at:" -ForegroundColor Green
    Write-Host "   Local:   http://localhost:11434" -ForegroundColor Cyan
    Write-Host "   Network: http://${localIP}:11434" -ForegroundColor Cyan
    return
}

# Configure Next.js
Write-Host "`n🔧 STEP 2: Configuring Next.js Development Server" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green

# Set Next.js environment variables
$env:NEXT_PUBLIC_OLLAMA_HOST = $localIP
$env:NEXT_PUBLIC_OLLAMA_PORT = "11434"
$env:NEXT_PUBLIC_OLLAMA_PROTOCOL = "http"

Write-Host "🌐 Next.js Configuration:" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_OLLAMA_HOST: $env:NEXT_PUBLIC_OLLAMA_HOST" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_OLLAMA_PORT: $env:NEXT_PUBLIC_OLLAMA_PORT" -ForegroundColor Gray

# Kill existing Node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "🛑 Stopping existing Node.js processes..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force
    Start-Sleep -Seconds 2
}

# Check if port is available
if (Test-Port -Host "localhost" -Port $Port) {
    Write-Host "⚠️  Port $Port is in use. Trying to free it..." -ForegroundColor Yellow
    $portProcess = netstat -ano | Select-String ":$Port " | Select-Object -First 1
    if ($portProcess) {
        $pid = ($portProcess -split '\s+')[-1]
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Blue
Write-Host "📱 Dashboard will be available at:" -ForegroundColor Cyan
Write-Host "   Local:   http://localhost:$Port" -ForegroundColor Gray
Write-Host "   Network: http://${localIP}:$Port" -ForegroundColor Gray

Write-Host "`n🌟 COMPLETE SETUP SUMMARY" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Magenta
Write-Host "Ollama API:    http://${localIP}:11434" -ForegroundColor Cyan
Write-Host "Dashboard:     http://${localIP}:$Port" -ForegroundColor Cyan
Write-Host "Proxy Route:   http://${localIP}:$Port/api/ollama-proxy" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Magenta

# Start the development server
npm run dev:network -- --port $Port
