'use client'

import React, { useState } from 'react'
import { Settings, Save, RotateCcw, Database, FileText, Zap, Shield, Bell, Palette, Globe } from 'lucide-react'

interface ConfigurationViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ actionContext }) => {
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  const configSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'processing', label: 'Processing', icon: FileText },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ]

  const [settings, setSettings] = useState({
    general: {
      defaultLanguage: 'en',
      autoSave: true,
      debugMode: false,
      analyticsEnabled: true
    },
    storage: {
      maxFileSize: 50,
      enableIndexedDB: true,
      autoCleanup: true,
      compressionLevel: 'medium'
    },
    processing: {
      enableOCR: true,
      chunkSize: 1000,
      chunkOverlap: 200,
      enableParallelProcessing: true
    },
    performance: {
      workerThreads: 4,
      batchSize: 10,
      memoryLimit: 512,
      enableCaching: true
    },
    security: {
      enableEncryption: false,
      sessionTimeout: 30,
      allowFileDownload: true,
      enableAuditLog: false
    },
    notifications: {
      showProcessingProgress: true,
      showErrorNotifications: true,
      showSuccessNotifications: true,
      soundEnabled: false
    },
    appearance: {
      theme: 'light',
      compactMode: false,
      showThumbnails: true,
      animationsEnabled: true
    },
    integrations: {
      enableWebhooks: false,
      apiEndpoint: '',
      authToken: '',
      enableExternalStorage: false
    }
  })

  const updateSetting = (section: string, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('rag-settings', JSON.stringify(settings))
    setHasChanges(false)
    console.log('Settings saved:', settings)
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('rag-settings')
      window.location.reload()
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Language
        </label>
        <select
          value={settings.general.defaultLanguage}
          onChange={(e) => updateSetting('general', 'defaultLanguage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Auto Save</label>
          <p className="text-sm text-gray-500">Automatically save changes as you work</p>
        </div>
        <input
          type="checkbox"
          checked={settings.general.autoSave}
          onChange={(e) => updateSetting('general', 'autoSave', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Debug Mode</label>
          <p className="text-sm text-gray-500">Enable detailed logging for troubleshooting</p>
        </div>
        <input
          type="checkbox"
          checked={settings.general.debugMode}
          onChange={(e) => updateSetting('general', 'debugMode', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Analytics</label>
          <p className="text-sm text-gray-500">Enable usage analytics to improve the system</p>
        </div>
        <input
          type="checkbox"
          checked={settings.general.analyticsEnabled}
          onChange={(e) => updateSetting('general', 'analyticsEnabled', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  )

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum File Size (MB)
        </label>
        <input
          type="number"
          value={settings.storage.maxFileSize}
          onChange={(e) => updateSetting('storage', 'maxFileSize', parseInt(e.target.value))}
          min="1"
          max="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Enable IndexedDB</label>
          <p className="text-sm text-gray-500">Use browser database for large file storage</p>
        </div>
        <input
          type="checkbox"
          checked={settings.storage.enableIndexedDB}
          onChange={(e) => updateSetting('storage', 'enableIndexedDB', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Auto Cleanup</label>
          <p className="text-sm text-gray-500">Automatically remove old temporary files</p>
        </div>
        <input
          type="checkbox"
          checked={settings.storage.autoCleanup}
          onChange={(e) => updateSetting('storage', 'autoCleanup', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compression Level
        </label>
        <select
          value={settings.storage.compressionLevel}
          onChange={(e) => updateSetting('storage', 'compressionLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="none">No Compression</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  )

  const renderProcessingSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Enable OCR</label>
          <p className="text-sm text-gray-500">Extract text from images and scanned documents</p>
        </div>
        <input
          type="checkbox"
          checked={settings.processing.enableOCR}
          onChange={(e) => updateSetting('processing', 'enableOCR', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chunk Size (characters)
        </label>
        <input
          type="number"
          value={settings.processing.chunkSize}
          onChange={(e) => updateSetting('processing', 'chunkSize', parseInt(e.target.value))}
          min="100"
          max="5000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chunk Overlap (characters)
        </label>
        <input
          type="number"
          value={settings.processing.chunkOverlap}
          onChange={(e) => updateSetting('processing', 'chunkOverlap', parseInt(e.target.value))}
          min="0"
          max="1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Parallel Processing</label>
          <p className="text-sm text-gray-500">Process multiple files simultaneously</p>
        </div>
        <input
          type="checkbox"
          checked={settings.processing.enableParallelProcessing}
          onChange={(e) => updateSetting('processing', 'enableParallelProcessing', e.target.checked)}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  )

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings()
      case 'storage': return renderStorageSettings()
      case 'processing': return renderProcessingSettings()
      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {configSections.find(s => s.id === activeTab)?.label} Settings
            </h3>
            <p className="text-gray-600">
              Configuration options for this section will be available soon.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            System Configuration
          </h1>
          <p className="text-gray-600">
            {actionContext ? `Context: ${actionContext}` : 'Customize your RAG system settings and preferences'}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Settings Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              {configSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {configSections.find(s => s.id === activeTab)?.label} Settings
                </h2>
                
                {hasChanges && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={resetToDefaults}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={saveSettings}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {renderCurrentTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationView
