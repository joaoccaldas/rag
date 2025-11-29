# 🌐 Network Access Quick Reference

## Your Network Configuration

**Your Computer's IP:** `192.168.86.31`
**Dashboard Port:** `3000`
**Ollama Port:** `11434`

---

## 🚀 Quick Start Options

### Option 1: View-Only Access (Simple, Secure) ✅

**On host computer, run:**
```powershell
npm run dev:network
```

**Access from any device:**
- Dashboard: `http://192.168.86.31:3000`

**Works:**
- ✅ View dashboard UI
- ✅ Browse documents (already uploaded)
- ✅ View analytics
- ✅ Navigate pages

**Doesn't Work:**
- ❌ Chat (needs Ollama)
- ❌ Upload/process documents (needs Ollama for embeddings)
- ❌ RAG search (needs Ollama for query embeddings)

---

### Option 2: Full Access (Requires Ollama Network Setup) 🔧

**On host computer, run:**
```powershell
.\start-network-full.ps1
```

This will:
1. Start Ollama with network access (0.0.0.0:11434)
2. Update .env.local with your current IP
3. Start Next.js with network access (0.0.0.0:3000)

**Access from any device:**
- Dashboard: `http://192.168.86.31:3000`
- Ollama API: `http://192.168.86.31:11434`

**Works:**
- ✅ Everything! Full functionality
- ✅ Chat with AI
- ✅ Upload and process documents
- ✅ RAG search with semantic caching
- ✅ All AI features

**⚠️ Security Note:** Only use on trusted private networks!

---

## 🔍 Troubleshooting

### Can't Access from Other Device?

1. **Check firewall:**
   ```powershell
   # Allow Next.js
   netsh advfirewall firewall add rule name="Next.js Dev" dir=in action=allow protocol=TCP localport=3000
   
   # Allow Ollama (if using Option 2)
   netsh advfirewall firewall add rule name="Ollama" dir=in action=allow protocol=TCP localport=11434
   ```

2. **Verify both devices on same network:**
   - Check WiFi network name matches
   - Check IP range (should be 192.168.86.x)

3. **Test connectivity:**
   ```powershell
   # From other device, ping host
   ping 192.168.86.31
   ```

### IP Address Changed?

Your IP might change if:
- Router restarts
- Computer reconnects to WiFi
- DHCP lease expires

**Get current IP:**
```powershell
ipconfig | findstr /i "IPv4"
```

**Update configuration:**
1. Stop services (Ctrl+C)
2. Update IP in `.env.local`
3. Restart with `.\start-network-full.ps1`

---

## 📱 Mobile Access

**Works great on:**
- iPads/tablets
- Smartphones
- Other laptops
- Any device with a web browser

**To test:**
1. Connect device to same WiFi
2. Open browser
3. Go to: `http://192.168.86.31:3000`
4. Bookmark for easy access!

---

## 🎯 Recommended Setup

**For most users:**
1. Use **Option 1** (view-only) for security
2. Process documents on host computer
3. View/browse from other devices

**For full access:**
1. Use **Option 2** on trusted home networks only
2. Disable when not needed
3. Consider VPN for remote access

---

## 📊 Performance Notes

**Local Access (localhost:3000):**
- Speed: ⚡⚡⚡⚡⚡ (instant)
- Best for: Document processing, heavy workloads

**Network Access (192.168.86.31:3000):**
- Speed: ⚡⚡⚡⚡ (very fast on good WiFi)
- Best for: Browsing, viewing, light queries

**Semantic Cache:**
- Works on all devices!
- Cached queries: ~50ms response time
- Non-cached: ~2000ms (still uses network Ollama)

---

## 🔐 Security Best Practices

1. **Only on private networks** - Never expose on public WiFi
2. **Disable when not needed** - Stop servers when done
3. **Use strong WiFi password** - Protect your network
4. **Monitor access** - Check console logs for connections
5. **Consider authentication** - Add login if sharing widely

---

## 📝 Current Status

- ✅ Next.js server: Running on network
- ⏹️ Ollama: Local only (needs Option 2 for network)
- 🌐 Access URL: http://192.168.86.31:3000
- 🔒 Security: View-only (safe)

**To upgrade to full access:** Run `.\start-network-full.ps1`
