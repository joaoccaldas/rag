'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SettingsState {
  aiSettings?: any
  ragSettings?: any
  raw?: {
    aiSettings?: string
    ragSettings?: string
  }
  error?: string
}

export default function RAGSettingsDebugPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = () => {
    try {
      const aiSettings = localStorage.getItem('aiSettings')
      const ragSettings = localStorage.getItem('ragSettings')
      
      setSettings({
        aiSettings: aiSettings ? JSON.parse(aiSettings) : null,
        ragSettings: ragSettings ? JSON.parse(ragSettings) : null,
        raw: {
          aiSettings,
          ragSettings
        }
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const enableUnifiedPrompts = () => {
    try {
      const currentAiSettings = localStorage.getItem('aiSettings')
      const parsed = currentAiSettings ? JSON.parse(currentAiSettings) : {}
      
      // Enable unified prompts
      parsed.useUnifiedPrompt = true
      
      localStorage.setItem('aiSettings', JSON.stringify(parsed))
      
      // Reload settings to show the change
      loadSettings()
      
      alert('✅ Unified prompts enabled! Try processing a document now.')
    } catch (error) {
      alert('❌ Error enabling unified prompts: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const disableUnifiedPrompts = () => {
    try {
      const currentAiSettings = localStorage.getItem('aiSettings')
      const parsed = currentAiSettings ? JSON.parse(currentAiSettings) : {}
      
      // Disable unified prompts
      parsed.useUnifiedPrompt = false
      
      localStorage.setItem('aiSettings', JSON.stringify(parsed))
      
      // Reload settings to show the change
      loadSettings()
      
      alert('⚠️ Unified prompts disabled! Will use legacy system.')
    } catch (error) {
      alert('❌ Error disabling unified prompts: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const clearAllSettings = () => {
    if (confirm('Are you sure you want to clear all settings?')) {
      localStorage.removeItem('aiSettings')
      localStorage.removeItem('ragSettings')
      loadSettings()
      alert('🗑️ All settings cleared!')
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading settings...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isUnifiedEnabled = settings?.aiSettings?.useUnifiedPrompt

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            🔧 RAG Settings Debug
            <Badge variant={isUnifiedEnabled ? "default" : "secondary"}>
              {isUnifiedEnabled ? "✅ Unified Enabled" : "❌ Unified Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={enableUnifiedPrompts}
              className="bg-green-600 hover:bg-green-700"
            >
              🚀 Enable Unified Prompts
            </Button>
            <Button 
              onClick={disableUnifiedPrompts}
              variant="outline"
            >
              ⏪ Use Legacy System
            </Button>
            <Button 
              onClick={loadSettings}
              variant="outline"
            >
              🔄 Refresh
            </Button>
            <Button 
              onClick={clearAllSettings}
              variant="destructive"
            >
              🗑️ Clear All
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Current Status:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Unified Prompt Setting: <code>{String(isUnifiedEnabled)}</code></li>
              <li>AI Settings: {settings?.aiSettings ? '✅ Found' : '❌ Missing'}</li>
              <li>RAG Settings: {settings?.ragSettings ? '✅ Found' : '❌ Missing'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Settings Display */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Current Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">AI Settings:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {settings?.aiSettings ? JSON.stringify(settings.aiSettings, null, 2) : 'No AI settings found'}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">RAG Settings:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {settings?.ragSettings ? JSON.stringify(settings.ragSettings, null, 2) : 'No RAG settings found'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Quick Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            After enabling unified prompts, test by:
            <br />1. Upload a document
            <br />2. Check if AI analysis shows formatted output instead of raw JSON
            <br />3. Look for tabbed interface with Summary & Messages, Analysis & Actions, etc.
          </p>
          <Button 
            onClick={() => window.open('/', '_blank')}
            variant="outline"
          >
            🏠 Go to Main App
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
