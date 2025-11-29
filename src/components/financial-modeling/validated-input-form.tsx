"use client"

import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { BridgeInputs, validateBridgeInputs } from '../../services/finance-calculations'
import { AlertCircle, Check } from 'lucide-react'

interface ValidatedInputProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  description?: string
  validationRules?: {
    min?: number
    max?: number
    required?: boolean
    customValidator?: (value: number) => string | null
  }
}

export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  suffix = "%",
  description,
  validationRules
}: ValidatedInputProps) {
  const [error, setError] = useState<string | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  const validateValue = (val: number): string | null => {
    if (validationRules?.required && (val === null || val === undefined)) {
      return 'This field is required'
    }

    if (validationRules?.min !== undefined && val < validationRules.min) {
      return `Value must be at least ${validationRules.min}${suffix}`
    }

    if (validationRules?.max !== undefined && val > validationRules.max) {
      return `Value must be at most ${validationRules.max}${suffix}`
    }

    if (validationRules?.customValidator) {
      return validationRules.customValidator(val)
    }

    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setIsTouched(true)
    
    const validationError = validateValue(newValue)
    setError(validationError)
    
    onChange(newValue)
  }

  const isValid = !error && isTouched
  const showError = error && isTouched

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {isValid && <Check size={14} className="text-green-500" />}
        {showError && <AlertCircle size={14} className="text-red-500" />}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={`text-right pr-8 ${
            showError ? 'border-red-500 focus:border-red-500' : 
            isValid ? 'border-green-500 focus:border-green-500' : ''
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      
      {description && !showError && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      )}
      
      {showError && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

interface BridgeInputFormProps {
  inputs: BridgeInputs
  onChange: (inputs: BridgeInputs) => void
  className?: string
}

export function BridgeInputForm({ inputs, onChange, className = "" }: BridgeInputFormProps) {
  const [globalErrors, setGlobalErrors] = useState<string[]>([])

  const handleInputChange = (field: keyof BridgeInputs, value: number) => {
    const newInputs = { ...inputs, [field]: value }
    onChange(newInputs)
    
    // Validate all inputs
    const errors = validateBridgeInputs(newInputs)
    setGlobalErrors(errors)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Validation Errors */}
      {globalErrors.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <ul className="list-disc list-inside space-y-1">
              {globalErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Baseline Revenue */}
        <ValidatedInput
          id="baseline"
          label="2025 Baseline Revenue"
          value={inputs.baseline2025}
          onChange={(value) => handleInputChange('baseline2025', value)}
          suffix="$"
          step={1000000}
          description="Starting revenue for the bridge analysis"
          validationRules={{
            required: true,
            min: 1000000,
            max: 1e12,
            customValidator: (val) => val <= 0 ? 'Revenue must be positive' : null
          }}
        />

        {/* Growth Factors */}
        <ValidatedInput
          id="growth"
          label="Volume Growth"
          value={inputs.growthVolume}
          onChange={(value) => handleInputChange('growthVolume', value)}
          description="Organic volume growth percentage"
          validationRules={{
            min: -50,
            max: 50,
            customValidator: (val) => Math.abs(val) > 25 ? 'High growth rates should be reviewed' : null
          }}
        />

        <ValidatedInput
          id="pricing"
          label="Pricing Change"
          value={inputs.pricingChange}
          onChange={(value) => handleInputChange('pricingChange', value)}
          description="Average price adjustment across portfolio"
          validationRules={{
            min: -25,
            max: 25
          }}
        />

        <ValidatedInput
          id="discount"
          label="Discount Impact"
          value={inputs.discountChange}
          onChange={(value) => handleInputChange('discountChange', value)}
          description="Change in discount levels (negative = more discounts)"
          validationRules={{
            min: -10,
            max: 5,
            customValidator: (val) => val > 2 ? 'Large discount reductions should be validated' : null
          }}
        />

        <ValidatedInput
          id="customerMix"
          label="Customer Mix"
          value={inputs.customerMixChange}
          onChange={(value) => handleInputChange('customerMixChange', value)}
          description="Impact from customer portfolio optimization"
          validationRules={{
            min: -15,
            max: 15
          }}
        />

        <ValidatedInput
          id="productMix"
          label="Product Mix"
          value={inputs.productMixChange}
          onChange={(value) => handleInputChange('productMixChange', value)}
          description="Impact from product portfolio shift"
          validationRules={{
            min: -15,
            max: 15
          }}
        />

        <ValidatedInput
          id="bonus"
          label="Bonus Impact"
          value={inputs.bonusImpact}
          onChange={(value) => handleInputChange('bonusImpact', value)}
          description="Bonus and incentive costs (typically negative)"
          validationRules={{
            min: -10,
            max: 5,
            customValidator: (val) => val > 0 ? 'Bonus impact is typically negative (cost)' : null
          }}
        />

        <ValidatedInput
          id="efficiency"
          label="Operational Efficiency"
          value={inputs.operationalEfficiency}
          onChange={(value) => handleInputChange('operationalEfficiency', value)}
          description="Cost savings reinvested in growth"
          validationRules={{
            min: 0,
            max: 10,
            customValidator: (val) => val > 5 ? 'High efficiency gains should be validated' : null
          }}
        />

        <ValidatedInput
          id="market"
          label="Market Expansion"
          value={inputs.marketExpansion}
          onChange={(value) => handleInputChange('marketExpansion', value)}
          description="Revenue from new market penetration"
          validationRules={{
            min: 0,
            max: 20
          }}
        />

        <ValidatedInput
          id="newProducts"
          label="New Products"
          value={inputs.newProducts}
          onChange={(value) => handleInputChange('newProducts', value)}
          description="Revenue from new product launches"
          validationRules={{
            min: 0,
            max: 15,
            customValidator: (val) => val > 10 ? 'High new product impact should be validated' : null
          }}
        />
      </div>

      {/* Input Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Input Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Positive Drivers:</span>
            <div className="font-semibold text-green-600">
              {[
                inputs.growthVolume, inputs.pricingChange, inputs.customerMixChange, 
                inputs.productMixChange, inputs.operationalEfficiency, 
                inputs.marketExpansion, inputs.newProducts
              ].filter(val => val > 0).length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Negative Drivers:</span>
            <div className="font-semibold text-red-600">
              {[
                inputs.growthVolume, inputs.pricingChange, inputs.discountChange,
                inputs.customerMixChange, inputs.productMixChange, inputs.bonusImpact,
                inputs.operationalEfficiency, inputs.marketExpansion, inputs.newProducts
              ].filter(val => val < 0).length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Validation Status:</span>
            <div className={`font-semibold ${globalErrors.length === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {globalErrors.length === 0 ? 'Valid' : `${globalErrors.length} Error(s)`}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
            <div className="font-semibold text-orange-600">
              {globalErrors.length === 0 ? 'Low' : 'Review Needed'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
