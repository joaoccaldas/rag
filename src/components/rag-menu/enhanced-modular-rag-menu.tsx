/**
 * Empty RAG Center Menu
 * Completely minimal implementation - no content
 */

'use client'

import React from 'react'

interface EmptyMenuProps {
  className?: string
  onViewChange?: (view: string) => void
  onActionSelect?: (itemId: string, actionId: string, targetView: string) => void
  showDepartments?: boolean
  defaultExpandedDepartments?: string[]
}

export function EmptyRAGMenu(props: EmptyMenuProps) {
  const { className = '', onActionSelect } = props

  // DEBUG: Log all props received by the component
  console.log('🔍 EmptyRAGMenu received props:', {
    className,
    onActionSelect: typeof onActionSelect,
    onActionSelectExists: !!onActionSelect,
    allProps: Object.keys(props),
    propValues: props
  })

  const handleFinanceClick = () => {
    console.log('🎯 Finance clicked - navigating to finance page')
    console.log('📤 Calling onActionSelect with:', 'finance', 'main', 'finance')
    console.log('📤 onActionSelect function:', typeof onActionSelect)
    if (onActionSelect) {
      onActionSelect('finance', 'main', 'finance')
      console.log('✅ onActionSelect called successfully')
    } else {
      console.error('❌ onActionSelect is not defined!')
    }
  }

  const handleMarketingClick = () => {
    console.log('🎯 Marketing clicked - navigating to marketing page')
    console.log('📤 Calling onActionSelect with:', 'marketing', 'main', 'marketing')
    console.log('📤 onActionSelect function:', typeof onActionSelect)
    if (onActionSelect) {
      onActionSelect('marketing', 'main', 'marketing')
      console.log('✅ onActionSelect called successfully')
    } else {
      console.error('❌ onActionSelect is not defined!')
    }
  }

  const handleHRClick = () => {
    console.log('🎯 HR clicked - navigating to HR page')
    console.log('📤 Calling onActionSelect with:', 'hr', 'main', 'hr')
    console.log('📤 onActionSelect function:', typeof onActionSelect)
    if (onActionSelect) {
      onActionSelect('hr', 'main', 'hr')
      console.log('✅ onActionSelect called successfully')
    } else {
      console.error('❌ onActionSelect is not defined!')
    }
  }

  return (
    <div className={`w-64 bg-white border-r border-gray-200 h-full overflow-y-auto ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document Intelligence Hub</h2>
        
        {/* Department Menu Items */}
        <div className="space-y-2">
          {/* Finance */}
          <button
            onClick={handleFinanceClick}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <span className="text-blue-600 font-semibold text-sm">F</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Finance</div>
              <div className="text-xs text-gray-500">Financial management & modeling</div>
            </div>
          </button>

          {/* Marketing */}
          <button
            onClick={handleMarketingClick}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <span className="text-purple-600 font-semibold text-sm">M</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Marketing</div>
              <div className="text-xs text-gray-500">Campaigns & content management</div>
            </div>
          </button>

          {/* HR */}
          <button
            onClick={handleHRClick}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-green-600 font-semibold text-sm">H</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">HR</div>
              <div className="text-xs text-gray-500">Human resources & talent</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// For backward compatibility
export { EmptyRAGMenu as EnhancedModularRAGMenu }
