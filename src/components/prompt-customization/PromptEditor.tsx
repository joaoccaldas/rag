/**
 * Prompt Editor Component
 * Allows users to customize the unified AI prompt template
 */

import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, Download, Upload, Eye, EyeOff, Info, Check, X } from 'lucide-react'
import UnifiedPromptManager, { PromptTemplate, UnifiedPromptVariables } from '../../utils/unified-prompt-manager'

interface PromptEditorProps {
  onSave?: (template: PromptTemplate) => void
  onReset?: () => void
  className?: string
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  onSave,
  onReset,
  className = ''
}) => {
  const [template, setTemplate] = useState<PromptTemplate>(UnifiedPromptManager.getDefaultPrompt())
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load current template on mount
  useEffect(() => {
    const currentTemplate = UnifiedPromptManager.getCurrentPrompt()
    setTemplate(currentTemplate)
  }, [])

  // Validate template whenever it changes
  useEffect(() => {
    const result = UnifiedPromptManager.validateTemplate(template)
    setValidation(result)
  }, [template])

  const handleSave = async () => {
    if (!validation.isValid) {
      setSaveStatus('error')
      return
    }

    setSaveStatus('saving')
    try {
      UnifiedPromptManager.saveCustomPrompt(template)
      setSaveStatus('saved')
      onSave?.(template)
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save template:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleReset = () => {
    UnifiedPromptManager.resetToDefault()
    setTemplate(UnifiedPromptManager.getDefaultPrompt())
    setSaveStatus('idle')
    onReset?.()
  }

  const handleExport = () => {
    const exportData = UnifiedPromptManager.exportTemplate()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        UnifiedPromptManager.importTemplate(jsonString)
        setTemplate(UnifiedPromptManager.getCurrentPrompt())
        setSaveStatus('saved')
      } catch (error) {
        console.error('Failed to import template:', error)
        setSaveStatus('error')
      }
    }
    reader.readAsText(file)
  }

  const generatePreview = () => {
    const sampleVariables: UnifiedPromptVariables = {
      filename: 'sample-business-report.pdf',
      content: 'This quarterly business report covers our performance metrics, revenue growth, and strategic initiatives for Q3 2024...',
      documentType: 'Business Report',
      wordCount: 2847,
      domain: 'business',
      customInstructions: 'Focus on financial metrics and strategic recommendations',
      visualContentCount: 5
    }

    return UnifiedPromptManager.generatePrompt(sampleVariables)
  }

  const availableVariables = UnifiedPromptManager.getAvailableVariables()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Prompt Customization
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Customize the unified prompt that analyzes all documents
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Validation Status */}
          {validation.isValid ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check size={16} className="mr-1" />
              <span className="text-sm">Valid</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <X size={16} className="mr-1" />
              <span className="text-sm">{validation.errors.length} errors</span>
            </div>
          )}

          {/* Save Status */}
          {saveStatus === 'saving' && (
            <div className="text-blue-600 dark:text-blue-400 text-sm">Saving...</div>
          )}
          {saveStatus === 'saved' && (
            <div className="text-green-600 dark:text-green-400 text-sm">Saved!</div>
          )}
          {saveStatus === 'error' && (
            <div className="text-red-600 dark:text-red-400 text-sm">Error saving</div>
          )}
        </div>
      </div>

      {/* Template Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => {
              setTemplate({ ...template, name: e.target.value })
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter template name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={template.description}
            onChange={(e) => {
              setTemplate({ ...template, description: e.target.value })
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describe what this template does"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!validation.isValid || saveStatus === 'saving'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} className="mr-2" />
          Save Template
        </button>

        <button
          onClick={handleReset}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <RotateCcw size={16} className="mr-2" />
          Reset to Default
        </button>

        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download size={16} className="mr-2" />
          Export
        </button>

        <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
          <Upload size={16} className="mr-2" />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowVariables(!showVariables)}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          <Info size={16} className="mr-2" />
          Variables
        </button>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showPreview ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
          Preview
        </button>
      </div>

      {/* Variables Reference */}
      {showVariables && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Available Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableVariables.map((variable: { name: string; description: string; example: string }) => (
              <div key={variable.name} className="text-sm">
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                  {`{${variable.name}}`}
                </code>
                <p className="text-blue-700 dark:text-blue-300 mt-1">{variable.description}</p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">Example: {variable.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Validation Errors</h4>
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-300">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* System Prompt Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            System Prompt (AI Context)
          </label>
          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            {showSystemPrompt ? 'Hide' : 'Show'}
          </button>
        </div>

        {showSystemPrompt && (
          <textarea
            value={template.systemPrompt}
            onChange={(e) => {
              setTemplate({ ...template, systemPrompt: e.target.value })
            }}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            placeholder="Enter system prompt that provides context to the AI..."
          />
        )}
      </div>

      {/* Main Prompt Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Main Prompt Template
        </label>
        <textarea
          value={template.userPrompt}
          onChange={(e) => {
            setTemplate({ ...template, userPrompt: e.target.value })
          }}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          placeholder="Enter your prompt template with variables like {filename}, {content}, etc."
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preview (with sample data)</h4>
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-900 p-3 rounded border max-h-96 overflow-y-auto">
            {generatePreview()}
          </pre>
        </div>
      )}

      {/* Template Status */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {template.isDefault ? (
          <span>Using default template</span>
        ) : (
          <span>Using custom template (last modified: {new Date(template.lastModified).toLocaleString()})</span>
        )}
      </div>
    </div>
  )
}

export default PromptEditor
