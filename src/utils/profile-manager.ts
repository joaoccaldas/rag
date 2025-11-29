/**
 * Profile Management Utility
 * Handles CRUD operations for user profiles
 */

"use client"

import { ChatbotProfile, ProfileCreationData, DEFAULT_PROFILE_TEMPLATES } from '../types/profile'

export class ProfileManager {
  private readonly STORAGE_KEY = 'rag_user_profiles'
  private readonly ACTIVE_PROFILE_KEY = 'rag_active_profile'

  /**
   * Get all user profiles
   */
  getAllProfiles(): ChatbotProfile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as ChatbotProfile[]
    } catch (error) {
      console.error('Failed to load profiles:', error)
      return []
    }
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): ChatbotProfile | null {
    const profiles = this.getAllProfiles()
    return profiles.find(p => p.id === id) || null
  }

  /**
   * Create new profile
   */
  createProfile(data: ProfileCreationData): ChatbotProfile {
    const newProfile: ChatbotProfile = {
      id: this.generateId(),
      name: data.name,
      displayName: data.displayName,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      
      // Chatbot Configuration
      chatbotName: data.chatbotName,
      personality: data.personality,
      behavior: data.behavior,
      systemPrompt: data.systemPrompt,
      contextPrompt: data.contextPrompt,
      image: data.image || '',
      
      // Default AI Settings
      temperature: 0.7,
      maxTokens: 2000,
      model: 'mistral:latest', // Use a model that actually exists
      
      // Default RAG Configuration
      searchSettings: {
        maxResults: 10,
        minScore: 0.7,
        enableSemanticSearch: true,
        enableHybridSearch: true
      },
      
      // Default Theme
      theme: {
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        chatBubbleStyle: 'rounded',
        avatarStyle: 'circle'
      },
      
      // Domain & Context
      domains: data.domains || [],
      keywords: [],
      specializations: data.specializations || [],
      
      // Initialize Analytics
      analytics: {
        messagesCount: 0,
        documentsProcessed: 0,
        lastUsed: new Date().toISOString(),
        averageResponseTime: 0
      }
    }

    const profiles = this.getAllProfiles()
    profiles.push(newProfile)
    this.saveProfiles(profiles)
    
    return newProfile
  }

  /**
   * Update existing profile
   */
  updateProfile(id: string, updates: Partial<ChatbotProfile>): ChatbotProfile | null {
    const profiles = this.getAllProfiles()
    const index = profiles.findIndex(p => p.id === id)
    
    if (index === -1) return null
    
    const existingProfile = profiles[index]!
    Object.assign(existingProfile, updates)
    existingProfile.lastModified = new Date().toISOString()
    
    this.saveProfiles(profiles)
    return existingProfile
  }

  /**
   * Delete profile
   */
  deleteProfile(id: string): boolean {
    const profiles = this.getAllProfiles()
    const filteredProfiles = profiles.filter(p => p.id !== id)
    
    if (filteredProfiles.length === profiles.length) {
      return false // Profile not found
    }
    
    this.saveProfiles(filteredProfiles)
    
    // If this was the active profile, clear it
    if (this.getActiveProfileId() === id) {
      this.setActiveProfile(null)
    }
    
    return true
  }

  /**
   * Clone profile with new name
   */
  cloneProfile(id: string, newName: string): ChatbotProfile | null {
    const originalProfile = this.getProfile(id)
    if (!originalProfile) return null
    
    const clonedProfile: ChatbotProfile = {
      ...originalProfile,
      id: this.generateId(),
      name: newName,
      displayName: `${originalProfile.displayName} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      analytics: {
        messagesCount: 0,
        documentsProcessed: 0,
        lastUsed: new Date().toISOString(),
        averageResponseTime: 0
      }
    }
    
    const profiles = this.getAllProfiles()
    profiles.push(clonedProfile)
    this.saveProfiles(profiles)
    
    return clonedProfile
  }

  /**
   * Create profile from template
   */
  createFromTemplate(templateId: string, customizations?: Partial<ProfileCreationData>): ChatbotProfile | null {
    const template = DEFAULT_PROFILE_TEMPLATES.find(t => t.id === templateId)
    if (!template) return null
    
    const baseData: ProfileCreationData = {
      name: customizations?.name || template.name,
      displayName: customizations?.displayName || template.name,
      description: customizations?.description || template.description,
      chatbotName: template.template.chatbotName || 'Assistant',
      personality: template.template.personality || 'Helpful and professional',
      behavior: template.template.behavior || 'Provides helpful assistance',
      systemPrompt: template.template.systemPrompt || 'You are a helpful AI assistant.',
      contextPrompt: template.template.contextPrompt || 'Provide helpful and accurate responses.',
      domains: template.template.domains || [],
      specializations: template.template.specializations || []
    }
    
    // Only add image if it exists
    if (customizations?.image) {
      baseData.image = customizations.image
    }
    
    return this.createProfile(baseData)
  }

  /**
   * Get active profile
   */
  getActiveProfile(): ChatbotProfile | null {
    const activeId = this.getActiveProfileId()
    if (!activeId) return null
    return this.getProfile(activeId)
  }

  /**
   * Set active profile
   */
  setActiveProfile(profileId: string | null): void {
    if (profileId) {
      localStorage.setItem(this.ACTIVE_PROFILE_KEY, profileId)
    } else {
      localStorage.removeItem(this.ACTIVE_PROFILE_KEY)
    }
    
    // Dispatch custom event to notify components in the same tab
    window.dispatchEvent(new CustomEvent('profileChanged', { 
      detail: { profileId } 
    }))
  }

  /**
   * Get active profile ID
   */
  getActiveProfileId(): string | null {
    return localStorage.getItem(this.ACTIVE_PROFILE_KEY)
  }

  /**
   * Update profile analytics
   */
  updateAnalytics(profileId: string, updates?: Partial<ChatbotProfile['analytics']>): void {
    const profile = this.getProfile(profileId)
    if (!profile) return
    
    const currentAnalytics = profile.analytics
    this.updateProfile(profileId, {
      analytics: {
        messagesCount: updates?.messagesCount || currentAnalytics?.messagesCount || 0,
        documentsProcessed: updates?.documentsProcessed || currentAnalytics?.documentsProcessed || 0,
        averageResponseTime: updates?.averageResponseTime || currentAnalytics?.averageResponseTime || 0,
        lastUsed: new Date().toISOString()
      }
    })
  }

  /**
   * Search profiles
   */
  searchProfiles(query: string): ChatbotProfile[] {
    const profiles = this.getAllProfiles()
    const lowercaseQuery = query.toLowerCase()
    
    return profiles.filter(profile => 
      profile.name.toLowerCase().includes(lowercaseQuery) ||
      profile.displayName.toLowerCase().includes(lowercaseQuery) ||
      profile.description?.toLowerCase().includes(lowercaseQuery) ||
      profile.chatbotName.toLowerCase().includes(lowercaseQuery) ||
      profile.personality.toLowerCase().includes(lowercaseQuery) ||
      profile.domains?.some(domain => domain.toLowerCase().includes(lowercaseQuery)) ||
      profile.specializations?.some(spec => spec.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * Export profile
   */
  exportProfile(id: string): string | null {
    const profile = this.getProfile(id)
    if (!profile) return null
    
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: profile
    }, null, 2)
  }

  /**
   * Import profile
   */
  importProfile(jsonData: string): ChatbotProfile | null {
    try {
      const data = JSON.parse(jsonData)
      if (!data.profile) throw new Error('Invalid profile format')
      
      const importedProfile = data.profile
      // Generate new ID to avoid conflicts
      importedProfile.id = this.generateId()
      importedProfile.createdAt = new Date().toISOString()
      importedProfile.lastModified = new Date().toISOString()
      
      const profiles = this.getAllProfiles()
      profiles.push(importedProfile)
      this.saveProfiles(profiles)
      
      return importedProfile
    } catch (error) {
      console.error('Failed to import profile:', error)
      return null
    }
  }

  /**
   * Get profile statistics
   */
  getStatistics() {
    const profiles = this.getAllProfiles()
    const totalMessages = profiles.reduce((sum, p) => sum + (p.analytics?.messagesCount || 0), 0)
    const totalDocuments = profiles.reduce((sum, p) => sum + (p.analytics?.documentsProcessed || 0), 0)
    
    return {
      totalProfiles: profiles.length,
      totalMessages,
      totalDocuments,
      mostUsedProfile: profiles.sort((a, b) => 
        (b.analytics?.messagesCount || 0) - (a.analytics?.messagesCount || 0)
      )[0] || null,
      recentlyUsed: profiles
        .filter(p => p.analytics?.lastUsed)
        .sort((a, b) => 
          new Date(b.analytics!.lastUsed).getTime() - new Date(a.analytics!.lastUsed).getTime()
        )
        .slice(0, 5)
    }
  }

  /**
   * Private helper methods
   */
  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private saveProfiles(profiles: ChatbotProfile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles))
    } catch (error) {
      console.error('Failed to save profiles:', error)
      throw new Error('Failed to save profiles to storage')
    }
  }
}

// Export singleton instance
export const profileManager = new ProfileManager()
