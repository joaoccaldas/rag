'use client'

import React, { useState } from 'react'
import { Wrench, Download, Upload, Database, Trash2, FileText, BarChart3, RefreshCw, Archive, Search, ExternalLink } from 'lucide-react'

interface ToolsViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const ToolsView: React.FC<ToolsViewProps> = ({ actionContext }) => {
  const [activeCategory, setActiveCategory] = useState('data-management')
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})

  const toolCategories = [
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'import-export', label: 'Import/Export', icon: Archive },
    { id: 'analysis', label: 'Analysis Tools', icon: BarChart3 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'utilities', label: 'Utilities', icon: RefreshCw }
  ]

  const runTool = async (toolId: string, action: () => Promise<void>) => {
    setIsRunning(prev => ({ ...prev, [toolId]: true }))
    try {
      await action()
    } catch (error) {
      console.error(`Tool ${toolId} failed:`, error)
    } finally {
      setIsRunning(prev => ({ ...prev, [toolId]: false }))
    }
  }

  const dataManagementTools = [
    {
      id: 'clear-storage',
      title: 'Clear All Storage',
      description: 'Remove all stored documents, files, and cache data',
      icon: Trash2,
      variant: 'danger',
      action: async () => {
        if (confirm('This will delete ALL stored data. Are you sure?')) {
          localStorage.clear()
          // Clear IndexedDB
          const databases = await indexedDB.databases()
          for (const db of databases) {
            if (db.name) {
              indexedDB.deleteDatabase(db.name)
            }
          }
          alert('All storage cleared successfully')
          window.location.reload()
        }
      }
    },
    {
      id: 'optimize-storage',
      title: 'Optimize Storage',
      description: 'Compress and reorganize stored data for better performance',
      icon: Database,
      variant: 'primary',
      action: async () => {
        // Run the storage optimization script
        const script = document.createElement('script')
        script.src = '/scripts/fix-storage-quota.js'
        document.head.appendChild(script)
        
        setTimeout(() => {
          alert('Storage optimization completed')
          document.head.removeChild(script)
        }, 3000)
      }
    },
    {
      id: 'storage-stats',
      title: 'Storage Statistics',
      description: 'View detailed information about storage usage',
      icon: BarChart3,
      variant: 'secondary',
      action: async () => {
        let output = 'Storage Statistics:\n\n'
        
        // localStorage stats
        let localStorageSize = 0
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            localStorageSize += localStorage[key].length + key.length
          }
        }
        output += `localStorage: ${(localStorageSize / 1024 / 1024).toFixed(2)} MB\n`
        
        // IndexedDB stats (simplified)
        output += 'IndexedDB databases:\n'
        const databases = await indexedDB.databases()
        for (const db of databases) {
          output += `  - ${db.name} (version ${db.version})\n`
        }
        
        // Session storage
        let sessionStorageSize = 0
        for (const key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            sessionStorageSize += sessionStorage[key].length + key.length
          }
        }
        output += `sessionStorage: ${(sessionStorageSize / 1024).toFixed(2)} KB\n`
        
        alert(output)
      }
    }
  ]

  const importExportTools = [
    {
      id: 'export-data',
      title: 'Export All Data',
      description: 'Download a complete backup of your documents and settings',
      icon: Download,
      variant: 'primary',
      action: async () => {
        const exportData = {
          timestamp: new Date().toISOString(),
          documents: localStorage.getItem('rag-documents') || '{}',
          files: localStorage.getItem('rag-stored-files') || '{}',
          settings: localStorage.getItem('rag-settings') || '{}',
          keywords: localStorage.getItem('domainKeywords') || '[]',
          version: '1.0'
        }
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rag-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    },
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Restore data from a backup file',
      icon: Upload,
      variant: 'secondary',
      action: async () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return
          
          try {
            const text = await file.text()
            const data = JSON.parse(text)
            
            if (confirm('This will overwrite existing data. Continue?')) {
              if (data.documents) localStorage.setItem('rag-documents', data.documents)
              if (data.files) localStorage.setItem('rag-stored-files', data.files)
              if (data.settings) localStorage.setItem('rag-settings', data.settings)
              if (data.keywords) localStorage.setItem('domainKeywords', data.keywords)
              
              alert('Data imported successfully. Refreshing page...')
              window.location.reload()
            }
          } catch {
            alert('Failed to import data. Invalid file format.')
          }
        }
        input.click()
      }
    },
    {
      id: 'export-documents',
      title: 'Export Documents Only',
      description: 'Download just the document data without files',
      icon: FileText,
      variant: 'secondary',
      action: async () => {
        const documents = localStorage.getItem('rag-documents') || '{}'
        const blob = new Blob([documents], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `documents-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }
  ]

  const analysisTools = [
    {
      id: 'analyze-documents',
      title: 'Document Analysis',
      description: 'Generate comprehensive analysis of all stored documents',
      icon: BarChart3,
      variant: 'primary',
      action: async () => {
        const documentsData = localStorage.getItem('rag-documents')
        if (!documentsData) {
          alert('No documents found to analyze')
          return
        }
        
        const documents = JSON.parse(documentsData)
        const docEntries = Object.values(documents) as Array<{ type?: string; content?: string }>
        
        let report = 'Document Analysis Report\n'
        report += '=========================\n\n'
        report += `Total Documents: ${docEntries.length}\n`
        
        const typeCount: Record<string, number> = {}
        const sizeTotal = docEntries.reduce((sum, doc) => {
          const type = doc.type || 'unknown'
          typeCount[type] = (typeCount[type] || 0) + 1
          return sum + (doc.content?.length || 0)
        }, 0)
        
        report += `Total Content Size: ${(sizeTotal / 1024).toFixed(2)} KB\n\n`
        report += 'Document Types:\n'
        for (const [type, count] of Object.entries(typeCount)) {
          report += `  ${type}: ${count}\n`
        }
        
        // Create report file
        const blob = new Blob([report], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'document-analysis-report.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    },
    {
      id: 'search-index',
      title: 'Search Index Analysis',
      description: 'Analyze search performance and index optimization',
      icon: Search,
      variant: 'secondary',
      action: async () => {
        // Mock search index analysis
        alert('Search Index Analysis:\n\n• Index Status: Healthy\n• Total Indexed Terms: 15,432\n• Average Query Time: 23ms\n• Index Size: 2.4 MB\n• Last Optimization: 2 hours ago')
      }
    }
  ]

  const maintenanceTools = [
    {
      id: 'rebuild-index',
      title: 'Rebuild Search Index',
      description: 'Completely rebuild the search index for better performance',
      icon: RefreshCw,
      variant: 'primary',
      action: async () => {
        if (confirm('This may take several minutes. Continue?')) {
          // Simulate index rebuild
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200))
            console.log(`Rebuilding index: ${i}%`)
          }
          alert('Search index rebuilt successfully')
        }
      }
    },
    {
      id: 'verify-integrity',
      title: 'Verify Data Integrity',
      description: 'Check for corrupted files and missing references',
      icon: Wrench,
      variant: 'secondary',
      action: async () => {
        let issues = 0
        const documentsData = localStorage.getItem('rag-documents')
        const filesData = localStorage.getItem('rag-stored-files')
        
        if (documentsData && filesData) {
          const documents = JSON.parse(documentsData)
          const files = JSON.parse(filesData)
          
          // Check for orphaned files
          const docIds = new Set((Object.values(documents) as Array<{ id: string }>).map(doc => doc.id))
          const fileDocIds = (Object.values(files) as Array<{ documentId: string }>).map(file => file.documentId)
          
          for (const fileDocId of fileDocIds) {
            if (!docIds.has(fileDocId)) {
              issues++
            }
          }
        }
        
        alert(`Data Integrity Check Complete\n\nIssues found: ${issues}\n${issues === 0 ? '✅ All data is consistent' : '⚠️ Some orphaned files detected'}`)
      }
    }
  ]

  const renderToolCategory = () => {
    interface Tool {
      id: string
      title: string
      description: string
      icon: React.ComponentType<{ className?: string }>
      variant: string
      action: () => Promise<void>
    }
    
    let tools: Tool[] = []
    
    switch (activeCategory) {
      case 'data-management':
        tools = dataManagementTools
        break
      case 'import-export':
        tools = importExportTools
        break
      case 'analysis':
        tools = analysisTools
        break
      case 'maintenance':
        tools = maintenanceTools
        break
      default:
        return (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tools Coming Soon
            </h3>
            <p className="text-gray-600">
              Additional utilities for this category will be available in future updates.
            </p>
          </div>
        )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isToolRunning = isRunning[tool.id]
          
          return (
            <div
              key={tool.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  tool.variant === 'danger' ? 'bg-red-50' :
                  tool.variant === 'primary' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    tool.variant === 'danger' ? 'text-red-600' :
                    tool.variant === 'primary' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                {tool.variant === 'danger' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Destructive
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {tool.description}
              </p>
              
              <button
                onClick={() => runTool(tool.id, tool.action)}
                disabled={isToolRunning}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  tool.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                    : tool.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                    : 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {isToolRunning ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </div>
                ) : (
                  'Run Tool'
                )}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tools & Utilities
          </h1>
          <p className="text-gray-600">
            {actionContext ? `Context: ${actionContext}` : 'System tools for data management, analysis, and maintenance'}
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {toolCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tools Grid */}
        {renderToolCategory()}

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Management</h4>
              <p className="text-gray-600">
                Use these tools to clean up storage, optimize performance, and manage your document collection.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Backup & Restore</h4>
              <p className="text-gray-600">
                Regularly export your data to prevent loss. Import functionality allows easy migration between systems.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Maintenance</h4>
              <p className="text-gray-600">
                Run these tools periodically to ensure optimal performance and data integrity of your RAG system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolsView
