/**
 * ADMIN CONTROL PANEL
 * 
 * Comprehensive admin interface for:
 * - Prompt system migration and management
 * - Database and storage management
 * - System health monitoring
 * - Performance optimization
 */

import React, { useState } from 'react'
import { Settings, Database, Zap, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import StorageResetComponent from './storage-reset-component'
import PromptMigrationComponent from './prompt-migration'
import { PromptEditor } from './prompt-customization/PromptEditor'

interface AdminControlPanelProps {
  className?: string
}

type AdminTab = 'prompt-system' | 'storage-management' | 'system-health' | 'prompt-editor'

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('prompt-system')
  const [systemStatus, setSystemStatus] = useState({
    promptSystemHealth: 'good',
    storageHealth: 'good',
    performanceScore: 85
  })

  const tabs = [
    {
      id: 'prompt-system' as const,
      name: 'Prompt System',
      icon: FileText,
      description: 'Migrate and manage prompt templates'
    },
    {
      id: 'storage-management' as const,
      name: 'Storage',
      icon: Database,
      description: 'Database and storage management'
    },
    {
      id: 'prompt-editor' as const,
      name: 'Prompt Editor',
      icon: Settings,
      description: 'Customize unified prompt template'
    },
    {
      id: 'system-health' as const,
      name: 'System Health',
      icon: Zap,
      description: 'Monitor system performance'
    }
  ]

  const handleMigrationComplete = () => {
    console.log('✅ Prompt migration completed')
    setSystemStatus(prev => ({
      ...prev,
      promptSystemHealth: 'excellent'
    }))
  }

  const handleStorageReset = () => {
    console.log('✅ Storage reset completed')
    setSystemStatus(prev => ({
      ...prev,
      storageHealth: 'excellent'
    }))
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Admin Control Panel
            </h1>
          </div>
          
          {/* System Health Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getHealthIcon(systemStatus.promptSystemHealth)}
              <span className="text-sm text-gray-600 dark:text-gray-400">Prompts</span>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon(systemStatus.storageHealth)}
              <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full ${
                systemStatus.performanceScore >= 80 ? 'bg-green-500' :
                systemStatus.performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {systemStatus.performanceScore}%
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Advanced system administration and maintenance tools
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                    {tab.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'prompt-system' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Prompt System Migration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Migrate from legacy domain-specific prompts to the unified trailer-style prompt system.
                This ensures consistency and improves document analysis quality.
              </p>
            </div>
            
            <PromptMigrationComponent onMigrationComplete={handleMigrationComplete} />
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🚀 Next Level Features
              </h3>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• Unified &ldquo;trailer-style&rdquo; prompts for comprehensive document analysis</li>
                <li>• Better variable substitution and context awareness</li>
                <li>• Improved AI model fallback system with gpt-oss support</li>
                <li>• Enhanced visual content integration</li>
                <li>• Consistent analysis across all document types</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'storage-management' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Database & Storage Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete database wipeout while preserving user profiles and custom prompts.
                Use when visual content shows cached data after database reset.
              </p>
            </div>
            
            <StorageResetComponent onResetComplete={handleStorageReset} />
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ What Gets Preserved
              </h3>
              <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                <li>✅ User profiles and authentication data</li>
                <li>✅ Custom prompt templates and configurations</li>
                <li>✅ AI model preferences and settings</li>
                <li>✅ App preferences and UI customizations</li>
                <li>❌ All documents, visual content, and analysis results</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'prompt-editor' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Unified Prompt Editor
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Customize the unified prompt template that analyzes all documents.
                Create engaging &ldquo;trailer-style&rdquo; prompts that give users complete understanding.
              </p>
            </div>
            
            <PromptEditor className="border-0 shadow-none" />
          </div>
        )}

        {activeTab === 'system-health' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                System Health Monitor
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Monitor system performance, conflicts, and optimization opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Prompt System
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-green-700 dark:text-green-300 text-sm">Status</span>
                  <span className="font-medium text-green-800 dark:text-green-200 capitalize">
                    {systemStatus.promptSystemHealth}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Storage System
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 dark:text-blue-300 text-sm">Status</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200 capitalize">
                    {systemStatus.storageHealth}
                  </span>
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  Performance
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-300 text-sm">Score</span>
                  <span className="font-medium text-purple-800 dark:text-purple-200">
                    {systemStatus.performanceScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">System Optimizations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unified prompt system enabled</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">AI model fallback configured</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Storage cleanup automated</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duplicate ID detection active</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminControlPanel
