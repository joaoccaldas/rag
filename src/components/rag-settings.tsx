import React, { useState } from 'react'
import { Settings, Wand2, Database, Download, Save, Plus, Trash2, Copy, Tags, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { usePromptTemplates, type PromptTemplate } from '../contexts/PromptTemplateContext'
import { DomainKeywordManager } from './domain-keyword-manager'
import UnifiedPromptManager from '../utils/unified-prompt-manager'
import PromptSystemManager from '../utils/prompt-system-interface'
import { CacheSettings } from '../rag/components/cache-settings'

export default function RAGSettings() {
  const [activeSection, setActiveSection] = useState<'general' | 'prompts' | 'keywords' | 'storage' | 'cache'>('prompts')
  const [showKeywordManager, setShowKeywordManager] = useState(false)
  const [promptSystemType, setPromptSystemType] = useState<'unified' | 'legacy'>('unified')
  const [unifiedTemplate, setUnifiedTemplate] = useState(UnifiedPromptManager.getCurrentPrompt())
  const [showSystemStatus, setShowSystemStatus] = useState(false)
  
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    duplicateTemplate,
    exportTemplates,
    importTemplates,
    resetToDefaults 
  } = usePromptTemplates()

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: 'business',
    systemPrompt: '',
    userPrompt: '',
    description: '',
    variables: '{content}, {filename}, {domain}'
  })

  // Get current AI settings to determine active prompt system
  const getAISettings = () => {
    try {
      const settings = localStorage.getItem('miele-ai-settings')
      return settings ? JSON.parse(settings) : { useUnifiedPrompt: true }
    } catch {
      return { useUnifiedPrompt: true }
    }
  }

  const aiSettings = getAISettings()
  const isUnifiedSystemActive = aiSettings.useUnifiedPrompt ?? true

  // Migration functions
  const migrateLegacyTemplates = async () => {
    const promptManager = PromptSystemManager.getInstance()
    let migratedCount = 0
    
    for (const template of templates) {
      if (promptManager.migrateLegacyTemplate(template)) {
        migratedCount++
      }
    }
    
    alert(`Migration complete! ${migratedCount} templates migrated to unified format.`)
    setUnifiedTemplate(UnifiedPromptManager.getCurrentPrompt())
  }

  const updateUnifiedTemplate = () => {
    const validation = UnifiedPromptManager.validateTemplate(unifiedTemplate)
    if (!validation.isValid) {
      alert(`Validation failed: ${validation.errors.join(', ')}`)
      return
    }

    try {
      UnifiedPromptManager.saveCustomPrompt(unifiedTemplate)
      alert('Unified prompt template updated successfully!')
      setUnifiedTemplate(UnifiedPromptManager.getCurrentPrompt())
    } catch (error) {
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetUnifiedTemplate = () => {
    if (confirm('Reset to default unified prompt? This will lose any customizations.')) {
      UnifiedPromptManager.resetToDefault()
      setUnifiedTemplate(UnifiedPromptManager.getCurrentPrompt())
      alert('Template reset to default!')
    }
  }

  const handleCreateTemplate = () => {
    if (!formData.name || !formData.systemPrompt || !formData.userPrompt) {
      alert('Please fill in all required fields')
      return
    }

    const variables = formData.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
    
    createTemplate({
      name: formData.name,
      domain: formData.domain as 'business' | 'appliance' | 'technical',
      systemPrompt: formData.systemPrompt,
      userPrompt: formData.userPrompt,
      description: formData.description,
      variables,
      isDefault: false,
      isActive: true
    })

    setFormData({
      name: '',
      domain: 'business',
      systemPrompt: '',
      userPrompt: '',
      description: '',
      variables: '{content}, {filename}, {domain}'
    })
    setIsCreating(false)
  }

  const handleUpdateTemplate = () => {
    if (!selectedTemplate || !formData.name || !formData.systemPrompt || !formData.userPrompt) {
      alert('Please fill in all required fields')
      return
    }

    const variables = formData.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
    
    updateTemplate(selectedTemplate, {
      name: formData.name,
      domain: formData.domain as 'business' | 'appliance' | 'technical',
      systemPrompt: formData.systemPrompt,
      userPrompt: formData.userPrompt,
      description: formData.description,
      variables
    })

    setSelectedTemplate(null)
    setFormData({
      name: '',
      domain: 'business',
      systemPrompt: '',
      userPrompt: '',
      description: '',
      variables: '{content}, {filename}, {domain}'
    })
  }

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template.id)
    setFormData({
      name: template.name,
      domain: template.domain,
      systemPrompt: template.systemPrompt,
      userPrompt: template.userPrompt,
      description: template.description,
      variables: template.variables.join(', ')
    })
    setIsCreating(false)
  }

  const handleExport = () => {
    const data = exportTemplates()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `miele-prompt-templates-${new Date().toISOString().split('T')[0]}.json`
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
          importTemplates(data)
          alert('Templates imported successfully!')
        } catch {
          alert('Failed to import templates. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
    event.target.value = '' // Reset input
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'prompts', label: 'Prompt Templates', icon: Wand2 },
          { id: 'keywords', label: 'Domain Keywords', icon: Tags },
          { id: 'general', label: 'General Settings', icon: Settings },
          { id: 'cache', label: 'Semantic Cache', icon: RefreshCw },
          { id: 'storage', label: 'Storage', icon: Database }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as 'general' | 'prompts' | 'keywords' | 'storage' | 'cache')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeSection === section.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Prompt Templates Section */}
      {activeSection === 'prompts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Prompt System</h3>
              <p className="text-sm text-muted-foreground">
                Configure AI prompts for document analysis
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowSystemStatus(!showSystemStatus)}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted"
              >
                <AlertCircle className="h-4 w-4" />
                System Status
              </button>
            </div>
          </div>

          {/* System Status Panel */}
          {showSystemStatus && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Current Prompt System Status
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active System:</span>
                  <span className={`font-medium ${isUnifiedSystemActive ? 'text-green-600' : 'text-orange-600'}`}>
                    {isUnifiedSystemActive ? 'Unified Prompt System' : 'Legacy Domain Prompts'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Current Template:</span>
                  <span className="font-medium">{unifiedTemplate.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Template Type:</span>
                  <span className="font-medium">{unifiedTemplate.isDefault ? 'Default' : 'Custom'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span className="font-medium">{new Date(unifiedTemplate.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              
              {!isUnifiedSystemActive && (
                <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-orange-800 dark:text-orange-200 text-xs">
                  ⚠️ Legacy system detected. Consider migrating to unified prompts for better performance.
                </div>
              )}
            </div>
          )}

          {/* Prompt System Selector */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setPromptSystemType('unified')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                promptSystemType === 'unified'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wand2 className="h-4 w-4" />
              Unified System {isUnifiedSystemActive && <CheckCircle className="h-3 w-3 text-green-500" />}
            </button>
            
            <button
              onClick={() => setPromptSystemType('legacy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                promptSystemType === 'legacy'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="h-4 w-4" />
              Legacy Templates {!isUnifiedSystemActive && <CheckCircle className="h-3 w-3 text-orange-500" />}
            </button>
          </div>

          {/* Unified Prompt System View */}
          {promptSystemType === 'unified' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Unified Trailer-Style Prompt</h4>
                  <p className="text-sm text-muted-foreground">
                    Single comprehensive prompt that analyzes all document types
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={updateUnifiedTemplate}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                  
                  <button
                    onClick={resetUnifiedTemplate}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset to Default
                  </button>
                  
                  <button
                    onClick={() => {
                      const data = UnifiedPromptManager.exportTemplate()
                      const blob = new Blob([data], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `unified-prompt-${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Unified Template Editor */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <input
                    type="text"
                    value={unifiedTemplate.name}
                    onChange={(e) => setUnifiedTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={unifiedTemplate.description}
                    onChange={(e) => setUnifiedTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <textarea
                    value={unifiedTemplate.systemPrompt}
                    onChange={(e) => setUnifiedTemplate(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                    rows={6}
                    placeholder="System instructions for the AI..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">User Prompt Template</label>
                  <textarea
                    value={unifiedTemplate.userPrompt}
                    onChange={(e) => setUnifiedTemplate(prev => ({ ...prev, userPrompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none font-mono text-sm"
                    rows={20}
                    placeholder="Main prompt template with variables..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variables: {unifiedTemplate.variables.map(v => `{${v}}`).join(', ')}
                  </p>
                </div>

                {/* Variables Reference */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium mb-2">Available Variables</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {UnifiedPromptManager.getAvailableVariables().map((variable) => (
                      <div key={variable.name} className="flex items-start gap-2">
                        <code className="bg-background px-1 py-0.5 rounded text-xs">{`{${variable.name}}`}</code>
                        <span className="text-muted-foreground">{variable.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy Templates View */}
          {promptSystemType === 'legacy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Legacy Domain-Specific Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Original domain-based prompt templates (for reference/migration)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={migrateLegacyTemplates}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Migrate to Unified
                  </button>
                  
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  
                  <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted cursor-pointer">
                    <Database className="h-4 w-4" />
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
                    className="flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {!isUnifiedSystemActive && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      <strong>Legacy System Active:</strong> These templates are currently being used for document processing. 
                      Consider migrating to the unified system for better consistency and performance.
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template List */}
                <div className="space-y-3">
                  <h4 className="font-medium">Available Templates</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === template.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm">{template.name}</h5>
                          <div className="flex items-center gap-1">
                            {template.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Default</span>
                            )}
                            <span className={`text-xs px-1 rounded ${
                              template.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <div>Domain: <span className="font-mono">{template.domain}</span></div>
                          <div>Variables: {template.variables.length}</div>
                        </div>
                        
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateTemplate(template.id, `${template.name} (Copy)`)
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Duplicate"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          
                          {!template.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this template?')) {
                                  deleteTemplate(template.id)
                                }
                              }}
                              className="p-1 text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {isCreating ? 'Create New Template' : selectedTemplate ? 'Edit Template' : 'Select a Template'}
                    </h4>
                    
                    {(isCreating || selectedTemplate) && (
                      <button
                        onClick={() => {
                          setIsCreating(false)
                          setSelectedTemplate(null)
                          setFormData({
                            name: '',
                            domain: 'business',
                            systemPrompt: '',
                            userPrompt: '',
                            description: '',
                            variables: '{content}, {filename}, {domain}'
                          })
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {(isCreating || selectedTemplate) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Template name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Domain *</label>
                          <select
                            value={formData.domain}
                            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          >
                            <option value="business">Business</option>
                            <option value="appliance">Appliance</option>
                            <option value="technical">Technical</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Brief description of this template"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Variables</label>
                        <input
                          type="text"
                          value={formData.variables}
                          onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="{content}, {filename}, {domain}"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Comma-separated list of variables to use in prompts
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">System Prompt *</label>
                        <textarea
                          value={formData.systemPrompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                          rows={4}
                          placeholder="System instructions for the AI..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">User Prompt *</label>
                        <textarea
                          value={formData.userPrompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, userPrompt: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                          rows={6}
                          placeholder="Prompt template with variables like {content}, {filename}..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={isCreating ? handleCreateTemplate : handleUpdateTemplate}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4" />
                          {isCreating ? 'Create' : 'Update'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isCreating && !selectedTemplate && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a template to edit or create a new one</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain Keywords Section */}
      {activeSection === 'keywords' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Domain Keywords</h3>
              <p className="text-sm text-muted-foreground">
                Customize keyword sets for domain detection and classification
              </p>
            </div>
            
            <button
              onClick={() => setShowKeywordManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Tags className="h-4 w-4" />
              Manage Keywords
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['business', 'technical', 'appliance', 'service'].map((domain) => (
              <div key={domain} className="p-4 border border-border rounded-lg">
                <h4 className="font-medium capitalize mb-2">{domain}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Default keywords available</div>
                  <div>Customizable thresholds</div>
                  <div>Active detection rules</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">About Domain Keywords</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Domain keywords help the system automatically classify documents and queries 
                into appropriate categories for better analysis and response generation.
              </p>
              <p>
                Click &quot;Manage Keywords&quot; to customize the keyword sets, adjust detection 
                thresholds, and test your configurations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* General Settings Section */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">General Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure general RAG system behavior and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Analysis Settings</h4>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Enable AI Summarization</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm">Enable Domain Detection</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm">Enable Visual Content Analysis</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Performance Settings</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Search Result Limit
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    min={1}
                    max={50}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Similarity Threshold
                  </label>
                  <input
                    type="range"
                    defaultValue={0.7}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storage Section */}
      {activeSection === 'storage' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Storage Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage document storage, cache, and data persistence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Documents</h4>
              <div className="text-2xl font-bold text-primary mb-1">--</div>
              <div className="text-sm text-muted-foreground">Total documents</div>
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Storage Used</h4>
              <div className="text-2xl font-bold text-primary mb-1">--</div>
              <div className="text-sm text-muted-foreground">MB used</div>
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Cache Size</h4>
              <div className="text-2xl font-bold text-primary mb-1">--</div>
              <div className="text-sm text-muted-foreground">Cached items</div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted text-left">
              Clear Search Cache
            </button>
            
            <button className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted text-left">
              Rebuild Document Index
            </button>
            
            <button className="w-full px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 text-left">
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* Cache Section */}
      {activeSection === 'cache' && (
        <div>
          <CacheSettings />
        </div>
      )}

      {/* Domain Keyword Manager Modal */}
      <DomainKeywordManager
        isOpen={showKeywordManager}
        onClose={() => setShowKeywordManager(false)}
      />
    </div>
  )
}
