"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface PromptTemplate {
  id: string
  name: string
  domain: string
  systemPrompt: string
  userPrompt: string
  description: string
  variables: string[] // e.g., ['{content}', '{filename}', '{domain}']
  isDefault: boolean
  isActive: boolean
  createdAt: string
  lastModified: string
}

export interface PromptTemplateVariables {
  content: string
  filename: string
  domain: string
  documentType: string
  wordCount: number
  [key: string]: string | number
}

interface PromptTemplateContextType {
  templates: PromptTemplate[]
  activeTemplates: Record<string, PromptTemplate> // domain -> template
  getTemplate: (domain: string) => PromptTemplate | null
  createTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'lastModified'>) => void
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void
  deleteTemplate: (id: string) => void
  setActiveTemplate: (domain: string, templateId: string) => void
  duplicateTemplate: (id: string, newName: string) => void
  resetToDefaults: () => void
  exportTemplates: () => string
  importTemplates: (data: string) => void
  renderPrompt: (template: PromptTemplate, variables: PromptTemplateVariables) => { systemPrompt: string; userPrompt: string }
}

const PromptTemplateContext = createContext<PromptTemplateContextType | undefined>(undefined)

export function usePromptTemplates() {
  const context = useContext(PromptTemplateContext)
  if (context === undefined) {
    throw new Error('usePromptTemplates must be used within a PromptTemplateProvider')
  }
  return context
}

