"use client"

import React from 'react'
import { Megaphone, Users, BarChart3, Target, Calendar, TrendingUp, Mail, Camera, Globe, ShoppingCart } from 'lucide-react'

interface MarketingLandingProps {
  onNavigate?: (page: string) => void
}

export function MarketingLanding({ onNavigate }: MarketingLandingProps) {
  const marketingModules = [
    {
      id: 'campaigns',
      title: 'Campaign Management',
      description: 'Create, manage, and track marketing campaigns across channels',
      icon: Megaphone,
      color: 'bg-purple-500',
      route: '#campaigns'
    },
    {
      id: 'content',
      title: 'Content Management',
      description: 'Digital asset management and content creation workflows',
      icon: Camera,
      color: 'bg-pink-500',
      route: '#content'
    },
    {
      id: 'analytics',
      title: 'Marketing Analytics',
      description: 'Performance metrics, ROI tracking, and campaign analytics',
      icon: BarChart3,
      color: 'bg-indigo-500',
      route: '#analytics'
    },
    {
      id: 'email',
      title: 'Email Marketing',
      description: 'Email campaigns, automation, and subscriber management',
      icon: Mail,
      color: 'bg-green-500',
      route: '#email'
    },
    {
      id: 'social',
      title: 'Social Media',
      description: 'Social media management and engagement tracking',
      icon: Globe,
      color: 'bg-blue-500',
      route: '#social'
    },
    {
      id: 'ecommerce',
      title: 'E-commerce Marketing',
      description: 'Product promotion, sales funnels, and conversion optimization',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      route: '#ecommerce'
    }
  ]

  const handleModuleClick = (module: typeof marketingModules[0]) => {
    onNavigate?.(module.id)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Megaphone size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Marketing Center</h1>
              <p className="text-purple-100 text-lg">Comprehensive marketing management and analytics</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Target size={24} className="text-green-300" />
                <div>
                  <div className="text-2xl font-bold">87.3%</div>
                  <div className="text-purple-100 text-sm">Campaign Success Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-yellow-300" />
                <div>
                  <div className="text-2xl font-bold">45.2K</div>
                  <div className="text-purple-100 text-sm">Active Leads</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} className="text-pink-300" />
                <div>
                  <div className="text-2xl font-bold">+28%</div>
                  <div className="text-purple-100 text-sm">Conversion Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Modules Grid */}
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Marketing Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketingModules.map((module) => {
            const IconComponent = module.icon
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {module.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                      Open Module →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Campaign Performance */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Campaigns</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Megaphone size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Q4 Product Launch Campaign</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Multi-channel campaign with 94% reach target achieved</div>
                  </div>
                  <div className="text-sm text-green-500 font-medium">Active</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Mail size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Holiday Email Series</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Seasonal email campaign with 23% open rate</div>
                  </div>
                  <div className="text-sm text-blue-500 font-medium">Scheduled</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Social Media Awareness</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Brand awareness campaign across social platforms</div>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
