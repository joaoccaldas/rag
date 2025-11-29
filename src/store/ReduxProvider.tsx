/**
 * Redux Provider Component
 * 
 * This component provides the Redux store to the entire application.
 * It should be placed at the root level of the app to ensure all 
 * components have access to the Redux store.
 */

"use client"

import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../store'

interface ReduxProviderProps {
  children: React.ReactNode
}

/**
 * Redux Provider wrapper component
 * 
 * Wraps the application with Redux Provider to enable state management
 * throughout the component tree.
 * 
 * @param children - React children to be wrapped with Redux Provider
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

export default ReduxProvider
