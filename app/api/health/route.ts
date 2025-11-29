/**
 * Health Check API Endpoint
 * Provides system status for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      nextjs: {
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      },
      storage: {
        status: 'online',
        type: 'IndexedDB + localStorage fallback'
      }
    }
  }

  // Check Ollama service
  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (ollamaResponse.ok) {
      const ollamaData = await ollamaResponse.json()
      checks.services.ollama = {
        status: 'online',
        models: ollamaData.models?.length || 0,
        endpoint: 'http://localhost:11434'
      }
    } else {
      throw new Error(`HTTP ${ollamaResponse.status}`)
    }
  } catch (error) {
    checks.services.ollama = {
      status: 'offline',
      error: error instanceof Error ? error.message : 'Connection failed',
      endpoint: 'http://localhost:11434'
    }
    checks.status = 'degraded'
  }

  const httpStatus = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
