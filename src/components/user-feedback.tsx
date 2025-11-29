"use client"

import React, { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, Star, AlertCircle, CheckCircle, Flag } from 'lucide-react'

interface FeedbackData {
  messageId: string
  rating: 'positive' | 'negative' | null
  score: number | null
  categories: string[]
  comment: string
  timestamp: Date
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

interface UserFeedbackProps {
  messageId: string
  messageContent: string
  source?: 'internal' | 'web' | 'rag'
  queryText?: string
  ragSources?: Array<{
    title: string
    content: string
    score: number
    documentId: string
    chunkId: string
  }>
  onFeedback?: (feedback: FeedbackData) => void
  className?: string
}

const FEEDBACK_CATEGORIES = [
  { id: 'accuracy', label: 'Accuracy', icon: CheckCircle },
  { id: 'relevance', label: 'Relevance', icon: Star },
  { id: 'completeness', label: 'Completeness', icon: MessageSquare },
  { id: 'clarity', label: 'Clarity', icon: AlertCircle },
  { id: 'sources', label: 'Source Quality', icon: Flag },
]

export function UserFeedback({ 
  messageId, 
  messageContent, 
  source, 
  queryText,
  ragSources, 
  onFeedback, 
  className = '' 
}: UserFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [score, setScore] = useState<number>(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing feedback from localStorage
  useEffect(() => {
    const existingFeedback = localStorage.getItem(`feedback_${messageId}`)
    if (existingFeedback) {
      try {
        const feedback = JSON.parse(existingFeedback)
        setRating(feedback.rating)
        setScore(feedback.score || 0)
        setSelectedCategories(feedback.categories || [])
        setComment(feedback.comment || '')
        setHasSubmitted(true)
      } catch (error) {
        console.error('Error loading existing feedback:', error)
      }
    }
  }, [messageId])

  const handleRatingClick = (newRating: 'positive' | 'negative') => {
    if (hasSubmitted) return
    
    if (rating === newRating) {
      setRating(null)
      setIsExpanded(false)
    } else {
      setRating(newRating)
      setIsExpanded(true)
      // Auto-set initial score based on rating
      setScore(newRating === 'positive' ? 4 : 2)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    if (hasSubmitted) return
    
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSubmit = async () => {
    if (!rating || isSubmitting) return

    setIsSubmitting(true)

    const feedbackData: FeedbackData = {
      messageId,
      rating,
      score,
      categories: selectedCategories,
      comment: comment.trim(),
      timestamp: new Date(),
      queryText,
      sources: ragSources?.map(source => ({
        documentId: source.documentId,
        chunkId: source.chunkId || source.documentId, // fallback if chunkId not available
        title: source.title,
        score: source.score
      })),
      context: {
        source,
        ragSources: ragSources?.length || 0,
        // Add more context as needed
      }
    }

    try {
      // Save to localStorage
      localStorage.setItem(`feedback_${messageId}`, JSON.stringify(feedbackData))
      
      // Send to parent component
      onFeedback?.(feedbackData)

      // Send to backend API for analytics
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...feedbackData,
            messageContent: messageContent.substring(0, 1000), // Truncate for storage
          }),
        })
      } catch (apiError) {
        console.warn('Failed to send feedback to API:', apiError)
        // Don't fail the UI action if API fails
      }

      setHasSubmitted(true)
      setTimeout(() => setIsExpanded(false), 2000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    setHasSubmitted(false)
    setIsExpanded(true)
  }

  return (
    <div className={`feedback-container ${className}`}>
      {/* Quick Rating Buttons */}
      <div className="flex items-center space-x-2 mt-2">
        <button
          onClick={() => handleRatingClick('positive')}
          disabled={hasSubmitted}
          className={`p-1.5 rounded-full transition-all duration-200 ${
            rating === 'positive'
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-500'
          } ${hasSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
          title="This response was helpful"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleRatingClick('negative')}
          disabled={hasSubmitted}
          className={`p-1.5 rounded-full transition-all duration-200 ${
            rating === 'negative'
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500'
          } ${hasSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
          title="This response was not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>

        {hasSubmitted && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Thanks for your feedback!
            </span>
            <button
              onClick={handleEdit}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Detailed Feedback Form */}
      {isExpanded && !hasSubmitted && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4">
          {/* Score Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Rating (1-5 stars)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  onClick={() => setScore(starValue)}
                  className={`p-1 rounded ${
                    starValue <= score
                      ? 'text-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  } hover:text-yellow-400 transition-colors`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              What could be improved? (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_CATEGORIES.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                      selectedCategories.includes(category.id)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share specific suggestions or issues..."
              className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rating || isSubmitting}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserFeedback
