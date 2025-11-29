"use client"

import React from 'react'
import { DollarSign, TrendingUp, BarChart3, Calculator, FileText, PieChart, Activity, Target } from 'lucide-react'

interface FinanceLandingProps {
  onNavigate?: (page: string) => void
}

export function FinanceLanding({ onNavigate }: FinanceLandingProps) {
  const financeModules = [
    {
      id: 'financial-modeling',
      title: 'Financial Modeling',
      description: 'Waterfall analysis, variance bridges, and scenario planning',
      icon: Activity,
      color: 'bg-blue-500',
      route: 'bridge-model'
    },
    {
      id: 'bridge-model',
      title: 'Revenue Bridge Model',
      description: '2025→2026 waterfall analysis with growth drivers',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      route: 'bridge-model'
    },
    {
      id: 'budgeting',
      title: 'Budgeting & Planning',
      description: 'Budget creation, tracking, and forecasting',
      icon: PieChart,
      color: 'bg-green-500',
      route: '#budgeting'
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'General ledger, AP/AR, reconciliation',
      icon: Calculator,
      color: 'bg-purple-500',
      route: '#accounting'
    },
    {
      id: 'reporting',
      title: 'Financial Reporting',
      description: 'Income statements, balance sheets, cash flow',
      icon: FileText,
      color: 'bg-orange-500',
      route: '#reporting'
    },
    {
      id: 'analytics',
      title: 'Financial Analytics',
      description: 'KPI dashboards and performance metrics',
      icon: BarChart3,
      color: 'bg-red-500',
      route: '#analytics'
    },
    {
      id: 'compliance',
      title: 'Compliance & Audit',
      description: 'Tax preparation, audit trails, regulatory reporting',
      icon: Target,
      color: 'bg-indigo-500',
      route: '#compliance'
    }
  ]

  const handleModuleClick = (module: typeof financeModules[0]) => {
    if (module.route.startsWith('/')) {
      // External route - navigate via window.location
      window.location.href = module.route
    } else {
      // Internal navigation
      onNavigate?.(module.id)
    }
  }

  return (
    <div className="flex flex-col h-full pr-12"> {/* Match RAG layout with right padding */}
      {/* Header Section - styled like RAG tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Center</h1>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive financial management and analysis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-6 space-y-6">
          {/* Quick Stats - styled like RAG components */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-green-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">+12.5%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-blue-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">$2.4M</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-purple-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">94.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Budget Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Finance Modules Grid - styled like RAG components */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Finance Modules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {financeModules.map((module) => {
                const IconComponent = module.icon
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{module.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Activity Section - styled like RAG components */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Q3 Budget Approved</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Budget increase of 8.5% approved for next quarter</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">2 hours ago</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Monthly Report Generated</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">August financial report ready for review</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">5 hours ago</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Financial Statements Prepared</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Income statement and balance sheet finalized</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">1 day ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
