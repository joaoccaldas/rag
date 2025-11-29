/**
 * Screenshot Manager Component
 * 
 * UI component for viewing, managing, and downloading screenshots generated
 * during document processing.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Download, 
  Trash2, 
  Eye, 
  Grid,
  List,
  Search,
  Camera,
  FileImage,
  BarChart3,
  Table,
  Workflow
} from 'lucide-react'
import { screenshotGenerator, type ScreenshotMetadata, ScreenshotUtils } from '../rag/utils/screenshot-generation'
import type { EnhancedVisualType } from '../rag/utils/enhanced-visual-analysis'

interface ScreenshotManagerProps {
  documentId?: string
  isOpen: boolean
  onClose: () => void
}

export function ScreenshotManager({ documentId, isOpen, onClose }: ScreenshotManagerProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotMetadata[]>([])
  const [filteredScreenshots, setFilteredScreenshots] = useState<ScreenshotMetadata[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<EnhancedVisualType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotMetadata | null>(null)
  const [stats, setStats] = useState<ReturnType<typeof screenshotGenerator.getScreenshotStats> | null>(null)
  
  const loadScreenshots = useCallback(() => {
    const allScreenshots = documentId 
      ? screenshotGenerator.getDocumentScreenshots(documentId)
      : [] // Simplified for now
    
    setScreenshots(allScreenshots)
  }, [documentId])
  
  const loadStats = useCallback(() => {
    const statsData = screenshotGenerator.getScreenshotStats()
    setStats(statsData)
  }, [])
  
  const applyFilters = useCallback(() => {
    let filtered = screenshots
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(screenshot => 
        screenshot.elementContext.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screenshot.elementContext.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screenshot.elementType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(screenshot => screenshot.elementType === selectedType)
    }
    
    setFilteredScreenshots(filtered)
  }, [screenshots, searchTerm, selectedType])
  
  useEffect(() => {
    if (isOpen) {
      loadScreenshots()
      loadStats()
    }
  }, [isOpen, loadScreenshots, loadStats])
  
  useEffect(() => {
    applyFilters()
  }, [applyFilters])
  
  const handleDownload = async (screenshot: ScreenshotMetadata) => {
    try {
      await ScreenshotUtils.downloadScreenshot(screenshot)
    } catch (error) {
      console.error('Failed to download screenshot:', error)
    }
  }
  
  const handleDelete = (screenshotId: string) => {
    if (confirm('Are you sure you want to delete this screenshot?')) {
      screenshotGenerator.deleteScreenshot(screenshotId)
      loadScreenshots()
      loadStats()
    }
  }
  
  const handleBatchDownload = async () => {
    for (const screenshot of filteredScreenshots) {
      if (screenshot.processingInfo.success) {
        await ScreenshotUtils.downloadScreenshot(screenshot)
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
  
  const getTypeIcon = (type: EnhancedVisualType) => {
    switch (type) {
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
      case 'scatter_plot':
        return <BarChart3 className="w-4 h-4" />
      case 'data_table':
      case 'comparison_table':
      case 'summary_table':
        return <Table className="w-4 h-4" />
      case 'flowchart':
      case 'org_chart':
      case 'process_diagram':
      case 'mind_map':
        return <Workflow className="w-4 h-4" />
      default:
        return <FileImage className="w-4 h-4" />
    }
  }
  
  const getTypeColor = (type: EnhancedVisualType): string => {
    if (type.includes('chart') || type.includes('plot')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (type.includes('table')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (type.includes('chart') || type.includes('diagram') || type.includes('map')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Screenshot Manager
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {documentId ? `Screenshots for current document` : 'All screenshots'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Statistics */}
        {stats && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalScreenshots}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Screenshots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {ScreenshotUtils.formatFileSize(stats.totalSize)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(stats.successRate * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Object.keys(stats.byDocument).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Documents</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search screenshots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EnhancedVisualType | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="bar_chart">Bar Charts</option>
              <option value="line_chart">Line Charts</option>
              <option value="pie_chart">Pie Charts</option>
              <option value="data_table">Data Tables</option>
              <option value="flowchart">Flowcharts</option>
              <option value="photo">Photos</option>
              <option value="illustration">Illustrations</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Batch Actions */}
          {filteredScreenshots.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download All ({filteredScreenshots.length})
              </button>
            </div>
          )}
        </div>
        
        {/* Screenshots Grid/List */}
        <div className="flex-1 overflow-auto p-4">
          {filteredScreenshots.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No screenshots found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Screenshots will appear here when generated during document processing'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScreenshots.map((screenshot) => (
                <ScreenshotCard
                  key={screenshot.id}
                  screenshot={screenshot}
                  onView={() => setSelectedScreenshot(screenshot)}
                  onDownload={() => handleDownload(screenshot)}
                  onDelete={() => handleDelete(screenshot.id)}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScreenshots.map((screenshot) => (
                <ScreenshotListItem
                  key={screenshot.id}
                  screenshot={screenshot}
                  onView={() => setSelectedScreenshot(screenshot)}
                  onDownload={() => handleDownload(screenshot)}
                  onDelete={() => handleDelete(screenshot.id)}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <ScreenshotPreview
          screenshot={selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </div>
  )
}

// Screenshot Card Component
function ScreenshotCard({ 
  screenshot, 
  onView, 
  onDownload, 
  onDelete, 
  getTypeIcon, 
  getTypeColor 
}: {
  screenshot: ScreenshotMetadata
  onView: () => void
  onDownload: () => void
  onDelete: () => void
  getTypeIcon: (type: EnhancedVisualType) => React.ReactNode
  getTypeColor: (type: EnhancedVisualType) => string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Screenshot Preview */}
      <div 
        className="aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer relative group"
        onClick={onView}
      >
        {screenshot.processingInfo.success ? (
          <img
            src={screenshot.screenshot.base64}
            alt={screenshot.elementContext.title || 'Screenshot'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <FileImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Failed to capture</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getTypeIcon(screenshot.elementType)}
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(screenshot.elementType)}`}>
            {screenshot.elementType.replace('_', ' ')}
          </span>
        </div>
        
        <h4 className="font-medium text-gray-900 dark:text-white truncate mb-1">
          {screenshot.elementContext.title || 'Untitled'}
        </h4>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {screenshot.elementContext.description || 'No description'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>{ScreenshotUtils.formatFileSize(screenshot.screenshot.fileSize)}</span>
          <span>{screenshot.screenshot.width} × {screenshot.screenshot.height}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            View
          </button>
          <button
            onClick={onDownload}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Screenshot List Item Component
function ScreenshotListItem({ 
  screenshot, 
  onView, 
  onDownload, 
  onDelete, 
  getTypeIcon, 
  getTypeColor 
}: {
  screenshot: ScreenshotMetadata
  onView: () => void
  onDownload: () => void
  onDelete: () => void
  getTypeIcon: (type: EnhancedVisualType) => React.ReactNode
  getTypeColor: (type: EnhancedVisualType) => string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div 
          className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer flex-shrink-0"
          onClick={onView}
        >
          {screenshot.processingInfo.success ? (
            <img
              src={screenshot.screenshot.base64}
              alt={screenshot.elementContext.title || 'Screenshot'}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileImage className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon(screenshot.elementType)}
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(screenshot.elementType)}`}>
              {screenshot.elementType.replace('_', ' ')}
            </span>
          </div>
          
          <h4 className="font-medium text-gray-900 dark:text-white truncate mb-1">
            {screenshot.elementContext.title || 'Untitled'}
          </h4>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
            {screenshot.elementContext.description || 'No description'}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{ScreenshotUtils.formatFileSize(screenshot.screenshot.fileSize)}</span>
            <span>{screenshot.screenshot.width} × {screenshot.screenshot.height}</span>
            <span>{new Date(screenshot.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            View
          </button>
          <button
            onClick={onDownload}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Screenshot Preview Modal
function ScreenshotPreview({ 
  screenshot, 
  onClose 
}: {
  screenshot: ScreenshotMetadata
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {screenshot.elementContext.title || 'Screenshot Preview'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Image */}
        <div className="p-4">
          {screenshot.processingInfo.success ? (
            <img
              src={screenshot.screenshot.base64}
              alt={screenshot.elementContext.title || 'Screenshot'}
              className="w-full h-auto max-h-[60vh] object-contain mx-auto rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Screenshot failed to generate</p>
                {screenshot.processingInfo.errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {screenshot.processingInfo.errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Metadata */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Type:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {screenshot.elementType.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Size:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {screenshot.screenshot.width} × {screenshot.screenshot.height}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">File Size:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {ScreenshotUtils.formatFileSize(screenshot.screenshot.fileSize)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Format:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {screenshot.screenshot.format.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Processing Time:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {Math.round(screenshot.processingInfo.processingTime)}ms
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Created:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {new Date(screenshot.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          
          {screenshot.elementContext.description && (
            <div className="mt-4">
              <span className="font-medium text-gray-900 dark:text-white">Description:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {screenshot.elementContext.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
