#!/bin/bash

# Network Development Setup Script
# Configures the RAG dashboard for cross-machine network access

echo "🚀 Starting RAG Dashboard Network Setup..."

# Get the machine's IP address
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    MACHINE_IP=$(ipconfig | grep -A 5 "Ethernet adapter" | grep "IPv4 Address" | cut -d: -f2 | tr -d ' ')
    if [ -z "$MACHINE_IP" ]; then
        MACHINE_IP=$(ipconfig | grep -A 5 "Wireless LAN adapter" | grep "IPv4 Address" | cut -d: -f2 | tr -d ' ')
    fi
else
    # Linux/Mac
    MACHINE_IP=$(hostname -I | awk '{print $1}')
fi

echo "📍 Detected machine IP: $MACHINE_IP"

# Check if Ollama is running
echo "🔍 Checking Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running on localhost:11434"
else
    echo "❌ Ollama is not running on localhost:11434"
    echo "   Please start Ollama with: ollama serve"
    exit 1
fi

# Configure Ollama for network access (if needed)
echo "🌐 Configuring Ollama for network access..."

# Check if we can access Ollama from the network IP
if curl -s "http://$MACHINE_IP:11434/api/tags" > /dev/null 2>&1; then
    echo "✅ Ollama is already accessible from network"
    export NEXT_PUBLIC_OLLAMA_HOST="$MACHINE_IP"
else
    echo "⚠️  Ollama not accessible from network. Setting up..."
    echo "   To enable network access, run:"
    echo "   set OLLAMA_HOST=0.0.0.0:11434 && ollama serve"
    echo "   or"
    echo "   set OLLAMA_HOST=$MACHINE_IP:11434 && ollama serve"
    
    # Use localhost as fallback
    export NEXT_PUBLIC_OLLAMA_HOST="localhost"
fi

# Create or update .env.local
echo "📝 Updating environment configuration..."
cat > .env.local << EOF
# Network Development Configuration
NEXT_PUBLIC_OLLAMA_HOST=$NEXT_PUBLIC_OLLAMA_HOST
NEXT_PUBLIC_OLLAMA_PORT=11434
NEXT_PUBLIC_OLLAMA_PROTOCOL=http

# Debug mode for network troubleshooting
NEXT_PUBLIC_DEBUG_MODE=true

# RAG System Configuration
NEXT_PUBLIC_MAX_PER_DOCUMENT=3
NEXT_PUBLIC_VECTOR_THRESHOLD=0.1
NEXT_PUBLIC_SEARCH_LIMIT=5
EOF

echo "✅ Environment configured"

# Start the development server with network binding
echo "🎯 Starting Next.js development server..."
echo "   Server will be accessible at:"
echo "   - Local: http://localhost:3000"
echo "   - Network: http://$MACHINE_IP:3000"
echo ""

# Check available ports
PORT=3000
while netstat -an | grep ":$PORT " > /dev/null 2>&1; do
    echo "⚠️  Port $PORT is busy, trying $((PORT+1))..."
    PORT=$((PORT+1))
done

echo "🚀 Starting server on port $PORT..."

# Start Next.js with host binding for network access
npm run dev -- --hostname 0.0.0.0 --port $PORT
