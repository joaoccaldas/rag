# Miele Dashboard with Ollama Integration

## Setup Instructions

### 1. Install Ollama

**Windows:**
- Download Ollama from: https://ollama.ai/download
- Run the installer and follow the setup instructions

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Start Ollama Service

After installation, start the Ollama service:

```bash
ollama serve
```

This will start Ollama on `http://localhost:11434`

### 3. Download AI Models

Download some popular models to get started:

```bash
# Llama 3.2 (recommended, smaller model)
ollama pull llama3.2

# Llama 3.1 (larger, more capable)
ollama pull llama3.1

# Code Llama (good for code-related questions)
ollama pull codellama

# Mistral (fast and efficient)
ollama pull mistral
```

### 4. Verify Installation

Check if Ollama is running and see available models:

```bash
ollama list
```

### 5. Start the Dashboard

Make sure both Ollama and the dashboard are running:

```bash
# In one terminal - start Ollama (if not already running)
ollama serve

# In another terminal - start the dashboard
npm run dev
```

## Features

### Chat Settings
Access the settings by clicking the gear icon in the chat header. You can customize:

- **AI Model**: Choose from your locally installed Ollama models
- **System Prompt**: Define the AI's role and behavior
- **Personality**: Professional, Friendly, Technical, or Casual
- **Response Style**: Concise, Detailed, or Brief
- **Temperature**: Control creativity vs consistency (0-2)
- **Max Tokens**: Limit response length (100-4000)
- **Verbose Mode**: Include reasoning in responses

### Settings Persistence
All settings are automatically saved to localStorage and persist between sessions.

## Troubleshooting

### "AI service not available" error
- Make sure Ollama is installed and running (`ollama serve`)
- Check that Ollama is accessible at `http://localhost:11434`
- Ensure you have at least one model downloaded (`ollama list`)

### Models not loading in settings
- Refresh the models list using the refresh button
- Make sure Ollama service is running
- Try pulling a model: `ollama pull llama3.2`

### Slow responses
- Try a smaller model like `llama3.2` instead of larger models
- Reduce max tokens in settings
- Lower the temperature setting
