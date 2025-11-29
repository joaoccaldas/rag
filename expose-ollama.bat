@echo off
echo =====================================
echo   Exposing Ollama to Local Network
echo =====================================
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr "192.168"') do (
    set IP=%%a
)
set IP=%IP:~1%

echo Your IP: %IP%
echo Ollama will be at: http://%IP%:11434
echo.
echo WARNING: This exposes Ollama to your network!
echo Only use on trusted private networks.
echo.
echo Press Ctrl+C to stop
echo.

REM Set environment variable and start Ollama
set OLLAMA_HOST=0.0.0.0:11434
ollama serve
