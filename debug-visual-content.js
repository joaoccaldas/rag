// Debug script to check visual content data structure
console.log('=== Visual Content Storage Debug ===')

// Check if we can access localStorage (this won't work in Node.js, needs browser)
if (typeof localStorage !== 'undefined') {
  const visualContent = localStorage.getItem('rag_visual_content')
  if (visualContent) {
    const data = JSON.parse(visualContent)
    console.log('Visual content items:', data.length)
    if (data.length > 0) {
      console.log('First item structure:', JSON.stringify(data[0], null, 2))
    }
  } else {
    console.log('No visual content in localStorage')
  }
} else {
  console.log('localStorage not available (running in Node.js)')
}

// Check for file-based storage
const fs = require('fs')
const path = require('path')

const storagePath = path.join(__dirname, 'visual-content-storage')
const imagesPath = path.join(storagePath, 'images')

console.log('\n=== File System Storage ===')
console.log('Storage path:', storagePath)
console.log('Images path:', imagesPath)

try {
  if (fs.existsSync(storagePath)) {
    console.log('✅ Storage directory exists')
    const contents = fs.readdirSync(storagePath)
    console.log('Storage contents:', contents)
    
    if (fs.existsSync(imagesPath)) {
      console.log('✅ Images directory exists')
      const images = fs.readdirSync(imagesPath)
      console.log('Images found:', images.length)
      if (images.length > 0) {
        console.log('First few images:', images.slice(0, 5))
      }
    } else {
      console.log('❌ Images directory does not exist')
    }
  } else {
    console.log('❌ Storage directory does not exist')
  }
} catch (error) {
  console.error('Error checking storage:', error.message)
}
