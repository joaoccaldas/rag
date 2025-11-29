"use client"

import React from 'react'
import { Users, UserCheck, FileText, Award, TrendingUp, Shield, ClipboardList, BookOpen, MessageSquare, Calendar } from 'lucide-react'

interface HRLandingProps {
  onNavigate?: (page: string) => void
}

export function HRLanding({ onNavigate }: HRLandingProps) {
  const hrModules = [
    {
      id: 'recruitment',
      title: 'Recruitment & Hiring',
      description: 'Job postings, applicant tracking, and hiring workflows',
      icon: UserCheck,
      color: 'bg-green-500',
      route: '#recruitment'
    },
    {
      id: 'employees',
      title: 'Employee Management',
      description: 'Employee records, performance tracking, and development',
      icon: Users,
      color: 'bg-blue-500',
      route: '#employees'
    },
    {
      id: 'performance',
      title: 'Performance Reviews',
      description: 'Performance evaluations, goal tracking, and feedback',
      icon: Award,
      color: 'bg-yellow-500',
      route: '#performance'
    },
    {
      id: 'training',
      title: 'Training & Development',
      description: 'Learning programs, skill development, and certifications',
      icon: BookOpen,
      color: 'bg-purple-500',
      route: '#training'
    },
    {
      id: 'compliance',
      title: 'HR Compliance',
      description: 'Policy management, legal compliance, and documentation',
      icon: Shield,
      color: 'bg-red-500',
      route: '#compliance'
    },
    {
      id: 'payroll',
      title: 'Payroll & Benefits',
      description: 'Compensation management, benefits administration',
      icon: ClipboardList,
      color: 'bg-indigo-500',
      route: '#payroll'
    }
  ]

  const handleModuleClick = (module: typeof hrModules[0]) => {
    onNavigate?.(module.id)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Human Resources</h1>
              <p className="text-green-100 text-lg">Employee management and organizational development</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-blue-300" />
                <div>
                  <div className="text-2xl font-bold">1,247</div>
                  <div className="text-green-100 text-sm">Active Employees</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} className="text-yellow-300" />
                <div>
                  <div className="text-2xl font-bold">92.4%</div>
                  <div className="text-green-100 text-sm">Employee Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-purple-300" />
                <div>
                  <div className="text-2xl font-bold">7.2%</div>
                  <div className="text-green-100 text-sm">Annual Turnover</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HR Modules Grid */}
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">HR Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrModules.map((module) => {
            const IconComponent = module.icon
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {module.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button className="text-green-600 dark:text-green-400 text-sm font-medium hover:text-green-700 dark:hover:text-green-300 transition-colors">
                      Open Module →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent HR Activities */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activities</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <UserCheck size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">New Employee Onboarding</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">15 new hires completed onboarding process this month</div>
                  </div>
                  <div className="text-sm text-gray-400">Today</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Award size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Performance Review Cycle</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Q4 performance reviews initiated for all departments</div>
                  </div>
                  <div className="text-sm text-gray-400">2 days ago</div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Training Program Launch</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">New leadership development program enrollment open</div>
                  </div>
                  <div className="text-sm text-gray-400">1 week ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
