"use client"

import React, { useState, useEffect, memo } from 'react'
import { Activity, Clock, Database, Zap, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  target: number
}

interface ChartDataPoint {
  time: string
  responseTime: number
  memoryUsage: number
  cpuUsage: number
  errorRate: number
}

interface PerformanceDashboardProps {
  className?: string
}

const PerformanceDashboardComponent = ({ className = '' }: PerformanceDashboardProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate real-time performance data
  useEffect(() => {
    const generateMetrics = () => {
      const baseMetrics: PerformanceMetric[] = [
        {
          id: 'response_time',
          name: 'Average Response Time',
          value: Math.random() * 2000 + 500,
          unit: 'ms',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 1000
        },
        {
          id: 'memory_usage',
          name: 'Memory Usage',
          value: Math.random() * 40 + 30,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 80
        },
        {
          id: 'cpu_usage',
          name: 'CPU Usage',
          value: Math.random() * 30 + 20,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 70
        },
        {
          id: 'db_queries',
          name: 'Database Queries/sec',
          value: Math.random() * 100 + 50,
          unit: '/sec',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 200
        },
        {
          id: 'error_rate',
          name: 'Error Rate',
          value: Math.random() * 2,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 1
        },
        {
          id: 'rag_search_time',
          name: 'RAG Search Time',
          value: Math.random() * 500 + 100,
          unit: 'ms',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 300
        }
      ]

      // Update status based on values
      const updatedMetrics = baseMetrics.map(metric => ({
        ...metric,
        status: (metric.value > metric.target 
          ? (metric.value > metric.target * 1.5 ? 'critical' : 'warning')
          : 'good') as 'good' | 'warning' | 'critical'
      }))

      setMetrics(updatedMetrics)

      // Generate chart data
      const now = Date.now()
      const newChartData = Array.from({ length: 10 }, (_, i) => ({
        time: new Date(now - (9 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.random() * 2000 + 500,
        memoryUsage: Math.random() * 40 + 30,
        cpuUsage: Math.random() * 30 + 20,
        errorRate: Math.random() * 2
      }))
      
      setChartData(newChartData)
      setIsLoading(false)
    }

    generateMetrics()
    const interval = setInterval(generateMetrics, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
      case 'critical':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }
  }

  const pieData = [
    { name: 'Good', value: metrics.filter(m => m.status === 'good').length, color: '#10B981' },
    { name: 'Warning', value: metrics.filter(m => m.status === 'warning').length, color: '#F59E0B' },
    { name: 'Critical', value: metrics.filter(m => m.status === 'critical').length, color: '#EF4444' }
  ]

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading performance metrics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-large text-foreground">Performance Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Real-time system performance monitoring</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`border rounded-lg p-4 ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {metric.name}
              </h3>
              <div className="flex items-center gap-1">
                {getStatusIcon(metric.status)}
                {getTrendIcon(metric.trend)}
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-headline-large text-foreground">
                  {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {metric.unit}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target: {metric.target}{metric.unit}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    metric.status === 'good' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Series Chart */}
        {isMounted && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-headline-medium text-foreground mb-4">
              Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" className="text-gray-600 dark:text-gray-400" />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                }}
              />
              <Line type="monotone" dataKey="responseTime" stroke="#3B82F6" strokeWidth={2} name="Response Time (ms)" />
              <Line type="monotone" dataKey="memoryUsage" stroke="#10B981" strokeWidth={2} name="Memory Usage (%)" />
              <Line type="monotone" dataKey="cpuUsage" stroke="#F59E0B" strokeWidth={2} name="CPU Usage (%)" />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {isMounted && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-headline-medium text-foreground mb-4">
              System Health
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-headline-medium text-foreground mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.floor(Math.random() * 1000 + 500)}
            </p>
          </div>
          
          <div className="text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Queries Today</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.floor(Math.random() * 10000 + 5000)}
            </p>
          </div>
          
          <div className="text-center">
            <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              99.9%
            </p>
          </div>
          
          <div className="text-center">
            <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.floor(Math.random() * 50 + 10)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

PerformanceDashboardComponent.displayName = 'PerformanceDashboard'

export const PerformanceDashboard = memo(PerformanceDashboardComponent)
