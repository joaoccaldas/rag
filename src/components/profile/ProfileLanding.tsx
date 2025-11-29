/**
 * Profile Landing Page
 * User profile selection and management interface
 */

"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Play, Copy, Trash2, User, Brain, Sparkles, Search, Star, Clock, MessageCircle, Edit } from 'lucide-react'
import { ChatbotProfile, ProfileTemplate, DEFAULT_PROFILE_TEMPLATES } from '../../types/profile'
import { profileManager } from '../../utils/profile-manager'

interface ProfileLandingProps {
  onProfileSelect: (profile: ChatbotProfile) => void
  onCreateNew: () => void
  onEditProfile?: (profileId: string) => void
}

export default function ProfileLanding({ onProfileSelect, onCreateNew, onEditProfile }: ProfileLandingProps) {
  const [profiles, setProfiles] = useState<ChatbotProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // const [selectedCategory, setSelectedCategory] = useState<string>('all') // Removed for now
  const [showTemplates, setShowTemplates] = useState(true) // Show templates by default
  const [isClient, setIsClient] = useState(false) // Add client-side flag
  const [statistics, setStatistics] = useState<{
    totalProfiles: number
    totalMessages: number
    totalDocuments: number
    mostUsedProfile: ChatbotProfile | null
  } | null>(null)

  useEffect(() => {
    setIsClient(true) // Mark as client-side
    loadProfiles()
    loadStatistics()
  }, [])

  const loadProfiles = () => {
    try {
      setIsLoading(true)
      const allProfiles = profileManager.getAllProfiles()
      setProfiles(allProfiles)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = () => {
    try {
      const stats = profileManager.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const handleProfileSelect = (profile: ChatbotProfile) => {
    console.log('🎯 ProfileLanding: handleProfileSelect called with:', profile.name)
    console.log('🔧 ProfileLanding: Setting active profile...')
    profileManager.setActiveProfile(profile.id)
    profileManager.updateAnalytics(profile.id, {
      lastUsed: new Date().toISOString()
    })
    console.log('📞 ProfileLanding: Calling onProfileSelect callback...')
    onProfileSelect(profile)
    console.log('✅ ProfileLanding: handleProfileSelect completed')
  }

  const handleCreateFromTemplate = (template: ProfileTemplate) => {
    console.log('🎨 ProfileLanding: Creating profile from template:', template.name)
    
    // Check if a profile with this template already exists
    const existingProfile = profiles.find(p => 
      p.name === template.name || 
      p.displayName === template.name ||
      (p.domains && template.template.domains && 
       p.domains.some(domain => template.template.domains?.includes(domain)))
    )
    
    if (existingProfile) {
      console.log('🔄 ProfileLanding: Using existing profile instead of creating duplicate:', existingProfile.name)
      handleProfileSelect(existingProfile)
      return
    }
    
    console.log('🔧 ProfileLanding: Calling profileManager.createFromTemplate...')
    const newProfile = profileManager.createFromTemplate(template.id)
    if (newProfile) {
      console.log('✅ ProfileLanding: Profile created successfully:', newProfile.name)
      loadProfiles()
      console.log('📞 ProfileLanding: Calling handleProfileSelect for new profile...')
      handleProfileSelect(newProfile)
    } else {
      console.error('❌ ProfileLanding: Failed to create profile from template')
    }
  }

  const handleDeleteProfile = (profileId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      profileManager.deleteProfile(profileId)
      loadProfiles()
      loadStatistics()
    }
  }

  const handleEditProfile = (profile: ChatbotProfile, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onEditProfile) {
      onEditProfile(profile.id)
    }
  }

  const handleCloneProfile = (profile: ChatbotProfile, event: React.MouseEvent) => {
    event.stopPropagation()
    const clonedProfile = profileManager.cloneProfile(profile.id, `${profile.name}-copy`)
    if (clonedProfile) {
      loadProfiles()
    }
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery === '' || 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.chatbotName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = true // Simplified - show all categories for now
    // TODO: Add category filtering when needed
    // profile.specializations?.some(spec => spec.toLowerCase().includes(selectedCategory.toLowerCase()))
    
    return matchesSearch && matchesCategory
  })

  // const categories = ['all', 'business', 'technical', 'creative', 'educational', 'support'] // Commented out for now

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            Choose Your AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Select a profile or create a new one to customize your RAG experience
          </p>
        </div>

        {/* Only render interactive content on client side */}
        {!isClient ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profiles...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalProfiles}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Profiles</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalMessages}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalDocuments}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Documents</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.mostUsedProfile?.displayName || 'None'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Most Used</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            {!showTemplates && (
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Templates
              </button>
            )}

            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New
            </button>
          </div>
        </div>

        {/* Profile Templates */}
        {showTemplates && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Start Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Hide Templates
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_PROFILE_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <strong>Assistant:</strong> {template.preview.chatbotName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2">
                    &ldquo;{template.preview.samplePrompt}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No profiles found' : 'No profiles yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Create your first profile to get started with personalized AI assistance'
              }
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group hover:shadow-md"
              >
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.chatbotName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{profile.displayName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{profile.chatbotName}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditProfile(profile, e)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleCloneProfile(profile, e)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Clone Profile"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProfile(profile.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {profile.description || profile.personality}
                    </p>
                  </div>

                  {/* Specializations */}
                  {profile.specializations && profile.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.specializations.slice(0, 3).map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                      {profile.specializations.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{profile.specializations.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {profile.analytics?.messagesCount || 0} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastUsed(profile.analytics?.lastUsed || profile.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Play className="w-4 h-4" />
                    Select Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
