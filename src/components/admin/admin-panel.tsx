"use client"

import { useState } from 'react'
import { Shield, Settings, Monitor, Database, FileText, Users, Activity, Upload, Eye, Brain } from 'lucide-react'
import { DatabaseManager } from './database-manager'
import { SystemMonitor } from './system-monitor'
import { ComprehensiveUploadDashboard } from '../upload/ComprehensiveUploadDashboard'
import { VisualContentDiagnostic } from '../VisualContentDiagnostic'
import { EnhancedVisualAnalysis } from '../EnhancedVisualAnalysis'
import { Button } from '@/design-system/components'

type AdminSection = 'overview' | 'database' | 'documents' | 'monitor' | 'users' | 'logs' | 'settings' | 'visual' | 'analysis'

interface AdminPanelProps {
  className?: string
}

export function AdminPanel({ className = '' }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const sections = [
    {
      id: 'overview' as AdminSection,
      title: 'Overview',
      icon: Activity,
      description: 'System status and quick actions'
    },
    {
      id: 'documents' as AdminSection,
      title: 'Documents',
      icon: Upload,
      description: 'Upload and manage documents with full processing pipeline'
    },
    {
      id: 'visual' as AdminSection,
      title: 'Visual Content',
      icon: Eye,
      description: 'Debug and test visual content extraction system'
    },
    {
      id: 'analysis' as AdminSection,
      title: 'LLM Analysis',
      icon: Brain,
      description: 'AI-powered analysis of visual content with local LLM'
    },
    {
      id: 'database' as AdminSection,
      title: 'Database',
      icon: Database,
      description: 'Manage database and storage'
    },
    {
      id: 'monitor' as AdminSection,
      title: 'Monitor',
      icon: Monitor,
      description: 'System performance and statistics'
    },
    {
      id: 'users' as AdminSection,
      title: 'Users',
      icon: Users,
      description: 'User management (Coming Soon)'
    },
    {
      id: 'logs' as AdminSection,
      title: 'Logs',
      icon: FileText,
      description: 'System logs and audit trail (Coming Soon)'
    },
    {
      id: 'settings' as AdminSection,
      title: 'Settings',
      icon: Settings,
      description: 'System configuration (Coming Soon)'
    }
  ]

  const handleActionComplete = (message: string) => {
    setActionMessage(message)
    setTimeout(() => setActionMessage(null), 5000) // Clear after 5 seconds
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-space-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {sections.slice(1, 7).map((section) => (
                <div
                  key={section.id}
                  className="border border-border rounded-lg p-space-md hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <section.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-body-large font-medium text-foreground">{section.title}</h3>
                  </div>
                  <p className="text-body-small text-muted-foreground">{section.description}</p>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-lg p-space-md">
              <h3 className="text-heading-3 text-foreground mb-space-md">Quick Actions</h3>
              <p className="text-body-small text-muted-foreground mb-space-md">
                Access the most common administrative tasks from here.
              </p>
              <div className="flex gap-space-sm">
                <Button
                  variant="outline"
                  onClick={() => setActiveSection('documents')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection('visual')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visual Diagnostics
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection('analysis')}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  LLM Analysis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection('database')}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Manage Database
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection('monitor')}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  View System Stats
                </Button>
              </div>
            </div>
          </div>
        )

      case 'documents':
        return <ComprehensiveUploadDashboard />

      case 'visual':
        return <VisualContentDiagnostic />

      case 'analysis':
        return <EnhancedVisualAnalysis />

      case 'database':
        return <DatabaseManager onActionComplete={handleActionComplete} />

      case 'monitor':
        return <SystemMonitor />

      case 'users':
      case 'logs':
      case 'settings':
        return (
          <div className="text-center py-space-xl">
            <div className="flex justify-center mb-space-md">
              {(() => {
                const section = sections.find(s => s.id === activeSection)
                const IconComponent = section?.icon
                return IconComponent && (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-muted-foreground" />
                  </div>
                )
              })()}
            </div>
            <h3 className="text-heading-3 text-foreground mb-space-sm">
              {sections.find(s => s.id === activeSection)?.title}
            </h3>
            <p className="text-body-small text-muted-foreground">
              This feature is coming soon. Stay tuned for updates!
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-background">
        <div className="p-space-md border-b border-border">
          <div className="flex items-center gap-space-sm">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-heading-3 text-foreground">Admin Panel</h2>
          </div>
        </div>

        <nav className="p-space-sm">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-body-small font-medium">{section.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background px-space-lg py-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-headline-3 text-foreground">
                {sections.find(s => s.id === activeSection)?.title}
              </h1>
              <p className="text-body-small text-muted-foreground mt-1">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="mx-space-lg mt-space-md">
            <div className={`p-space-sm rounded-lg border ${
              actionMessage.startsWith('✅') 
                ? 'bg-success/10 border-success/20 text-success' 
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              <p className="text-body-small">{actionMessage}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-space-lg overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
