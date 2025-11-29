"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'miele'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  isDark: boolean
  isMiele: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme && ['light', 'dark', 'miele'].includes(savedTheme)) {
      setThemeState(savedTheme)
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setThemeState(systemPrefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'miele')
    root.classList.add(theme)
    
    // Apply CSS custom properties for each theme
    switch (theme) {
      case 'light':
        root.style.setProperty('--background', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--foreground', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--muted', 'hsl(210, 40%, 96%)')
        root.style.setProperty('--muted-foreground', 'hsl(215, 16%, 47%)')
        root.style.setProperty('--popover', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--popover-foreground', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--card', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--card-foreground', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--border', 'hsl(214, 32%, 91%)')
        root.style.setProperty('--input', 'hsl(214, 32%, 91%)')
        root.style.setProperty('--primary', 'hsl(216, 87%, 59%)')
        root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--secondary', 'hsl(210, 40%, 96%)')
        root.style.setProperty('--secondary-foreground', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--accent', 'hsl(210, 40%, 96%)')
        root.style.setProperty('--accent-foreground', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--destructive', 'hsl(0, 84%, 60%)')
        root.style.setProperty('--destructive-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--ring', 'hsl(216, 87%, 59%)')
        break
        
      case 'dark':
        root.style.setProperty('--background', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--foreground', 'hsl(210, 40%, 98%)')
        root.style.setProperty('--muted', 'hsl(217, 33%, 17%)')
        root.style.setProperty('--muted-foreground', 'hsl(215, 20%, 65%)')
        root.style.setProperty('--popover', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--popover-foreground', 'hsl(210, 40%, 98%)')
        root.style.setProperty('--card', 'hsl(222, 84%, 5%)')
        root.style.setProperty('--card-foreground', 'hsl(210, 40%, 98%)')
        root.style.setProperty('--border', 'hsl(217, 33%, 17%)')
        root.style.setProperty('--input', 'hsl(217, 33%, 17%)')
        root.style.setProperty('--primary', 'hsl(216, 87%, 59%)')
        root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--secondary', 'hsl(217, 33%, 17%)')
        root.style.setProperty('--secondary-foreground', 'hsl(210, 40%, 98%)')
        root.style.setProperty('--accent', 'hsl(217, 33%, 17%)')
        root.style.setProperty('--accent-foreground', 'hsl(210, 40%, 98%)')
        root.style.setProperty('--destructive', 'hsl(0, 84%, 60%)')
        root.style.setProperty('--destructive-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--ring', 'hsl(216, 87%, 59%)')
        break
        
      case 'miele':
        root.style.setProperty('--background', 'hsl(45, 45%, 95%)')
        root.style.setProperty('--foreground', 'hsl(218, 15%, 25%)')
        root.style.setProperty('--muted', 'hsl(30, 25%, 88%)')
        root.style.setProperty('--muted-foreground', 'hsl(218, 15%, 45%)')
        root.style.setProperty('--popover', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--popover-foreground', 'hsl(218, 15%, 25%)')
        root.style.setProperty('--card', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--card-foreground', 'hsl(218, 15%, 25%)')
        root.style.setProperty('--border', 'hsl(210, 8%, 78%)')
        root.style.setProperty('--input', 'hsl(210, 8%, 85%)')
        root.style.setProperty('--primary', 'hsl(350, 80%, 50%)')
        root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--secondary', 'hsl(210, 8%, 78%)')
        root.style.setProperty('--secondary-foreground', 'hsl(218, 15%, 25%)')
        root.style.setProperty('--accent', 'hsl(30, 25%, 88%)')
        root.style.setProperty('--accent-foreground', 'hsl(218, 15%, 25%)')
        root.style.setProperty('--destructive', 'hsl(0, 84%, 60%)')
        root.style.setProperty('--destructive-foreground', 'hsl(0, 0%, 100%)')
        root.style.setProperty('--ring', 'hsl(350, 80%, 50%)')
        break
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const value = {
    theme,
    setTheme,
    isDark: theme === 'dark',
    isMiele: theme === 'miele'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
