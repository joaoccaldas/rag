import { NextRequest, NextResponse } from 'next/server'

interface FeedbackData {
  messageId: string
  rating: 'positive' | 'negative' | null
  score: number | null
  categories: string[]
  comment: string
  timestamp: Date
  messageContent?: string
  queryText?: string
  sources?: Array<{
    documentId: string
    chunkId: string
    title: string
    score: number
  }>
  context: {
    source?: 'internal' | 'web' | 'rag'
    model?: string
    ragSources?: number
    promptTokens?: number
    responseTokens?: number
  }
}

// In-memory storage for development (replace with database in production)
const feedbackStore: FeedbackData[] = []

export async function POST(request: NextRequest) {
  try {
    const feedback: FeedbackData = await request.json()
    
    // Validate the feedback data
    if (!feedback.messageId || !feedback.rating) {
      return NextResponse.json(
        { error: 'Missing required feedback data' },
        { status: 400 }
      )
    }

    // Add server timestamp
    feedback.timestamp = new Date()
    
    // Store feedback (in production, save to database)
    feedbackStore.push(feedback)
    
    // Process RAG-specific feedback for search optimization
    if (feedback.context?.source === 'rag' && feedback.sources) {
      await processRAGFeedback(feedback)
    }
    
    // Log for analytics (in production, send to analytics service)
    console.log('Feedback received:', {
      messageId: feedback.messageId,
      rating: feedback.rating,
      score: feedback.score,
      categories: feedback.categories,
      source: feedback.context.source,
      ragSources: feedback.context.ragSources,
      queryText: feedback.queryText,
      sourcesCount: feedback.sources?.length || 0,
      timestamp: feedback.timestamp
    })

    // Calculate aggregated metrics for this session
    const positiveCount = feedbackStore.filter(f => f.rating === 'positive').length
    const negativeCount = feedbackStore.filter(f => f.rating === 'negative').length
    const averageScore = feedbackStore
      .filter(f => f.score !== null)
      .reduce((sum, f) => sum + (f.score || 0), 0) / feedbackStore.filter(f => f.score !== null).length

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.messageId,
        received: feedback.timestamp
      },
      analytics: {
        totalFeedback: feedbackStore.length,
        positiveCount,
        negativeCount,
        averageScore: Math.round(averageScore * 100) / 100,
        satisfactionRate: Math.round((positiveCount / (positiveCount + negativeCount)) * 100)
      }
    })

  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    
    if (messageId) {
      // Get feedback for specific message
      const feedback = feedbackStore.find(f => f.messageId === messageId)
      return NextResponse.json({ feedback })
    }
    
    // Get aggregated analytics
    const positiveCount = feedbackStore.filter(f => f.rating === 'positive').length
    const negativeCount = feedbackStore.filter(f => f.rating === 'negative').length
    const totalFeedback = feedbackStore.length
    
    const averageScore = feedbackStore
      .filter(f => f.score !== null)
      .reduce((sum, f) => sum + (f.score || 0), 0) / feedbackStore.filter(f => f.score !== null).length

    // Category breakdown
    const categoryStats = feedbackStore.reduce((acc, feedback) => {
      feedback.categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    // Source breakdown
    const sourceStats = feedbackStore.reduce((acc, feedback) => {
      const source = feedback.context.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      analytics: {
        totalFeedback,
        positiveCount,
        negativeCount,
        satisfactionRate: totalFeedback > 0 ? Math.round((positiveCount / totalFeedback) * 100) : 0,
        averageScore: Math.round(averageScore * 100) / 100 || 0,
        categoryBreakdown: categoryStats,
        sourceBreakdown: sourceStats,
        recentFeedback: feedbackStore
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(f => ({
            messageId: f.messageId,
            rating: f.rating,
            score: f.score,
            categories: f.categories,
            comment: f.comment?.substring(0, 100),
            source: f.context.source,
            timestamp: f.timestamp
          }))
      }
    })

  } catch (error) {
    console.error('Error retrieving feedback analytics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

// RAG Feedback Processing for Search Optimization
async function processRAGFeedback(feedbackData: FeedbackData) {
  try {
    console.log('🔄 Processing RAG feedback for search optimization...')
    
    if (!feedbackData.sources || feedbackData.sources.length === 0) {
      console.log('⚠️ No sources provided in feedback')
      return
    }

    // Create feedback entry for search optimization
    const searchFeedback: Partial<FeedbackData> = {
      messageId: feedbackData.messageId,
      queryText: feedbackData.queryText || '',
      rating: feedbackData.rating,
      score: feedbackData.score || 0,
      timestamp: new Date(),
      sources: feedbackData.sources,
      categories: feedbackData.categories,
      comment: feedbackData.comment,
      context: feedbackData.context
    }

    // Store in feedback analytics (already in feedbackStore)
    console.log('📊 Feedback data processed for query optimization:', {
      queryText: searchFeedback.queryText,
      rating: searchFeedback.rating,
      sourcesCount: searchFeedback.sources?.length || 0
    })
    
    // Update source relevance scores based on feedback
    if (feedbackData.rating) {
      await updateSourceRelevanceScores(feedbackData.sources, feedbackData.rating, feedbackData.score || 0)
    }
    
    console.log('✅ RAG feedback processed successfully')
    
  } catch (error) {
    console.error('❌ Error processing RAG feedback:', error)
  }
}

async function updateSourceRelevanceScores(
  sources: Array<{documentId: string; chunkId: string; title: string; score: number}>, 
  rating: string, 
  score: number
) {
  try {
    console.log('📊 Updating source relevance scores...')
    
    // Calculate score adjustment based on feedback
    const scoreMultiplier = rating === 'positive' ? 1 : -0.5
    const adjustedScore = (score / 5) * scoreMultiplier // Normalize to -0.5 to 1
    
    // In production, this would update a database
    // For now, we'll log the updates that would be made
    sources.forEach(source => {
      console.log(`📈 Would update scores for ${source.title}:`, {
        documentId: source.documentId,
        chunkId: source.chunkId,
        originalScore: source.score,
        feedbackRating: rating,
        feedbackScore: score,
        adjustedScore: adjustedScore.toFixed(3),
        boostCalculation: `${adjustedScore.toFixed(3)} * 0.3 = ${(adjustedScore * 0.3).toFixed(3)}`
      })
    })
    
    console.log('✅ Source relevance score updates calculated')
    
  } catch (error) {
    console.error('❌ Error updating source scores:', error)
  }
}
