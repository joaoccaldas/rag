// Model Importer Component
// Allows importing fine-tuned models and converting them to Ollama format

'use client'

import React, { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Cpu, Download, Trash2, RefreshCw } from 'lucide-react'

interface FineTunedModel {
  id: string
  name: string
  path: string
  baseModel: string
  size: number
  type: 'lora' | 'full'
  dateCreated: string
  status: 'pending' | 'processing' | 'converted' | 'error'
  ollamaName?: string
  checkpoints?: string[]
  config?: {
    loraRank?: number
    loraAlpha?: number
    targetModules?: string[]
  }
}

interface ConversionProgress {
  step: string
  progress: number
  message: string
}

export default function ModelImporter() {
  const [models, setModels] = useState<FineTunedModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>('final_model')
  const [isScanning, setIsScanning] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('')
  const [customPath, setCustomPath] = useState('')
  const [showCustomPath, setShowCustomPath] = useState(false)

  // Scan for fine-tuned models on mount
  useEffect(() => {
    scanForModels()
    loadOllamaModels()
  }, [])

  const scanForModels = async () => {
    setIsScanning(true)
    try {
      const response = await fetch('/api/models/scan-finetuned')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to scan models:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const loadOllamaModels = async () => {
    try {
      const response = await fetch('/api/models/ollama-list')
      if (response.ok) {
        const data = await response.json()
        setOllamaModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error)
    }
  }

  const convertToOllama = async () => {
    if (!selectedModel) return

    const model = models.find(m => m.id === selectedModel)
    if (!model) return

    setIsConverting(true)
    setConversionProgress({
      step: 'init',
      progress: 0,
      message: 'Starting conversion...'
    })

    try {
      const response = await fetch('/api/models/convert-to-ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          checkpoint: selectedCheckpoint,
          customName: model.name
        })
      })

      if (!response.ok) {
        throw new Error('Conversion failed')
      }

      // Stream progress updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            setConversionProgress(data)

            if (data.step === 'complete') {
              // Update model status
              setModels(prev => prev.map(m =>
                m.id === selectedModel
                  ? { ...m, status: 'converted', ollamaName: data.ollamaName }
                  : m
              ))
              await loadOllamaModels()
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Conversion error:', error)
      setConversionProgress({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Conversion failed'
      })
    } finally {
      setIsConverting(false)
      setTimeout(() => setConversionProgress(null), 3000)
    }
  }

  const addCustomPath = async () => {
    if (!customPath) return

    setIsScanning(true)
    try {
      const response = await fetch('/api/models/add-custom-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: customPath })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.model) {
          setModels(prev => [...prev, data.model])
          setCustomPath('')
          setShowCustomPath(false)
        }
      }
    } catch (error) {
      console.error('Failed to add custom path:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to remove this model from the list?')) return

    setModels(prev => prev.filter(m => m.id !== modelId))
  }

  const setAsActiveModel = async (ollamaName: string) => {
    try {
      // Update RAG settings to use this model
      const settings = JSON.parse(localStorage.getItem('miele-rag-settings') || '{}')
      settings.selectedModel = ollamaName
      localStorage.setItem('miele-rag-settings', JSON.stringify(settings))

      setSelectedOllamaModel(ollamaName)
      alert(`✅ Model "${ollamaName}" set as active chatbot!`)
    } catch (error) {
      console.error('Failed to set active model:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const selectedModelData = models.find(m => m.id === selectedModel)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fine-Tuned Model Importer
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Import your fine-tuned models and convert them to Ollama format
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={scanForModels}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isScanning ? 'Scanning...' : 'Scan for Models'}
          </button>
          <button
            onClick={() => setShowCustomPath(!showCustomPath)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Add Custom Path
          </button>
        </div>
      </div>

      {/* Custom Path Input */}
      {showCustomPath && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model Directory Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="C:\path\to\your\fine-tuned-model"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={addCustomPath}
              disabled={!customPath || isScanning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Supports: Hugging Face format (with adapter_model.safetensors), GGUF files
          </p>
        </div>
      )}

      {/* Models List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {models.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No fine-tuned models found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Click "Scan for Models" or add a custom path
            </p>
          </div>
        ) : (
          models.map((model) => (
            <div
              key={model.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedModel === model.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {model.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Base: {model.baseModel}
                  </p>
                </div>
                <div className="flex gap-1">
                  {model.status === 'converted' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {model.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {model.status === 'processing' && (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteModel(model.id)
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {model.type === 'lora' ? 'LoRA Adapter' : 'Full Model'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatSize(model.size)}
                  </span>
                </div>
                {model.config && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">LoRA Rank:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {model.config.loraRank} (alpha: {model.config.loraAlpha})
                    </span>
                  </div>
                )}
                {model.ollamaName && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Ollama: <span className="font-mono text-blue-600 dark:text-blue-400">{model.ollamaName}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAsActiveModel(model.ollamaName!)
                        }}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Use as Chatbot
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {model.checkpoints && model.checkpoints.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {model.checkpoints.length} checkpoints available
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Conversion Panel */}
      {selectedModelData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Convert to Ollama Format
          </h3>

          {/* Checkpoint Selector */}
          {selectedModelData.checkpoints && selectedModelData.checkpoints.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Checkpoint
              </label>
              <select
                value={selectedCheckpoint}
                onChange={(e) => setSelectedCheckpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="final_model">Final Model (Recommended)</option>
                {selectedModelData.checkpoints.map((checkpoint) => (
                  <option key={checkpoint} value={checkpoint}>
                    {checkpoint}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conversion Progress */}
          {conversionProgress && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                {conversionProgress.step === 'complete' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : conversionProgress.step === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  {conversionProgress.message}
                </span>
              </div>
              {conversionProgress.progress > 0 && conversionProgress.progress < 100 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${conversionProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Conversion Steps Info */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Conversion Process:
            </h4>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Load base model ({selectedModelData.baseModel})</li>
              <li>Load fine-tuned adapter weights</li>
              <li>Merge adapter into base model</li>
              <li>Convert to GGUF format (Ollama compatible)</li>
              <li>Import into Ollama</li>
            </ol>
          </div>

          {/* Convert Button */}
          <button
            onClick={convertToOllama}
            disabled={isConverting || selectedModelData.status === 'converted'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Converting...
              </>
            ) : selectedModelData.status === 'converted' ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Already Converted
              </>
            ) : (
              <>
                <Cpu className="h-5 w-5" />
                Convert to Ollama
              </>
            )}
          </button>

          {selectedModelData.status === 'converted' && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-3">
              Model is ready! Click "Use as Chatbot" to activate it.
            </p>
          )}
        </div>
      )}

      {/* Available Ollama Models */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Available Ollama Models
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {ollamaModels.length === 0 ? (
            <p className="col-span-full text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No models available
            </p>
          ) : (
            ollamaModels.map((modelName) => (
              <div
                key={modelName}
                className="px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm font-mono truncate"
                title={modelName}
              >
                {modelName}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
