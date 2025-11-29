import React, { useState } from 'react'
import SmartAIAnalysisSection from '../ai-analysis'
import { unifiedPromptTestData, legacyPromptTestData } from '../ai-analysis/test-data'
import { Badge } from '../../design-system/components'

const AIAnalysisDemo = () => {
  const [selectedData, setSelectedData] = useState<'unified' | 'legacy'>('unified')
  const [isCompact, setIsCompact] = useState(false)

  const currentData = selectedData === 'unified' ? unifiedPromptTestData : legacyPromptTestData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            AI Analysis Display System
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Enhanced formatting for unified prompt system with backward compatibility for legacy prompts.
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedData('unified')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedData === 'unified'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Unified Prompt Data
              </button>
              <button
                onClick={() => setSelectedData('legacy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedData === 'legacy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Legacy Prompt Data
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isCompact}
                  onChange={(e) => setIsCompact(e.target.checked)}
                  className="mr-2"
                />
                Compact View
              </label>
            </div>
            
            <Badge 
              variant="outline" 
              className={`${selectedData === 'unified' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
            >
              {selectedData === 'unified' ? 'Enhanced Display Active' : 'Legacy Display Active'}
            </Badge>
          </div>
        </div>

        {/* Analysis Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analysis Preview
            </h2>
            <Badge variant="outline" className="text-xs">
              {selectedData === 'unified' ? 'Unified Prompt System' : 'Legacy System'}
            </Badge>
          </div>
          
          <SmartAIAnalysisSection
            aiAnalysis={currentData}
            isCompact={isCompact}
          />
        </div>

        {/* Data Structure Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Structure Comparison
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Unified Prompt System
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>✅ Rich mainMessages array</li>
                <li>✅ Structured mainNumbers with context</li>
                <li>✅ Detailed mainAnalysis insights</li>
                <li>✅ Actionable explanations</li>
                <li>✅ Specific action recommendations</li>
                <li>✅ Visual content insights</li>
                <li>✅ Enhanced formatting & organization</li>
                <li>✅ Color-coded sections</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                Legacy System
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Basic summary text</li>
                <li>• Simple keywords array</li>
                <li>• Basic tags and topics</li>
                <li>• Standard metadata fields</li>
                <li>• Compatible with existing workflow</li>
                <li>• Automatically detected & routed</li>
                <li>• No breaking changes</li>
                <li>• Graceful fallback</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                🔄 Smart Routing
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Automatically detects data format and routes to appropriate display component.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                🎨 Enhanced UI
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Rich visual formatting with tabs, color coding, and organized sections.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                🔧 Backward Compatible
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                No breaking changes - existing systems continue to work seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAnalysisDemo
