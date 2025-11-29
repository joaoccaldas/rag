/**
 * Action Toolbar Component - Handles view controls and bulk actions
 */

"use client"

import React from 'react'
import { Grid3X3, List, Download, Trash2, MoreHorizontal, CheckSquare } from 'lucide-react'
import { ActionToolbarProps } from './types'

export function ActionToolbar({
  selection,
  viewMode,
  displayMode,
  onDisplayModeChange,
  onBulkAction,
  onToggleSelectMode
}: ActionToolbarProps) {
  const hasSelection = selection.selectedIds.size > 0

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        
        {/* Left: Selection and Bulk Actions */}
        <div className="flex items-center space-x-3">
          {hasSelection ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selection.selectedIds.size} selected
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onBulkAction('download')}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
                
                <button
                  onClick={() => onBulkAction('delete')}
                  className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
                
                <button
                  onClick={() => onBulkAction('more')}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  More
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onToggleSelectMode}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select
            </button>
          )}
        </div>

        {/* Right: View Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Display Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              onClick={() => onDisplayModeChange('grid')}
              className={`p-2 ${
                displayMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDisplayModeChange('list')}
              className={`p-2 ${
                displayMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* View Mode Indicators */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === 'hybrid' && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                All Features
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
