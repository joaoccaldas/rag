/**
 * Error Reporting API Route
 * Handles client-side error reporting and logging
 */

import { NextRequest, NextResponse } from 'next/server'

interface ErrorReport {
  error: {
    message: string
    stack?: string
    name: string
  }
  errorInfo: {
    componentStack: string
    timestamp: string
    userAgent: string
    url: string
    level: string
    boundaryName: string
  }
  errorId: string
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json()
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Client Error Report')
      console.log('Error ID:', errorReport.errorId)
      console.log('Level:', errorReport.errorInfo.level)
      console.log('Boundary:', errorReport.errorInfo.boundaryName)
      console.log('Error:', errorReport.error)
      console.log('Context:', errorReport.errorInfo)
      console.groupEnd()
    }

    // In production, you would send this to an external service
    // like Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external error reporting service
      // await sendToErrorReportingService(errorReport)
    }

    // Store in local logs (you might want to use a proper logging service)
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      source: 'client',
      ...errorReport
    }

    // You could write to a file, database, or external service here
    console.error('Client Error:', JSON.stringify(logEntry, null, 2))

    return NextResponse.json({ 
      success: true, 
      errorId: errorReport.errorId,
      message: 'Error reported successfully' 
    })

  } catch (error) {
    console.error('Failed to process error report:', error)
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}

// Helper function for external error reporting (implement as needed)
// async function sendToErrorReportingService(errorReport: ErrorReport) {
//   // Example implementation for Sentry
//   // Sentry.captureException(new Error(errorReport.error.message), {
//   //   contexts: {
//   //     errorInfo: errorReport.errorInfo
//   //   },
//   //   tags: {
//   //     errorId: errorReport.errorId,
//   //     level: errorReport.errorInfo.level,
//   //     boundary: errorReport.errorInfo.boundaryName
//   //   }
//   // })
// }
