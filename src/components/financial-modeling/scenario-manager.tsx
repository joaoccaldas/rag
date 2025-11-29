"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { BridgeInputs, ScenarioDefinition, SCENARIO_TEMPLATES } from '../../services/finance-calculations'
import { Save, Trash2, Copy, Download, Upload, RefreshCw } from 'lucide-react'

interface SavedScenario extends ScenarioDefinition {
  id: string
  createdAt: string
  lastModified: string
  inputs: BridgeInputs
}

interface ScenarioManagerProps {
  currentInputs: BridgeInputs
  onLoadScenario: (inputs: BridgeInputs) => void
  className?: string
}

export function ScenarioManager({ currentInputs, onLoadScenario, className = "" }: ScenarioManagerProps) {
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [newScenarioDescription, setNewScenarioDescription] = useState('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')

  // Load saved scenarios from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bridge-model-scenarios')
    if (saved) {
      try {
        const scenarios = JSON.parse(saved)
        setSavedScenarios(scenarios)
      } catch (error) {
        console.error('Failed to load saved scenarios:', error)
      }
    }
  }, [])

  // Save scenarios to localStorage
  const saveToStorage = (scenarios: SavedScenario[]) => {
    localStorage.setItem('bridge-model-scenarios', JSON.stringify(scenarios))
    setSavedScenarios(scenarios)
  }

  const handleSaveScenario = () => {
    if (!newScenarioName.trim()) return

    const newScenario: SavedScenario = {
      id: `scenario-${Date.now()}`,
      name: newScenarioName.trim(),
      description: newScenarioDescription.trim() || `Custom scenario created on ${new Date().toLocaleDateString()}`,
      inputs: currentInputs,
      riskLevel: selectedRiskLevel,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    const updatedScenarios = [...savedScenarios, newScenario]
    saveToStorage(updatedScenarios)

    setNewScenarioName('')
    setNewScenarioDescription('')
    setShowSaveDialog(false)
  }

  const handleDeleteScenario = (id: string) => {
    const updatedScenarios = savedScenarios.filter(s => s.id !== id)
    saveToStorage(updatedScenarios)
  }

  const handleDuplicateScenario = (scenario: SavedScenario) => {
    const duplicated: SavedScenario = {
      ...scenario,
      id: `scenario-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    const updatedScenarios = [...savedScenarios, duplicated]
    saveToStorage(updatedScenarios)
  }

  const handleLoadTemplate = (templateKey: string) => {
    const template = SCENARIO_TEMPLATES[templateKey]
    if (template) {
      // Merge template inputs with current baseline
      const mergedInputs = {
        ...currentInputs,
        ...template.inputs
      }
      onLoadScenario(mergedInputs)
    }
  }

  const exportScenarios = () => {
    const dataStr = JSON.stringify(savedScenarios, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bridge-model-scenarios-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importScenarios = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const mergedScenarios = [...savedScenarios, ...imported]
          saveToStorage(mergedScenarios)
        }
      } catch (error) {
        console.error('Failed to import scenarios:', error)
      }
    }
    reader.readAsText(file)
  }

  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw size={20} />
            Predefined Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(SCENARIO_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="border-2 hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                    </div>
                    <Badge className={getRiskBadgeColor(template.riskLevel)}>
                      {template.riskLevel}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => handleLoadTemplate(key)} 
                    size="sm" 
                    className="w-full"
                  >
                    Load Scenario
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saved Scenarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Save size={20} />
              Saved Scenarios ({savedScenarios.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save size={14} className="mr-2" />
                Save Current
              </Button>
              <Button variant="outline" size="sm" onClick={exportScenarios}>
                <Download size={14} className="mr-2" />
                Export
              </Button>
              <label className="relative cursor-pointer">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Upload size={14} className="mr-2" />
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={importScenarios}
                />
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {savedScenarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Save size={48} className="mx-auto mb-4 opacity-50" />
              <p>No saved scenarios yet</p>
              <p className="text-sm">Save your current inputs to reuse them later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedScenarios.map((scenario) => (
                <Card key={scenario.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {scenario.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {scenario.description}
                        </p>
                      </div>
                      <Badge className={getRiskBadgeColor(scenario.riskLevel)}>
                        {scenario.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Created: {new Date(scenario.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => onLoadScenario(scenario.inputs)} 
                        size="sm" 
                        className="flex-1"
                      >
                        Load
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDuplicateScenario(scenario)}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Save Current Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name *</Label>
                <Input
                  id="scenario-name"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Q1 2026 Aggressive Growth"
                />
              </div>
              
              <div>
                <Label htmlFor="scenario-description">Description</Label>
                <Input
                  id="scenario-description"
                  value={newScenarioDescription}
                  onChange={(e) => setNewScenarioDescription(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              
              <div>
                <Label htmlFor="risk-level">Risk Level</Label>
                <select
                  id="risk-level"
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveScenario} disabled={!newScenarioName.trim()}>
                  Save Scenario
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
