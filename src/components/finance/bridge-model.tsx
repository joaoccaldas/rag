"use client"

import React, { useState, useMemo, ChangeEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Users, Package, Target, Calculator, Download, Settings, RefreshCw } from "lucide-react"

interface BridgeInputs {
  baseline2025: number
  growthVolume: number
  pricingChange: number
  discountChange: number
  customerMixChange: number
  productMixChange: number
  bonusImpact: number
  operationalEfficiency: number
  marketExpansion: number
  newProducts: number
}

interface WaterfallStep {
  label: string
  value: number
  cumulative: number
  isPositive: boolean
  category: 'baseline' | 'growth' | 'pricing' | 'mix' | 'efficiency' | 'result'
  icon: React.ReactNode
  description: string
}

export function BridgeModel() {
  const [inputs, setInputs] = useState<BridgeInputs>({
    baseline2025: 100000000, // $100M baseline
    growthVolume: 5.2, // 5.2% growth
    pricingChange: 2.1, // 2.1% price increase
    discountChange: -0.8, // 0.8% discount increase (negative impact)
    customerMixChange: 1.5, // 1.5% positive customer mix
    productMixChange: 0.7, // 0.7% positive product mix
    bonusImpact: -2.1, // 2.1% bonus impact (negative)
    operationalEfficiency: 1.8, // 1.8% efficiency gain
    marketExpansion: 3.2, // 3.2% market expansion
    newProducts: 2.5 // 2.5% new product revenue
  })

  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'realistic' | 'optimistic'>('realistic')

  // Calculate waterfall steps
  const waterfallData = useMemo((): WaterfallStep[] => {
    const baseline = inputs.baseline2025
    let cumulative = baseline

    const steps: WaterfallStep[] = [
      {
        label: '2025 Baseline',
        value: baseline,
        cumulative: baseline,
        isPositive: true,
        category: 'baseline',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Starting revenue base for 2025'
      }
    ]

    // Volume Growth Impact
    const volumeImpact = baseline * (inputs.growthVolume / 100)
    cumulative += volumeImpact
    steps.push({
      label: 'Volume Growth',
      value: volumeImpact,
      cumulative,
      isPositive: volumeImpact > 0,
      category: 'growth',
      icon: <TrendingUp className="w-4 h-4" />,
      description: `${inputs.growthVolume}% organic volume growth`
    })

    // Pricing Impact
    const pricingImpact = baseline * (inputs.pricingChange / 100)
    cumulative += pricingImpact
    steps.push({
      label: 'Pricing',
      value: pricingImpact,
      cumulative,
      isPositive: pricingImpact > 0,
      category: 'pricing',
      icon: <Target className="w-4 h-4" />,
      description: `${inputs.pricingChange}% average price adjustment`
    })

    // Discount Impact
    const discountImpact = baseline * (inputs.discountChange / 100)
    cumulative += discountImpact
    steps.push({
      label: 'Discounts',
      value: discountImpact,
      cumulative,
      isPositive: discountImpact > 0,
      category: 'pricing',
      icon: discountImpact > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      description: `${Math.abs(inputs.discountChange)}% ${inputs.discountChange > 0 ? 'discount reduction' : 'discount increase'}`
    })

    // Customer Mix Impact
    const customerMixImpact = baseline * (inputs.customerMixChange / 100)
    cumulative += customerMixImpact
    steps.push({
      label: 'Customer Mix',
      value: customerMixImpact,
      cumulative,
      isPositive: customerMixImpact > 0,
      category: 'mix',
      icon: <Users className="w-4 h-4" />,
      description: `${inputs.customerMixChange}% customer portfolio optimization`
    })

    // Product Mix Impact
    const productMixImpact = baseline * (inputs.productMixChange / 100)
    cumulative += productMixImpact
    steps.push({
      label: 'Product Mix',
      value: productMixImpact,
      cumulative,
      isPositive: productMixImpact > 0,
      category: 'mix',
      icon: <Package className="w-4 h-4" />,
      description: `${inputs.productMixChange}% product portfolio shift`
    })

    // Market Expansion Impact
    const marketImpact = baseline * (inputs.marketExpansion / 100)
    cumulative += marketImpact
    steps.push({
      label: 'Market Expansion',
      value: marketImpact,
      cumulative,
      isPositive: marketImpact > 0,
      category: 'growth',
      icon: <TrendingUp className="w-4 h-4" />,
      description: `${inputs.marketExpansion}% new market penetration`
    })

    // New Products Impact
    const newProductsImpact = baseline * (inputs.newProducts / 100)
    cumulative += newProductsImpact
    steps.push({
      label: 'New Products',
      value: newProductsImpact,
      cumulative,
      isPositive: newProductsImpact > 0,
      category: 'growth',
      icon: <Package className="w-4 h-4" />,
      description: `${inputs.newProducts}% revenue from new product launches`
    })

    // Operational Efficiency Impact
    const efficiencyImpact = baseline * (inputs.operationalEfficiency / 100)
    cumulative += efficiencyImpact
    steps.push({
      label: 'Operational Efficiency',
      value: efficiencyImpact,
      cumulative,
      isPositive: efficiencyImpact > 0,
      category: 'efficiency',
      icon: <Settings className="w-4 h-4" />,
      description: `${inputs.operationalEfficiency}% cost savings reinvested`
    })

    // Bonus Impact
    const bonusImpact = baseline * (inputs.bonusImpact / 100)
    cumulative += bonusImpact
    steps.push({
      label: 'Bonus Impact',
      value: bonusImpact,
      cumulative,
      isPositive: bonusImpact > 0,
      category: 'efficiency',
      icon: bonusImpact > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      description: `${Math.abs(inputs.bonusImpact)}% ${inputs.bonusImpact > 0 ? 'bonus savings' : 'bonus costs'}`
    })

    // 2026 Result
    steps.push({
      label: '2026 Target',
      value: cumulative,
      cumulative,
      isPositive: cumulative > baseline,
      category: 'result',
      icon: <Target className="w-4 h-4" />,
      description: 'Projected 2026 revenue target'
    })

    return steps
  }, [inputs])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const baseline = inputs.baseline2025
    const lastStep = waterfallData[waterfallData.length - 1]
    if (!lastStep) return { baseline: 0, target: 0, totalGrowth: 0, growthPercentage: 0, isPositiveGrowth: false }
    
    const target = lastStep.cumulative
    const totalGrowth = target - baseline
    const growthPercentage = (totalGrowth / baseline) * 100

    return {
      baseline: baseline,
      target: target,
      totalGrowth: totalGrowth,
      growthPercentage: growthPercentage,
      isPositiveGrowth: totalGrowth > 0
    }
  }, [waterfallData, inputs.baseline2025])

  // Predefined scenarios
  const scenarios = {
    conservative: {
      growthVolume: 2.8,
      pricingChange: 1.2,
      discountChange: -1.5,
      customerMixChange: 0.8,
      productMixChange: 0.3,
      bonusImpact: -2.8,
      operationalEfficiency: 1.2,
      marketExpansion: 1.5,
      newProducts: 1.2
    },
    realistic: {
      growthVolume: 5.2,
      pricingChange: 2.1,
      discountChange: -0.8,
      customerMixChange: 1.5,
      productMixChange: 0.7,
      bonusImpact: -2.1,
      operationalEfficiency: 1.8,
      marketExpansion: 3.2,
      newProducts: 2.5
    },
    optimistic: {
      growthVolume: 8.5,
      pricingChange: 3.2,
      discountChange: -0.2,
      customerMixChange: 2.8,
      productMixChange: 1.5,
      bonusImpact: -1.5,
      operationalEfficiency: 2.8,
      marketExpansion: 5.5,
      newProducts: 4.2
    }
  }

  const loadScenario = (scenario: 'conservative' | 'realistic' | 'optimistic') => {
    setSelectedScenario(scenario)
    setInputs(prev => ({ ...prev, ...scenarios[scenario] }))
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
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Revenue Bridge Model: 2025 → 2026
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Strategic Financial Planning & Waterfall Analysis Tool
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">2025 Baseline</p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.baseline)}</p>
                </div>
                <DollarSign className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">2026 Target</p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.target)}</p>
                </div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-r ${summaryMetrics.isPositiveGrowth ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Growth Impact</p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalGrowth)}</p>
                </div>
                {summaryMetrics.isPositiveGrowth ? 
                  <TrendingUp className="w-8 h-8 opacity-80" /> : 
                  <TrendingDown className="w-8 h-8 opacity-80" />
                }
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-r ${summaryMetrics.isPositiveGrowth ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} text-white`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Growth Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summaryMetrics.growthPercentage)}</p>
                </div>
                <Calculator className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="model" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">Bridge Model</TabsTrigger>
            <TabsTrigger value="inputs">Input Parameters</TabsTrigger>
            <TabsTrigger value="analysis">Analysis & Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Scenario Planning
                </CardTitle>
                <CardDescription>
                  Load predefined scenarios or customize your own parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    variant={selectedScenario === 'conservative' ? 'default' : 'outline'}
                    onClick={() => loadScenario('conservative')}
                    className="flex-1"
                  >
                    Conservative Scenario
                  </Button>
                  <Button 
                    variant={selectedScenario === 'realistic' ? 'default' : 'outline'}
                    onClick={() => loadScenario('realistic')}
                    className="flex-1"
                  >
                    Realistic Scenario
                  </Button>
                  <Button 
                    variant={selectedScenario === 'optimistic' ? 'default' : 'outline'}
                    onClick={() => loadScenario('optimistic')}
                    className="flex-1"
                  >
                    Optimistic Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Waterfall Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Bridge Waterfall Analysis</CardTitle>
                <CardDescription>
                  Visual representation of revenue drivers from 2025 baseline to 2026 target
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Waterfall Steps */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {waterfallData.map((step, index) => (
                      <Card key={index} className={`border-l-4 ${
                        step.category === 'baseline' ? 'border-l-gray-500' :
                        step.category === 'result' ? 'border-l-purple-500' :
                        step.isPositive ? 'border-l-green-500' : 'border-l-red-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {step.icon}
                              <div>
                                <p className="font-semibold text-sm">{step.label}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{step.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {step.category !== 'baseline' && step.category !== 'result' && (
                                <p className={`text-sm font-semibold ${step.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {step.isPositive ? '+' : ''}{formatCurrency(step.value)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Total: {formatCurrency(step.cumulative)}
                              </p>
                            </div>
                          </div>
                          {step.category !== 'baseline' && step.category !== 'result' && (
                            <div className="mt-2">
                              <Progress 
                                value={Math.abs(step.value / inputs.baseline2025) * 1000} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Parameters</CardTitle>
                <CardDescription>
                  Adjust the input parameters to model different scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Baseline */}
                  <div className="space-y-2">
                    <Label htmlFor="baseline">2025 Baseline Revenue</Label>
                    <Input
                      id="baseline"
                      type="number"
                      value={inputs.baseline2025}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputs(prev => ({ ...prev, baseline2025: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  {/* Growth Factors */}
                  <div className="space-y-2">
                    <Label htmlFor="growth">Volume Growth (%)</Label>
                    <Input
                      id="growth"
                      type="number"
                      step="0.1"
                      value={inputs.growthVolume}
                      onChange={(e) => setInputs(prev => ({ ...prev, growthVolume: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing">Pricing Change (%)</Label>
                    <Input
                      id="pricing"
                      type="number"
                      step="0.1"
                      value={inputs.pricingChange}
                      onChange={(e) => setInputs(prev => ({ ...prev, pricingChange: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Impact (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.1"
                      value={inputs.discountChange}
                      onChange={(e) => setInputs(prev => ({ ...prev, discountChange: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerMix">Customer Mix (%)</Label>
                    <Input
                      id="customerMix"
                      type="number"
                      step="0.1"
                      value={inputs.customerMixChange}
                      onChange={(e) => setInputs(prev => ({ ...prev, customerMixChange: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productMix">Product Mix (%)</Label>
                    <Input
                      id="productMix"
                      type="number"
                      step="0.1"
                      value={inputs.productMixChange}
                      onChange={(e) => setInputs(prev => ({ ...prev, productMixChange: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus">Bonus Impact (%)</Label>
                    <Input
                      id="bonus"
                      type="number"
                      step="0.1"
                      value={inputs.bonusImpact}
                      onChange={(e) => setInputs(prev => ({ ...prev, bonusImpact: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="efficiency">Operational Efficiency (%)</Label>
                    <Input
                      id="efficiency"
                      type="number"
                      step="0.1"
                      value={inputs.operationalEfficiency}
                      onChange={(e) => setInputs(prev => ({ ...prev, operationalEfficiency: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="market">Market Expansion (%)</Label>
                    <Input
                      id="market"
                      type="number"
                      step="0.1"
                      value={inputs.marketExpansion}
                      onChange={(e) => setInputs(prev => ({ ...prev, marketExpansion: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newProducts">New Products (%)</Label>
                    <Input
                      id="newProducts"
                      type="number"
                      step="0.1"
                      value={inputs.newProducts}
                      onChange={(e) => setInputs(prev => ({ ...prev, newProducts: Number(e.target.value) }))}
                      className="text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Growth Driver Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {waterfallData
                      .filter(step => step.category !== 'baseline' && step.category !== 'result')
                      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                      .map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            {step.icon}
                            <span className="font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={step.isPositive ? "default" : "destructive"}>
                              {formatCurrency(step.value)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {((step.value / inputs.baseline2025) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Revenue Growth</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Total projected growth: {formatPercentage(summaryMetrics.growthPercentage)} 
                        ({formatCurrency(summaryMetrics.totalGrowth)})
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200">Top Growth Driver</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {waterfallData
                          .filter(s => s.category !== 'baseline' && s.category !== 'result' && s.value > 0)
                          .sort((a, b) => b.value - a.value)[0]?.label || 'No positive drivers'}
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">Risk Factors</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        Monitor discount levels and bonus costs for margin protection
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200">Strategic Focus</h4>
                      <p className="text-sm text-purple-600 dark:text-purple-300">
                        Leverage market expansion and operational efficiency for sustainable growth
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Export & Share</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download your bridge model analysis
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Share Model
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
