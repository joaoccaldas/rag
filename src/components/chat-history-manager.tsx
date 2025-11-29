"use client"

import { useState, useEffect } from 'react'
import { Save, Download, Upload, Trash2, Calendar } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{title: string, url: string, content: string}>
  timestamp?: Date
}

interface ChatSession {
  id: string
  name: string
  messages: Message[]
  timestamp: Date
  messageCount: number
}

interface ChatHistoryManagerProps {
  messages: Message[]
  onLoadSession: (messages: Message[]) => void
  className?: string
}

export function ChatHistoryManager({ messages, onLoadSession, className = '' }: ChatHistoryManagerProps) {
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [sessionName, setSessionName] = useState('')

  useEffect(() => {
    loadSavedSessions()
  }, [])

  const loadSavedSessions = () => {
    try {
      const saved = localStorage.getItem('miele-chat-sessions')
      if (saved) {
        const sessions = JSON.parse(saved).map((session: ChatSession & { timestamp: string }) => ({
          ...session,
          timestamp: new Date(session.timestamp)
        }))
        setSavedSessions(sessions)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    }
  }

  const saveCurrentSession = () => {
    if (!sessionName.trim() || messages.length === 0) return

    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: sessionName.trim(),
      messages: messages,
      timestamp: new Date(),
      messageCount: messages.length
    }

    const updatedSessions = [...savedSessions, newSession]
    setSavedSessions(updatedSessions)
    localStorage.setItem('miele-chat-sessions', JSON.stringify(updatedSessions))
    
    setSessionName('')
    setShowSaveDialog(false)
  }

  const loadSession = (session: ChatSession) => {
    onLoadSession(session.messages)
    setShowLoadDialog(false)
  }

  const deleteSession = (sessionId: string) => {
    const updatedSessions = savedSessions.filter(s => s.id !== sessionId)
    setSavedSessions(updatedSessions)
    localStorage.setItem('miele-chat-sessions', JSON.stringify(updatedSessions))
  }

  const exportSession = (session: ChatSession) => {
    const dataStr = JSON.stringify(session, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-session-${session.name}-${session.timestamp.toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Save Current Session */}
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={messages.length === 0}
          className={`p-2 rounded-md transition-colors ${
            messages.length === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Save current chat session"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* Load Saved Session */}
        <button
          onClick={() => setShowLoadDialog(true)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Load saved chat session"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Session Count Badge */}
        {savedSessions.length > 0 && (
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
            {savedSessions.length} saved
          </span>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Chat Session
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter a name for this chat session..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This session contains {messages.length} messages
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentSession}
                disabled={!sessionName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Load Chat Session
              </h3>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {savedSessions.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved chat sessions found</p>
                  <p className="text-sm mt-2">Save your current conversation to access it later</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {session.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>{session.messageCount} messages</span>
                            <span>{session.timestamp.toLocaleDateString()}</span>
                            <span>{session.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => exportSession(session)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Export session"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-2 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loadSession(session)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
