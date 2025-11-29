@echo off
REM Ollama Service Auto-Start Script for Windows
REM Automatically detects and starts Ollama with available models

echo 🔍 Checking Ollama service status...

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Ollama service is already running
    echo 📋 Checking available models...
    curl -s http://localhost:11434/api/tags
    goto :end
)

echo 🚀 Starting Ollama service...

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama not found. Please install from https://ollama.ai
    echo 📥 Download: https://ollama.ai/download
    pause
    exit /b 1
)

REM Start Ollama service
echo ⏳ Starting service...
start /B ollama serve

REM Wait for service to start
timeout /t 5 /nobreak >nul

REM Check if service started
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Ollama service started successfully!
    
    REM Check for available models
    echo 📋 Checking for available models...
    for /f "tokens=*" %%i in ('curl -s http://localhost:11434/api/tags ^| findstr "name"') do (
        echo Found model: %%i
        set "models_found=true"
    )
    
    if not defined models_found (
        echo 📥 No models found. Installing recommended model...
        echo 🔄 This may take several minutes...
        
        REM Try to pull lightweight models in order of preference
        ollama pull llama3.1:8b
        if %errorlevel% neq 0 (
            ollama pull llama3:8b
            if %errorlevel% neq 0 (
                ollama pull llama2:7b
                if %errorlevel% neq 0 (
                    echo ❌ Failed to pull any models. Please manually install:
                    echo    ollama pull llama3.1:8b
                ) else (
                    echo ✅ Model llama2:7b installed successfully!
                )
            ) else (
                echo ✅ Model llama3:8b installed successfully!
            )
        ) else (
            echo ✅ Model llama3.1:8b installed successfully!
        )
    )
) else (
    echo ❌ Failed to start Ollama service
    echo 📋 Please check if port 11434 is available
    pause
    exit /b 1
)

echo 🎉 Setup complete! Ollama is ready at http://localhost:11434

:end
echo.
echo 💡 You can now start your development server:
echo    npm run dev
echo.
pause
