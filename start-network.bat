@echo off
echo Starting Ollama with network access...
set OLLAMA_HOST=0.0.0.0
set OLLAMA_ORIGINS=*
start /b ollama serve

echo Waiting for Ollama to start...
timeout /t 5 /nobreak > nul

echo Starting Next.js development server...
cd /d "c:\Users\joaoc\OneDrive\Desktop\Starting.over\projects\ai\rag\miele\dashboard"
set NEXT_PUBLIC_OLLAMA_HOST=localhost
set NEXT_PUBLIC_OLLAMA_PORT=11434
set NEXT_PUBLIC_OLLAMA_PROTOCOL=http
npm run dev:network -- --port 3000
