/**
 * Notes Management System
 * Provides persistent note-taking functionality with rich text support
 */

'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Plus, Search, Trash2, Edit3, Save, X, Settings } from 'lucide-react'
import { enhancedNotesStorage } from '../../storage/managers/enhanced-notes-storage'
import { Button } from '@/design-system/components/button'
import { Input } from '@/design-system/components/input'
import { Card, CardHeader, CardContent } from '@/design-system/components/card'
import { cn } from '@/utils/cn'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface NotesManagerProps {
  className?: string
}

export const NotesManager: React.FC<NotesManagerProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' })
  const [showNewNoteForm, setShowNewNoteForm] = useState(false)
  const [showStorageSettings, setShowStorageSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load notes from enhanced storage on component mount
  useEffect(() => {
    async function loadNotesData() {
      try {
        setIsLoading(true)
        const loadedNotes = await enhancedNotesStorage.loadNotes()
        setNotes(loadedNotes)
      } catch (error) {
        console.error('Error loading notes:', error)
        // Fallback to localStorage for backward compatibility
        const savedNotes = localStorage.getItem('rag-notes')
        if (savedNotes) {
          try {
            setNotes(JSON.parse(savedNotes))
          } catch (parseError) {
            console.error('Error parsing saved notes:', parseError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadNotesData()
  }, [])

  // Save notes using enhanced storage whenever notes change
  useEffect(() => {
    if (!isLoading && notes.length >= 0) {
      enhancedNotesStorage.saveNotes(notes).catch(error => {
        console.error('Error saving notes:', error)
        // Fallback to localStorage
        localStorage.setItem('rag-notes', JSON.stringify(notes))
      })
    }
  }, [notes, isLoading])

  const createNote = () => {
    if (!newNote.title.trim()) return

    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title.trim(),
      content: newNote.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    setNotes(prev => [note, ...prev])
    setNewNote({ title: '', content: '', tags: '' })
    setShowNewNoteForm(false)
    setSelectedNote(note)
  }

  const updateNote = (updatedNote: Note) => {
    const updated = { ...updatedNote, updatedAt: new Date().toISOString() }
    setNotes(prev => prev.map(note => note.id === updated.id ? updated : note))
    setSelectedNote(updated)
    setIsEditing(false)
  }

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`h-full flex bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Notes Sidebar */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStorageSettings(!showStorageSettings)}
                title="Storage Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewNoteForm(true)}
                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Storage Settings Panel */}
        {showStorageSettings && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div 
              ref={(el) => {
                if (el && showStorageSettings) {
                  const storageUI = enhancedNotesStorage.createFolderPickerUI()
                  el.innerHTML = ''
                  el.appendChild(storageUI)
                }
              }}
              className="p-4"
            />
          </div>
        )}

        {/* New Note Form */}
        {showNewNoteForm && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)..."
                value={newNote.tags}
                onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={createNote}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowNewNoteForm(false)
                    setNewNote({ title: '', content: '', tags: '' })
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

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {notes.length === 0 ? 'No notes yet. Create your first note!' : 'No notes match your search.'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <h3 className="font-medium text-gray-900 dark:text-white truncate">{note.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {note.content || 'No content'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs rounded text-gray-700 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedNote.title}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(selectedNote.createdAt)}
                    {selectedNote.updatedAt !== selectedNote.createdAt && (
                      <span className="ml-2">• Updated: {formatDate(selectedNote.updatedAt)}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 p-4 bg-white dark:bg-gray-800">
              {isEditing ? (
                <NoteEditor
                  note={selectedNote}
                  onSave={updateNote}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100">
                    {selectedNote.content || 'No content'}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a note</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a note from the sidebar to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface NoteEditorProps {
  note: Note
  onSave: (note: Note) => void
  onCancel: () => void
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const [editedNote, setEditedNote] = useState({
    title: note.title,
    content: note.content,
    tags: note.tags.join(', ')
  })

  const handleSave = () => {
    const updated: Note = {
      ...note,
      title: editedNote.title.trim() || 'Untitled',
      content: editedNote.content,
      tags: editedNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }
    onSave(updated)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={editedNote.title}
        onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Note title..."
      />
      
      <textarea
        value={editedNote.content}
        onChange={(e) => setEditedNote(prev => ({ ...prev, content: e.target.value }))}
        className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
        placeholder="Write your note content here..."
      />
      
      <input
        type="text"
        value={editedNote.tags}
        onChange={(e) => setEditedNote(prev => ({ ...prev, tags: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Tags (comma-separated)..."
      />
      
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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

export default NotesManager
