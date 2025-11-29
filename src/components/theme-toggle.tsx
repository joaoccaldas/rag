"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
    )
  }

  const cycleTheme = () => {
    switch (theme) {
      case 'light':
        setTheme('dark')
        break
      case 'dark':
        setTheme('miele')
        break
      case 'miele':
        setTheme('light')
        break
      default:
        setTheme('light')
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'dark':
        return <Moon className="h-5 w-5" />
      case 'miele':
        return <Palette className="h-5 w-5" />
      default:
        return <Sun className="h-5 w-5" />
    }
  }

  const getNextThemeName = () => {
    switch (theme) {
      case 'light':
        return 'dark'
      case 'dark':
        return 'Miele'
      case 'miele':
        return 'light'
      default:
        return 'dark'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:ring-gray-300 dark:text-gray-100 miele:hover:bg-miele-warm miele:hover:text-miele-charcoal miele:focus:ring-miele-500"
      aria-label="Toggle theme"
      title={`Switch to ${getNextThemeName()} mode`}
    >
      {getThemeIcon()}
    </button>
  )
}
