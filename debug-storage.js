// Debug script to check visual content storage and create missing directories
console.log('🔍 Visual Content Storage Diagnostic')

// Check current working directory
console.log('📁 Current directory:', process.cwd())

// Check if storage directories exist
const path = require('path')
const fs = require('fs').promises

const STORAGE_BASE_PATH = path.join(process.cwd(), 'visual-content-storage')
const THUMBNAILS_PATH = path.join(STORAGE_BASE_PATH, 'thumbnails')
const FULL_IMAGES_PATH = path.join(STORAGE_BASE_PATH, 'images')

async function checkAndCreateDirectories() {
  try {
    console.log('📂 Checking storage paths:')
    console.log('  Base:', STORAGE_BASE_PATH)
    console.log('  Thumbnails:', THUMBNAILS_PATH)
    console.log('  Images:', FULL_IMAGES_PATH)
    
    // Create directories
    await fs.mkdir(STORAGE_BASE_PATH, { recursive: true })
    await fs.mkdir(THUMBNAILS_PATH, { recursive: true })
    await fs.mkdir(FULL_IMAGES_PATH, { recursive: true })
    
    console.log('✅ Created storage directories')
    
    // List contents
    const baseContents = await fs.readdir(STORAGE_BASE_PATH, { withFileTypes: true })
    console.log('📋 Storage directory contents:', baseContents.map(d => d.name))
    
    // Check for any existing files
    const thumbFiles = await fs.readdir(THUMBNAILS_PATH)
    const imageFiles = await fs.readdir(FULL_IMAGES_PATH)
    
    console.log(`📊 Found ${thumbFiles.length} thumbnail files, ${imageFiles.length} image files`)
    
    if (thumbFiles.length > 0) {
      console.log('🖼️ Thumbnail files:', thumbFiles.slice(0, 5))
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAndCreateDirectories()
