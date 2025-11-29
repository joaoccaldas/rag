"use client"

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/components/card'

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

interface ScenarioComparisonProps {
  data: ModelData
  title: string
  subtitle: string
}

export function ScenarioComparison({ data, title, subtitle }: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['base', 'optimistic', 'pessimistic'])

  const scenarios = useMemo(() => {
    const baseScenario = {
      name: 'Base Case',
      id: 'base',
      description: 'Current model assumptions',
      drivers: data.drivers,
      probability: 50,
      color: 'blue'
    }

    const optimisticScenario = {
      name: 'Optimistic',
      id: 'optimistic', 
      description: '20% uplift on positive drivers',
      drivers: Object.fromEntries(
        Object.entries(data.drivers).map(([key, driver]) => [
          key,
          {
            ...driver,
            impact: driver.impact > 0 ? driver.impact * 1.2 : driver.impact
          }
        ])
      ),
      probability: 25,
      color: 'green'
    }

    const pessimisticScenario = {
      name: 'Pessimistic',
      id: 'pessimistic',
      description: '20% downside on positive drivers, 20% worse on negative',
      drivers: Object.fromEntries(
        Object.entries(data.drivers).map(([key, driver]) => [
          key,
          {
            ...driver,
            impact: driver.impact > 0 ? driver.impact * 0.8 : driver.impact * 1.2
          }
        ])
      ),
      probability: 25,
      color: 'red'
    }

    const conservativeScenario = {
      name: 'Conservative',
      id: 'conservative',
      description: '50% of positive impacts achieved',
      drivers: Object.fromEntries(
        Object.entries(data.drivers).map(([key, driver]) => [
          key,
          {
            ...driver,
            impact: driver.impact > 0 ? driver.impact * 0.5 : driver.impact
          }
        ])
      ),
      probability: 30,
      color: 'orange'
    }

    const aggressiveScenario = {
      name: 'Aggressive',
      id: 'aggressive',
      description: '50% uplift on all positive drivers',
      drivers: Object.fromEntries(
        Object.entries(data.drivers).map(([key, driver]) => [
          key,
          {
            ...driver,
            impact: driver.impact > 0 ? driver.impact * 1.5 : driver.impact
          }
        ])
      ),
      probability: 15,
      color: 'purple'
    }

    return [baseScenario, optimisticScenario, pessimisticScenario, conservativeScenario, aggressiveScenario]
  }, [data.drivers])

  const scenarioResults = useMemo(() => {
    return scenarios.map(scenario => {
      const totalDriverImpact = Object.values(scenario.drivers).reduce((sum, driver) => sum + driver.impact, 0)
      const finalValue = data.baseline2025 + totalDriverImpact
      const growthRate = ((finalValue - data.baseline2025) / data.baseline2025) * 100
      const vsTarget = finalValue - data.target2026
      const vsTargetPercent = ((finalValue - data.target2026) / data.target2026) * 100

      return {
        ...scenario,
        totalDriverImpact,
        finalValue,
        growthRate,
        vsTarget,
        vsTargetPercent,
        risk: Math.abs(vsTargetPercent) > 10 ? 'high' : Math.abs(vsTargetPercent) > 5 ? 'medium' : 'low'
      }
    })
  }, [scenarios, data.baseline2025, data.target2026])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value)
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getTextColor = (color: string) => {
    const colors = {
      blue: 'text-blue-700 dark:text-blue-300',
      green: 'text-emerald-700 dark:text-emerald-300',
      red: 'text-red-700 dark:text-red-300',
      orange: 'text-orange-700 dark:text-orange-300',
      purple: 'text-purple-700 dark:text-purple-300'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="text-red-500" size={16} />
      case 'medium':
        return <AlertTriangle className="text-orange-500" size={16} />
      default:
        return <Target className="text-green-500" size={16} />
    }
  }

  const filteredResults = scenarioResults.filter(result => selectedScenarios.includes(result.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Scenario Selection */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Select Scenarios to Compare
          </h4>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenarios(prev => 
                    prev.includes(scenario.id)
                      ? prev.filter(id => id !== scenario.id)
                      : [...prev, scenario.id]
                  )
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedScenarios.includes(scenario.id)
                    ? `${getColorClasses(scenario.color)} ${getTextColor(scenario.color)}`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredResults.map(result => (
          <div
            key={result.id}
            className={`border rounded-lg p-4 ${getColorClasses(result.color)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className={`font-semibold ${getTextColor(result.color)}`}>
                {result.name}
              </h5>
              <div className="flex items-center gap-1">
                {getRiskIcon(result.risk)}
                <span className="text-xs text-gray-500">
                  {result.probability}%
                </span>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              {result.description}
            </p>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Final Value
                </div>
                <div className={`text-lg font-bold ${getTextColor(result.color)}`}>
                  {formatCurrency(result.finalValue)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Growth Rate
                </div>
                <div className="flex items-center gap-1">
                  {result.growthRate >= 0 ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(result.growthRate).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  vs Target
                </div>
                <div className="flex items-center gap-1">
                  {result.vsTarget >= 0 ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    result.vsTarget >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(result.vsTarget))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Scenario Outcomes vs Target
        </h4>
        <div className="space-y-3">
          {filteredResults.map(result => (
            <div key={result.id} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                {result.name}
              </div>
              <div className="flex-1 relative">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.vsTarget >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(result.vsTargetPercent) * 2, 100)}%`,
                      marginLeft: result.vsTarget < 0 ? 'auto' : '0'
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {result.vsTargetPercent >= 0 ? '+' : ''}{result.vsTargetPercent.toFixed(1)}%
                </div>
              </div>
              <div className="w-24 text-right text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(result.finalValue)}
              </div>
            </div>
          ))}
        </div>

        {/* Target line */}
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div className="w-20 text-sm font-bold text-gray-900 dark:text-white">
              Target
            </div>
            <div className="flex-1 relative">
              <div className="h-2 bg-blue-500 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                TARGET
              </div>
            </div>
            <div className="w-24 text-right text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.target2026)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
            Low Risk Scenarios
          </div>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">
            {filteredResults.filter(r => r.risk === 'low').length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Within 5% of target
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">
            Medium Risk Scenarios
          </div>
          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
            {filteredResults.filter(r => r.risk === 'medium').length}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            5-10% variance from target
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">
            High Risk Scenarios
          </div>
          <div className="text-lg font-bold text-red-900 dark:text-red-100">
            {filteredResults.filter(r => r.risk === 'high').length}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">
            &gt;10% variance from target
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}