// Default prompt templates
const defaultTemplates: PromptTemplate[] = [
  {
    id: 'appliance-default',
    name: 'Appliance & Product Analysis',
    domain: 'appliance',
    systemPrompt: 'You are an expert in home appliances and Miele products. Analyze documents for technical specifications, user guidance, maintenance procedures, and product information. Always respond with valid JSON only.',
    userPrompt: `Analyze the following {documentType} and provide a structured analysis focused on:

DOCUMENT: {filename}
DOMAIN: {domain}

Focus on appliance-specific information including:
- Product features and specifications
- Installation and setup procedures
- Operating instructions and programs
- Maintenance and cleaning requirements
- Troubleshooting and error resolution
- Safety guidelines and warnings
- Parts and service information

CONTENT:
{content}

Please provide your analysis in JSON format with: summary, keywords, tags, topics, sentiment, complexity, documentType, and confidence.`,
    description: 'Optimized for appliance manuals, product documentation, and technical specifications',
    variables: ['{content}', '{filename}', '{domain}', '{documentType}'],
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'business-default',
    name: 'Business & Strategy Analysis',
    domain: 'business',
    systemPrompt: 'You are a business analyst expert in customer service, operations, and business processes. Focus on extracting strategic insights, operational procedures, and business-relevant information. Always respond with valid JSON only.',
    userPrompt: `Analyze the following {documentType} and provide business insights focused on:

DOCUMENT: {filename}
DOMAIN: {domain}

Focus on business and operational information including:
- Business objectives and strategies
- Customer service procedures
- Product information and positioning
- Operational guidelines and policies
- Market analysis and insights
- Performance metrics and KPIs
- Compliance and regulatory information

CONTENT:
{content}

Please provide your analysis in JSON format with: summary, keywords, tags, topics, sentiment, complexity, documentType, and confidence.`,
    description: 'Designed for business documents, strategic plans, and operational procedures',
    variables: ['{content}', '{filename}', '{domain}', '{documentType}'],
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'technical-default',
    name: 'Technical Documentation',
    domain: 'technical',
    systemPrompt: 'You are a technical documentation specialist. Focus on system specifications, implementation details, configuration procedures, and technical requirements. Always respond with valid JSON only.',
    userPrompt: `Analyze the following {documentType} and provide technical insights focused on:

DOCUMENT: {filename}
DOMAIN: {domain}

Focus on technical specifications and implementation details including:
- System architecture and design
- Technical specifications and requirements
- Installation and configuration procedures
- API documentation and interfaces
- Security protocols and measures
- Performance optimization and tuning
- Integration guidelines and best practices

CONTENT:
{content}

Please provide your analysis in JSON format with: summary, keywords, tags, topics, sentiment, complexity, documentType, and confidence.`,
    description: 'Specialized for technical documentation, API guides, and system specifications',
    variables: ['{content}', '{filename}', '{domain}', '{documentType}'],
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  {
    id: 'general-default',
    name: 'General Document Analysis',
    domain: 'general',
    systemPrompt: 'You are a document analysis expert. Extract key information, themes, and metadata from any type of document. Always respond with valid JSON only.',
    userPrompt: `Analyze the following {documentType} and provide a comprehensive analysis:

DOCUMENT: {filename}
DOMAIN: {domain}

Provide a comprehensive analysis focusing on:
- Main topics and themes
- Key information and insights
- Important procedures or instructions
- Notable facts and figures
- Actionable items or recommendations

CONTENT:
{content}

Please provide your analysis in JSON format with: summary, keywords, tags, topics, sentiment, complexity, documentType, and confidence.`,
    description: 'General-purpose template for any document type',
    variables: ['{content}', '{filename}', '{domain}', '{documentType}'],
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  }
]

interface PromptTemplateProviderProps {
  children: ReactNode
}

export function PromptTemplateProvider({ children }: PromptTemplateProviderProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(defaultTemplates)
  const [activeTemplates, setActiveTemplates] = useState<Record<string, PromptTemplate>>({})

  // Load templates from localStorage on mount
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('miele-prompt-templates')
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates)
        setTemplates(parsed.templates || defaultTemplates)
        
        // Build active templates map
        const activeMap: Record<string, PromptTemplate> = {}
        parsed.templates?.forEach((template: PromptTemplate) => {
          if (template.isActive) {
            activeMap[template.domain] = template
          }
        })
        setActiveTemplates(activeMap)
      } else {
        // Initialize with defaults
        const activeMap: Record<string, PromptTemplate> = {}
        defaultTemplates.forEach(template => {
          if (template.isActive) {
            activeMap[template.domain] = template
          }
        })
        setActiveTemplates(activeMap)
      }
    } catch (error) {
      console.error('Failed to load prompt templates:', error)
    }
  }, [])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('miele-prompt-templates', JSON.stringify({
        templates,
        lastUpdated: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to save prompt templates:', error)
    }
  }, [templates])

  const getTemplate = (domain: string): PromptTemplate | null => {
    return activeTemplates[domain] || templates.find(t => t.domain === domain && t.isDefault) || null
  }

  const createTemplate = (templateData: Omit<PromptTemplate, 'id' | 'createdAt' | 'lastModified'>) => {
    const newTemplate: PromptTemplate = {
      ...templateData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    setTemplates(prev => [...prev, newTemplate])

    // If this is set as active, update active templates
    if (newTemplate.isActive) {
      setActiveTemplates(prev => ({
        ...prev,
        [newTemplate.domain]: newTemplate
      }))
    }
  }

  const updateTemplate = (id: string, updates: Partial<PromptTemplate>) => {
    setTemplates(prev => prev.map(template => {
      if (template.id === id) {
        const updated = {
          ...template,
          ...updates,
          lastModified: new Date().toISOString()
        }

        // Update active templates if this template is active
        if (updated.isActive) {
          setActiveTemplates(prevActive => ({
            ...prevActive,
            [updated.domain]: updated
          }))
        }

        return updated
      }
      return template
    }))
  }

  const deleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template?.isDefault) {
      console.warn('Cannot delete default template')
      return
    }

    setTemplates(prev => prev.filter(t => t.id !== id))

    // Remove from active templates if it was active
    if (template?.isActive) {
      setActiveTemplates(prev => {
        const updated = { ...prev }
        delete updated[template.domain]
        return updated
      })
    }
  }

  const setActiveTemplate = (domain: string, templateId: string) => {
    // First, deactivate all templates for this domain
    setTemplates(prev => prev.map(template => ({
      ...template,
      isActive: template.domain === domain ? template.id === templateId : template.isActive
    })))

    // Update active templates map
    const newActiveTemplate = templates.find(t => t.id === templateId)
    if (newActiveTemplate) {
      setActiveTemplates(prev => ({
        ...prev,
        [domain]: { ...newActiveTemplate, isActive: true }
      }))
    }
  }

  const duplicateTemplate = (id: string, newName: string) => {
    const original = templates.find(t => t.id === id)
    if (!original) return

    const duplicated: PromptTemplate = {
      ...original,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      isDefault: false,
      isActive: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    setTemplates(prev => [...prev, duplicated])
  }

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all prompt templates to defaults? This will delete all custom templates.')) {
      setTemplates(defaultTemplates)
      
      const activeMap: Record<string, PromptTemplate> = {}
      defaultTemplates.forEach(template => {
        if (template.isActive) {
          activeMap[template.domain] = template
        }
      })
      setActiveTemplates(activeMap)
    }
  }

  const exportTemplates = (): string => {
    return JSON.stringify({
      templates: templates.filter(t => !t.isDefault), // Only export custom templates
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2)
  }

  const importTemplates = (data: string) => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.templates && Array.isArray(parsed.templates)) {
        // Add imported templates (they get new IDs to avoid conflicts)
        const importedTemplates = parsed.templates.map((template: Omit<PromptTemplate, 'id'>) => ({
          ...template,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isActive: false, // Imported templates are not active by default
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }))

        setTemplates(prev => [...prev, ...importedTemplates])
        console.log(`Imported ${importedTemplates.length} prompt templates`)
      } else {
        throw new Error('Invalid template format')
      }
    } catch (error) {
      console.error('Failed to import templates:', error)
      throw new Error('Failed to import templates: Invalid format')
    }
  }

  const renderPrompt = (template: PromptTemplate, variables: PromptTemplateVariables): { systemPrompt: string; userPrompt: string } => {
    let systemPrompt = template.systemPrompt
    let userPrompt = template.userPrompt

    // Replace all variables in both prompts
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), String(value))
      userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return { systemPrompt, userPrompt }
  }

  return (
    <PromptTemplateContext.Provider
      value={{
        templates,
        activeTemplates,
        getTemplate,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        setActiveTemplate,
        duplicateTemplate,
        resetToDefaults,
        exportTemplates,
        importTemplates,
        renderPrompt
      }}
    >
      {children}
    </PromptTemplateContext.Provider>
  )
}
