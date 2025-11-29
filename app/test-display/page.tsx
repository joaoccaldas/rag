// Manual Test Component for Enhanced AI Analysis Display
"use client"

import React, { useState } from 'react'
import SmartAIAnalysisSection from '@/components/ai-analysis'
import { AIAnalysisData } from '@/rag/types'

export default function TestEnhancedDisplay() {
  const [testData, setTestData] = useState<AIAnalysisData | null>(null)

  // Sample unified prompt data based on the screenshot
  const sampleUnifiedData: AIAnalysisData = {
    summary: "Gmail's FYI document presents a comprehensive business case for its Nordic DA 5-year financial growth, highlighting the company's Base strategy for market expansion and key KPIs for measuring success. The document provides actionable insights for stakeholders to drive growth and optimize resources.",
    keywords: ["gmail", "nordic", "financial", "growth", "base", "strategy", "kpis", "business"],
    tags: ["business-case", "financial-planning", "nordic-expansion", "strategic-growth"],
    topics: ["Financial Growth", "Market Expansion", "Business Strategy", "Performance Metrics"],
    sentiment: "positive" as const,
    complexity: "medium" as const,
    documentType: "Business Case Document",
    confidence: 0.85,
    analyzedAt: new Date(),
    model: "Unified LLM System",
    
    // Enhanced unified prompt fields - this is what should show beautifully formatted
    mainMessages: [
      "What drives Gmail's Nordic DA 5-year financial growth",
      "Gmail's Base strategy for Nordic market expansion and key performance indicators (KPIs) for measuring success",
      "Gmail's FYI document presents a comprehensive business case for its Nordic DA 5-year financial growth",
      "The document provides actionable insights for stakeholders to drive growth and optimize resources"
    ],
    
    mainNumbers: [
      { key: "Revenue", value: "$2.5M", context: "5-year growth target for Nordic expansion" },
      { key: "Market Share", value: "25%", context: "Target Nordic market penetration by year 5" },
      { key: "ROI", value: "185%", context: "Expected return on investment over 5 years" },
      { key: "Team Size", value: "50+", context: "Projected team growth for Nordic operations" }
    ],
    
    mainAnalysis: [
      "Strong market opportunity identified in Nordic region with high growth potential",
      "Gmail's Base strategy provides solid foundation for sustainable expansion",
      "Key performance indicators align with company's strategic objectives",
      "Document demonstrates thorough planning and realistic growth projections"
    ],
    
    explanations: [
      "Nordic market shows high demand for Gmail's services with limited competition",
      "Base strategy focuses on building strong local partnerships and customer relationships",
      "KPI framework ensures measurable progress tracking and accountability",
      "Financial projections based on conservative market analysis and growth assumptions"
    ],
    
    actions: [
      "Establish Nordic regional headquarters within 18 months",
      "Hire local sales and support teams of 25-30 professionals",
      "Launch targeted marketing campaigns in key Nordic cities",
      "Develop partnerships with local technology and business service providers"
    ],
    
    visualInsights: [
      "Growth trajectory chart shows steady 15-20% annual increase",
      "Market penetration map highlights optimal entry points in major Nordic cities",
      "Financial dashboard displays positive cash flow projections from year 2",
      "Competitive analysis matrix positions Gmail favorably against existing players"
    ]
  }

  // Sample legacy data for comparison
  const sampleLegacyData: AIAnalysisData = {
    summary: "Basic document analysis with traditional formatting",
    keywords: ["document", "analysis", "basic"],
    tags: ["legacy", "traditional"],
    topics: ["Document Analysis"],
    sentiment: "neutral" as const,
    complexity: "low" as const,
    documentType: "Standard Document",
    confidence: 0.7,
    analyzedAt: new Date(),
    model: "Legacy System"
    // No unified fields - should display with legacy formatting
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 Enhanced AI Analysis Display Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Testing the enhanced formatting system for unified prompt analysis data.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setTestData(sampleUnifiedData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show Enhanced Display (Unified)
            </button>
            <button
              onClick={() => setTestData(sampleLegacyData)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Show Legacy Display
            </button>
            <button
              onClick={() => setTestData(null)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Display
            </button>
          </div>
        </div>

        {testData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Analysis Display
            </h2>
            <SmartAIAnalysisSection
              aiAnalysis={testData}
              isCompact={false}
            />
          </div>
        )}

        {!testData && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Click one of the buttons above to test the enhanced display system
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
