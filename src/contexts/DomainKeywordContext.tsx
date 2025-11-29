/**
 * Domain Keyword Customization Context
 * Manages customizable keyword arrays and thresholds for domain detection
 */

"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface DomainKeywordSet {
  id: string
  name: string
  domain: 'business' | 'technical' | 'appliance' | 'service'
  keywords: string[]
  threshold: number // 0.0 - 1.0, percentage of keywords that must match
  isDefault: boolean
  isActive: boolean
  createdAt: string
  lastModified: string
}

export interface DomainDetectionConfig {
  enableCustomKeywords: boolean
  fallbackThreshold: number
  minimumKeywordMatches: number
  caseSensitive: boolean
  usePartialMatching: boolean
}

interface DomainKeywordContextType {
  keywordSets: DomainKeywordSet[]
  detectionConfig: DomainDetectionConfig
  
  // Keyword Set Management
  createKeywordSet: (keywordSet: Omit<DomainKeywordSet, 'id' | 'createdAt' | 'lastModified'>) => void
  updateKeywordSet: (id: string, updates: Partial<DomainKeywordSet>) => void
  deleteKeywordSet: (id: string) => void
  duplicateKeywordSet: (id: string, newName: string) => void
  
  // Configuration Management
  updateDetectionConfig: (config: Partial<DomainDetectionConfig>) => void
  
  // Utility Functions
  getActiveKeywordsByDomain: (domain: string) => string[]
  detectDomainWithCustomKeywords: (content: string, filename?: string) => {
    domain: string
    confidence: number
    matchedKeywords: string[]
    explanation: string
  }
  
  // Import/Export
  exportKeywordSets: () => string
  importKeywordSets: (data: string) => void
  resetToDefaults: () => void
}

const DomainKeywordContext = createContext<DomainKeywordContextType | undefined>(undefined)

export function useDomainKeywords(): DomainKeywordContextType | null {
  const context = useContext(DomainKeywordContext)
  if (!context) {
    console.error('useDomainKeywords must be used within a DomainKeywordProvider')
    return null
  }
  return context
}

// Default keyword sets based on current implementation
const defaultKeywordSets: DomainKeywordSet[] = [
  {
    id: 'business-default',
    name: 'Business & Operations',
    domain: 'business',
    keywords: [
      'strategy', 'market', 'revenue', 'customer', 'product', 'analysis', 
      'appliance', 'home', 'quality', 'business', 'sales', 'profit',
      'management', 'operations', 'service', 'brand', 'marketing',
      'policy', 'procedure', 'guidelines', 'manual', 'warranty', 'support'
    ],
    threshold: 0.1, // 10% of keywords must match
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'technical-default',
    name: 'Technical Documentation',
    domain: 'technical',
    keywords: [
      'system', 'process', 'implementation', 'architecture', 'performance', 
      'specification', 'feature', 'technical', 'installation', 'configuration', 
      'api', 'software', 'hardware', 'code', 'development', 'database', 
      'server', 'network', 'security', 'protocol', 'algorithm'
    ],
    threshold: 0.15, // 15% of keywords must match
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'appliance-default',
    name: 'Appliance & Products',
    domain: 'appliance',
    keywords: [
      'appliance', 'washing', 'dryer', 'dishwasher', 'oven', 'refrigerator',
      'miele', 'temperature', 'cycle', 'program', 'maintenance', 'cleaning',
      'troubleshooting', 'repair', 'parts', 'model', 'serial', 'cooking',
      'kitchen', 'laundry', 'steam', 'sensor', 'energy', 'efficiency'
    ],
    threshold: 0.12, // 12% of keywords must match
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'service-default',
    name: 'Service & Support',
    domain: 'service',
    keywords: [
      'support', 'maintenance', 'repair', 'warranty', 'installation', 
      'troubleshooting', 'service', 'technical', 'help', 'contact',
      'customer', 'care', 'assistance', 'guidance', 'manual', 'instructions'
    ],
    threshold: 0.2, // 20% of keywords must match
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  }
]

const defaultDetectionConfig: DomainDetectionConfig = {
  enableCustomKeywords: true,
  fallbackThreshold: 0.05, // 5% minimum for any domain detection
  minimumKeywordMatches: 2, // At least 2 keywords must match
  caseSensitive: false,
  usePartialMatching: true // Match partial words (e.g., "wash" matches "washing")
}

