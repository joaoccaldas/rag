import React from 'react'
import { Filter, Search, SortAsc, SortDesc } from 'lucide-react'
import { DocumentFiltersProps } from './types'
import { Button, Card, Input, Badge } from '../../../design-system/components'

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  state,
  setState,
  fileTypeOptions,
  statusOptions
}) => {
  return (
    <div className="space-y-4">
      {/* Search and basic controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <select
            value={state.sortBy}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              sortBy: e.target.value as 'name' | 'uploadedAt' | 'size' | 'type'
            }))}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="uploadedAt">Upload Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
            }))}
          >
            {state.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Advanced filters */}
      {state.showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">File Types</label>
              <div className="flex flex-wrap gap-2">
                {fileTypeOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={state.selectedFileTypes.includes(option.value) ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => setState(prev => ({
                      ...prev,
                      selectedFileTypes: prev.selectedFileTypes.includes(option.value)
                        ? prev.selectedFileTypes.filter(t => t !== option.value)
                        : [...prev.selectedFileTypes, option.value]
                    }))}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={state.selectedStatuses.includes(option.value) ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => setState(prev => ({
                      ...prev,
                      selectedStatuses: prev.selectedStatuses.includes(option.value)
                        ? prev.selectedStatuses.filter(s => s !== option.value)
                        : [...prev.selectedStatuses, option.value]
                    }))}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
