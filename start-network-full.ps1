# 🌐 Complete Network Access Setup
# Starts both Ollama and Next.js with network access

Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🌐 Network Access Setup for RAG Dashboard   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "^192\.168\." }).IPAddress

if ($localIP) {
    Write-Host "📍 Your local IP address: $localIP" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not detect local IP. Using default..." -ForegroundColor Yellow
    $localIP = "192.168.86.31"
}

Write-Host ""
Write-Host "🎯 Access URLs:" -ForegroundColor Yellow
Write-Host "   Dashboard: http://$localIP:3000" -ForegroundColor White
Write-Host "   Ollama:    http://$localIP:11434" -ForegroundColor White
Write-Host ""

# Warning about security
Write-Host "⚠️  SECURITY WARNING" -ForegroundColor Red
Write-Host "   This will expose your services to the local network." -ForegroundColor Yellow
Write-Host "   Only proceed if you're on a trusted private network!" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Step 1: Start Ollama with network access
Write-Host ""
Write-Host "1️⃣  Starting Ollama with network access..." -ForegroundColor Cyan

# Set Ollama to listen on all interfaces
$env:OLLAMA_HOST = "0.0.0.0:11434"

# Start Ollama in background
$ollamaJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve" -PassThru -WindowStyle Minimized

Write-Host "   ⏳ Waiting for Ollama to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test Ollama connection
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Ollama running on http://0.0.0.0:11434" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ollama failed to start. Check if it's already running." -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Step 2: Update environment configuration
Write-Host ""
Write-Host "2️⃣  Updating environment configuration..." -ForegroundColor Cyan

# Update .env.local with current IP
$envContent = @"
# Network Access Configuration (Auto-generated)
NEXT_PUBLIC_OLLAMA_HOST=$localIP
NEXT_PUBLIC_OLLAMA_PORT=11434
NEXT_PUBLIC_OLLAMA_PROTOCOL=http
NEXT_PUBLIC_DEBUG_NETWORK=true

# RAG Enhancement Features
NEXT_PUBLIC_USE_SEMANTIC_CHUNKING=true
NEXT_PUBLIC_USE_ENHANCED_SEARCH=true

# Development flags
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES=false

# Search Configuration
NEXT_PUBLIC_MAX_PER_DOCUMENT=3
NEXT_PUBLIC_VECTOR_THRESHOLD=0.1
NEXT_PUBLIC_SEARCH_LIMIT=5
NEXT_PUBLIC_MAX_FEEDBACK_BOOST=0.1
NEXT_PUBLIC_CACHE_TIMEOUT=300000
NEXT_PUBLIC_MAX_CACHE_SIZE=1000

# UI Configuration  
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=4000
NEXT_PUBLIC_MAX_FILE_SIZE=104857600
NEXT_PUBLIC_UPLOAD_CHUNK_SIZE=1048576
NEXT_PUBLIC_ANIMATION_DURATION=300

# Analytics Configuration
NEXT_PUBLIC_MAX_ANALYTICS_ENTRIES=100
NEXT_PUBLIC_DATA_RETENTION_DAYS=30
NEXT_PUBLIC_EXCELLENT_THRESHOLD=0.9
NEXT_PUBLIC_GOOD_THRESHOLD=0.8
NEXT_PUBLIC_WARNING_THRESHOLD=0.6
NEXT_PUBLIC_SAMPLE_DATA_ENABLED=true

# Storage Configuration
NEXT_PUBLIC_DB_NAME=RAGDatabase
NEXT_PUBLIC_DB_VERSION=1
NEXT_PUBLIC_CACHE_PREFIX=rag_
NEXT_PUBLIC_COMPRESSION_ENABLED=true
"@

Set-Content -Path ".env.local" -Value $envContent
Write-Host "   ✅ Environment configured for network access" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Step 3: Start Next.js with network access
Write-Host ""
Write-Host "3️⃣  Starting Next.js dashboard..." -ForegroundColor Cyan
Write-Host "   📡 Server will be accessible at: http://$localIP:3000" -ForegroundColor Green
Write-Host ""

# Start Next.js
npm run dev:network

# Cleanup on exit (if script is interrupted)
Write-Host ""
Write-Host "Shutting down services..." -ForegroundColor Yellow
if ($ollamaJob -and !$ollamaJob.HasExited) {
    Stop-Process -Id $ollamaJob.Id -Force
    Write-Host "   Ollama stopped" -ForegroundColor Green
}
Write-Host "   Next.js stopped" -ForegroundColor Green
