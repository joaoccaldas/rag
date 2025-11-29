"use client"

import { useState } from 'react'
import { DollarSign, Percent, Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

interface ModelingControlsProps {
  modelData: ModelData
  onDataChange: (data: ModelData) => void
}

export function ModelingControls({ modelData, onDataChange }: ModelingControlsProps) {
  const [editMode, setEditMode] = useState(false)

  const handleBaselineChange = (value: number) => {
    onDataChange({
      ...modelData,
      baseline2025: value
    })
  }

  const handleTargetChange = (value: number) => {
    onDataChange({
      ...modelData,
      target2026: value
    })
  }

  const handleDriverChange = (driverKey: keyof ModelData['drivers'], field: keyof DriverData, value: number | string) => {
    onDataChange({
      ...modelData,
      drivers: {
        ...modelData.drivers,
        [driverKey]: {
          ...modelData.drivers[driverKey],
          [field]: value
        }
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getDriverIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp size={16} className="text-green-500" />
    if (impact < 0) return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-gray-400" />
  }

  const drivers = [
    { key: 'volume', label: 'Volume Growth', description: 'Units sold increase/decrease' },
    { key: 'price', label: 'Price Change', description: 'Average selling price impact' },
    { key: 'mix', label: 'Product Mix', description: 'Product portfolio shift impact' },
    { key: 'discounts', label: 'Discounts & Promotions', description: 'Promotional impact' },
    { key: 'fx', label: 'Foreign Exchange', description: 'Currency translation impact' },
    { key: 'bonus', label: 'Bonus & Incentives', description: 'Performance bonuses' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Model Controls
          </h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {editMode ? 'View Mode' : 'Edit Mode'}
          </button>
        </div>

        {/* Baseline Values */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              2025 Baseline
            </label>
            {editMode ? (
              <input
                type="number"
                value={modelData.baseline2025}
                onChange={(e) => handleBaselineChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <DollarSign size={18} />
                {formatCurrency(modelData.baseline2025)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              2026 Target
            </label>
            {editMode ? (
              <input
                type="number"
                value={modelData.target2026}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400">
                <DollarSign size={18} />
                {formatCurrency(modelData.target2026)}
              </div>
            )}
          </div>

          {/* Growth Rate */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Growth Rate:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatPercentage((modelData.target2026 - modelData.baseline2025) / modelData.baseline2025)}
              </span>
            </div>
          </div>
        </div>

        {/* Drivers */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Value Drivers
          </h4>
          <div className="space-y-3">
            {drivers.map(({ key, label, description }) => {
              const driver = modelData.drivers[key as keyof ModelData['drivers']]
              return (
                <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getDriverIcon(driver.impact)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                      </span>
                    </div>
                    {editMode && (
                      <select
                        value={driver.type}
                        onChange={(e) => handleDriverChange(key as keyof ModelData['drivers'], 'type', e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="absolute">Absolute</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {description}
                  </p>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={driver.impact}
                        onChange={(e) => handleDriverChange(key as keyof ModelData['drivers'], 'impact', Number(e.target.value))}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {driver.type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {driver.type === 'percentage' ? (
                        <>
                          <Percent size={14} />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatPercentage(driver.impact / 100)}
                          </span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={14} />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(driver.impact)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Bridge:
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(
                Object.values(modelData.drivers).reduce((sum, driver) => sum + driver.impact, 0)
              )}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Calculated 2026:
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {formatCurrency(
                modelData.baseline2025 + Object.values(modelData.drivers).reduce((sum, driver) => sum + driver.impact, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
