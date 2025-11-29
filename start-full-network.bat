@echo off
echo ============================================
echo   RAG Dashboard - Complete Network Setup
echo ============================================
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr "192.168"') do (
    set IP=%%a
)
set IP=%IP:~1%

echo Your Network IP: %IP%
echo.
echo Dashboard: http://%IP%:3000
echo Ollama:    http://%IP%:11434
echo.
echo WARNING: Exposes services to local network!
echo Only use on trusted private networks.
echo.
echo ============================================
echo.

REM Check if Ollama is already running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Ollama is already running
) else (
    echo Starting Ollama with network access...
    start "Ollama Network" cmd /k "set OLLAMA_HOST=0.0.0.0:11434 && ollama serve"
    timeout /t 3 /nobreak >nul
)

echo.
echo Starting Next.js dashboard...
echo.
npm run dev:network
