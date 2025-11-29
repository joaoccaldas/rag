"use client"

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Save,
  X,
  Check,
  Settings,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { usePromptTemplates, PromptTemplate } from '@/contexts/PromptTemplateContext'

interface PromptTemplateManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function PromptTemplateManager({ isOpen, onClose }: PromptTemplateManagerProps) {
  const {
    templates,
    activeTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,
    duplicateTemplate,
    resetToDefaults,
    exportTemplates,
    importTemplates
  } = usePromptTemplates()

  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')

  // Filter templates based on search and domain
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.domain.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDomain = selectedDomain === 'all' || template.domain === selectedDomain
    
    return matchesSearch && matchesDomain
  })

  const domains = [...new Set(templates.map(t => t.domain))]

  const handleSaveTemplate = (templateData: Partial<PromptTemplate>) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData)
    } else {
      createTemplate({
        ...templateData as Omit<PromptTemplate, 'id' | 'createdAt' | 'lastModified'>,
        isDefault: false,
        isActive: false
      })
    }
    setEditingTemplate(null)
    setIsCreating(false)
  }

  const handleExport = () => {
    try {
      const data = exportTemplates()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `miele-prompt-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      console.error('Export failed')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        importTemplates(data)
        alert('Templates imported successfully!')
      } catch (error) {
        alert('Failed to import templates: Invalid file format')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <span>Prompt Template Manager</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize AI analysis prompts for different document types
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Preview Mode Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {previewMode ? 'Preview' : 'Edit'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Controls */}
            <div className="p-4 space-y-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              {/* Domain Filter */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Domains</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>
                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                </button>
                
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                <label className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={resetToDefaults}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Template List */}
            <div className="overflow-y-auto h-full">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    editingTemplate?.id === template.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => setEditingTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {template.name}
                        </h4>
                        {template.isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded">
                            Default
                          </span>
                        )}
                        {activeTemplates[template.domain]?.id === template.id && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {template.domain} • {template.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {template.variables.length} variables
                    </span>
                    
                    <div className="flex space-x-1">
                      {activeTemplates[template.domain]?.id !== template.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveTemplate(template.domain, template.id)
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Set as active"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newName = prompt('Enter name for duplicated template:', `${template.name} (Copy)`)
                          if (newName) duplicateTemplate(template.id, newName)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      
                      {!template.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this template?')) {
                              deleteTemplate(template.id)
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {(editingTemplate || isCreating) ? (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => {
                  setEditingTemplate(null)
                  setIsCreating(false)
                }}
                previewMode={previewMode}
              />
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                <p>Choose a template from the sidebar to view or edit it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TemplateEditorProps {
  template: PromptTemplate | null
  onSave: (template: Partial<PromptTemplate>) => void
  onCancel: () => void
  previewMode: boolean
}

function TemplateEditor({ template, onSave, onCancel, previewMode }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    domain: 'general',
    systemPrompt: '',
    userPrompt: '',
    description: '',
    variables: [],
    isActive: false
  })

  const [variableInput, setVariableInput] = useState('')

  useEffect(() => {
    if (template) {
      setFormData(template)
    } else {
      setFormData({
        name: '',
        domain: 'general',
        systemPrompt: '',
        userPrompt: '',
        description: '',
        variables: [],
        isActive: false
      })
    }
  }, [template])

  const handleSave = () => {
    if (!formData.name || !formData.systemPrompt || !formData.userPrompt) {
      alert('Please fill in all required fields')
      return
    }

    onSave(formData)
  }

  const addVariable = () => {
    if (variableInput && !formData.variables?.includes(`{${variableInput}}`)) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), `{${variableInput}}`]
      }))
      setVariableInput('')
    }
  }

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter(v => v !== variable) || []
    }))
  }

  if (previewMode && template) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Template Preview: {template.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Domain: {template.domain}</span>
            <span>Variables: {template.variables.length}</span>
            <span>Type: {template.isDefault ? 'Default' : 'Custom'}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              {template.description}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">System Prompt</h4>
            <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {template.systemPrompt}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Prompt Template</h4>
            <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {template.userPrompt}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Available Variables</h4>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {template ? 'Edit Template' : 'Create New Template'}
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Custom Business Analysis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Domain *
            </label>
            <select
              value={formData.domain || 'general'}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="technical">Technical</option>
              <option value="appliance">Appliance</option>
              <option value="medical">Medical</option>
              <option value="legal">Legal</option>
              <option value="financial">Financial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Brief description of what this template does"
          />
        </div>

        {/* Variables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Variables
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={variableInput}
              onChange={(e) => setVariableInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addVariable()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., content, filename, domain"
            />
            <button
              onClick={addVariable}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.variables?.map((variable) => (
              <span
                key={variable}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded"
              >
                <span>{variable}</span>
                <button
                  onClick={() => removeVariable(variable)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Variables can be used in prompts as placeholders (e.g., {'{content}'}, {'{filename}'})
          </p>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Prompt *
          </label>
          <textarea
            value={formData.systemPrompt || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="System prompt that defines the AI's role and behavior..."
          />
        </div>

        {/* User Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User Prompt Template *
          </label>
          <textarea
            value={formData.userPrompt || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, userPrompt: e.target.value }))}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="User prompt template with variables like {content}, {filename}, etc..."
          />
        </div>

        {/* Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive || false}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Set as active template for this domain
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
