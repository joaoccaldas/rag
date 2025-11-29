/**
 * Filter Panel Component - Advanced filtering for documents
 */

"use client"

import React from 'react'
import { Filter, X, Calendar, Tag, FileType } from 'lucide-react'
import { FilterPanelProps } from './types'

export function FilterPanel({
  filters,
  onFiltersChange,
  documentTypes,
  availableTags,
  isExpanded,
  onToggleExpanded
}: FilterPanelProps) {
  if (!isExpanded) {
    return (
      <button
        onClick={onToggleExpanded}
        className="p-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <Filter className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
        <button
          onClick={onToggleExpanded}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Document Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileType className="inline h-4 w-4 mr-1" />
            Document Types
          </label>
          <div className="space-y-2">
            {documentTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.documentTypes.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.documentTypes, type]
                      : filters.documentTypes.filter(t => t !== type)
                    onFiltersChange({ documentTypes: newTypes })
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {availableTags.map((tag) => (
                <label key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={(e) => {
                      const newTags = e.target.checked
                        ? [...filters.tags, tag]
                        : filters.tags.filter(t => t !== tag)
                      onFiltersChange({ tags: newTags })
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null
                onFiltersChange({ 
                  dateRange: { ...filters.dateRange, start: date }
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null
                onFiltersChange({ 
                  dateRange: { ...filters.dateRange, end: date }
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Similarity Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Similarity Threshold: {Math.round(filters.minSimilarity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filters.minSimilarity}
            onChange={(e) => onFiltersChange({ minSimilarity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Max Results */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Results
          </label>
          <select
            value={filters.maxResults}
            onChange={(e) => onFiltersChange({ maxResults: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <div className="space-y-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ sortBy: e.target.value as 'name' | 'uploadedAt' | 'size' | 'relevance' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="uploadedAt">Upload Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="relevance">Relevance</option>
            </select>
            <div className="flex space-x-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={filters.sortOrder === 'asc'}
                  onChange={() => onFiltersChange({ sortOrder: 'asc' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">Ascending</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={filters.sortOrder === 'desc'}
                  onChange={() => onFiltersChange({ sortOrder: 'desc' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">Descending</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onFiltersChange({
            searchQuery: '',
            documentTypes: [],
            status: [],
            dateRange: { start: null, end: null },
            tags: [],
            minSimilarity: 0.7,
            maxResults: 50,
            sortBy: 'uploadedAt',
            sortOrder: 'desc'
          })}
          className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )
}
