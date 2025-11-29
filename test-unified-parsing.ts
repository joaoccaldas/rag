// Quick test to verify unified prompt parsing is working
import { parseAndValidateResponse } from '../rag/utils/enhanced-document-processing'

const testUnifiedResponse = `{
  "summary": "This document presents a comprehensive business case for Gmail's Nordic DA 5-year financial growth strategy",
  "keywords": ["gmail", "nordic", "financial", "growth", "strategy"],
  "tags": ["business-case", "financial-planning", "strategic-growth"],
  "topics": ["Financial Growth", "Market Expansion", "Business Strategy"],
  "sentiment": "positive",
  "complexity": "medium",
  "documentType": "Business Case",
  "confidence": 0.9,
  "mainMessages": [
    "Gmail's Nordic DA 5-year financial growth strategy focuses on market expansion",
    "The document provides actionable insights for stakeholders to drive growth",
    "Key performance indicators (KPIs) are established for measuring success"
  ],
  "mainNumbers": [
    {"key": "Revenue Target", "value": "$2.5M", "context": "5-year growth projection"},
    {"key": "Market Share", "value": "25%", "context": "Target Nordic market penetration"},
    {"key": "ROI", "value": "18%", "context": "Expected return on investment"}
  ],
  "mainAnalysis": [
    "Strong market opportunity identified in Nordic region",
    "Competitive analysis shows favorable positioning",
    "Financial projections demonstrate sustainable growth path"
  ],
  "explanations": [
    "Nordic market shows high demand for Gmail services",
    "Strategic partnerships enable rapid market entry",
    "Technology infrastructure supports scalable expansion"
  ],
  "actions": [
    "Establish Nordic headquarters within 12 months",
    "Hire local sales team of 15-20 professionals",
    "Launch targeted marketing campaign in Q2 2025"
  ]
}`

console.log('Testing unified prompt parsing...')
try {
  const result = parseAndValidateResponse(testUnifiedResponse, '', 'test.pdf', 'standard')
  console.log('✅ Unified prompt parsing successful!')
  console.log('Main Messages:', result.mainMessages)
  console.log('Main Numbers:', result.mainNumbers)
  console.log('Has unified data:', !!(result.mainMessages || result.mainNumbers))
} catch (error) {
  console.error('❌ Parsing failed:', error)
}
