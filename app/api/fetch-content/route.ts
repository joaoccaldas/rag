import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch content from URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch content: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    
    // Handle different content types
    if (contentType.includes('text/html')) {
      const html = await response.text()
      
      // Extract text content from HTML (basic implementation)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      return NextResponse.json({
        content: textContent.substring(0, 5000), // Limit to 5000 characters
        contentType: 'text/html',
        url
      })
    } else if (contentType.includes('text/')) {
      const textContent = await response.text()
      return NextResponse.json({
        content: textContent.substring(0, 5000), // Limit to 5000 characters
        contentType,
        url
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Only text content is supported.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content from URL' },
      { status: 500 }
    )
  }
}
