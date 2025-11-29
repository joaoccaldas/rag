import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { readFileSync } from 'fs'
import path from 'path'

interface VisualContent {
  id: string
  data?: {
    base64?: string
  }
}

// Simulate localStorage access on server-side
function getStoredVisualContent(): VisualContent[] {
  try {
    // In a real implementation, this would read from a database or file
    // For now, we'll check if there's a visual-content-data.json file
    const dataPath = path.join(process.cwd(), 'visual-content-data.json')
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch {
    console.log('No visual content data file found, returning empty array')
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 })
    }

    // Extract visual ID from filename (format: visual_id.extension)
    const visualId = filename.replace(/\.[^/.]+$/, '')
    
    // Try to get visual content from stored data
    const storedVisuals = getStoredVisualContent()
    const visual = storedVisuals.find((v: VisualContent) => v.id === visualId)
    
    if (visual && visual.data?.base64) {
      // Serve from base64 data
      const base64Data = visual.data.base64
      
      // Extract content type and data from base64 string
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
      if (matches && matches[1] && matches[2]) {
        const contentType = matches[1]
        const base64Content = matches[2]
        const buffer = Buffer.from(base64Content, 'base64')
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
          },
        })
      }
    }

    // Fallback: Try file system storage
    const sanitizedFilename = path.basename(filename)
    const storagePath = process.env['NEXT_PUBLIC_VISUAL_STORAGE_PATH'] || 
                       path.join(process.cwd(), 'visual-content-storage')
    const imagePath = path.join(storagePath, 'images', sanitizedFilename)

    try {
      await fs.access(imagePath)
      const fileBuffer = await fs.readFile(imagePath)
      
      const ext = path.extname(sanitizedFilename).toLowerCase()
      let contentType = 'image/png'
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
        case '.svg':
          contentType = 'image/svg+xml'
          break
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    } catch {
      console.log(`File not found in storage: ${imagePath}`)
    }

    // Generate fallback placeholder image
    const placeholderSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="10" y="10" width="180" height="130" fill="white" stroke="#e5e7eb" stroke-width="2" rx="8"/>
        <text x="100" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          📊
        </text>
        <text x="100" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">
          Visual Content
        </text>
        <text x="100" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#d1d5db">
          ID: ${visualId}
        </text>
      </svg>
    `
    
    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
