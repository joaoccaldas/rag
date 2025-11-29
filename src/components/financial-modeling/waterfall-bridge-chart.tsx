"use client"

import { useMemo } from 'react'

interface DriverData {
  impact: number
  type: 'percentage' | 'absolute'
}

interface ModelData {
  baseline2025: number
  target2026: number
  drivers: {
    volume: DriverData
    price: DriverData
    mix: DriverData
    discounts: DriverData
    fx: DriverData
    bonus: DriverData
  }
}

interface WaterfallBridgeChartProps {
  data: ModelData
  title: string
  subtitle: string
}

export function WaterfallBridgeChart({ data, title, subtitle }: WaterfallBridgeChartProps) {
  const chartData = useMemo(() => {
    let runningTotal = data.baseline2025
    const segments = []

    // Starting point
    segments.push({
      label: '2025 Baseline',
      value: data.baseline2025,
      cumulative: data.baseline2025,
      type: 'baseline',
      color: '#3B82F6' // blue
    })

    // Add each driver
    const driverLabels = {
      volume: 'Volume',
      price: 'Price',
      mix: 'Mix',
      discounts: 'Discounts',
      fx: 'FX',
      bonus: 'Bonus'
    }

    Object.entries(data.drivers).forEach(([key, driver]) => {
      runningTotal += driver.impact
      segments.push({
        label: driverLabels[key as keyof typeof driverLabels],
        value: driver.impact,
        cumulative: runningTotal,
        type: driver.impact >= 0 ? 'positive' : 'negative',
        color: driver.impact >= 0 ? '#10B981' : '#EF4444' // green or red
      })
    })

    // Ending point
    segments.push({
      label: '2026 Target',
      value: data.target2026,
      cumulative: data.target2026,
      type: 'target',
      color: '#8B5CF6' // purple
    })

    return segments
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value)
  }

  const maxValue = Math.max(...chartData.map(d => Math.abs(d.cumulative)))
  const chartHeight = 400

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      <div className="relative">
        {/* Chart Container */}
        <div className="relative overflow-x-auto">
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartData.length * 120 + 100} ${chartHeight}`}
            className="min-w-max"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
              <g key={percent}>
                <line
                  x1={50}
                  y1={50 + (chartHeight - 100) * percent}
                  x2={chartData.length * 120 + 50}
                  y2={50 + (chartHeight - 100) * percent}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  strokeDasharray={percent === 0 || percent === 1 ? "0" : "3,3"}
                />
                <text
                  x={40}
                  y={55 + (chartHeight - 100) * percent}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatCurrency(maxValue * (1 - percent))}
                </text>
              </g>
            ))}

            {/* Chart segments */}
            {chartData.map((segment, index) => {
              const x = 60 + index * 120
              const barWidth = 80
              
              let barHeight: number
              let barY: number
              
              if (segment.type === 'baseline' || segment.type === 'target') {
                barHeight = (Math.abs(segment.value) / maxValue) * (chartHeight - 100)
                barY = chartHeight - 50 - barHeight
              } else {
                barHeight = (Math.abs(segment.value) / maxValue) * (chartHeight - 100)
                const prevCumulative = index > 0 ? (chartData[index - 1]?.cumulative || 0) : 0
                const bottomY = chartHeight - 50 - (prevCumulative / maxValue) * (chartHeight - 100)
                barY = segment.value >= 0 ? bottomY - barHeight : bottomY
              }

              return (
                <g key={index}>
                  {/* Connecting line to previous segment */}
                  {index > 0 && segment.type !== 'target' && (
                    <line
                      x1={x - 60 + 80}
                      y1={chartHeight - 50 - ((chartData[index - 1]?.cumulative || 0) / maxValue) * (chartHeight - 100)}
                      x2={x}
                      y2={chartHeight - 50 - ((chartData[index - 1]?.cumulative || 0) / maxValue) * (chartHeight - 100)}
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}

                  {/* Bar */}
                  <rect
                    x={x}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={segment.color}
                    rx={4}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  />

                  {/* Value label on bar */}
                  <text
                    x={x + barWidth / 2}
                    y={barY - 5}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-900 dark:fill-white"
                  >
                    {segment.type === 'baseline' || segment.type === 'target' 
                      ? formatCurrency(segment.value)
                      : formatCurrency(Math.abs(segment.value))
                    }
                  </text>

                  {/* Impact indicator */}
                  {segment.type !== 'baseline' && segment.type !== 'target' && (
                    <text
                      x={x + barWidth / 2}
                      y={barY + barHeight / 2}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                    >
                      {segment.value >= 0 ? '↑' : '↓'}
                    </text>
                  )}

                  {/* Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 30}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                  >
                    {segment.label}
                  </text>

                  {/* Cumulative value */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {formatCurrency(segment.cumulative)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Positive Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Negative Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Target</span>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Growth</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.target2026 - data.baseline2025)}
            </div>
            <div className="text-xs text-gray-500">
              {(((data.target2026 - data.baseline2025) / data.baseline2025) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Positive Drivers</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(
                Object.values(data.drivers)
                  .filter(d => d.impact > 0)
                  .reduce((sum, d) => sum + d.impact, 0)
              )}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Negative Drivers</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(
                Math.abs(Object.values(data.drivers)
                  .filter(d => d.impact < 0)
                  .reduce((sum, d) => sum + d.impact, 0))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
