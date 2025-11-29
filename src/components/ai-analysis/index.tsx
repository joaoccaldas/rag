import React from 'react'
import { AIAnalysisSection } from './AIAnalysisSection'
import { UnifiedAIAnalysisSection } from './UnifiedAIAnalysisSection'
import { AIAnalysisData } from '../../rag/types'

// Type guard to detect unified prompt format
function isUnifiedAIAnalysis(data: AIAnalysisData): boolean {
  // Debug logging
  console.log('🔍 AI Analysis Data Check:', {
    hasMainMessages: !!data.mainMessages,
    hasMainNumbers: !!data.mainNumbers,
    hasMainAnalysis: !!data.mainAnalysis,
    summaryType: typeof data.summary,
    summaryContent: data.summary?.substring(0, 100) + '...',
    fullData: data
  })
  
  return !!(data && (
    data.mainMessages || 
    data.mainNumbers || 
    data.mainAnalysis || 
    data.explanations || 
    data.actions || 
    data.visualInsights
  ))
}

interface SmartAIAnalysisSectionProps {
  aiAnalysis: AIAnalysisData
  isCompact?: boolean
  className?: string
}

export const SmartAIAnalysisSection: React.FC<SmartAIAnalysisSectionProps> = ({
  aiAnalysis,
  isCompact = false,
  className = ''
}) => {
  if (!aiAnalysis) return null

  // Try to extract unified data from summary if it contains JSON
  let processedAnalysis = aiAnalysis
  
  if (typeof aiAnalysis.summary === 'string' && 
      (aiAnalysis.summary.includes('mainMessages') || aiAnalysis.summary.includes('mainNumbers'))) {
    try {
      const jsonMatch = aiAnalysis.summary.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        processedAnalysis = {
          ...aiAnalysis,
          summary: parsed.summary || aiAnalysis.summary,
          mainMessages: parsed.mainMessages,
          mainNumbers: parsed.mainNumbers,
          mainAnalysis: parsed.mainAnalysis,
          explanations: parsed.explanations,
          actions: parsed.actions,
          visualInsights: parsed.visualInsights,
          // Preserve existing fields
          keywords: parsed.keywords || aiAnalysis.keywords || [],
          tags: parsed.tags || aiAnalysis.tags || [],
          topics: parsed.topics || aiAnalysis.topics || [],
          sentiment: parsed.sentiment || aiAnalysis.sentiment,
          complexity: parsed.complexity || aiAnalysis.complexity,
          documentType: parsed.documentType || aiAnalysis.documentType,
          confidence: parsed.confidence || aiAnalysis.confidence,
          analyzedAt: aiAnalysis.analyzedAt,
          model: parsed.model || aiAnalysis.model
        }
        console.log('✅ Extracted unified data from summary field:', processedAnalysis)
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse JSON from summary:', error)
    }
  }

  // Route to appropriate component based on data structure
  if (isUnifiedAIAnalysis(processedAnalysis)) {
    console.log('🎨 Using UnifiedAIAnalysisSection')
    return (
      <UnifiedAIAnalysisSection
        aiAnalysis={processedAnalysis}
        isCompact={isCompact}
        className={className}
      />
    )
  }

  console.log('📄 Using legacy AIAnalysisSection')
  // Fallback to legacy component
  return (
    <AIAnalysisSection
      aiAnalysis={processedAnalysis}
      isCompact={isCompact}
      className={className}
    />
  )
}

// Export both individual components and the smart router
export { AIAnalysisSection, UnifiedAIAnalysisSection, SmartAIAnalysisSection as default }
