/**
 * Finance Calculations Service
 * Centralized business logic for financial modeling calculations
 */

export interface BridgeInputs {
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

export interface WaterfallStep {
  label: string
  value: number
  cumulative: number
  isPositive: boolean
  category: 'baseline' | 'growth' | 'pricing' | 'mix' | 'efficiency' | 'result'
  icon: string // Icon name instead of React component for reusability
  description: string
  percentage: number // Percentage of baseline
}

export interface SummaryMetrics {
  baseline: number
  target: number
  totalGrowth: number
  growthPercentage: number
  isPositiveGrowth: boolean
  topPositiveDriver: string | null
  topNegativeDriver: string | null
  riskScore: number // 0-100 risk assessment
}

export interface ScenarioDefinition {
  name: string
  description: string
  inputs: Partial<BridgeInputs>
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Predefined scenario templates
 */
export const SCENARIO_TEMPLATES: Record<string, ScenarioDefinition> = {
  conservative: {
    name: 'Conservative',
    description: 'Risk-averse scenario with modest growth expectations',
    riskLevel: 'low',
    inputs: {
      growthVolume: 2.8,
      pricingChange: 1.2,
      discountChange: -1.5,
      customerMixChange: 0.8,
      productMixChange: 0.3,
      bonusImpact: -2.8,
      operationalEfficiency: 1.2,
      marketExpansion: 1.5,
      newProducts: 1.2
    }
  },
  realistic: {
    name: 'Realistic',
    description: 'Balanced scenario based on market trends and historical data',
    riskLevel: 'medium',
    inputs: {
      growthVolume: 5.2,
      pricingChange: 2.1,
      discountChange: -0.8,
      customerMixChange: 1.5,
      productMixChange: 0.7,
      bonusImpact: -2.1,
      operationalEfficiency: 1.8,
      marketExpansion: 3.2,
      newProducts: 2.5
    }
  },
  optimistic: {
    name: 'Optimistic',
    description: 'Growth-focused scenario with aggressive targets',
    riskLevel: 'high',
    inputs: {
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
}

/**
 * Calculate waterfall steps from bridge inputs
 */
export function calculateWaterfallSteps(inputs: BridgeInputs): WaterfallStep[] {
  const baseline = inputs.baseline2025
  let cumulative = baseline

  const steps: WaterfallStep[] = [
    {
      label: '2025 Baseline',
      value: baseline,
      cumulative: baseline,
      isPositive: true,
      category: 'baseline',
      icon: 'DollarSign',
      description: 'Starting revenue base for 2025',
      percentage: 100
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
    icon: 'TrendingUp',
    description: `${inputs.growthVolume}% organic volume growth`,
    percentage: inputs.growthVolume
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
    icon: 'Target',
    description: `${inputs.pricingChange}% average price adjustment`,
    percentage: inputs.pricingChange
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
    icon: discountImpact > 0 ? 'TrendingUp' : 'TrendingDown',
    description: `${Math.abs(inputs.discountChange)}% ${inputs.discountChange > 0 ? 'discount reduction' : 'discount increase'}`,
    percentage: inputs.discountChange
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
    icon: 'Users',
    description: `${inputs.customerMixChange}% customer portfolio optimization`,
    percentage: inputs.customerMixChange
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
    icon: 'Package',
    description: `${inputs.productMixChange}% product portfolio shift`,
    percentage: inputs.productMixChange
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
    icon: 'TrendingUp',
    description: `${inputs.marketExpansion}% new market penetration`,
    percentage: inputs.marketExpansion
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
    icon: 'Package',
    description: `${inputs.newProducts}% revenue from new product launches`,
    percentage: inputs.newProducts
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
    icon: 'Settings',
    description: `${inputs.operationalEfficiency}% cost savings reinvested`,
    percentage: inputs.operationalEfficiency
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
    icon: bonusImpact > 0 ? 'TrendingUp' : 'TrendingDown',
    description: `${Math.abs(inputs.bonusImpact)}% ${inputs.bonusImpact > 0 ? 'bonus savings' : 'bonus costs'}`,
    percentage: inputs.bonusImpact
  })

  // 2026 Result
  steps.push({
    label: '2026 Target',
    value: cumulative,
    cumulative,
    isPositive: cumulative > baseline,
    category: 'result',
    icon: 'Target',
    description: 'Projected 2026 revenue target',
    percentage: ((cumulative - baseline) / baseline) * 100
  })

  return steps
}

/**
 * Calculate summary metrics from waterfall steps
 */
export function calculateSummaryMetrics(waterfallSteps: WaterfallStep[], inputs: BridgeInputs): SummaryMetrics {
  const baseline = inputs.baseline2025
  const lastStep = waterfallSteps[waterfallSteps.length - 1]
  
  if (!lastStep) {
    return {
      baseline: 0,
      target: 0,
      totalGrowth: 0,
      growthPercentage: 0,
      isPositiveGrowth: false,
      topPositiveDriver: null,
      topNegativeDriver: null,
      riskScore: 100
    }
  }

  const target = lastStep.cumulative
  const totalGrowth = target - baseline
  const growthPercentage = (totalGrowth / baseline) * 100

  // Find top drivers
  const driverSteps = waterfallSteps.filter(s => s.category !== 'baseline' && s.category !== 'result')
  const positiveDrivers = driverSteps.filter(s => s.value > 0).sort((a, b) => b.value - a.value)
  const negativeDrivers = driverSteps.filter(s => s.value < 0).sort((a, b) => a.value - b.value)

  // Calculate risk score (0-100)
  const totalNegativeImpact = Math.abs(negativeDrivers.reduce((sum, s) => sum + s.value, 0))
  const totalPositiveImpact = positiveDrivers.reduce((sum, s) => sum + s.value, 0)
  const riskScore = totalPositiveImpact > 0 ? Math.min(100, (totalNegativeImpact / totalPositiveImpact) * 50) : 100

  return {
    baseline,
    target,
    totalGrowth,
    growthPercentage,
    isPositiveGrowth: totalGrowth > 0,
    topPositiveDriver: positiveDrivers[0]?.label || null,
    topNegativeDriver: negativeDrivers[0]?.label || null,
    riskScore: Math.round(riskScore)
  }
}

/**
 * Validate bridge inputs
 */
export function validateBridgeInputs(inputs: BridgeInputs): string[] {
  const errors: string[] = []

  if (inputs.baseline2025 <= 0) {
    errors.push('Baseline revenue must be positive')
  }

  if (inputs.baseline2025 > 1e12) {
    errors.push('Baseline revenue seems unrealistic (> $1T)')
  }

  if (Math.abs(inputs.growthVolume) > 50) {
    errors.push('Volume growth should be between -50% and +50%')
  }

  if (Math.abs(inputs.pricingChange) > 25) {
    errors.push('Pricing change should be between -25% and +25%')
  }

  if (inputs.discountChange > 5) {
    errors.push('Discount changes should typically be negative or small positive')
  }

  return errors
}

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

/**
 * Generate export data for external tools
 */
export function generateExportData(inputs: BridgeInputs, waterfallSteps: WaterfallStep[], metrics: SummaryMetrics) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      scenario: 'Custom',
      version: '1.0'
    },
    inputs,
    waterfallSteps,
    metrics,
    summary: {
      totalGrowth: formatCurrency(metrics.totalGrowth),
      growthPercentage: formatPercentage(metrics.growthPercentage),
      riskAssessment: metrics.riskScore < 30 ? 'Low' : metrics.riskScore < 60 ? 'Medium' : 'High'
    }
  }
}
