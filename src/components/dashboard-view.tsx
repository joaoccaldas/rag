"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Activity, Users, DollarSign, TrendingUp } from "lucide-react"
import { PerformanceDashboard } from "./performance-dashboard"

// Sample data generators for live data simulation
const generateRealtimeData = () => {
  const now = new Date()
  const data = []
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000) // 1 minute intervals
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Math.floor(Math.random() * 100) + 50,
      sales: Math.floor(Math.random() * 1000) + 500,
      users: Math.floor(Math.random() * 50) + 10
    })
  }
  return data
}

const pieData = [
  { name: 'Washing Machines', value: 400, color: '#3b82f6' },
  { name: 'Dryers', value: 300, color: '#10b981' },
  { name: 'Dishwashers', value: 200, color: '#f59e0b' },
  { name: 'Ovens', value: 100, color: '#ef4444' },
]

export function DashboardView() {
  const [realtimeData, setRealtimeData] = useState(() => {
    // Initialize with static data to prevent hydration mismatch
    const staticData = []
    const now = new Date()
    for (let i = 9; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000)
      staticData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: 75, // Static initial value
        sales: 750, // Static initial value
        users: 25 // Static initial value
      })
    }
    return staticData
  })
  
  const [stats, setStats] = useState({
    totalRevenue: 45231,
    activeUsers: 2350,
    conversionRate: 3.2,
    growth: 12.5
  })
  
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Simulate live data updates only on client
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      setRealtimeData(generateRealtimeData())
      setStats(prev => ({
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 100) - 50,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        conversionRate: Math.max(0, prev.conversionRate + (Math.random() - 0.5) * 0.1),
        growth: prev.growth + (Math.random() - 0.5) * 0.5
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [isClient])

  // Don't render dynamic content until client-side
  if (!isClient) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 min-h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
            trendPositive={true}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon={Users}
            trend="+5.2%"
            trendPositive={true}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={Activity}
            trend="-0.3%"
            trendPositive={false}
          />
          <StatCard
            title="Growth"
            value={`${stats.growth.toFixed(1)}%`}
            icon={TrendingUp}
            trend="+2.1%"
            trendPositive={true}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Real-time Performance
              <span className="block text-sm font-normal text-gray-600 dark:text-gray-400">
                Live data updating every 5 seconds
              </span>
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--tw-color-gray-800)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Product Distribution
              <span className="block text-sm font-normal text-gray-600 dark:text-gray-400">
                Sales breakdown by product category
              </span>
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Sales & User Activity
            <span className="block text-sm font-normal text-gray-600 dark:text-gray-400">
              Comparative analysis of sales and user engagement
            </span>
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realtimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--tw-color-gray-800)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="sales" fill="#10b981" />
                <Bar dataKey="users" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Dashboard */}
        <PerformanceDashboard />
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: string
  trendPositive: boolean
}

function StatCard({ title, value, icon: Icon, trend, trendPositive }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <span className={`text-sm font-medium ${
            trendPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  )
}
