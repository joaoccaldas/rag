"use client"

import React, { useState } from 'react'
import { BridgeModel } from './bridge-model'
import { ArrowLeft, Home, BarChart3 } from 'lucide-react'

interface FinanceToolsProps {
  onNavigate?: (page: string) => void
  initialTool?: string
}

export function FinanceTools({ onNavigate, initialTool = 'bridge-model' }: FinanceToolsProps) {
  const [activeTool, setActiveTool] = useState<'bridge-model'>(initialTool as 'bridge-model')

  const tools: Record<string, { name: string; component: React.ReactElement }> = {
    'bridge-model': {
      name: 'Revenue Bridge Model',
      component: <BridgeModel />
    }
  }

  const handleBack = () => {
    onNavigate?.('finance')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Finance</span>
          </button>
          
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">{tools[activeTool]?.name}</span>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="flex-1 overflow-hidden">
        {tools[activeTool]?.component}
      </div>
    </div>
  )
}
