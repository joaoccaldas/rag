/**
 * Database Export/Import UI Component
 * User interface for database backup and restore operations
 */

"use client"

import React, { useState, useCallback } from 'react'
import { Download, Upload, Database, Settings, History, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { databaseExportImport, ExportOptions, ImportOptions } from '../../utils/database-export-import'

interface ExportImportPanelProps {
  className?: string
}

export function DatabaseExportImportPanel({ className = '' }: ExportImportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string>('')
  const [importProgress, setImportProgress] = useState<string>('')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeFiles: true,
    includeAnalytics: true,
    includeHistory: true,
    includeSettings: true,
    compressionLevel: 'standard'
  })
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    skipDuplicates: true,
    preserveSettings: false,
    validateData: true
  })
  const [lastExport, setLastExport] = useState<string>('')
  const [lastImport, setLastImport] = useState<string>('')

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      setExportProgress('Preparing export...')
      
      const exportBlob = await databaseExportImport.exportDatabase(exportOptions)
      
      setExportProgress('Creating download...')
      
      // Create download
      const url = URL.createObjectURL(exportBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rag-database-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setLastExport(new Date().toLocaleString())
      setExportProgress('Export completed successfully!')
      
      setTimeout(() => setExportProgress(''), 3000)
    } catch (error) {
      console.error('Export failed:', error)
      setExportProgress(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setExportProgress(''), 5000)
    } finally {
      setIsExporting(false)
    }
  }, [exportOptions])

  const handleImport = useCallback(async (file: File) => {
    try {
      setIsImporting(true)
      setImportProgress('Reading import file...')
      
      await databaseExportImport.importDatabase(file, importOptions)
      
      setLastImport(new Date().toLocaleString())
      setImportProgress('Import completed successfully!')
      
      setTimeout(() => {
        setImportProgress('')
        // Refresh page to load new data
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Import failed:', error)
      setImportProgress(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setImportProgress(''), 5000)
    } finally {
      setIsImporting(false)
    }
  }, [importOptions])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }, [handleImport])

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Database Export/Import</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Database
          </h3>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">What to include:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFiles}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeFiles: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Documents & Files</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeAnalytics}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Analytics Data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeHistory}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeHistory: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <History className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Search History</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSettings}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">User Settings</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Compression Level:</label>
              <select
                value={exportOptions.compressionLevel}
                onChange={(e) => setExportOptions(prev => ({ ...prev, compressionLevel: e.target.value as any }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="none">None (Faster)</option>
                <option value="standard">Standard</option>
                <option value="maximum">Maximum (Smaller file)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Database
              </>
            )}
          </button>

          {exportProgress && (
            <div className={`text-sm p-3 rounded-md ${
              exportProgress.includes('failed') || exportProgress.includes('error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : exportProgress.includes('completed')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {exportProgress.includes('failed') || exportProgress.includes('error') ? (
                <AlertTriangle className="w-4 h-4 inline mr-2" />
              ) : exportProgress.includes('completed') ? (
                <CheckCircle className="w-4 h-4 inline mr-2" />
              ) : null}
              {exportProgress}
            </div>
          )}

          {lastExport && (
            <div className="text-xs text-gray-500">
              Last export: {lastExport}
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Database
          </h3>

          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Import Options:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.overwriteExisting}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Overwrite existing data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Skip duplicates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.preserveSettings}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, preserveSettings: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Keep current settings</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.validateData}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Validate import data</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
              id="import-file-input"
            />
            <label
              htmlFor="import-file-input"
              className={`cursor-pointer flex flex-col items-center gap-2 ${
                isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-sm">
                <span className="font-medium">Click to select export file</span>
                <div className="text-gray-500">JSON files only</div>
              </div>
            </label>
          </div>

          {importProgress && (
            <div className={`text-sm p-3 rounded-md ${
              importProgress.includes('failed') || importProgress.includes('error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : importProgress.includes('completed')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {importProgress.includes('failed') || importProgress.includes('error') ? (
                <AlertTriangle className="w-4 h-4 inline mr-2" />
              ) : importProgress.includes('completed') ? (
                <CheckCircle className="w-4 h-4 inline mr-2" />
              ) : null}
              {importProgress}
            </div>
          )}

          {lastImport && (
            <div className="text-xs text-gray-500">
              Last import: {lastImport}
            </div>
          )}
        </div>
      </div>

      {/* Warning Section */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800">Important Notes:</div>
            <ul className="mt-1 text-yellow-700 space-y-1">
              <li>• Export includes all documents, embeddings, and user data</li>
              <li>• Import will create a backup before applying changes</li>
              <li>• Large databases may take several minutes to export/import</li>
              <li>• Page will refresh after successful import to load new data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
