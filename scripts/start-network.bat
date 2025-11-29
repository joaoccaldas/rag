@echo off
REM Network Development Setup Script for Windows
REM Configures the RAG dashboard for cross-machine network access

echo 🚀 Starting RAG Dashboard Network Setup...

REM Get the machine's IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set MACHINE_IP=%%a
    goto :found_ip
)

:found_ip
set MACHINE_IP=%MACHINE_IP: =%
echo 📍 Detected machine IP: %MACHINE_IP%

REM Check if Ollama is running
echo 🔍 Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama is running on localhost:11434
) else (
    echo ❌ Ollama is not running on localhost:11434
    echo    Please start Ollama with: ollama serve
    pause
    exit /b 1
)

REM Configure Ollama for network access
echo 🌐 Configuring Ollama for network access...

curl -s "http://%MACHINE_IP%:11434/api/tags" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama is already accessible from network
    set NEXT_PUBLIC_OLLAMA_HOST=%MACHINE_IP%
) else (
    echo ⚠️  Ollama not accessible from network. Setting up...
    echo    To enable network access, run in another terminal:
    echo    set OLLAMA_HOST=0.0.0.0:11434 ^&^& ollama serve
    echo    or
    echo    set OLLAMA_HOST=%MACHINE_IP%:11434 ^&^& ollama serve
    echo.
    set NEXT_PUBLIC_OLLAMA_HOST=localhost
)

REM Create or update .env.local
echo 📝 Updating environment configuration...
(
echo # Network Development Configuration
echo NEXT_PUBLIC_OLLAMA_HOST=%NEXT_PUBLIC_OLLAMA_HOST%
echo NEXT_PUBLIC_OLLAMA_PORT=11434
echo NEXT_PUBLIC_OLLAMA_PROTOCOL=http
echo.
echo # Debug mode for network troubleshooting
echo NEXT_PUBLIC_DEBUG_MODE=true
echo.
echo # RAG System Configuration
echo NEXT_PUBLIC_MAX_PER_DOCUMENT=3
echo NEXT_PUBLIC_VECTOR_THRESHOLD=0.1
echo NEXT_PUBLIC_SEARCH_LIMIT=5
) > .env.local

echo ✅ Environment configured

REM Find available port
set PORT=3000
:check_port
netstat -an | findstr ":%PORT% " >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port %PORT% is busy, trying %PORT%+1...
    set /a PORT+=1
    goto :check_port
)

echo 🎯 Starting Next.js development server...
echo    Server will be accessible at:
echo    - Local: http://localhost:%PORT%
echo    - Network: http://%MACHINE_IP%:%PORT%
echo.

echo 🚀 Starting server on port %PORT%...

REM Start Next.js with host binding for network access
npm run dev -- --hostname 0.0.0.0 --port %PORT%

pause
