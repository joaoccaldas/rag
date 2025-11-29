const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Caldas Dashboard Server...\n');

// Change to dashboard directory
process.chdir(__dirname);

console.log('📁 Current directory:', process.cwd());
console.log('📦 Starting Next.js development server...\n');

// Start the development server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`\n🔄 Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️ Stopping server...');
  server.kill();
  process.exit();
});

console.log('🌐 Server should be available at: http://localhost:3000');
console.log('💡 Press Ctrl+C to stop the server\n');
