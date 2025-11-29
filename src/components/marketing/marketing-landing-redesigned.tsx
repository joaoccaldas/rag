"use client"

import React from 'react'
import { Users, TrendingUp, Target, Mail, Globe, BarChart3, Calendar } from 'lucide-react'

interface MarketingLandingProps {
  onNavigate?: (page: string) => void
}

export function MarketingLanding({ onNavigate }: MarketingLandingProps) {
  const marketingModules = [
    {
      id: 'campaign-management',
      title: 'Campaign Management',
      description: 'Create, track, and optimize marketing campaigns',
      icon: Target,
      color: 'bg-pink-500'
    },
    {
      id: 'content-management',
      title: 'Content Management',
      description: 'Manage marketing assets and content library',
      icon: Globe,
      color: 'bg-purple-500'
    },
    {
      id: 'analytics',
      title: 'Marketing Analytics',
      description: 'Performance metrics and ROI analysis',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      id: 'email-marketing',
      title: 'Email Marketing',
      description: 'Email campaigns and automation',
      icon: Mail,
      color: 'bg-green-500'
    },
    {
      id: 'social-media',
      title: 'Social Media',
      description: 'Social media management and scheduling',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      id: 'event-management',
      title: 'Event Management',
      description: 'Plan and manage marketing events',
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ]

  const handleModuleClick = (module: typeof marketingModules[0]) => {
    onNavigate?.(module.id)
  }

  return (
    <div className="flex flex-col h-full pr-12"> {/* Match RAG layout with right padding */}
      {/* Header Section - styled like RAG tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Center</h1>
              <p className="text-gray-600 dark:text-gray-400">Campaign management and customer engagement</p>
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
                  <div className="text-xl font-bold text-gray-900 dark:text-white">+24.3%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-blue-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">15,240</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Leads</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-purple-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">4.2x</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Modules Grid - styled like RAG components */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Marketing Modules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketingModules.map((module) => {
                const IconComponent = module.icon
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 text-left group"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Campaigns</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Target size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Summer Sale Campaign</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">25% increase in engagement, 180 conversions</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">Active</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Newsletter Q3</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Sent to 12,500 subscribers, 34% open rate</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">Completed</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Social Media Boost</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">LinkedIn and Instagram campaign running</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
