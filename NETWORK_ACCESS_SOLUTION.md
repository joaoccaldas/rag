# Network Access Solution Guide

## Problem Summary
- Dashboard accessible locally but not from other machines on the network
- Ollama service returning 403 Forbidden for external connections
- Proxy route returning 404 Not Found

## Complete Solution

### Step 1: Configure Ollama for Network Access

**Option A: Command Line (Recommended)**
```powershell
# Open PowerShell as Administrator
$env:OLLAMA_HOST='0.0.0.0'
$env:OLLAMA_ORIGINS='*'
ollama serve
```

**Option B: Batch File**
```batch
# Run the provided batch file
start-network.bat
```

**Option C: PowerShell Script**
```powershell
# Run the comprehensive setup script
powershell -ExecutionPolicy Bypass -File "scripts\start-complete-network.ps1"
```

### Step 2: Start Next.js Development Server

After Ollama is running:
```bash
cd dashboard
npm run dev:network -- --port 3000
```

### Step 3: Test Network Access

From another machine on the same network:
- Replace `YOUR_IP` with your actual local IP address
- Dashboard: `http://YOUR_IP:3000`
- Ollama API: `http://YOUR_IP:11434/api/tags`
- Proxy Route: `http://YOUR_IP:3000/api/ollama-proxy?endpoint=/api/tags`

### Step 4: Find Your Local IP Address

**Windows:**
```powershell
ipconfig | findstr "IPv4"
```

**Or use the auto-detection script:**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*"})[0].IPAddress
```

## Environment Variables Set

### Ollama Configuration
- `OLLAMA_HOST=0.0.0.0` (Listen on all interfaces)
- `OLLAMA_ORIGINS=*` (Allow all origins)

### Next.js Configuration
- `NEXT_PUBLIC_OLLAMA_HOST=YOUR_LOCAL_IP`
- `NEXT_PUBLIC_OLLAMA_PORT=11434`
- `NEXT_PUBLIC_OLLAMA_PROTOCOL=http`

## Troubleshooting

### If Ollama Still Returns 403
1. Check Windows Firewall settings
2. Ensure Ollama service restarted with new environment variables
3. Try accessing from localhost first: `http://localhost:11434/api/tags`

### If Next.js Server Not Accessible
1. Check if port 3000 is blocked by firewall
2. Ensure server started with `--hostname 0.0.0.0`
3. Try accessing from localhost first: `http://localhost:3000`

### If Proxy Route Returns 404
1. Restart the development server
2. Check that the file exists at `src/app/api/ollama-proxy/route.ts`
3. Clear Next.js cache: `rm -rf .next`

## Quick Start Commands

**Terminal 1 (Ollama):**
```powershell
$env:OLLAMA_HOST='0.0.0.0'; $env:OLLAMA_ORIGINS='*'; ollama serve
```

**Terminal 2 (Next.js):**
```bash
cd dashboard
$env:NEXT_PUBLIC_OLLAMA_HOST='YOUR_LOCAL_IP'
npm run dev:network -- --port 3000
```

## Files Modified for Network Access

1. `.vscode/tasks.json` - Updated dev server task
2. `next.config.js` - Added CORS headers and rewrites
3. `src/app/api/ollama-proxy/route.ts` - Created proxy endpoint
4. `src/utils/ollama-host-resolver.ts` - Dynamic host resolution
5. `src/contexts/AISettingsContext.tsx` - Fallback connection logic
6. `scripts/start-complete-network.ps1` - Automated setup
7. `start-network.bat` - Simple batch startup

## Testing Access

Once both services are running, test from another machine:

```bash
# Test Ollama directly
curl http://YOUR_IP:11434/api/tags

# Test proxy route
curl http://YOUR_IP:3000/api/ollama-proxy?endpoint=/api/tags

# Test dashboard
# Open browser to: http://YOUR_IP:3000
```

## Success Indicators

✅ Ollama API responds with model list
✅ Dashboard loads without connection errors
✅ AI chat functionality works from remote machine
✅ File upload and analysis works cross-network
