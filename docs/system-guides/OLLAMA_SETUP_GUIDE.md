# 🚀 Ollama Setup Guide for Caldas Analytics Dashboard

## Current Status
The Caldas Analytics Dashboard is fully functional, but the AI chat features require Ollama to be installed and running.

## Quick Install (Windows)

### 1. Download and Install Ollama
```powershell
# Download Ollama installer
$url = "https://ollama.com/download/windows"
$output = "$env:TEMP\OllamaSetup.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Run installer (requires admin)
Start-Process -FilePath $output -Wait
```

### 2. Install Required Models
```bash
# Open Command Prompt or PowerShell and run:
ollama pull llama3:latest        # Main chat model (4.7GB)
ollama pull mistral:latest       # Alternative model (4.1GB)  
ollama pull nomic-embed-text     # For document embeddings
```

### 3. Start Ollama Service
```bash
# Start Ollama (runs on localhost:11434)
ollama serve
```

### 4. Verify Installation
```bash
# Test API endpoint
curl http://localhost:11434/api/tags

# Should return JSON with installed models
```

## Alternative: Docker Installation
```bash
# Run Ollama in Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Pull models
docker exec -it ollama ollama pull llama3:latest
docker exec -it ollama ollama pull mistral:latest
```

## Environment Configuration

Create `.env.local` file in dashboard root:
```env
# Ollama Configuration
NEXT_PUBLIC_OLLAMA_HOST=localhost
NEXT_PUBLIC_OLLAMA_PORT=11434
NEXT_PUBLIC_OLLAMA_PROTOCOL=http

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG_NETWORK=true
```

## Testing the Connection

1. **Profile System**: ✅ Already working - profile selection and landing page
2. **Document Processing**: ✅ Already working - 5 documents loaded  
3. **Chat Features**: ⚠️ Requires Ollama

After installing Ollama, the chat should show:
- ✅ Connection successful via localhost
- ✅ Model responses working
- ✅ RAG context integration

## Troubleshooting

### Connection Issues
1. **Check Ollama is running**: `netstat -an | findstr 11434`
2. **Test direct connection**: `curl http://localhost:11434/api/tags`
3. **Check Windows Firewall**: Allow port 11434
4. **Restart Ollama**: Stop and restart the service

### Model Issues
```bash
# List installed models
ollama list

# Pull missing models
ollama pull llama3:latest

# Remove corrupted models
ollama rm model-name
```

### CORS Issues (if using external host)
The dashboard includes a proxy route at `/api/ollama-proxy` that handles CORS automatically.

## Performance Tips

1. **GPU Acceleration**: Ollama automatically uses GPU if available
2. **Memory**: Each model uses 4-8GB RAM when loaded
3. **Model Selection**: 
   - `llama3:latest` - Best quality, slower
   - `mistral:latest` - Good balance of speed/quality
   - `llama3:8b` - Faster, less memory

## What Works Without Ollama

- ✅ Profile management and selection
- ✅ Document upload and processing  
- ✅ RAG search and indexing
- ✅ File management and organization
- ✅ Analytics and reporting
- ❌ AI chat responses
- ❌ AI-powered document summarization
- ❌ Smart query suggestions

The system gracefully handles Ollama unavailability with helpful error messages and installation guidance.
