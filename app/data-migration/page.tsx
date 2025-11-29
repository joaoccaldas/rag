// Utility to fix existing documents with stringified AI analysis data
"use client"

import React, { useState } from 'react'

export default function DataMigrationTool() {
  const [migrationStatus, setMigrationStatus] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const migrateExistingDocuments = async () => {
    setIsProcessing(true)
    setMigrationStatus('🔍 Checking for documents with stringified AI analysis...')

    try {
      // Get documents from storage
      const documentsStr = localStorage.getItem('documents')
      if (!documentsStr) {
        setMigrationStatus('ℹ️ No documents found in storage')
        setIsProcessing(false)
        return
      }

      const documents = JSON.parse(documentsStr)
      let migratedCount = 0
      let totalCount = 0

      for (const doc of documents) {
        if (doc.aiAnalysis) {
          totalCount++
          
          // Check if aiAnalysis is a string (needs parsing)
          if (typeof doc.aiAnalysis === 'string') {
            try {
              const parsed = JSON.parse(doc.aiAnalysis)
              doc.aiAnalysis = parsed
              migratedCount++
              console.log(`✅ Migrated document: ${doc.name}`)
            } catch (error) {
              console.warn(`⚠️ Failed to parse aiAnalysis for ${doc.name}:`, error)
            }
          }
          
          // Check if the analysis is missing unified fields but contains them in summary
          else if (doc.aiAnalysis && typeof doc.aiAnalysis.summary === 'string') {
            const summary = doc.aiAnalysis.summary
            
            // Check if summary contains JSON with unified fields
            if (summary.includes('mainMessages') || summary.includes('mainNumbers')) {
              try {
                const jsonMatch = summary.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0])
                  
                  // Merge the parsed unified fields into the existing analysis
                  if (parsed.mainMessages || parsed.mainNumbers || parsed.mainAnalysis) {
                    doc.aiAnalysis = {
                      ...doc.aiAnalysis,
                      ...parsed
                    }
                    migratedCount++
                    console.log(`✅ Enhanced document with unified fields: ${doc.name}`)
                  }
                }
              } catch (error) {
                console.warn(`⚠️ Failed to extract unified fields from ${doc.name}:`, error)
              }
            }
          }
        }
      }

      // Save the migrated documents back
      if (migratedCount > 0) {
        localStorage.setItem('documents', JSON.stringify(documents))
        setMigrationStatus(`✅ Migration complete! Fixed ${migratedCount} out of ${totalCount} documents with AI analysis.`)
      } else {
        setMigrationStatus(`ℹ️ No migration needed. Checked ${totalCount} documents - all are properly formatted.`)
      }

    } catch (error) {
      console.error('Migration error:', error)
      setMigrationStatus(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsProcessing(false)
  }

  const clearAllDocuments = async () => {
    if (confirm('⚠️ This will delete ALL documents. Are you sure?')) {
      localStorage.removeItem('documents')
      setMigrationStatus('🗑️ All documents cleared from storage')
    }
  }

  const checkDocumentStructure = async () => {
    setMigrationStatus('🔍 Analyzing document structure...')
    
    try {
      const documentsStr = localStorage.getItem('documents')
      if (!documentsStr) {
        setMigrationStatus('ℹ️ No documents found')
        return
      }

      const documents = JSON.parse(documentsStr)
      let analysisReport = `📊 Document Analysis Report:\n\n`
      analysisReport += `Total documents: ${documents.length}\n`
      
      let withAiAnalysis = 0
      let withUnifiedFields = 0
      let withStringifiedData = 0

      for (const doc of documents) {
        if (doc.aiAnalysis) {
          withAiAnalysis++
          
          if (typeof doc.aiAnalysis === 'string') {
            withStringifiedData++
          } else if (doc.aiAnalysis.mainMessages || doc.aiAnalysis.mainNumbers) {
            withUnifiedFields++
          }
        }
      }

      analysisReport += `Documents with AI analysis: ${withAiAnalysis}\n`
      analysisReport += `Documents with unified fields: ${withUnifiedFields}\n`
      analysisReport += `Documents with stringified data: ${withStringifiedData}\n`
      analysisReport += `Documents needing migration: ${withStringifiedData}\n`

      setMigrationStatus(analysisReport)

    } catch (error) {
      setMigrationStatus(`❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔧 Data Migration Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This tool helps fix existing documents that might have stringified AI analysis data
            or extracts unified prompt fields from summary text.
          </p>

          <div className="space-y-4 mb-6">
            <button
              onClick={checkDocumentStructure}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              📊 Analyze Document Structure
            </button>
            
            <button
              onClick={migrateExistingDocuments}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {isProcessing ? '🔄 Processing...' : '🚀 Migrate Documents'}
            </button>
            
            <button
              onClick={clearAllDocuments}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              🗑️ Clear All Documents (Danger Zone)
            </button>
          </div>

          {migrationStatus && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Migration Status:</h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {migrationStatus}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
