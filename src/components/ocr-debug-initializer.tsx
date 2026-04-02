"use client"

import { useEffect } from 'react'

export function OCRDebugInitializer() {
  useEffect(() => {
    // Initialize OCR debug tools
    import('@/utils/ocr-debug').then(() => {
    }).catch((error) => {
      console.warn('⚠️ Failed to load OCR debug tools:', error)
    })
  }, [])

  return null // This component doesn't render anything
}
