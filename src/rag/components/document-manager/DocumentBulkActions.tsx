import React from 'react'
import { Trash2 } from 'lucide-react'
import { DocumentBulkActionsProps } from './types'
import { Button } from '../../../design-system/components'

export const DocumentBulkActions: React.FC<DocumentBulkActionsProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg mb-4">
      <span className="text-sm text-blue-700 dark:text-blue-300">
        {selectedCount} documents selected
      </span>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected
        </Button>
      </div>
    </div>
  )
}
