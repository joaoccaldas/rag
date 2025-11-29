/**
 * Enhanced Navigation System
 * Provides intuitive navigation with proper user flow and accessibility
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  MessageCircle, 
  Database, 
  FileText, 
  BarChart3, 
  DollarSign, 
  Users, 
  Megaphone,
  Settings,
  User,
  Search,
  Upload,
  Brain,
  ChevronRight,
  Zap
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useActiveProfile } from '@/hooks/useActiveProfile'

import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: NavigationItem[]
  description?: string
  isNew?: boolean
  isActive?: boolean
  shortcut?: string
}

export interface NavigationProps {
  activeView: string
  onViewChange: (view: string) => void
  className?: string
  collapsed?: boolean
}

const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and analytics',
    shortcut: 'Ctrl+D'
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: MessageCircle,
    description: 'Conversational AI interface',
    shortcut: 'Ctrl+T',
    badge: 'AI'
  },
  {
    id: 'rag',
    label: 'Knowledge Base',
    icon: Database,
    description: 'Document search and RAG system',
    children: [
      {
        id: 'documents',
        label: 'Documents',
        icon: FileText,
        description: 'Manage and browse documents'
      },
      {
        id: 'search',
        label: 'Smart Search',
        icon: Search,
        description: 'AI-powered document search'
      },
      {
        id: 'upload',
        label: 'Upload',
        icon: Upload,
        description: 'Add new documents'
      },
      {
        id: 'knowledge',
        label: 'Knowledge Graph',
        icon: Brain,
        description: 'Visualize document relationships',
        isNew: true
      }
    ]
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: Users,
    description: 'Department-specific tools',
    children: [
      {
        id: 'finance',
        label: 'Finance',
        icon: DollarSign,
        description: 'Financial analysis and modeling'
      },
      {
        id: 'marketing',
        label: 'Marketing',
        icon: Megaphone,
        description: 'Marketing analytics and campaigns'
      },
      {
        id: 'hr',
        label: 'Human Resources',
        icon: Users,
        description: 'HR tools and analytics'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Performance metrics and insights',
    badge: 'Pro'
  },
  {
    id: 'debug',
    label: 'Debug Tools',
    icon: Zap,
    description: 'Development and debugging',
    children: [
      {
        id: 'ai-debug',
        label: 'AI Analysis',
        icon: Brain,
        description: 'AI model debugging'
      },
      {
        id: 'system-debug',
        label: 'System Status',
        icon: Settings,
        description: 'System health monitoring'
      }
    ]
  }
]

export function EnhancedNavigation({ 
  activeView, 
  onViewChange, 
  className,
  collapsed = false 
}: NavigationProps) {
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['rag', 'departments']))
  const { activeProfile } = useActiveProfile()

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleNavigation = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      router.push(item.href)
    } else {
      onViewChange(item.id)
    }
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const isActive = activeView === item.id || (item.children?.some(child => activeView === child.id))
    const Icon = item.icon

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              handleNavigation(item)
            }
          }}
          className={cn(
            'flex items-center w-full px-3 py-2 text-left text-sm rounded-lg transition-all duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            level > 0 && 'ml-4 pl-6',
            isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? item.label : item.description}
        >
          <Icon className={cn(
            'flex-shrink-0',
            collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3',
            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
          )} />
          
          {!collapsed && (
            <>
              <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                {item.label}
              </span>
              
              {item.badge && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2',
                  item.badge === 'AI' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                  item.badge === 'Pro' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
                  typeof item.badge === 'number' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                )}>
                  {item.badge}
                </span>
              )}
              
              {item.isNew && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2">
                  New
                </span>
              )}
              
              {hasChildren && (
                <ChevronRight className={cn(
                  'h-4 w-4 text-gray-400 transition-transform duration-200 ml-1',
                  isExpanded && 'rotate-90'
                )} />
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
      collapsed ? 'w-16' : 'w-64',
      'transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-800',
        collapsed && 'px-2 justify-center'
      )}>
        {!collapsed && activeProfile && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activeProfile.displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {activeProfile.personality}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationConfig.map(item => renderNavigationItem(item))}
      </div>

      {/* Footer */}
      <div className={cn(
        'p-3 border-t border-gray-200 dark:border-gray-800',
        collapsed && 'p-2'
      )}>
        <button
          onClick={() => onViewChange('settings')}
          className={cn(
            'flex items-center w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400',
            'hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            'rounded-lg transition-colors duration-200',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : 'Application settings'}
        >
          <Settings className={cn(
            'flex-shrink-0',
            collapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'
          )} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </nav>
  )
}
