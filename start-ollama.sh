#!/bin/bash
# Ollama Service Auto-Start Script
# Automatically detects and starts Ollama with available models

echo "🔍 Checking Ollama service status..."

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama service is already running"
    
    # List available models
    echo "📋 Available models:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4
    
    exit 0
fi

echo "🚀 Starting Ollama service..."

# Start Ollama service in background
if command -v ollama > /dev/null 2>&1; then
    # Start service
    nohup ollama serve > ollama.log 2>&1 &
    
    echo "⏳ Waiting for service to start..."
    sleep 5
    
    # Check if service started
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service started successfully!"
        
        # Check for models
        models=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        
        if [ -z "$models" ]; then
            echo "📥 No models found. Pulling recommended model..."
            echo "🔄 This may take several minutes..."
            
            # Try to pull a lightweight model
            if ollama pull llama3.1:8b; then
                echo "✅ Model llama3.1:8b installed successfully!"
            elif ollama pull llama3:8b; then
                echo "✅ Model llama3:8b installed successfully!"
            elif ollama pull llama2:7b; then
                echo "✅ Model llama2:7b installed successfully!"
            else
                echo "❌ Failed to pull any models. Please manually install a model:"
                echo "   ollama pull llama3.1:8b"
            fi
        else
            echo "📋 Available models:"
            echo "$models"
        fi
    else
        echo "❌ Failed to start Ollama service"
        echo "📋 Check the log file: ollama.log"
        exit 1
    fi
else
    echo "❌ Ollama not found. Please install from https://ollama.ai"
    echo "📥 Download: https://ollama.ai/download"
    exit 1
fi

echo "🎉 Setup complete! Ollama is ready at http://localhost:11434"
