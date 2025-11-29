"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { ConsolidatedChatView } from "@/components/chat/consolidated-chat-view"
import { RAGProvider } from "@/rag/contexts/RAGContext"
import { EnhancedModularRAGMenu } from "@/components/rag-menu/enhanced-modular-rag-menu"
import { PageErrorBoundary, ComponentErrorBoundary } from "@/components/error-boundary/error-boundary"
import { 
  ChatErrorBoundary, 
  FeatureErrorBoundary 
} from "@/components/error-boundary/enhanced-error-boundary-system"
import { profileManager } from "@/utils/profile-manager"
import { ChatbotProfile } from "@/types/profile"
import VisualContentDebugger from "@/components/visual-content-debugger"

// Lazy load heavy components for better performance
const RAGView = dynamic(() => import("@/rag/components/rag-view").then(mod => ({ default: mod.RAGView })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

const FinanceHub = dynamic(() => import("@/components/finance/finance-hub").then(mod => ({ default: mod.FinanceHub })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

const MarketingLanding = dynamic(() => import("@/components/marketing/marketing-landing-redesigned").then(mod => ({ default: mod.MarketingLanding })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

const HRLanding = dynamic(() => import("@/components/hr/hr-landing-redesigned").then(mod => ({ default: mod.HRLanding })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

// Debug components - only load in development
const RAGDebugInfo = dynamic(() => import("@/components/rag-debug-info-fixed").then(mod => ({ default: mod.RAGDebugInfo })), {
  loading: () => <div className="text-sm text-gray-500">Loading debug info...</div>,
  ssr: false
})

const AIAnalysisDebug = dynamic(() => import("@/components/debug/ai-analysis-debug"), {
  loading: () => <div className="text-sm text-gray-500">Loading AI debug...</div>,
  ssr: false
})

const OCRDebugInitializer = dynamic(() => import("@/components/ocr-debug-initializer").then(mod => ({ default: mod.OCRDebugInitializer })), {
  loading: () => <div className="text-sm text-gray-500">Loading OCR debug...</div>,
  ssr: false
})

const RAGDebuggingDashboard = dynamic(() => import("@/components/debugging/RAGDebuggingDashboard").then(mod => ({ default: mod.RAGDebuggingDashboard })), {
  loading: () => <div className="text-sm text-gray-500">Loading RAG debug dashboard...</div>,
  ssr: false
})

const ModelStatusDashboard = dynamic(() => import("@/components/status/ModelStatusDashboard").then(mod => ({ default: mod.ModelStatusDashboard })), {
  loading: () => <div className="text-sm text-gray-500">Loading model status...</div>,
  ssr: false
})

const ProfileLanding = dynamic(() => import("@/components/profile/ProfileLanding"), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

const ProfileCreator = dynamic(() => import("@/components/profile/ProfileCreator"), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

const DatabaseManagementPage = dynamic(() => import("@/components/database/DatabaseManagementPage"), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>,
  ssr: false
})

// Load test functions in development
if (process.env.NODE_ENV === 'development') {
  import("../tests/simple-rag-test")
}

// Auto-migrate storage systems
import("../src/storage/utils/auto-migration")

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'rag' | 'debug' | 'finance' | 'marketing' | 'hr' | 'database' | 'profile-selection' | 'profile-creator' | 'debugging'>('dashboard') // Back to dashboard default
  const [ragActiveTab, setRagActiveTab] = useState<'documents' | 'search' | 'stats' | 'upload' | 'knowledge' | 'visual' | 'settings' | 'analytics' | 'admin' | 'notes' | 'ideas'>('documents')
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string>('')

  // Check for active profile on mount
  useEffect(() => {
    const checkActiveProfile = () => {
      console.log('🔍 Checking for active profile...')
      const activeProfile = profileManager.getActiveProfile()
      const allProfiles = profileManager.getAllProfiles()
      
      console.log('📊 Profile status:', {
        activeProfile: !!activeProfile,
        totalProfiles: allProfiles.length,
        profileIds: allProfiles.map(p => p.id)
      })
      
      // Always start with profile selection page where users can:
      // 1. See existing profiles (if any)
      // 2. Select from existing profiles
      // 3. Create new profiles
      console.log('🏠 Showing profile landing page')
      setActiveView('profile-selection')
    }
    
    checkActiveProfile()
    
    // Listen for profile changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeProfileId' || e.key?.startsWith('chatbot_profile_')) {
        console.log('🔄 Profile storage changed, re-checking...')
        checkActiveProfile()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Profile handlers
  const handleProfileSelect = (profile: ChatbotProfile) => {
    console.log('✅ Profile selected:', profile.name)
    console.log('🔄 Setting active profile and switching to dashboard...')
    
    // Set active profile first
    profileManager.setActiveProfile(profile.id)
    
    // Then switch view
    console.log('🎯 Switching to dashboard view')
    setActiveView('dashboard')
    
    // Force a small delay to ensure state updates
    setTimeout(() => {
      console.log('📊 Dashboard view should now be active')
    }, 100)
  }

  const handleProfileCreate = () => {
    console.log('➕ Creating new profile...')
    setActiveView('profile-creator')
    setEditingProfileId('')
  }

  const handleProfileEdit = (profileId: string) => {
    console.log('✏️ Editing profile:', profileId)
    setEditingProfileId(profileId)
    setActiveView('profile-creator')
  }

  const handleProfileCreated = (profile: ChatbotProfile) => {
    console.log('✅ Profile created:', profile.name)
    profileManager.setActiveProfile(profile.id)
    setActiveView('dashboard')
  }

  const handleBackToSelection = () => {
    console.log('🔙 Back to profile selection')
    setActiveView('profile-selection')
    setEditingProfileId('')
  }

  const handleRagViewChange = (view: string) => {
    console.log(`🔄 ROOT handleRagViewChange called with view: "${view}"`)
    
    // Handle department views - render department landing pages
    if (view === 'finance') {
      console.log('✅ Switching to Finance view')
      setActiveView('finance')
      return
    }
    
    if (view === 'marketing') {
      console.log('✅ Switching to Marketing view')
      setActiveView('marketing')
      return
    }
    
    if (view === 'hr') {
      console.log('✅ Switching to HR view')
      setActiveView('hr')
      return
    }
    
    if (view === 'debugging') {
      console.log('✅ Switching to Debugging view')
      setActiveView('debugging')
      return
    }

    if (view === 'marketing') {
      console.log('✅ Switching to Marketing view')  
      setActiveView('marketing')
      return
    }

    if (view === 'hr') {
      console.log('✅ Switching to HR view')
      setActiveView('hr')
      return
    }
    
    // Map RAG menu actions to tabs or views
    const tabMapping: Record<string, typeof ragActiveTab> = {
      'search': 'search',
      'documents': 'documents', 
      'upload': 'upload',
      'stats': 'stats',
      'knowledge': 'knowledge',
      'visual': 'visual',
      'settings': 'settings',
      'analytics': 'analytics',
      'admin': 'admin',
      'notes': 'notes',
      'ideas': 'ideas'
    }
    
    // Handle debug view separately
    if (view === 'debug') {
      setActiveView('debug')
      return
    }
    
    const targetTab = tabMapping[view]
    console.log(`Main page: Mapping view '${view}' to tab '${targetTab}', current tab: ${ragActiveTab}`)
    if (targetTab) {
      setRagActiveTab(targetTab)
      // Switch to RAG view if not already there
      if (activeView !== 'rag') {
        setActiveView('rag')
      }
    }
  }

  const toggleDebugInfo = () => setShowDebugInfo(!showDebugInfo)

  return (
    <PageErrorBoundary name="HomePage">
      <RAGProvider>
        <OCRDebugInitializer />
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <ComponentErrorBoundary name="Header">
            <Header activeView={activeView} setActiveView={setActiveView} />
          </ComponentErrorBoundary>
          
          <main className="flex-1 flex overflow-hidden">
            {/* Profile Selection and Creation Views */}
            {activeView === 'profile-selection' ? (
              <div className="w-full">
                <ProfileLanding 
                  onProfileSelect={handleProfileSelect}
                  onCreateNew={handleProfileCreate}
                  onEditProfile={handleProfileEdit}
                />
              </div>
            ) : activeView === 'profile-creator' ? (
              <div className="w-full">
                <ProfileCreator 
                  profileId={editingProfileId || ''}
                  onSave={handleProfileCreated}
                  onCancel={handleBackToSelection}
                />
              </div>
            ) : activeView === 'dashboard' ? (
              <ComponentErrorBoundary name="Dashboard">
                <ModelStatusDashboard />
              </ComponentErrorBoundary>
            ) : (
              <>
                <ComponentErrorBoundary name="RAGMenu">
                  <EnhancedModularRAGMenu
                    onActionSelect={(itemId: string, actionId: string, targetView: string) => {
                      console.log('🔗 ROOT PAGE onActionSelect received:', itemId, actionId, targetView)
                      handleRagViewChange(targetView)
                    }}
                    showDepartments={true}
                    defaultExpandedDepartments={['finance']}
                  />
                </ComponentErrorBoundary>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                  {activeView === 'chat' ? (
                    <ChatErrorBoundary>
                      <ConsolidatedChatView />
                    </ChatErrorBoundary>
                  ) : activeView === 'finance' ? (
                    <FeatureErrorBoundary feature="Finance Hub">
                      <FinanceHub onNavigate={handleRagViewChange} />
                    </FeatureErrorBoundary>
                  ) : activeView === 'marketing' ? (
                    <FeatureErrorBoundary feature="Marketing">
                      <MarketingLanding onNavigate={handleRagViewChange} />
                    </FeatureErrorBoundary>
                  ) : activeView === 'hr' ? (
                    <FeatureErrorBoundary feature="HR">
                      <HRLanding onNavigate={handleRagViewChange} />
                    </FeatureErrorBoundary>
                  ) : activeView === 'debugging' ? (
                    <FeatureErrorBoundary feature="RAG Debugging">
                      <RAGDebuggingDashboard />
                    </FeatureErrorBoundary>
                  ) : activeView === 'debug' ? (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Debug Center</h2>
                          <div className="grid grid-cols-1 gap-6">
                            <ComponentErrorBoundary name="VisualContentDebugger">
                              <VisualContentDebugger />
                            </ComponentErrorBoundary>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <ComponentErrorBoundary name="AIAnalysisDebug">
                                <AIAnalysisDebug />
                              </ComponentErrorBoundary>
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Debug Tools</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                  Additional debug tools and system diagnostics will appear here.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeView === 'database' ? (
                    <FeatureErrorBoundary feature="Database Management">
                      <DatabaseManagementPage />
                    </FeatureErrorBoundary>
                  ) : (
                    <FeatureErrorBoundary feature="RAG System">
                      <RAGView />
                    </FeatureErrorBoundary>
                  )}
                </div>
              </>
            )}
            
            {/* Debug Panel */}
            {showDebugInfo && (
              <ComponentErrorBoundary name="RAGDebugInfo">
                <div className="absolute bottom-space-md right-space-md z-50">
                  <RAGDebugInfo />
                  <button 
                    onClick={toggleDebugInfo}
                    className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
                  >
                    Close Debug
                  </button>
                </div>
              </ComponentErrorBoundary>
            )}
            

          </main>
        </div>
      </RAGProvider>
    </PageErrorBoundary>
  )
}
