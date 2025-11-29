/**
 * Advanced Metadata Filtering - Component Only
 * 
 * Provides a sophisticated UI for filtering documents based on metadata.
 */

'use client'

import React, { useState, useEffect } from 'react'

interface SimpleFilterCriteria {
  id: string
  field: string
  operator: string
  value: string | number | boolean | Date
  type: string
}

interface FilterProps {
  onFiltersChange?: (filters: SimpleFilterCriteria[]) => void
  availableFields?: Array<{
    field: string
    label: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: Array<{ value: string; label: string }>
  }>
}

export const MetadataFiltering: React.FC<FilterProps> = ({
  onFiltersChange,
  availableFields = []
}) => {
  const [filters, setFilters] = useState<SimpleFilterCriteria[]>([])
  const [showAddFilter, setShowAddFilter] = useState(false)

  // Default filter fields
  const defaultFields = [
    {
      field: 'type',
      label: 'Document Type',
      type: 'select' as const,
      options: [
        { value: 'pdf', label: 'PDF' },
        { value: 'txt', label: 'Text' },
        { value: 'docx', label: 'Word' },
        { value: 'md', label: 'Markdown' }
      ]
    },
    {
      field: 'created',
      label: 'Creation Date',
      type: 'date' as const
    },
    {
      field: 'author',
      label: 'Author',
      type: 'text' as const
    },
    {
      field: 'size',
      label: 'File Size (KB)',
      type: 'number' as const
    }
  ]

  const fields = availableFields.length > 0 ? availableFields : defaultFields

  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const addFilter = () => {
    const newFilter: SimpleFilterCriteria = {
      id: `filter_${Date.now()}`,
      field: fields[0]?.field || 'type',
      operator: 'equals',
      value: '',
      type: fields[0]?.type || 'text'
    }
    setFilters([...filters, newFilter])
    setShowAddFilter(false)
  }

  const updateFilter = (id: string, updates: Partial<SimpleFilterCriteria>) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id))
  }

  const clearAllFilters = () => {
    setFilters([])
  }

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'starts_with', label: 'Starts with' },
          { value: 'ends_with', label: 'Ends with' }
        ]
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater_than', label: 'Greater than' },
          { value: 'less_than', label: 'Less than' }
        ]
      case 'date':
        return [
          { value: 'equals', label: 'On' },
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' }
        ]
      case 'select':
        return [
          { value: 'equals', label: 'Is' },
          { value: 'not_equals', label: 'Is not' }
        ]
      default:
        return [{ value: 'equals', label: 'Equals' }]
    }
  }

  const renderFilterValue = (filter: SimpleFilterCriteria) => {
    const field = fields.find(f => f.field === filter.field)
    
    switch (field?.type) {
      case 'select':
        return (
          <select
            value={String(filter.value)}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={filter.value instanceof Date ? filter.value.toISOString().split('T')[0] : String(filter.value)}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={String(filter.value)}
            onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Enter number"
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={String(filter.value)}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Enter value"
          />
        )
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <div className="flex gap-2">
          {filters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear all
            </button>
          )}
          <button
            onClick={addFilter}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Filter
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="space-y-3">
          {filters.map((filter, index) => {
            const field = fields.find(f => f.field === filter.field)
            const operators = getOperatorsForType(field?.type || 'text')
            
            return (
              <div key={filter.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {index > 0 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                    AND
                  </span>
                )}
                
                {/* Field Selection */}
                <select
                  value={filter.field}
                  onChange={(e) => {
                    const newField = fields.find(f => f.field === e.target.value)
                    updateFilter(filter.id, { 
                      field: e.target.value,
                      type: newField?.type || 'text',
                      value: ''
                    })
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {fields.map(field => (
                    <option key={field.field} value={field.field}>
                      {field.label}
                    </option>
                  ))}
                </select>

                {/* Operator Selection */}
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input */}
                {renderFilterValue(filter)}

                {/* Remove Filter */}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Filter Modal */}
      {showAddFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Filter
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a field to filter by:
            </p>
            <div className="space-y-2">
              {fields.map(field => (
                <button
                  key={field.field}
                  onClick={() => {
                    const newFilter: SimpleFilterCriteria = {
                      id: `filter_${Date.now()}`,
                      field: field.field,
                      operator: 'equals',
                      value: '',
                      type: field.type
                    }
                    setFilters([...filters, newFilter])
                    setShowAddFilter(false)
                  }}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <div className="font-medium">{field.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {field.type} field
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddFilter(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {filters.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {filters.length} filter{filters.length !== 1 ? 's' : ''} active
        </div>
      )}
    </div>
  )
}

export default MetadataFiltering
