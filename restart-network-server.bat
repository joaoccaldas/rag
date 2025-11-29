@echo off
echo Restarting Next.js development server with network configuration...

REM Kill any existing Node.js processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 3 /nobreak > nul

REM Set environment variables for network access
set NEXT_PUBLIC_OLLAMA_HOST=192.168.86.23
set NEXT_PUBLIC_OLLAMA_PORT=11434
set NEXT_PUBLIC_OLLAMA_PROTOCOL=http

echo Starting development server with network access...
echo Dashboard will be available at:
echo   Local:   http://localhost:3000
echo   Network: http://192.168.86.23:3000

REM Start the development server
npm run dev:network -- --port 3000
