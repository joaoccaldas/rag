#!/usr/bin/env node

/**
 * Quick Ollama Connection Test
 * Tests multiple connection methods to help debug connectivity
 */

console.log('🔍 OLLAMA CONNECTION TEST\n');

async function testConnection(url, name, timeout = 5000) {
  try {
    console.log(`Testing ${name}: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} SUCCESS - Models available: ${data.models?.length || 0}`);
      return true;
    } else {
      console.log(`❌ ${name} FAILED - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} ERROR:`, error.message);
    return false;
  }
}

async function runTests() {
  const tests = [
    { url: 'http://localhost:11434/api/tags', name: 'Localhost' },
    { url: 'http://127.0.0.1:11434/api/tags', name: 'Local IP' },
    { url: 'http://192.168.86.27:11434/api/tags', name: 'Network IP' },
    { url: 'http://localhost:3000/api/ollama-proxy?endpoint=/api/tags', name: 'Proxy Route' }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testConnection(test.url, test.name);
    if (success) successCount++;
    console.log(''); // spacing
  }
  
  console.log('📊 SUMMARY:');
  console.log(`✅ Successful connections: ${successCount}/${tests.length}`);
  
  if (successCount === 0) {
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Make sure Ollama is installed: curl -fsSL https://ollama.ai/install.sh | sh');
    console.log('2. Start Ollama service: ollama serve');
    console.log('3. Test manually: curl http://localhost:11434/api/tags');
    console.log('4. Install a model: ollama pull llama3:latest');
  } else {
    console.log('\n🎉 At least one connection method works!');
  }
}

// For Node.js environments that don't have fetch
if (typeof fetch === 'undefined') {
  console.log('⚠️  This script requires fetch API. Run in a browser console or Node 18+');
} else {
  runTests().catch(console.error);
}
