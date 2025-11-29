"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { Document, ProcessingStats } from '../types'

interface StatisticsState {
  processingStats: ProcessingStats
  isCalculating: boolean
  error: string | null
}

type StatisticsAction =
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PROCESSING_STATS'; payload: Partial<ProcessingStats> }

const initialState: StatisticsState = {
  processingStats: {
    totalDocuments: 0,
    readyDocuments: 0,
    processingDocuments: 0,
    errorDocuments: 0,
    totalChunks: 0,
    storageUsed: 0
  },
  isCalculating: false,
  error: null
}

function statisticsReducer(state: StatisticsState, action: StatisticsAction): StatisticsState {
  switch (action.type) {
    case 'SET_CALCULATING':
      return { ...state, isCalculating: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isCalculating: false }
    
    case 'UPDATE_PROCESSING_STATS':
      return {
        ...state,
        processingStats: { ...state.processingStats, ...action.payload }
      }
    
    default:
      return state
  }
}

interface StatisticsContextType {
  state: StatisticsState
  processingStats: ProcessingStats
  updateStatistics: (documents: Document[]) => void
  recalculateStats: (documents: Document[]) => Promise<void>
}

const StatisticsContext = createContext<StatisticsContextType | null>(null)

export function StatisticsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(statisticsReducer, initialState)

  const calculateStatistics = useCallback((documents: Document[]) => {
    const stats = documents.reduce(
      (acc, doc) => {
        acc.totalDocuments++
        switch (doc.status) {
          case 'ready':
            acc.readyDocuments++
            break
          case 'processing':
          case 'chunking':
          case 'embedding':
            acc.processingDocuments++
            break
          case 'error':
            acc.errorDocuments++
            break
        }
        acc.totalChunks += doc.chunks?.length || 0
        acc.storageUsed += doc.size
        return acc
      },
      {
        totalDocuments: 0,
        readyDocuments: 0,
        processingDocuments: 0,
        errorDocuments: 0,
        totalChunks: 0,
        storageUsed: 0
      }
    )
    
    dispatch({ type: 'UPDATE_PROCESSING_STATS', payload: stats })
  }, [])

  const updateStatistics = useCallback((documents: Document[]) => {
    calculateStatistics(documents)
  }, [calculateStatistics])

  const recalculateStats = useCallback(async (documents: Document[]) => {
    try {
      dispatch({ type: 'SET_CALCULATING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Add a small delay to simulate calculation (for visual feedback)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      calculateStatistics(documents)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Statistics calculation failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_CALCULATING', payload: false })
    }
  }, [calculateStatistics])

  const value: StatisticsContextType = {
    state,
    processingStats: state.processingStats,
    updateStatistics,
    recalculateStats
  }

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  )
}

export function useStatistics() {
  const context = useContext(StatisticsContext)
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider')
  }
  return context
}
