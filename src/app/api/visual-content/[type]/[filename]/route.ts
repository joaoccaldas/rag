import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Simple MIME type detection
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.ico': 'image/x-icon'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Storage paths (should match file-system-visual-storage.ts)
const STORAGE_BASE_PATH = process.env['NEXT_PUBLIC_VISUAL_STORAGE_PATH'] || 
  path.join(process.cwd(), 'visual-content-storage')

const THUMBNAILS_PATH = path.join(STORAGE_BASE_PATH, 'thumbnails')
const FULL_IMAGES_PATH = path.join(STORAGE_BASE_PATH, 'images')

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; filename: string } }
) {
  try {
    const { type, filename } = params
    
    // Validate type
    if (type !== 'image' && type !== 'thumbnail') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    
    // Validate filename (security check)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    
    // Try file system first
    try {
      const basePath = type === 'thumbnail' ? THUMBNAILS_PATH : FULL_IMAGES_PATH
      const filePath = path.join(basePath, filename)
      
      // Check if file exists
      await fs.access(filePath)
      
      // Read file
      const fileBuffer = await fs.readFile(filePath)
      
      // Determine MIME type
      const mimeType = getMimeType(filename)
      
      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileSystemError) {
      console.log(`File not found in file system: ${filename}, trying localStorage fallback`)
      
      // Fallback: Try to reconstruct from localStorage
      // This is a server-side fallback that redirects to a client-side generated blob URL
      // For a better solution, we should store both in the same place
      
      return NextResponse.json({ 
        error: 'File not found in file system storage. Visual content may be stored in browser localStorage.',
        suggestion: 'Try refreshing the page or re-uploading the document.'
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error('Error serving visual content file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
