@echo off
echo Network Development Server Restart
echo ===================================

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo Setting environment variables...
set NEXT_PUBLIC_OLLAMA_HOST=192.168.86.23
set NEXT_PUBLIC_OLLAMA_PORT=11434
set NEXT_PUBLIC_OLLAMA_PROTOCOL=http
set NEXT_PUBLIC_DEBUG_NETWORK=true

echo Environment Configuration:
echo   OLLAMA_HOST: %NEXT_PUBLIC_OLLAMA_HOST%
echo   OLLAMA_PORT: %NEXT_PUBLIC_OLLAMA_PORT%
echo   DEBUG: %NEXT_PUBLIC_DEBUG_NETWORK%

echo.
echo Starting development server...
echo Dashboard will be available at:
echo   Local:   http://localhost:3000
echo   Network: http://192.168.86.23:3000

npm run dev:network -- --port 3000
