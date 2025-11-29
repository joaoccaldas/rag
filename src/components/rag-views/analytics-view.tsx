'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, LineChart, PieChart, TrendingUp, TrendingDown, Activity, FileText, Search, Clock, Target } from 'lucide-react'

interface AnalyticsData {
  totalDocuments: number
  totalSearches: number
  avgResponseTime: number
  successRate: number
  searchTrends: Array<{ date: string; searches: number }>
  topQueries: Array<{ query: string; count: number }>
  documentTypes: Array<{ type: string; count: number }>
  performance: Array<{ metric: string; value: number; change: number }>
}

interface AnalyticsViewProps {
  actionContext?: string
  params?: Record<string, unknown>
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ actionContext }) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  // Mock analytics data
  useEffect(() => {
    const mockData: AnalyticsData = {
      totalDocuments: 1247,
      totalSearches: 8952,
      avgResponseTime: 234,
      successRate: 94.7,
      searchTrends: [
        { date: '2024-01-08', searches: 120 },
        { date: '2024-01-09', searches: 145 },
        { date: '2024-01-10', searches: 132 },
        { date: '2024-01-11', searches: 178 },
        { date: '2024-01-12', searches: 156 },
        { date: '2024-01-13', searches: 189 },
        { date: '2024-01-14', searches: 203 }
      ],
      topQueries: [
        { query: 'product specifications', count: 456 },
        { query: 'installation guide', count: 332 },
        { query: 'troubleshooting', count: 298 },
        { query: 'warranty information', count: 234 },
        { query: 'user manual', count: 189 }
      ],
      documentTypes: [
        { type: 'PDF', count: 623 },
        { type: 'Word', count: 312 },
        { type: 'PowerPoint', count: 189 },
        { type: 'Excel', count: 123 }
      ],
      performance: [
        { metric: 'Response Time', value: 234, change: -12 },
        { metric: 'Success Rate', value: 94.7, change: 2.3 },
        { metric: 'User Satisfaction', value: 4.6, change: 0.2 },
        { metric: 'Query Volume', value: 8952, change: 15.7 }
      ]
    }

    setTimeout(() => {
      setData(mockData)
      setIsLoading(false)
    }, 1000)
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-600">
            Analytics data will appear here once you start using the system
          </p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, change, unit = '' }: {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    change?: number
    unit?: string
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}{unit}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}% from last period</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Analytics & Insights
              </h1>
              <p className="text-gray-600">
                {actionContext ? `Context: ${actionContext}` : 'Monitor system performance and usage patterns'}
              </p>
            </div>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Documents"
            value={data.totalDocuments}
            icon={FileText}
            change={12.5}
          />
          <StatCard
            title="Total Searches"
            value={data.totalSearches}
            icon={Search}
            change={8.3}
          />
          <StatCard
            title="Avg Response Time"
            value={data.avgResponseTime}
            icon={Clock}
            change={-12}
            unit="ms"
          />
          <StatCard
            title="Success Rate"
            value={data.successRate}
            icon={Target}
            change={2.3}
            unit="%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Search Trends */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Trends</h3>
              <LineChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {data.searchTrends.map((point) => (
                <div key={point.date} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600"
                    style={{
                      height: `${(point.searches / Math.max(...data.searchTrends.map(p => p.searches))) * 200}px`,
                      minHeight: '20px'
                    }}
                    title={`${point.searches} searches on ${new Date(point.date).toLocaleDateString()}`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Document Types */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Document Types</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {data.documentTypes.map((type, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
                const percentage = (type.count / data.totalDocuments * 100).toFixed(1)
                return (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-sm font-medium text-gray-700">{type.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{type.count}</span>
                      <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            <BarChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.performance.map((metric) => (
              <div key={metric.metric} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {metric.metric === 'Response Time' ? `${metric.value}ms` : 
                   metric.metric === 'User Satisfaction' ? `${metric.value}/5` :
                   metric.metric === 'Success Rate' ? `${metric.value}%` :
                   metric.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Queries */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Search Queries</h3>
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.topQueries.map((query, index) => {
              const maxCount = Math.max(...data.topQueries.map(q => q.count))
              const percentage = (query.count / maxCount) * 100
              return (
                <div key={query.query} className="flex items-center gap-4">
                  <div className="w-6 text-center">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{query.query}</span>
                      <span className="text-sm text-gray-500">{query.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsView
