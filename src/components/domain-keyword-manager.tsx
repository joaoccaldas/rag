/**
 * Domain Keyword Manager Component
 * UI for customizing domain detection keywords and thresholds
 */

import React, { useState } from 'react'
import { Search, Plus, Trash2, Copy, Download, Upload, RotateCcw, Settings } from 'lucide-react'
import { useDomainKeywords, DomainKeywordSet, DomainDetectionConfig } from '../contexts/DomainKeywordContext'

// Custom styles for the range slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
  }
  .slider::-webkit-slider-thumb:hover {
    background: #2563eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
  }
  .slider::-moz-range-thumb:hover {
    background: #2563eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  .slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
  }
  .dark .slider::-webkit-slider-track {
    background: #374151;
  }
  .slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
    border: none;
  }
  .dark .slider::-moz-range-track {
    background: #374151;
  }
`

interface DomainKeywordManagerProps {
  isOpen: boolean
  onClose: () => void
}

interface DetectionTestResult {
  domain: string
  confidence: number
  matchedKeywords: string[]
  explanation: string
}

export function DomainKeywordManager({ isOpen, onClose }: DomainKeywordManagerProps) {
  // Initialize all hooks first
  const [editingSet, setEditingSet] = useState<DomainKeywordSet | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [showConfig, setShowConfig] = useState(false)
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<DetectionTestResult | null>(null)

  // Use safe hook access with error boundary
  const context = useDomainKeywords()
  
  // Early return if context is not available (after hooks)
  if (!context) {
    console.warn('DomainKeywordManager: useDomainKeywords context not available')
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">Context Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Domain keyword context is not available. Please ensure the component is wrapped with DomainKeywordProvider.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  const {
    keywordSets,
    detectionConfig,
    createKeywordSet,
    updateKeywordSet,
    deleteKeywordSet,
    duplicateKeywordSet,
    updateDetectionConfig,
    exportKeywordSets,
    importKeywordSets,
    resetToDefaults,
    detectDomainWithCustomKeywords
  } = context

  if (!isOpen) return null

  // Filter keyword sets based on search and domain
  const filteredSets = keywordSets.filter(set => {
    const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         set.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDomain = selectedDomain === 'all' || set.domain === selectedDomain
    
    return matchesSearch && matchesDomain
  })

  const handleExport = () => {
    const data = exportKeywordSets()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `miele-domain-keywords-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          importKeywordSets(data)
          alert('Keyword sets imported successfully!')
        } catch {
          alert('Failed to import keyword sets. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
    event.target.value = '' // Reset input
  }

  const handleTestDetection = () => {
    if (testContent.trim()) {
      const result = detectDomainWithCustomKeywords(testContent)
      setTestResult(result)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Domain Keyword Manager</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize keywords and thresholds for domain detection</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[700px]">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search keyword sets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Domains</option>
                <option value="business">Business</option>
                <option value="technical">Technical</option>
                <option value="appliance">Appliance</option>
                <option value="service">Service</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
              
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Config
              </button>
            </div>
            {/* Keyword Sets List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Keyword Sets</h3>
              {filteredSets.map((set) => (
                <div
                  key={set.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    editingSet?.id === set.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${!set.isActive ? 'opacity-60' : ''}`}
                  onClick={() => setEditingSet(set)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{set.name}</h4>
                    <div className="flex items-center gap-2">
                      {set.isDefault && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Default</span>
                      )}
                      {!set.isActive && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Domain: <span className="font-mono text-gray-900 dark:text-white">{set.domain}</span></div>
                    <div>Keywords: <span className="font-medium text-gray-900 dark:text-white">{set.keywords.length}</span></div>
                    <div>Threshold: <span className="font-medium text-gray-900 dark:text-white">{(set.threshold * 100).toFixed(1)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-gray-900 p-6 overflow-y-auto">
            {showConfig ? (
              <ConfigurationPanel 
                config={detectionConfig}
                onUpdate={updateDetectionConfig}
              />
            ) : editingSet || isCreating ? (
              <KeywordSetEditor
                keywordSet={editingSet}
                isCreating={isCreating}
                onSave={(set) => {
                  if (isCreating) {
                    createKeywordSet(set)
                    setIsCreating(false)
                  } else if (editingSet) {
                    updateKeywordSet(editingSet.id, set)
                  }
                  setEditingSet(null)
                }}
                onCancel={() => {
                  setEditingSet(null)
                  setIsCreating(false)
                }}
                onDelete={editingSet ? () => {
                  deleteKeywordSet(editingSet.id)
                  setEditingSet(null)
                } : undefined}
                onDuplicate={editingSet ? () => {
                  duplicateKeywordSet(editingSet.id, `${editingSet.name} (Copy)`)
                  setEditingSet(null)
                } : undefined}
              />
            ) : (
              <div className="space-y-6">
                {/* Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Domain Detection Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['business', 'technical', 'appliance', 'service'].map((domain) => {
                      const domainSets = keywordSets.filter(set => set.domain === domain && set.isActive)
                      const totalKeywords = domainSets.reduce((sum, set) => sum + set.keywords.length, 0)
                      
                      return (
                        <div key={domain} className="p-3 border border-border rounded-lg">
                          <h4 className="font-medium capitalize">{domain}</h4>
                          <div className="text-sm text-muted-foreground">
                            <div>{domainSets.length} sets</div>
                            <div>{totalKeywords} keywords</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Test Detection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Test Domain Detection</h3>
                  <div className="space-y-3">
                    <textarea
                      value={testContent}
                      onChange={(e) => setTestContent(e.target.value)}
                      placeholder="Enter text to test domain detection..."
                      className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
                    />
                    
                    <button
                      onClick={handleTestDetection}
                      disabled={!testContent.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      Test Detection
                    </button>

                    {testResult && (
                      <div className="p-4 border border-border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Detected Domain:</strong> {testResult.domain}
                          </div>
                          <div>
                            <strong>Confidence:</strong> {(testResult.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="col-span-2">
                            <strong>Matched Keywords:</strong> {testResult.matchedKeywords.join(', ') || 'None'}
                          </div>
                          <div className="col-span-2">
                            <strong>Explanation:</strong> {testResult.explanation}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">How to Use</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <ol>
                      <li>Select a keyword set from the sidebar to edit its keywords and threshold</li>
                      <li>Create new keyword sets for specialized domains or use cases</li>
                      <li>Adjust thresholds to fine-tune detection sensitivity</li>
                      <li>Test your changes using the detection tester above</li>
                      <li>Export/import configurations to share with your team</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// Configuration Panel Component
interface ConfigurationPanelProps {
  config: DomainDetectionConfig
  onUpdate: (updates: Partial<DomainDetectionConfig>) => void
}

function ConfigurationPanel({ config, onUpdate }: ConfigurationPanelProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Detection Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enable Custom Keywords
            </label>
            <input
              type="checkbox"
              checked={config.enableCustomKeywords}
              onChange={(e) => onUpdate({ enableCustomKeywords: e.target.checked })}
              className="rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Fallback Threshold ({(config.fallbackThreshold * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={config.fallbackThreshold}
              onChange={(e) => onUpdate({ fallbackThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Keyword Matches
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.minimumKeywordMatches}
              onChange={(e) => onUpdate({ minimumKeywordMatches: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Case Sensitive Matching
            </label>
            <input
              type="checkbox"
              checked={config.caseSensitive}
              onChange={(e) => onUpdate({ caseSensitive: e.target.checked })}
              className="rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Use Partial Matching
            </label>
            <input
              type="checkbox"
              checked={config.usePartialMatching}
              onChange={(e) => onUpdate({ usePartialMatching: e.target.checked })}
              className="rounded"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Configuration Help</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li><strong>Fallback Threshold:</strong> Minimum confidence needed for any domain detection</li>
          <li><strong>Minimum Matches:</strong> At least this many keywords must match</li>
          <li><strong>Case Sensitive:</strong> Whether keyword matching considers letter case</li>
          <li><strong>Partial Matching:</strong> Whether to match partial words (e.g., &quot;wash&quot; matches &quot;washing&quot;)</li>
        </ul>
      </div>
    </div>
  )
}

// Keyword Set Editor Component
function KeywordSetEditor({ 
  keywordSet, 
  isCreating, 
  onSave, 
  onCancel, 
  onDelete, 
  onDuplicate 
}: {
  keywordSet: DomainKeywordSet | null
  isCreating: boolean
  onSave: (set: Omit<DomainKeywordSet, 'id' | 'createdAt' | 'lastModified'>) => void
  onCancel: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  const [formData, setFormData] = useState({
    name: keywordSet?.name || '',
    domain: keywordSet?.domain || 'business',
    keywords: keywordSet?.keywords || [],
    threshold: keywordSet?.threshold || 0.1,
    isActive: keywordSet?.isActive ?? true,
    isDefault: keywordSet?.isDefault || false
  })

  const [newKeyword, setNewKeyword] = useState('')

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (formData.name.trim() && formData.keywords.length > 0) {
      onSave(formData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isCreating ? 'Create New Keyword Set' : 'Edit Keyword Set'}
        </h3>
        
        <div className="flex gap-2">
          {!isCreating && onDuplicate && (
            <button
              onClick={onDuplicate}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-border rounded-md hover:bg-muted"
            >
              <Copy className="h-3 w-3" />
              Duplicate
            </button>
          )}
          
          {!isCreating && onDelete && !formData.isDefault && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Custom Business Keywords"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domain *</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value as 'business' | 'technical' | 'appliance' | 'service' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="business">Business</option>
              <option value="technical">Technical</option>
              <option value="appliance">Appliance</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detection Threshold ({(formData.threshold * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={formData.threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Percentage of keywords that must match for domain detection
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active for detection</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Keywords ({formData.keywords.length})
            </label>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add keyword..."
              />
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-wrap gap-2">
                {formData.keywords.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">No keywords added yet. Add keywords above.</p>
                ) : (
                  formData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200 dark:border-blue-700"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title={`Remove ${keyword}`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={!formData.name.trim() || formData.keywords.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Create Set' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
