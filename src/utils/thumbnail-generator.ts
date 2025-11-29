/**
 * Thumbnail Generation Utility
 * Provides client-side thumbnail generation for visual content
 */

export interface ThumbnailOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png'
}

/**
 * Generate thumbnail from image data URL
 */
export async function generateThumbnail(
  dataURL: string, 
  options: ThumbnailOptions = {}
): Promise<string | null> {
  const {
    maxWidth = 150,
    maxHeight = 150,
    quality = 0.7,
    format = 'jpeg'
  } = options

  if (typeof window === 'undefined') {
    return null // Server-side, return null
  }
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        const aspectRatio = width / height

        if (width > height) {
          if (width > maxWidth) {
            width = maxWidth
            height = width / aspectRatio
          }
        } else {
          if (height > maxHeight) {
            height = maxHeight
            width = height * aspectRatio
          }
        }

        canvas.width = Math.round(width)
        canvas.height = Math.round(height)

        // Draw with high quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const thumbnailDataURL = canvas.toDataURL(`image/${format}`, quality)
        resolve(thumbnailDataURL)
      } catch (error) {
        console.warn('Thumbnail generation failed:', error)
        resolve(null)
      }
    }
    img.onerror = () => {
      console.warn('Failed to load image for thumbnail generation')
      resolve(null)
    }
    img.src = dataURL
  })
}

/**
 * Generate placeholder thumbnail for non-image content
 */
export function generatePlaceholderThumbnail(
  type: string, 
  title: string = 'Content',
  options: ThumbnailOptions = {}
): string {
  const {
    maxWidth = 150,
    maxHeight = 150
  } = options

  const icons = {
    table: '📊',
    chart: '📈', 
    diagram: '📋',
    image: '🖼️',
    default: '📄'
  }

  const icon = icons[type as keyof typeof icons] || icons.default
  const bgColors = {
    table: '#3B82F6',
    chart: '#10B981', 
    diagram: '#8B5CF6',
    image: '#F59E0B',
    default: '#6B7280'
  }
  
  const bgColor = bgColors[type as keyof typeof bgColors] || bgColors.default

  // Create SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${maxHeight}" viewBox="0 0 ${maxWidth} ${maxHeight}">
      <rect width="100%" height="100%" fill="${bgColor}" rx="8"/>
      <text x="50%" y="35%" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="white">${icon}</text>
      <text x="50%" y="70%" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="white" opacity="0.9">
        ${title.length > 15 ? title.substring(0, 15) + '...' : title}
      </text>
      <text x="50%" y="85%" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white" opacity="0.7">
        ${type.toUpperCase()}
      </text>
    </svg>
  `

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Get thumbnail for visual content - either existing or generate one
 */
export async function getOrCreateThumbnail(
  content: { 
    thumbnail?: string; 
    fullContent?: string | { [key: string]: string | number | boolean }[]; 
    type: string; 
    title?: string;
  },
  options: ThumbnailOptions = {}
): Promise<string> {
  
  // Return existing thumbnail if available and not a placeholder
  if (content.thumbnail && 
      content.thumbnail.startsWith('data:image') && 
      !content.thumbnail.includes('placeholder.com')) {
    return content.thumbnail
  }

  // Generate from full content if available and is string (data URL)
  if (content.fullContent && 
      typeof content.fullContent === 'string' && 
      content.fullContent.startsWith('data:image')) {
    const generated = await generateThumbnail(content.fullContent, options)
    if (generated) {
      return generated
    }
  }

  // Fall back to placeholder
  return generatePlaceholderThumbnail(
    content.type, 
    content.title || 'Visual Content',
    options
  )
}
