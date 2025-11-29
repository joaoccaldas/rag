"use client"

import React from 'react'
import { Users, Award, Calendar, FileText, DollarSign, TrendingUp, Clock, UserPlus, Bug } from 'lucide-react'

interface HRLandingProps {
  onNavigate?: (page: string) => void
}

export function HRLanding({ onNavigate }: HRLandingProps) {
  const hrModules = [
    {
      id: 'recruitment',
      title: 'Recruitment',
      description: 'Manage job postings and candidate applications',
      icon: UserPlus,
      color: 'bg-green-500'
    },
    {
      id: 'employee-management',
      title: 'Employee Management',
      description: 'Employee records and organizational structure',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'performance',
      title: 'Performance Reviews',
      description: 'Performance evaluations and goal tracking',
      icon: Award,
      color: 'bg-purple-500'
    },
    {
      id: 'payroll',
      title: 'Payroll & Benefits',
      description: 'Salary processing and benefits administration',
      icon: DollarSign,
      color: 'bg-emerald-500'
    },
    {
      id: 'time-tracking',
      title: 'Time & Attendance',
      description: 'Time tracking and attendance management',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      id: 'documents',
      title: 'HR Documents',
      description: 'Policy documents and employee handbook',
      icon: FileText,
      color: 'bg-indigo-500'
    },
    {
      id: 'debugging',
      title: 'System Debugging',
      description: 'RAG pipeline diagnostics and troubleshooting',
      icon: Bug,
      color: 'bg-red-500'
    }
  ]

  const handleModuleClick = (module: typeof hrModules[0]) => {
    onNavigate?.(module.id)
  }

  return (
    <div className="flex flex-col h-full pr-12"> {/* Match RAG layout with right padding */}
      {/* Header Section - styled like RAG tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Human Resources</h1>
              <p className="text-gray-600 dark:text-gray-400">Employee management and organizational development</p>
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
                <Users size={20} className="text-blue-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">247</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Employees</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-green-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">94.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-purple-500" />
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">12</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Open Positions</div>
                </div>
              </div>
            </div>
          </div>

          {/* HR Modules Grid - styled like RAG components */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">HR Modules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hrModules.map((module) => {
                const IconComponent = module.icon
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 text-left group"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent HR Activities</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <UserPlus size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">New Hire Onboarding</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Sarah Johnson - Software Engineer (Marketing)</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">Today</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Award size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Performance Reviews Due</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">15 employees scheduled for Q3 reviews</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">This Week</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Team Building Event</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Annual company retreat planning in progress</div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">Next Month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
