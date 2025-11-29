/**
 * Debug component to test AI analysis integration
 */

'use client'

import React, { useState } from 'react'

export function AIAnalysisDebug() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testAIAnalysis = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      const testContent = "This is a test document about artificial intelligence and machine learning technologies. It contains information about data processing, neural networks, and computational algorithms."
      
      const prompt = `Analyze the following document content and provide a structured analysis:

DOCUMENT: Test Document
CONTENT: ${testContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the main content",
  "keywords": ["5-10 most important keywords/terms"],
  "tags": ["3-7 relevant tags for categorization"],
  "topics": ["2-5 main topics/themes"],
  "sentiment": "positive|negative|neutral",
  "complexity": "low|medium|high", 
  "documentType": "description of document type",
  "confidence": 0.85
}

Focus on extracting actionable metadata. Be precise and specific.`

      console.log('🔄 Testing AI analysis with prompt:', prompt.substring(0, 200) + '...')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          settings: {
            model: 'llama3:latest',
            temperature: 0.3,
            maxTokens: 1000,
            systemPrompt: 'You are a document analysis AI that extracts structured metadata. Always respond with valid JSON only, no additional text.'
          }
        }),
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📊 Raw API result:', result)
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = result.message.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0])
          setTestResult(`✅ SUCCESS: AI Analysis working!\n\nParsed Data:\n${JSON.stringify(parsedData, null, 2)}`)
        } else {
          setTestResult(`⚠️ PARTIAL: AI responded but no JSON found:\n\n${result.message}`)
        }
      } catch (parseError) {
        setTestResult(`❌ PARSE ERROR: ${parseError}\n\nRaw response:\n${result.message}`)
      }

    } catch (error) {
      console.error('❌ AI Analysis test failed:', error)
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
        🔧 <span className="ml-1">AI Debug</span>
      </h3>
      
      <button
        onClick={testAIAnalysis}
        disabled={isLoading}
        className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
      >
        {isLoading ? '🔄 Testing...' : '🧪 Test AI Analysis'}
      </button>

      {testResult && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2 border max-h-32 overflow-y-auto">
          <div className="text-xs text-gray-700 dark:text-gray-300">
            {testResult.includes('SUCCESS') ? '✅ Working' : 
             testResult.includes('ERROR') ? '❌ Failed' : 
             testResult.includes('PARTIAL') ? '⚠️ Issues' : 'Result'}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIAnalysisDebug
