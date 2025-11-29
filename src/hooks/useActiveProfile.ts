/**
 * Active Profile Hook
 * Provides reactive access to the currently active profile
 */

import { useState, useEffect } from 'react'
import { ChatbotProfile } from '@/types/profile'
import { profileManager } from '@/utils/profile-manager'

export function useActiveProfile() {
  const [activeProfile, setActiveProfile] = useState<ChatbotProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActiveProfile = () => {
      try {
        const profile = profileManager.getActiveProfile()
        console.log('🔄 useActiveProfile: Loading profile:', profile?.name || 'None')
        setActiveProfile(profile)
      } catch (error) {
        console.error('Failed to load active profile:', error)
        setActiveProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadActiveProfile()

    // Listen for profile changes in localStorage (from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'rag_active_profile' || event.key === 'rag_user_profiles') {
        loadActiveProfile()
      }
    }

    // Listen for custom profile change events (from same tab)
    const handleProfileChange = () => {
      loadActiveProfile()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileChanged', handleProfileChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileChanged', handleProfileChange)
    }
  }, [])

  const switchProfile = (profileId: string) => {
    profileManager.setActiveProfile(profileId)
    const newProfile = profileManager.getActiveProfile()
    setActiveProfile(newProfile)
  }

  const clearActiveProfile = () => {
    profileManager.setActiveProfile(null)
    setActiveProfile(null)
  }

  return {
    activeProfile,
    isLoading,
    switchProfile,
    clearActiveProfile,
    hasActiveProfile: !!activeProfile
  }
}

/**
 * Get effective chat settings combining base settings with profile overrides
 * Note: Model selection should always respect user choice, not profile override
 */
export function useProfiledChatSettings(baseSettings: Record<string, unknown>) {
  const { activeProfile } = useActiveProfile()

  const effectiveSettings = {
    ...baseSettings,
    ...(activeProfile && {
      systemPrompt: activeProfile.systemPrompt,
      contextPrompt: activeProfile.contextPrompt,
      personality: activeProfile.personality,
      botName: activeProfile.chatbotName,
      temperature: activeProfile.temperature || baseSettings['temperature'],
      maxTokens: activeProfile.maxTokens || baseSettings['maxTokens'],
      // DO NOT override model - let user choice take precedence
      // model: activeProfile.model || baseSettings['model'], // REMOVED
      // Add profile-specific context to system prompt
      personalityDescription: `${activeProfile.personality} - ${activeProfile.behavior}`
    })
  }

  return effectiveSettings
}
