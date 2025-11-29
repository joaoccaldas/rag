/**
 * Profile Creator Component
 * Create and edit user profiles with customization options
 */

"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Save, ArrowLeft, Upload, X, Brain, MessageSquare, Settings, Wand2 } from 'lucide-react'
import { ChatbotProfile, ProfileCreationData, DEFAULT_PROFILE_TEMPLATES } from '../../types/profile'
import { profileManager } from '../../utils/profile-manager'

interface ProfileCreatorProps {
  profileId?: string // If provided, we're editing an existing profile
  onSave: (profile: ChatbotProfile) => void
  onCancel: () => void
}

export default function ProfileCreator({ profileId, onSave, onCancel }: ProfileCreatorProps) {
  const [formData, setFormData] = useState<ProfileCreationData>({
    name: '',
    displayName: '',
    description: '',
    chatbotName: '',
    personality: '',
    behavior: '',
    systemPrompt: '',
    contextPrompt: '',
    image: '',
    domains: [],
    specializations: []
  })

  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'prompts' | 'advanced'>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    displayName?: string
    chatbotName?: string
    personality?: string
    behavior?: string
    systemPrompt?: string
    contextPrompt?: string
    general?: string
  }>({})
  const [newDomain, setNewDomain] = useState('')
  const [newSpecialization, setNewSpecialization] = useState('')

  const isEditing = !!profileId

  useEffect(() => {
    if (profileId) {
      const profile = profileManager.getProfile(profileId)
      if (profile) {
        setFormData({
          name: profile.name,
          displayName: profile.displayName,
          description: profile.description || '',
          chatbotName: profile.chatbotName,
          personality: profile.personality,
          behavior: profile.behavior,
          systemPrompt: profile.systemPrompt,
          contextPrompt: profile.contextPrompt,
          image: profile.image || '',
          domains: profile.domains || [],
          specializations: profile.specializations || []
        })
      }
    }
  }, [profileId])

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.name.trim()) newErrors.name = 'Profile name is required'
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required'
    if (!formData.chatbotName.trim()) newErrors.chatbotName = 'Chatbot name is required'
    if (!formData.personality.trim()) newErrors.personality = 'Personality is required'
    if (!formData.behavior.trim()) newErrors.behavior = 'Behavior description is required'
    if (!formData.systemPrompt.trim()) newErrors.systemPrompt = 'System prompt is required'
    if (!formData.contextPrompt.trim()) newErrors.contextPrompt = 'Context prompt is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      let savedProfile: ChatbotProfile

      if (isEditing) {
        savedProfile = profileManager.updateProfile(profileId!, formData)!
      } else {
        savedProfile = profileManager.createProfile(formData)
      }

      onSave(savedProfile)
    } catch (error) {
      console.error('Failed to save profile:', error)
      setErrors({ general: 'Failed to save profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, image: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addDomain = () => {
    if (newDomain.trim() && !formData.domains?.includes(newDomain.trim())) {
      setFormData(prev => ({
        ...prev,
        domains: [...(prev.domains || []), newDomain.trim()]
      }))
      setNewDomain('')
    }
  }

  const removeDomain = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains?.filter(d => d !== domain) || []
    }))
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations?.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...(prev.specializations || []), newSpecialization.trim()]
      }))
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations?.filter(s => s !== specialization) || []
    }))
  }

  const loadTemplate = (templateId: string) => {
    const template = DEFAULT_PROFILE_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    setFormData(prev => ({
      ...prev,
      chatbotName: template.template.chatbotName || prev.chatbotName,
      personality: template.template.personality || prev.personality,
      behavior: template.template.behavior || prev.behavior,
      systemPrompt: template.template.systemPrompt || prev.systemPrompt,
      contextPrompt: template.template.contextPrompt || prev.contextPrompt,
      domains: template.template.domains || prev.domains || [],
      specializations: template.template.specializations || prev.specializations || []
    }))
  }

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: Brain },
    { id: 'personality' as const, label: 'Personality', icon: MessageSquare },
    { id: 'prompts' as const, label: 'AI Prompts', icon: Wand2 },
    { id: 'advanced' as const, label: 'Advanced', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Profile' : 'Create New Profile'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditing ? 'Modify your assistant profile' : 'Design your personalized AI assistant'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Template Quick Actions */}
        {!isEditing && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Start Templates</h3>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PROFILE_TEMPLATES.slice(0, 4).map(template => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700/50 transition-colors"
                >
                  {template.icon} {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{errors.general}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., my-business-assistant"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Business Assistant"
                  />
                  {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this profile's purpose and capabilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chatbot Name *
                </label>
                <input
                  type="text"
                  value={formData.chatbotName}
                  onChange={(e) => setFormData(prev => ({ ...prev, chatbotName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.chatbotName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Alex, BusinessBot, AssistantPro"
                />
                {errors.chatbotName && <p className="mt-1 text-sm text-red-600">{errors.chatbotName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                    {formData.image && (
                    <div className="relative">
                      <Image
                        src={formData.image}
                        alt="Profile preview"
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Personality Tab */}
          {activeTab === 'personality' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personality *
                </label>
                <input
                  type="text"
                  value={formData.personality}
                  onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personality ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Professional, friendly, and analytical"
                />
                {errors.personality && <p className="mt-1 text-sm text-red-600">{errors.personality}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Behavior Description *
                </label>
                <textarea
                  value={formData.behavior}
                  onChange={(e) => setFormData(prev => ({ ...prev, behavior: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.behavior ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe how this assistant should behave, its communication style, and approach to helping users..."
                />
                {errors.behavior && <p className="mt-1 text-sm text-red-600">{errors.behavior}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specializations
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a specialization..."
                    />
                    <button
                      onClick={addSpecialization}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.specializations?.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                      >
                        {spec}
                        <button
                          onClick={() => removeSpecialization(spec)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  System Prompt *
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    errors.systemPrompt ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Define the AI's role, capabilities, and general behavior. This is the main instruction that shapes how the AI responds..."
                />
                {errors.systemPrompt && <p className="mt-1 text-sm text-red-600">{errors.systemPrompt}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  This prompt defines the AI&apos;s core identity and behavior. Be specific about its role and capabilities.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Context Prompt *
                </label>
                <textarea
                  value={formData.contextPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, contextPrompt: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    errors.contextPrompt ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Additional context about how to handle specific scenarios, domains, or use cases..."
                />
                {errors.contextPrompt && <p className="mt-1 text-sm text-red-600">{errors.contextPrompt}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  This prompt provides additional context for specific use cases and domains.
                </p>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domains
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a domain..."
                    />
                    <button
                      onClick={addDomain}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.domains?.map((domain, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm flex items-center gap-1"
                      >
                        {domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Domains help categorize and filter profiles. Examples: business, finance, healthcare, education
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
