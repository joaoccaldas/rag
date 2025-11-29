"use client"

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react'

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

interface VarianceDriverAnalysisProps {
  data: ModelData
  title: string
  subtitle: string
}

export function VarianceDriverAnalysis({ data, title, subtitle }: VarianceDriverAnalysisProps) {
  const analysisData = useMemo(() => {
    const totalVariance = data.target2026 - data.baseline2025
    const totalDriversImpact = Object.values(data.drivers).reduce((sum, driver) => sum + driver.impact, 0)
    
    const driverDetails = Object.entries(data.drivers).map(([key, driver]) => {
      const contribution = totalVariance !== 0 ? (driver.impact / totalVariance) * 100 : 0
      const absoluteContribution = totalDriversImpact !== 0 ? (driver.impact / totalDriversImpact) * 100 : 0
      
      return {
        key,
        label: {
          volume: 'Volume Growth',
          price: 'Price Change',
          mix: 'Product Mix',
          discounts: 'Discounts & Promotions',
          fx: 'Foreign Exchange',
          bonus: 'Bonus & Incentives'
        }[key] || key,
        impact: driver.impact,
        type: driver.type,
        contribution,
        absoluteContribution,
        significance: Math.abs(contribution),
        direction: driver.impact >= 0 ? 'positive' : 'negative'
      }
    }).sort((a, b) => b.significance - a.significance)

    return {
      totalVariance,
      totalDriversImpact,
      drivers: driverDetails
    }
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${Math.abs(value).toFixed(1)}%`
  }

  const getImpactColor = (direction: string) => {
    return direction === 'positive' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400'
  }

  const getBackgroundColor = (direction: string) => {
    return direction === 'positive' 
      ? 'bg-green-50 dark:bg-green-900/20' 
      : 'bg-red-50 dark:bg-red-900/20'
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Total Variance
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(analysisData.totalVariance)}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {((analysisData.totalVariance / data.baseline2025) * 100).toFixed(1)}% growth
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Positive Drivers
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(
              analysisData.drivers
                .filter(d => d.direction === 'positive')
                .reduce((sum, d) => sum + d.impact, 0)
            )}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {analysisData.drivers.filter(d => d.direction === 'positive').length} drivers
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              Negative Drivers
            </span>
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(
              Math.abs(analysisData.drivers
                .filter(d => d.direction === 'negative')
                .reduce((sum, d) => sum + d.impact, 0))
            )}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            {analysisData.drivers.filter(d => d.direction === 'negative').length} drivers
          </div>
        </div>
      </div>

      {/* Driver Analysis Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                Driver
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                Impact
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                Type
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                Contribution
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                Visual
              </th>
            </tr>
          </thead>
          <tbody>
            {analysisData.drivers.map((driver, index) => (
              <tr 
                key={driver.key} 
                className={`border-b border-gray-100 dark:border-gray-700 ${getBackgroundColor(driver.direction)}`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {driver.direction === 'positive' ? (
                      <TrendingUp className="text-green-500" size={16} />
                    ) : (
                      <TrendingDown className="text-red-500" size={16} />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {driver.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Rank #{index + 1} by impact
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`py-4 px-4 text-right font-semibold ${getImpactColor(driver.direction)}`}>
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign size={14} />
                    {formatCurrency(Math.abs(driver.impact))}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 text-gray-600 dark:text-gray-400">
                    {driver.type === 'percentage' ? (
                      <>
                        <Percent size={14} />
                        <span className="text-sm">Percentage</span>
                      </>
                    ) : (
                      <>
                        <DollarSign size={14} />
                        <span className="text-sm">Absolute</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatPercentage(driver.contribution)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of total variance
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          driver.direction === 'positive' 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.abs(driver.contribution), 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sensitivity Analysis */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Sensitivity Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Most Sensitive Driver:
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {analysisData.drivers[0]?.label} ({formatPercentage(analysisData.drivers[0]?.contribution || 0)})
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Bridge Accuracy:
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {Math.abs(analysisData.totalVariance - analysisData.totalDriversImpact) < 1000 
                ? 'Perfect Match' 
                : `${formatCurrency(Math.abs(analysisData.totalVariance - analysisData.totalDriversImpact))} variance`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
