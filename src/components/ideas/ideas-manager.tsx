/**
 * Ideas Management System
 * Provides keyword and concept management for mindmaps and brainstorming
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Lightbulb, Plus, Search, Trash2, Edit3, Save, X, Brain, Tag, Settings } from 'lucide-react'
import { enhancedNotesStorage } from '../../storage/managers/enhanced-notes-storage'

export interface Idea {
  id: string
  title: string
  keywords: string[]
  description: string
  category: string
  color: string
  createdAt: string
  updatedAt: string
  connections: string[] // IDs of connected ideas
}

interface IdeasManagerProps {
  className?: string
}

const IDEA_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#FCD34D'
]

const CATEGORIES = [
  'General', 'Technology', 'Business', 'Creative', 
  'Research', 'Problem Solving', 'Innovation', 'Strategy'
]

export const IdeasManager: React.FC<IdeasManagerProps> = ({ className = '' }) => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [viewMode, setViewMode] = useState<'list' | 'mindmap'>('list')
  const [showStorageSettings, setShowStorageSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newIdea, setNewIdea] = useState({
    title: '',
    keywords: '',
    description: '',
    category: 'General',
    color: IDEA_COLORS[0] || '#3B82F6'
  })
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false)

  // Load ideas from enhanced storage
  useEffect(() => {
    async function loadIdeasData() {
      try {
        setIsLoading(true)
        const loadedIdeas = await enhancedNotesStorage.loadIdeas()
        setIdeas(loadedIdeas)
      } catch (error) {
        console.error('Error loading ideas:', error)
        // Fallback to localStorage for backward compatibility
        const savedIdeas = localStorage.getItem('rag-ideas')
        if (savedIdeas) {
          try {
            setIdeas(JSON.parse(savedIdeas))
          } catch (parseError) {
            console.error('Error parsing saved ideas:', parseError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadIdeasData()
  }, [])

  // Save ideas using enhanced storage
  useEffect(() => {
    if (!isLoading && ideas.length >= 0) {
      enhancedNotesStorage.saveIdeas(ideas).catch(error => {
        console.error('Error saving ideas:', error)
        // Fallback to localStorage
        localStorage.setItem('rag-ideas', JSON.stringify(ideas))
      })
    }
  }, [ideas, isLoading])

  const createIdea = () => {
    if (!newIdea.title.trim()) return

    const idea: Idea = {
      id: `idea-${Date.now()}`,
      title: newIdea.title.trim(),
      keywords: newIdea.keywords.split(',').map(k => k.trim()).filter(k => k),
      description: newIdea.description,
      category: newIdea.category,
      color: newIdea.color || IDEA_COLORS[0] || '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connections: []
    }

    setIdeas(prev => [idea, ...prev])
    setNewIdea({ title: '', keywords: '', description: '', category: 'General', color: IDEA_COLORS[0] || '#3B82F6' })
    setShowNewIdeaForm(false)
    setSelectedIdea(idea)
  }

  const updateIdea = (updatedIdea: Idea) => {
    const updated = { ...updatedIdea, updatedAt: new Date().toISOString() }
    setIdeas(prev => prev.map(idea => idea.id === updated.id ? updated : idea))
    setSelectedIdea(updated)
    setIsEditing(false)
  }

  const deleteIdea = (ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId))
    if (selectedIdea?.id === ideaId) {
      setSelectedIdea(null)
    }
  }

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || idea.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={`h-full flex bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Ideas Sidebar */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Ideas
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStorageSettings(!showStorageSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Storage Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewIdeaForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('mindmap')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  viewMode === 'mindmap' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Brain className="w-3 h-3" />
                Mind Map
              </button>
            </div>
          </div>
        </div>

        {/* New Idea Form */}
        {showNewIdeaForm && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Idea title..."
                value={newIdea.title}
                onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Keywords (comma-separated)..."
                value={newIdea.keywords}
                onChange={(e) => setNewIdea(prev => ({ ...prev, keywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Description..."
                value={newIdea.description}
                onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <select
                  value={newIdea.category}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {IDEA_COLORS.slice(0, 4).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewIdea(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newIdea.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createIdea}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowNewIdeaForm(false)
                    setNewIdea({ title: '', keywords: '', description: '', category: 'General', color: IDEA_COLORS[0] || '#3B82F6' })
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ideas List */}
        <div className="flex-1 overflow-y-auto">
          {filteredIdeas.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {ideas.length === 0 ? 'No ideas yet. Create your first idea!' : 'No ideas match your search.'}
            </div>
          ) : (
            filteredIdeas.map(idea => (
              <div
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedIdea?.id === idea.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: idea.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{idea.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {idea.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.keywords.slice(0, 3).map(keyword => (
                        <span key={keyword} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs rounded text-gray-700 dark:text-gray-300">
                          {keyword}
                        </span>
                      ))}
                      {idea.keywords.length > 3 && (
                        <span className="text-xs text-gray-500">+{idea.keywords.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                        {idea.category}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(idea.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Idea Content */}
      <div className="flex-1 flex flex-col">
        {selectedIdea ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: selectedIdea.color }}
                  />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedIdea.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedIdea.category} • {formatDate(selectedIdea.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteIdea(selectedIdea.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 bg-white dark:bg-gray-800">
              {isEditing ? (
                <IdeaEditor
                  idea={selectedIdea}
                  onSave={updateIdea}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="space-y-6">
                  {selectedIdea.keywords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIdea.keywords.map(keyword => (
                          <span
                            key={keyword}
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${selectedIdea.color}20`,
                              color: selectedIdea.color
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedIdea.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedIdea.description}
                      </p>
                    </div>
                  )}

                  {selectedIdea.connections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Connected Ideas</h3>
                      <div className="space-y-2">
                        {selectedIdea.connections.map(connectionId => {
                          const connectedIdea = ideas.find(i => i.id === connectionId)
                          return connectedIdea ? (
                            <div
                              key={connectionId}
                              onClick={() => setSelectedIdea(connectedIdea)}
                              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: connectedIdea.color }}
                              />
                              <span className="text-gray-900 dark:text-white">{connectedIdea.title}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select an idea</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose an idea from the sidebar to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface IdeaEditorProps {
  idea: Idea
  onSave: (idea: Idea) => void
  onCancel: () => void
}

const IdeaEditor: React.FC<IdeaEditorProps> = ({ idea, onSave, onCancel }) => {
  const [editedIdea, setEditedIdea] = useState({
    title: idea.title,
    keywords: idea.keywords.join(', '),
    description: idea.description,
    category: idea.category,
    color: idea.color
  })

  const handleSave = () => {
    const updated: Idea = {
      ...idea,
      title: editedIdea.title.trim() || 'Untitled',
      keywords: editedIdea.keywords.split(',').map(k => k.trim()).filter(k => k),
      description: editedIdea.description,
      category: editedIdea.category,
      color: editedIdea.color
    }
    onSave(updated)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={editedIdea.title}
        onChange={(e) => setEditedIdea(prev => ({ ...prev, title: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-medium focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
        placeholder="Idea title..."
      />
      
      <input
        type="text"
        value={editedIdea.keywords}
        onChange={(e) => setEditedIdea(prev => ({ ...prev, keywords: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
        placeholder="Keywords (comma-separated)..."
      />
      
      <textarea
        value={editedIdea.description}
        onChange={(e) => setEditedIdea(prev => ({ ...prev, description: e.target.value }))}
        className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white resize-none"
        placeholder="Describe your idea..."
      />
      
      <div className="flex gap-4">
        <select
          value={editedIdea.category}
          onChange={(e) => setEditedIdea(prev => ({ ...prev, category: e.target.value }))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
        >
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        
        <div className="flex gap-2">
          {IDEA_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setEditedIdea(prev => ({ ...prev, color }))}
              className={`w-8 h-8 rounded-full border-2 ${
                editedIdea.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}

export default IdeasManager
