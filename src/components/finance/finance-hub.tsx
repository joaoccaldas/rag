"use client"

import React, { useState } from 'react'
import { FinanceLanding } from './finance-landing-redesigned'
import { FinanceTools } from './finance-tools'

interface FinanceHubProps {
  onNavigate?: (page: string) => void
}

export function FinanceHub({ onNavigate }: FinanceHubProps) {
  const [currentView, setCurrentView] = useState<'landing' | 'bridge-model'>('landing')

  const handleNavigateToTool = (tool: string) => {
    if (tool === 'bridge-model') {
      // Navigate to the standalone bridge model page
      window.open('/bridge-model.html', '_blank')
    } else if (tool === 'financial-modeling') {
      // Navigate to the standalone bridge model page
      window.open('/bridge-model.html', '_blank')
    } else {
      // Handle other tools or external navigation
      onNavigate?.(tool)
    }
  }

  const handleBackToLanding = () => {
    setCurrentView('landing')
  }

  if (currentView === 'bridge-model') {
    return (
      <FinanceTools 
        onNavigate={handleBackToLanding}
        initialTool="bridge-model"
      />
    )
  }

  return (
    <FinanceLanding onNavigate={handleNavigateToTool} />
  )
}
