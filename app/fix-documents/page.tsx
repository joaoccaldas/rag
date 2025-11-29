// Data diagnostic and fix utility
"use client"

import React, { useState, useEffect } from 'react'
import SmartAIAnalysisSection from '@/components/ai-analysis'

export default function DocumentDataFixer() {
  const [diagnostics, setDiagnostics] = useState<string>('')
  const [documents, setDocuments] = useState<unknown[]>([])
  const [selectedDoc, setSelectedDoc] = useState<unknown>(null)
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    loadAndDiagnoseDocuments()
  }, [])

  const loadAndDiagnoseDocuments = () => {
    try {
      const documentsStr = localStorage.getItem('documents')
      if (!documentsStr) {
        setDiagnostics('No documents found in storage')
        return
      }

      const docs = JSON.parse(documentsStr)
      setDocuments(docs)
      
      let report = `📊 Document Diagnostics Report\n\n`
      report += `Total documents: ${docs.length}\n\n`

      for (let i = 0; i < Math.min(docs.length, 5); i++) {
        const doc = docs[i]
        report += `Document ${i + 1}: ${doc.name}\n`
        report += `  - Has aiAnalysis: ${!!doc.aiAnalysis}\n`
        
        if (doc.aiAnalysis) {
          report += `  - aiAnalysis type: ${typeof doc.aiAnalysis}\n`
          
          if (typeof doc.aiAnalysis === 'string') {
            report += `  - ❌ ISSUE: aiAnalysis is a string (needs parsing)\n`
            try {
              const parsed = JSON.parse(doc.aiAnalysis)
              report += `  - Contains mainMessages: ${!!parsed.mainMessages}\n`
              report += `  - Contains mainNumbers: ${!!parsed.mainNumbers}\n`
            } catch (e) {
              report += `  - ❌ ISSUE: Cannot parse JSON string\n`
            }
          } else if (typeof doc.aiAnalysis === 'object') {
            report += `  - Has mainMessages: ${!!doc.aiAnalysis.mainMessages}\n`
            report += `  - Has mainNumbers: ${!!doc.aiAnalysis.mainNumbers}\n`
            report += `  - Summary type: ${typeof doc.aiAnalysis.summary}\n`
            
            // Check if summary contains JSON
            if (typeof doc.aiAnalysis.summary === 'string' && 
                (doc.aiAnalysis.summary.includes('mainMessages') || 
                 doc.aiAnalysis.summary.includes('mainNumbers'))) {
              report += `  - ❌ ISSUE: Summary contains JSON data\n`
            }
          }
        }
        report += `\n`
      }

      setDiagnostics(report)
      
    } catch (error) {
      setDiagnostics(`Error loading documents: ${error}`)
    }
  }

  const fixDocumentData = async () => {
    setIsFixing(true)
    let fixCount = 0
    
    try {
      const fixedDocs = documents.map(doc => {
        if (!doc.aiAnalysis) return doc
        
        let fixed = false
        let newAiAnalysis = doc.aiAnalysis
        
        // Fix 1: If aiAnalysis is a string, parse it
        if (typeof doc.aiAnalysis === 'string') {
          try {
            newAiAnalysis = JSON.parse(doc.aiAnalysis)
            fixed = true
          } catch (e) {
            console.warn(`Cannot parse aiAnalysis for ${doc.name}`)
            return doc
          }
        }
        
        // Fix 2: If summary contains JSON with unified fields, extract them
        if (newAiAnalysis && typeof newAiAnalysis.summary === 'string') {
          const summary = newAiAnalysis.summary
          
          if (summary.includes('mainMessages') || summary.includes('mainNumbers')) {
            try {
              const jsonMatch = summary.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                
                // Merge the parsed unified fields
                newAiAnalysis = {
                  ...newAiAnalysis,
                  summary: parsed.summary || newAiAnalysis.summary,
                  mainMessages: parsed.mainMessages,
                  mainNumbers: parsed.mainNumbers,
                  mainAnalysis: parsed.mainAnalysis,
                  explanations: parsed.explanations,
                  actions: parsed.actions,
                  visualInsights: parsed.visualInsights,
                  // Keep existing fields
                  keywords: parsed.keywords || newAiAnalysis.keywords || [],
                  tags: parsed.tags || newAiAnalysis.tags || [],
                  topics: parsed.topics || newAiAnalysis.topics || [],
                  sentiment: parsed.sentiment || newAiAnalysis.sentiment || 'neutral',
                  complexity: parsed.complexity || newAiAnalysis.complexity || 'medium',
                  documentType: parsed.documentType || newAiAnalysis.documentType || 'Document',
                  confidence: parsed.confidence || newAiAnalysis.confidence || 0.5,
                  analyzedAt: newAiAnalysis.analyzedAt || new Date(),
                  model: parsed.model || newAiAnalysis.model || 'Unified LLM'
                }
                fixed = true
              }
            } catch (e) {
              console.warn(`Cannot extract JSON from summary for ${doc.name}`)
            }
          }
        }
        
        if (fixed) {
          fixCount++
          return { ...doc, aiAnalysis: newAiAnalysis }
        }
        
        return doc
      })
      
      // Save fixed documents
      localStorage.setItem('documents', JSON.stringify(fixedDocs))
      setDocuments(fixedDocs)
      
      setDiagnostics(prev => prev + `\n✅ Fixed ${fixCount} documents!\n\nReload the page to see changes.`)
      
    } catch (error) {
      setDiagnostics(prev => prev + `\n❌ Fix failed: ${error}`)
    }
    
    setIsFixing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔧 Document Data Fixer
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={loadAndDiagnoseDocuments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Diagnose Documents
            </button>
            
            <button
              onClick={fixDocumentData}
              disabled={isFixing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {isFixing ? '🔄 Fixing...' : '🚀 Fix All Documents'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              🔄 Reload Page
            </button>
          </div>

          {diagnostics && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Diagnostics:</h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                {diagnostics}
              </pre>
            </div>
          )}

          {documents.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Test Document Display:</h3>
              
              <select 
                onChange={(e) => setSelectedDoc(documents[parseInt(e.target.value)])}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a document to test display...</option>
                {documents.map((doc, idx) => (
                  <option key={idx} value={idx}>
                    {doc.name} {doc.aiAnalysis ? '(has AI analysis)' : '(no AI analysis)'}
                  </option>
                ))}
              </select>

              {selectedDoc && selectedDoc.aiAnalysis && (
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-medium mb-4">AI Analysis for: {selectedDoc.name}</h4>
                  <SmartAIAnalysisSection
                    aiAnalysis={selectedDoc.aiAnalysis}
                    isCompact={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
