"use client"

import React, { useRef, useState } from 'react'
import { WaterfallStep, formatCurrency, formatPercentage } from '../../services/finance-calculations'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Target, Settings } from 'lucide-react'

interface EnhancedWaterfallChartProps {
  steps: WaterfallStep[]
  title?: string
  subtitle?: string
  height?: number
  interactive?: boolean
  showPercentages?: boolean
  className?: string
}

const iconMap = {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Target,
  Settings
}

export function EnhancedWaterfallChart({ 
  steps, 
  title = "Revenue Bridge Analysis",
  subtitle = "Waterfall analysis showing impact of each driver",
  height = 400,
  interactive = true,
  showPercentages = true,
  className = ""
}: EnhancedWaterfallChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  const maxValue = Math.max(...steps.map(s => Math.abs(s.cumulative)))
  const chartWidth = steps.length * 120 + 100

  const getStepColor = (step: WaterfallStep, index: number) => {
    if (selectedStep === index || hoveredStep === index) {
      return step.category === 'baseline' ? '#1e40af' :
             step.category === 'result' ? '#7c3aed' :
             step.isPositive ? '#059669' : '#dc2626'
    }
    
    return step.category === 'baseline' ? '#3b82f6' :
           step.category === 'result' ? '#8b5cf6' :
           step.isPositive ? '#10b981' : '#ef4444'
  }

  const handleStepClick = (index: number) => {
    if (interactive) {
      setSelectedStep(selectedStep === index ? null : index)
    }
  }

  const handleStepHover = (index: number | null) => {
    if (interactive) {
      setHoveredStep(index)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="relative overflow-x-auto">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="min-w-max"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
            <g key={percent}>
              <line
                x1={50}
                y1={50 + (height - 100) * percent}
                x2={chartWidth - 50}
                y2={50 + (height - 100) * percent}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray={percent === 0 || percent === 1 ? "0" : "3,3"}
              />
              <text
                x={40}
                y={55 + (height - 100) * percent}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {formatCurrency(maxValue * (1 - percent))}
              </text>
            </g>
          ))}

          {/* Chart segments */}
          {steps.map((step, index) => {
            const x = 60 + index * 120
            const barWidth = 80
            
            let barHeight: number
            let barY: number
            
            if (step.category === 'baseline' || step.category === 'result') {
              barHeight = (Math.abs(step.value) / maxValue) * (height - 100)
              barY = height - 50 - barHeight
            } else {
              barHeight = (Math.abs(step.value) / maxValue) * (height - 100)
              const prevCumulative = index > 0 ? (steps[index - 1]?.cumulative || 0) : 0
              const bottomY = height - 50 - (prevCumulative / maxValue) * (height - 100)
              barY = step.value >= 0 ? bottomY - barHeight : bottomY
            }

            const IconComponent = iconMap[step.icon as keyof typeof iconMap] || DollarSign

            return (
              <g key={index}>
                {/* Connecting line to previous segment */}
                {index > 0 && step.category !== 'target' && (
                  <line
                    x1={x - 60 + 80}
                    y1={height - 50 - ((steps[index - 1]?.cumulative || 0) / maxValue) * (height - 100)}
                    x2={x}
                    y2={height - 50 - ((steps[index - 1]?.cumulative || 0) / maxValue) * (height - 100)}
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    className="transition-all duration-200"
                  />
                )}

                {/* Bar */}
                <rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)} // Minimum height for visibility
                  fill={getStepColor(step, index)}
                  rx={4}
                  className={`transition-all duration-200 cursor-pointer ${
                    interactive ? 'hover:opacity-80' : ''
                  }`}
                  onClick={() => handleStepClick(index)}
                  onMouseEnter={() => handleStepHover(index)}
                  onMouseLeave={() => handleStepHover(null)}
                />

                {/* Bar shadow for depth */}
                <rect
                  x={x + 2}
                  y={barY + 2}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  fill="rgba(0,0,0,0.1)"
                  rx={4}
                  className="pointer-events-none"
                />

                {/* Value label on bar */}
                <text
                  x={x + barWidth / 2}
                  y={barY - 8}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-900 dark:fill-white"
                >
                  {step.category === 'baseline' || step.category === 'result' 
                    ? formatCurrency(step.value)
                    : formatCurrency(Math.abs(step.value))
                  }
                </text>

                {/* Percentage label */}
                {showPercentages && step.category !== 'baseline' && step.category !== 'result' && (
                  <text
                    x={x + barWidth / 2}
                    y={barY - 22}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-600 dark:fill-gray-400"
                  >
                    {formatPercentage(step.percentage)}
                  </text>
                )}

                {/* Icon inside bar */}
                <foreignObject
                  x={x + barWidth / 2 - 10}
                  y={barY + barHeight / 2 - 10}
                  width={20}
                  height={20}
                  className="pointer-events-none"
                >
                  <IconComponent size={16} className="text-white mx-auto" />
                </foreignObject>

                {/* Impact indicator */}
                {step.category !== 'baseline' && step.category !== 'result' && (
                  <text
                    x={x + barWidth / 2}
                    y={barY + barHeight - 8}
                    textAnchor="middle"
                    className="text-lg font-bold fill-white"
                  >
                    {step.value >= 0 ? '↑' : '↓'}
                  </text>
                )}

                {/* Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 25}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                >
                  {step.label}
                </text>

                {/* Cumulative value */}
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatCurrency(step.cumulative)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected Step Details */}
      {selectedStep !== null && steps[selectedStep] && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              {React.createElement(iconMap[steps[selectedStep].icon as keyof typeof iconMap] || DollarSign, {
                size: 16,
                className: "text-white"
              })}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                {steps[selectedStep].label}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {steps[selectedStep].description}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Impact:</span>{' '}
                  <span className="font-semibold">
                    {formatCurrency(steps[selectedStep].value)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Cumulative:</span>{' '}
                  <span className="font-semibold">
                    {formatCurrency(steps[selectedStep].cumulative)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {formatCurrency(steps[steps.length - 1]?.cumulative - steps[0]?.cumulative)}
          </div>
          <div className="text-xs text-gray-500">
            {formatPercentage(((steps[steps.length - 1]?.cumulative - steps[0]?.cumulative) / steps[0]?.cumulative) * 100)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Positive Drivers</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(
              steps.filter(s => s.value > 0 && s.category !== 'baseline' && s.category !== 'result')
                   .reduce((sum, s) => sum + s.value, 0)
            )}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Risk Factors</div>
          <div className="text-xl font-bold text-red-600">
            {formatCurrency(
              Math.abs(steps.filter(s => s.value < 0 && s.category !== 'baseline' && s.category !== 'result')
                           .reduce((sum, s) => sum + s.value, 0))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
