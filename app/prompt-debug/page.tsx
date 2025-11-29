"use client"

import React, { useState } from 'react'
import { UnifiedPromptManager } from '@/utils/unified-prompt-manager'

export default function PromptDebugPage() {
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const runDebugCheck = () => {
    setIsProcessing(true)
    try {
      // Clear console and run debug
      console.clear()
      UnifiedPromptManager.debugCurrentTemplate()
      
      // Get current template info
      const template = UnifiedPromptManager.getCurrentPrompt()
      const validation = UnifiedPromptManager.validateTemplate(template)
      
      let report = `🔍 PROMPT TEMPLATE DEBUG REPORT\n\n`
      report += `Template Name: ${template.name}\n`
      report += `Is Default: ${template.isDefault}\n`
      report += `Is Valid: ${validation.isValid}\n\n`
      
      if (validation.errors.length > 0) {
        report += `❌ VALIDATION ERRORS:\n`
        validation.errors.forEach((error, i) => {
          report += `${i + 1}. ${error}\n`
        })
        report += `\n`
      }
      
      report += `📋 VARIABLE CHECK:\n`
      report += `- {content}: ${template.userPrompt.includes('{content}') ? '✅' : '❌'}\n`
      report += `- {filename}: ${template.userPrompt.includes('{filename}') ? '✅' : '❌'}\n`
      report += `- {documentType}: ${template.userPrompt.includes('{documentType}') ? '✅' : '❌'}\n`
      report += `- {wordCount}: ${template.userPrompt.includes('{wordCount}') ? '✅' : '❌'}\n`
      report += `- {domain}: ${template.userPrompt.includes('{domain}') ? '✅' : '❌'}\n\n`
      
      report += `📄 TEMPLATE PREVIEW (first 300 chars):\n`
      report += `${template.userPrompt.substring(0, 300)}...\n\n`
      
      setDebugInfo(report)
      
    } catch (error) {
      setDebugInfo(`❌ Debug failed: ${error}`)
    }
    setIsProcessing(false)
  }

  const resetToDefault = () => {
    setIsProcessing(true)
    try {
      UnifiedPromptManager.resetToDefault()
      setDebugInfo('✅ Reset to default template. Run debug check again to verify.')
    } catch (error) {
      setDebugInfo(`❌ Reset failed: ${error}`)
    }
    setIsProcessing(false)
  }

  const refreshTemplate = () => {
    setIsProcessing(true)
    try {
      UnifiedPromptManager.refreshTemplate()
      setDebugInfo('✅ Template cache cleared. Run debug check to see current state.')
    } catch (error) {
      setDebugInfo(`❌ Refresh failed: ${error}`)
    }
    setIsProcessing(false)
  }

  const testPromptGeneration = () => {
    setIsProcessing(true)
    try {
      const testVariables = {
        filename: 'test-document.pdf',
        content: 'This is a test document content for validation purposes.',
        documentType: 'Test Document',
        wordCount: 10,
        domain: 'general',
        visualContentCount: 0,
        customInstructions: ''
      }
      
      const generatedPrompt = UnifiedPromptManager.generatePrompt(testVariables)
      
      let report = `🧪 PROMPT GENERATION TEST\n\n`
      report += `✅ Prompt generated successfully!\n\n`
      report += `📄 GENERATED PROMPT (first 500 chars):\n`
      report += `${generatedPrompt.substring(0, 500)}...\n\n`
      report += `📊 STATS:\n`
      report += `- Total length: ${generatedPrompt.length} characters\n`
      report += `- Contains test content: ${generatedPrompt.includes('test document content') ? '✅' : '❌'}\n`
      report += `- Contains filename: ${generatedPrompt.includes('test-document.pdf') ? '✅' : '❌'}\n`
      
      setDebugInfo(report)
      
    } catch (error) {
      setDebugInfo(`❌ Prompt generation failed: ${error}`)
    }
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔧 Prompt Template Debugger
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Debug and fix validation issues with the unified prompt template system.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={runDebugCheck}
              disabled={isProcessing}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              🔍 Debug Current Template
            </button>
            
            <button
              onClick={testPromptGeneration}
              disabled={isProcessing}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              🧪 Test Prompt Generation
            </button>
            
            <button
              onClick={refreshTemplate}
              disabled={isProcessing}
              className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
            >
              🔄 Refresh Template Cache
            </button>
            
            <button
              onClick={resetToDefault}
              disabled={isProcessing}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              🔄 Reset to Default
            </button>
          </div>

          {debugInfo && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Debug Results:</h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                {debugInfo}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Click "Debug Current Template" to see validation status</li>
              <li>2. If validation fails, try "Refresh Template Cache"</li>
              <li>3. If still failing, try "Reset to Default"</li>
              <li>4. Use "Test Prompt Generation" to verify it's working</li>
              <li>5. Check browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
