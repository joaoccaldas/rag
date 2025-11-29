"use client"

import { useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { MessageCircle, BarChart3, Database, Bot, HardDrive, User, ChevronDown, FileText } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"
import { useActiveProfile } from "@/hooks/useActiveProfile"
import Image from "next/image"

interface HeaderProps {
  activeView: 'dashboard' | 'chat' | 'rag' | 'debug' | 'finance' | 'marketing' | 'hr' | 'database' | 'profile-selection' | 'profile-creator' | 'debugging'
  setActiveView: (view: 'dashboard' | 'chat' | 'rag' | 'debug' | 'finance' | 'marketing' | 'hr' | 'database' | 'profile-selection' | 'profile-creator' | 'debugging') => void
}

export function Header({ activeView, setActiveView }: HeaderProps) {
  const { settings } = useSettings()
  const { activeProfile } = useActiveProfile()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleSwitchProfile = () => {
    setShowProfileMenu(false)
    setActiveView('profile-selection')
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          {/* Logo/Avatar from Settings or Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
              {activeProfile?.image ? (
                <Image 
                  src={activeProfile.image} 
                  alt={activeProfile.chatbotName} 
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : settings.avatarUrl ? (
                <Image 
                  src={settings.avatarUrl} 
                  alt="Caldas Logo" 
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeProfile?.chatbotName || settings.botName || 'Caldas AI Platform'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeProfile ? `Profile: ${activeProfile.displayName}` : 'AI-Powered Analytics Platform'}
              </p>
            </div>
          </div>

          {/* Profile Selector */}
          {activeProfile && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 rounded-full hover:border-gray-300 dark:hover:border-gray-600"
              >
                <User className="w-3 h-3" />
                <span className="hidden sm:block">{activeProfile.displayName}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showProfileMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-48 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Profile</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activeProfile.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeProfile.personality}</p>
                  </div>
                  <button
                    onClick={handleSwitchProfile}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Switch Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 miele:bg-miele-red/10 miele:text-miele-red'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 miele:text-miele-charcoal miele:hover:text-miele-red'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'chat'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 miele:bg-miele-red/10 miele:text-miele-red'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 miele:text-miele-charcoal miele:hover:text-miele-red'
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </button>
            <button
              onClick={() => setActiveView('rag')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'rag'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 miele:bg-miele-red/10 miele:text-miele-red'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 miele:text-miele-charcoal miele:hover:text-miele-red'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </button>
            <button
              onClick={() => setActiveView('database')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'database'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Database
            </button>
          </nav>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  )
}