export function DomainKeywordProvider({ children }: { children: ReactNode }) {
  const [keywordSets, setKeywordSets] = useState<DomainKeywordSet[]>(defaultKeywordSets)
  const [detectionConfig, setDetectionConfig] = useState<DomainDetectionConfig>(defaultDetectionConfig)

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        const storedSets = localStorage.getItem('miele-domain-keywords')
        const storedConfig = localStorage.getItem('miele-domain-detection-config')
        
        if (storedSets) {
          const data = JSON.parse(storedSets)
          setKeywordSets(data.keywordSets || defaultKeywordSets)
        }
        
        if (storedConfig) {
          const config = JSON.parse(storedConfig)
          setDetectionConfig({ ...defaultDetectionConfig, ...config })
        }
      } catch (error) {
        console.warn('Failed to load domain keyword settings:', error)
      }
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      loadPersistedData()
    }
  }, [])

  // Persist data when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('miele-domain-keywords', JSON.stringify({ keywordSets }))
      } catch (error) {
        console.warn('Failed to save domain keyword settings:', error)
      }
    }
  }, [keywordSets])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('miele-domain-detection-config', JSON.stringify(detectionConfig))
      } catch (error) {
        console.warn('Failed to save domain detection config:', error)
      }
    }
  }, [detectionConfig])

  const createKeywordSet = (newKeywordSet: Omit<DomainKeywordSet, 'id' | 'createdAt' | 'lastModified'>) => {
    const keywordSet: DomainKeywordSet = {
      ...newKeywordSet,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    setKeywordSets(prev => [...prev, keywordSet])
  }

  const updateKeywordSet = (id: string, updates: Partial<DomainKeywordSet>) => {
    setKeywordSets(prev => prev.map(set => 
      set.id === id 
        ? { ...set, ...updates, lastModified: new Date().toISOString() }
        : set
    ))
  }

  const deleteKeywordSet = (id: string) => {
    setKeywordSets(prev => prev.filter(set => set.id !== id))
  }

  const duplicateKeywordSet = (id: string, newName: string) => {
    const originalSet = keywordSets.find(set => set.id === id)
    if (originalSet) {
      createKeywordSet({
        ...originalSet,
        name: newName,
        isDefault: false,
        isActive: true
      })
    }
  }

  const updateDetectionConfig = (config: Partial<DomainDetectionConfig>) => {
    setDetectionConfig(prev => ({ ...prev, ...config }))
  }

  const getActiveKeywordsByDomain = (domain: string): string[] => {
    const activeSets = keywordSets.filter(set => 
      set.domain === domain && set.isActive
    )
    
    // Combine keywords from all active sets for this domain
    const allKeywords = activeSets.flatMap(set => set.keywords)
    
    // Remove duplicates
    return [...new Set(allKeywords)]
  }

  const detectDomainWithCustomKeywords = (content: string, filename = ''): {
    domain: string
    confidence: number
    matchedKeywords: string[]
    explanation: string
  } => {
    if (!detectionConfig.enableCustomKeywords) {
      return {
        domain: 'general',
        confidence: 0,
        matchedKeywords: [],
        explanation: 'Custom keyword detection is disabled'
      }
    }

    const normalizedContent = detectionConfig.caseSensitive ? content : content.toLowerCase()
    const normalizedFilename = detectionConfig.caseSensitive ? filename : filename.toLowerCase()
    const combinedText = `${normalizedContent} ${normalizedFilename}`

    let bestMatch = {
      domain: 'general',
      confidence: 0,
      matchedKeywords: [] as string[],
      totalKeywords: 0,
      threshold: 0
    }

    // Test each active keyword set
    for (const keywordSet of keywordSets.filter(set => set.isActive)) {
      const keywords = detectionConfig.caseSensitive ? keywordSet.keywords : keywordSet.keywords.map(k => k.toLowerCase())
      const matchedKeywords: string[] = []

      for (const keyword of keywords) {
        let matched = false

        if (detectionConfig.usePartialMatching) {
          matched = combinedText.includes(keyword)
        } else {
          const regex = new RegExp(`\\b${keyword}\\b`, 'g')
          matched = regex.test(combinedText)
        }

        if (matched) {
          matchedKeywords.push(keyword)
        }
      }

      const confidence = matchedKeywords.length / keywords.length
      
      // Check if this meets the threshold and minimum matches requirement
      if (confidence >= keywordSet.threshold && 
          matchedKeywords.length >= detectionConfig.minimumKeywordMatches &&
          confidence > bestMatch.confidence) {
        
        bestMatch = {
          domain: keywordSet.domain,
          confidence,
          matchedKeywords,
          totalKeywords: keywords.length,
          threshold: keywordSet.threshold
        }
      }
    }

    // Fallback to general if no domain meets criteria
    if (bestMatch.confidence < detectionConfig.fallbackThreshold) {
      return {
        domain: 'general',
        confidence: 0,
        matchedKeywords: [],
        explanation: `No domain exceeded minimum threshold of ${(detectionConfig.fallbackThreshold * 100).toFixed(1)}%`
      }
    }

    return {
      domain: bestMatch.domain,
      confidence: bestMatch.confidence,
      matchedKeywords: bestMatch.matchedKeywords,
      explanation: `Matched ${bestMatch.matchedKeywords.length}/${bestMatch.totalKeywords} keywords (${(bestMatch.confidence * 100).toFixed(1)}%) for ${bestMatch.domain} domain, exceeding threshold of ${(bestMatch.threshold * 100).toFixed(1)}%`
    }
  }

  const exportKeywordSets = (): string => {
    return JSON.stringify({
      keywordSets,
      detectionConfig,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2)
  }

  const importKeywordSets = (data: string) => {
    try {
      const parsed = JSON.parse(data)
      
      if (parsed.keywordSets && Array.isArray(parsed.keywordSets)) {
        setKeywordSets(parsed.keywordSets)
      }
      
      if (parsed.detectionConfig) {
        setDetectionConfig({ ...defaultDetectionConfig, ...parsed.detectionConfig })
      }
    } catch {
      throw new Error('Invalid import data format')
    }
  }

  const resetToDefaults = () => {
    setKeywordSets(defaultKeywordSets)
    setDetectionConfig(defaultDetectionConfig)
  }

  const value: DomainKeywordContextType = {
    keywordSets,
    detectionConfig,
    createKeywordSet,
    updateKeywordSet,
    deleteKeywordSet,
    duplicateKeywordSet,
    updateDetectionConfig,
    getActiveKeywordsByDomain,
    detectDomainWithCustomKeywords,
    exportKeywordSets,
    importKeywordSets,
    resetToDefaults
  }

  return (
    <DomainKeywordContext.Provider value={value}>
      {children}
    </DomainKeywordContext.Provider>
  )
}
