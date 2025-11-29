/**
 * PROMPT SYSTEM MIGRATION UTILITY
 * 
 * Helps migrate from legacy domain-specific prompts to unified prompt system
 * Provides backwards compatibility during transition period
 */

import React, { useState, useEffect } from 'react'
import { ChevronRight, CheckCircle, AlertTriangle, Download, Upload } from 'lucide-react'
import { usePromptTemplates } from '../contexts/PromptTemplateContext'
import UnifiedPromptManager from '../utils/unified-prompt-manager'
import PromptSystemManager from '../utils/prompt-system-interface'

interface MigrationStatus {
  legacyTemplatesFound: number
  migrationCompleted: number
  migrationFailed: number
  unifiedTemplatesCount: number
}

interface MigrationComponentProps {
  onMigrationComplete?: () => void
  className?: string
}

export const PromptMigrationComponent: React.FC<MigrationComponentProps> = ({
  onMigrationComplete,
  className = ''
}) => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    legacyTemplatesFound: 0,
    migrationCompleted: 0,
    migrationFailed: 0,
    unifiedTemplatesCount: 0
  })
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationLog, setMigrationLog] = useState<string[]>([])

  const { templates: legacyTemplates } = usePromptTemplates()
  const promptSystemManager = PromptSystemManager.getInstance()

  // Check current status on mount
  useEffect(() => {
    const updateStatus = () => {
      const customTemplates = legacyTemplates.filter(t => !t.isDefault)
      const unifiedTemplate = UnifiedPromptManager.getCurrentPrompt()
      
      setMigrationStatus({
        legacyTemplatesFound: customTemplates.length,
        migrationCompleted: 0, // Would need to track this separately
        migrationFailed: 0,
        unifiedTemplatesCount: unifiedTemplate ? 1 : 0
      })
    }
    
    updateStatus()
  }, [legacyTemplates])

  const handleMigration = async () => {
    setIsMigrating(true)
    setMigrationLog([])
    
    const logs: string[] = []
    let completed = 0
    let failed = 0

    try {
      const customTemplates = legacyTemplates.filter(t => !t.isDefault)
      
      logs.push(`🔄 Starting migration of ${customTemplates.length} legacy templates...`)
      
      for (const template of customTemplates) {
        try {
          const success = promptSystemManager.migrateLegacyTemplate(template)
          if (success) {
            completed++
            logs.push(`✅ Migrated: ${template.name} (${template.domain} domain)`)
          } else {
            failed++
            logs.push(`❌ Failed: ${template.name}`)
          }
        } catch (error) {
          failed++
          logs.push(`❌ Error migrating ${template.name}: ${error}`)
        }
      }

      logs.push(`🎉 Migration complete: ${completed} successful, ${failed} failed`)
      
      setMigrationStatus(prev => ({
        ...prev,
        migrationCompleted: completed,
        migrationFailed: failed
      }))

      onMigrationComplete?.()
      
    } catch (error) {
      logs.push(`💥 Migration failed: ${error}`)
    }

    setMigrationLog(logs)
    setIsMigrating(false)
  }

  const handleExportLegacy = () => {
    const customTemplates = legacyTemplates.filter(t => !t.isDefault)
    const exportData = JSON.stringify(customTemplates, null, 2)
    
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `legacy-prompt-templates-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportUnified = () => {
    const exportData = UnifiedPromptManager.exportTemplate()
    
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unified-prompt-template-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const canMigrate = migrationStatus.legacyTemplatesFound > 0 && !isMigrating

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <ChevronRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Prompt System Migration</h2>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {migrationStatus.legacyTemplatesFound}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Legacy Templates</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {migrationStatus.migrationCompleted}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Migrated</div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {migrationStatus.migrationFailed}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {migrationStatus.unifiedTemplatesCount}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Unified Templates</div>
        </div>
      </div>

      {/* Migration Status */}
      <div className="mb-6">
        {migrationStatus.legacyTemplatesFound === 0 ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>No legacy templates found - system is up to date</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{migrationStatus.legacyTemplatesFound} legacy templates need migration</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleMigration}
          disabled={!canMigrate}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          {isMigrating ? 'Migrating...' : 'Migrate All'}
        </button>

        <button
          onClick={handleExportLegacy}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Legacy
        </button>

        <button
          onClick={handleExportUnified}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Unified
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {/* Migration Log */}
      {migrationLog.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Migration Log</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {migrationLog.map((log, index) => (
              <div
                key={index}
                className={`text-sm font-mono ${
                  log.includes('✅') ? 'text-green-600 dark:text-green-400' :
                  log.includes('❌') ? 'text-red-600 dark:text-red-400' :
                  log.includes('🎉') ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Migration Recommendations</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {promptSystemManager.getMigrationRecommendations().map((rec, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PromptMigrationComponent
