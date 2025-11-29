// Document Type Manager Component
// React component for managing and displaying document type configurations

import React, { useState, useMemo } from 'react'
import { 
  DOCUMENT_TYPE_CONFIGS, 
  DocumentTypeConfig,
  getSupportedExtensions,
  getConfigsByCategory,
  getHighPriorityConfigs,
  getRequiredLibraries
} from './document-types-config'

interface DocumentTypeManagerProps {
  onTypeSelect?: (config: DocumentTypeConfig) => void
  selectedTypes?: string[]
  showDetails?: boolean
}

export const DocumentTypeManager: React.FC<DocumentTypeManagerProps> = ({
  onTypeSelect,
  selectedTypes = [],
  showDetails = true
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSupportLevel, setActiveSupportLevel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = useMemo(() => {
    const cats = [...new Set(Object.values(DOCUMENT_TYPE_CONFIGS).map(config => config.category))]
    return ['all', ...cats]
  }, [])

  const supportLevels = useMemo(() => {
    const levels = [...new Set(Object.values(DOCUMENT_TYPE_CONFIGS).map(config => config.supportLevel))]
    return ['all', ...levels]
  }, [])

  const filteredConfigs = useMemo(() => {
    let configs = Object.values(DOCUMENT_TYPE_CONFIGS)

    if (activeCategory !== 'all') {
      configs = getConfigsByCategory(activeCategory as DocumentTypeConfig['category'])
    }

    if (activeSupportLevel !== 'all') {
      configs = configs.filter(config => config.supportLevel === activeSupportLevel)
    }

    if (searchTerm) {
      configs = configs.filter(config => 
        config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.extensions.some(ext => ext.includes(searchTerm.toLowerCase()))
      )
    }

    return configs
  }, [activeCategory, activeSupportLevel, searchTerm])

  const statistics = useMemo(() => {
    const total = Object.keys(DOCUMENT_TYPE_CONFIGS).length
    const byCategory = Object.groupBy(Object.values(DOCUMENT_TYPE_CONFIGS), config => config.category)
    const bySupportLevel = Object.groupBy(Object.values(DOCUMENT_TYPE_CONFIGS), config => config.supportLevel)
    const highPriority = getHighPriorityConfigs().length
    const totalExtensions = getSupportedExtensions().length
    const requiredLibs = getRequiredLibraries().length

    return {
      total,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([key, value]) => [key, value?.length || 0])
      ),
      bySupportLevel: Object.fromEntries(
        Object.entries(bySupportLevel).map(([key, value]) => [key, value?.length || 0])
      ),
      highPriority,
      totalExtensions,
      requiredLibs
    }
  }, [])

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'text-green-600 bg-green-100'
      case 'partial': return 'text-yellow-600 bg-yellow-100'
      case 'experimental': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="document-type-manager p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Document Type Management</h2>
        <p className="text-gray-600">Configure and manage supported document types and their processing strategies</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
          <div className="text-sm text-blue-800">Total Types</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statistics.highPriority}</div>
          <div className="text-sm text-green-800">High Priority</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{statistics.totalExtensions}</div>
          <div className="text-sm text-purple-800">Extensions</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{statistics.requiredLibs}</div>
          <div className="text-sm text-orange-800">Libraries</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search document types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={activeSupportLevel}
          onChange={(e) => setActiveSupportLevel(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {supportLevels.map(level => (
            <option key={level} value={level}>
              {level === 'all' ? 'All Support Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Document Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConfigs.map(config => (
          <div
            key={config.type}
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
              selectedTypes.includes(config.type)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onTypeSelect?.(config)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{config.displayName}</h3>
                <p className="text-sm text-gray-600">{config.type}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getSupportLevelColor(config.supportLevel)}`}>
                  {config.supportLevel}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(config.priority)}`}>
                  {config.priority}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{config.description}</p>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Extensions:</div>
              <div className="flex flex-wrap gap-1">
                {config.extensions.map(ext => (
                  <span key={ext} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {showDetails && (
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Category:</span> {config.category}
                </div>
                <div>
                  <span className="font-medium">Max Size:</span> {config.maxSize}MB
                </div>
                <div>
                  <span className="font-medium">Chunking:</span> {config.processingPipeline.chunking.method}
                </div>
                <div>
                  <span className="font-medium">Visual Extraction:</span> {
                    config.processingPipeline.visualExtraction.enabled ? 'Enabled' : 'Disabled'
                  }
                </div>
                {config.libraryDependencies.length > 0 && (
                  <div>
                    <span className="font-medium">Dependencies:</span> {config.libraryDependencies.join(', ')}
                  </div>
                )}
                {config.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800">
                    <span className="font-medium">Note:</span> {config.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No document types found</div>
          <div className="text-gray-500">Try adjusting your search or filter criteria</div>
        </div>
      )}

      {/* Support Level Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Support Level Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-green-600 bg-green-100">full</span>
            <span className="text-gray-600">Complete implementation with all features</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-yellow-600 bg-yellow-100">partial</span>
            <span className="text-gray-600">Basic functionality, some features missing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-red-600 bg-red-100">experimental</span>
            <span className="text-gray-600">In development, may have issues</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentTypeManager
