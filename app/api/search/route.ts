import { NextRequest, NextResponse } from 'next/server'

interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
}

// Multiple open-source search endpoints
const SEARCH_ENGINES = [
  {
    name: 'SearXNG',
    url: 'https://searx.be',
    format: 'json'
  },
  {
    name: 'SearXNG 2',
    url: 'https://search.sapti.me',
    format: 'json'
  },
  {
    name: 'SearXNG 3',
    url: 'https://searx.tiekoetter.com',
    format: 'json'
  }
]

async function searchWithSearX(query: string, engineUrl: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `${engineUrl}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=en`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Miele Dashboard Bot 1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      return []
    }

    return data.results.slice(0, 10).map((result: { title?: string; url?: string; content?: string; description?: string }) => ({
      title: result.title || 'Untitled',
      url: result.url || '',
      content: result.content || result.description || '',
      engine: engineUrl.replace('https://', '').split('.')[0]
    }))
  } catch (error) {
    console.error(`SearX search failed for ${engineUrl}:`, error)
    return []
  }
}

// Fallback: Simple web scraping search (for demonstration)
async function fallbackSearch(query: string): Promise<SearchResult[]> {
  try {
    // This is a simple demonstration - in production you'd want a more robust solution
    return [
      {
        title: `Search results for: ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        content: 'Open source search is temporarily unavailable. This is a fallback result that directs to Google search.',
        engine: 'fallback'
      }
    ]
  } catch (error) {
    console.error('Fallback search failed:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedQuery.length > 500) {
      return NextResponse.json(
        { error: 'Query too long' },
        { status: 400 }
      )
    }

    console.log(`Searching for: "${trimmedQuery}"`)

    let results: SearchResult[] = []

    // Try SearX engines in order
    for (const engine of SEARCH_ENGINES) {
      try {
        results = await searchWithSearX(trimmedQuery, engine.url)
        if (results.length > 0) {
          console.log(`Found ${results.length} results from ${engine.name}`)
          break
        }
      } catch {
        console.log(`${engine.name} failed, trying next engine...`)
        continue
      }
    }

    // If no results from SearX engines, use fallback
    if (results.length === 0) {
      console.log('All SearX engines failed, using fallback')
      results = await fallbackSearch(trimmedQuery)
    }

    return NextResponse.json({
      results,
      query: trimmedQuery,
      timestamp: new Date().toISOString(),
      source: results.length > 0 ? results[0].engine : 'none'
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
