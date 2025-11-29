'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MENU_CONFIG, MENU_MAPPING, validateMenuAction, getTargetView } from './rag-menu/menu-config'
import type { MenuItem, MenuAction } from './rag-menu/menu-config'

interface ModularRAGMenuProps {
  onViewChange?: (view: string) => void
}

const ModularRAGMenu: React.FC<ModularRAGMenuProps> = ({ onViewChange }) => {
  // Initialize menu state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rag-menu-expanded')
      return saved !== null ? JSON.parse(saved) : true
    }
    return true
  })
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  
  // Save menu state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rag-menu-expanded', JSON.stringify(isExpanded))
    }
  }, [isExpanded])

  // Load last action on mount for better UX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastAction = localStorage.getItem('rag-last-action')
      if (lastAction) {
        try {
          const parsed = JSON.parse(lastAction)
          // Set as active if it was recent (within last hour)
          if (Date.now() - parsed.timestamp < 3600000) {
            setActiveAction(`${parsed.itemId}-${parsed.actionId}`)
          }
        } catch (error) {
          console.warn('Failed to parse last action:', error)
        }
      }
    }
  }, [])
  
  const handleMenuToggle = () => {
    setIsExpanded(!isExpanded)
    // Close active submenu when collapsing
    if (isExpanded) {
      setActiveSubmenu(null)
    }
  }
  
  const handleMenuAction = (itemId: string, action: MenuAction): void => {
    try {
      // Clear any previous errors
      setLastError(null)
      
      // Validate the action
      if (!validateMenuAction(itemId, action.id)) {
        throw new Error(`Invalid menu action: ${itemId}-${action.id}`)
      }
      
      // Get the target view
      const targetView = getTargetView(itemId, action.id)
      if (!targetView) {
        throw new Error(`No view mapping found for action: ${itemId}-${action.id}`)
      }
      
      // Build the view command with context
      let viewCommand = targetView
      if (action.actionContext) {
        viewCommand = `${targetView}:${action.actionContext}`
      }
      
      // Set the active view and action
      if (onViewChange) {
        onViewChange(viewCommand)
      }
      setActiveAction(`${itemId}-${action.id}`)
      
      console.log(`Menu action executed: ${itemId}-${action.id} -> ${viewCommand}`)
      
      // Store last action for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('rag-last-action', JSON.stringify({
          itemId,
          actionId: action.id,
          targetView,
          context: action.actionContext,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      console.error('Menu action failed:', errorMessage)
    }
  }
  
  const toggleSubmenu = (menuId: string): void => {
    console.log('Toggling submenu:', menuId, 'Current active:', activeSubmenu)
    setActiveSubmenu(activeSubmenu === menuId ? null : menuId)
  }
  
  return (
    <div className={`
      h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
      transition-all duration-300 flex flex-col shadow-lg relative z-10
      ${isExpanded ? 'w-80' : 'w-16'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 min-h-[4rem]">
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <h2 className="text-body-large font-semibold text-gray-900 dark:text-white truncate">
              Document Intelligence Hub
            </h2>
            <p className="text-caption text-gray-500 dark:text-gray-400">
              {Object.keys(MENU_MAPPING).length} actions available
            </p>
          </div>
        )}
        <button
          onClick={handleMenuToggle}
          className="p-2.5 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors flex-shrink-0 bg-white/30 dark:bg-gray-700/30"
          aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {lastError && isExpanded && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{lastError}</p>
          <button
            onClick={() => setLastError(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Active Function Display */}
      {activeAction && isExpanded && (
        <div className="mx-4 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Active: <span className="font-medium">{activeAction}</span>
          </p>
        </div>
      )}
      
      {/* Menu Content */}
      {isExpanded && (
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {MENU_CONFIG.map((menuItem: MenuItem) => (
              <div key={menuItem.id} className="space-y-1">
                {/* Main Menu Item */}
                <button
                  onClick={() => toggleSubmenu(menuItem.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors group ${
                    activeSubmenu === menuItem.id 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <menuItem.icon className={`w-5 h-5 ${
                    activeSubmenu === menuItem.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`} />
                  <div className="flex-1">
                    <span className={`text-sm font-medium block ${
                      activeSubmenu === menuItem.id 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}>
                      {menuItem.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {menuItem.description}
                    </span>
                  </div>
                  <ChevronRight 
                    className={`w-4 h-4 ml-auto transition-transform ${
                      activeSubmenu === menuItem.id ? 'rotate-90 text-blue-600 dark:text-blue-400' : 'text-gray-400'
                    }`} 
                  />
                </button>
                
                {/* Action Items */}
                {activeSubmenu === menuItem.id && menuItem.actions && (
                  <div className="ml-6 space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
                    {menuItem.actions.map((action: MenuAction) => (
                      <button
                        key={action.id}
                        onClick={() => handleMenuAction(menuItem.id, action)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors group ${
                          activeAction === `${menuItem.id}-${action.id}` 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <action.icon className={`w-4 h-4 ${
                          activeAction === `${menuItem.id}-${action.id}` 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        }`} />
                        <span className={`text-xs ${
                          activeAction === `${menuItem.id}-${action.id}` 
                            ? 'text-green-900 dark:text-green-100 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                        }`}>
                          {action.label}
                        </span>
                        {action.isExperimental && (
                          <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                            BETA
                          </span>
                        )}
                        {activeAction === `${menuItem.id}-${action.id}` && (
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}
      
      {/* Collapsed Menu Icons */}
      {!isExpanded && (
        <nav className="flex-1 p-2">
          <div className="space-y-2">
            {MENU_CONFIG.map((menuItem: MenuItem) => (
              <button
                key={menuItem.id}
                onClick={() => {
                  setIsExpanded(true)
                  setActiveSubmenu(menuItem.id)
                }}
                className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative group"
                title={menuItem.label}
              >
                <menuItem.icon className="w-6 h-6 text-gray-500 dark:text-gray-400 mx-auto" />
                {/* Tooltip */}
                <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {menuItem.label}
                </div>
              </button>
            ))}
          </div>
        </nav>
      )}
      
      {/* Footer */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Menu Items:</span>
              <span>{MENU_CONFIG.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Actions:</span>
              <span>{Object.keys(MENU_MAPPING).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            {activeAction && (
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <div className="flex justify-between">
                  <span>Active View:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {MENU_MAPPING[activeAction]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModularRAGMenu
