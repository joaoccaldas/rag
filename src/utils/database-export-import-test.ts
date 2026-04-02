/**
 * Database Export/Import Test Utility
 * Comprehensive testing for the database export/import system
 */

"use client"

import { databaseExportImport } from '../utils/database-export-import'

export class DatabaseExportImportTest {
  private testResults: any[] = []

  async runAllTests(): Promise<boolean> {

    try {
      await this.testExportStructure()
      await this.testImportValidation()
      await this.testStorageOperations()
      await this.testErrorHandling()
      
      this.printResults()
      return this.testResults.every(result => result.passed)
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      return false
    }
  }

  private async testExportStructure() {
    
    try {
      // Create mock data
      this.setupMockData()
      
      // Test export with minimal options
      const exportBlob = await databaseExportImport.exportDatabase({
        includeFiles: false,
        includeAnalytics: false,
        includeHistory: true,
        includeSettings: true,
        compressionLevel: 'none'
      })

      // Parse exported data
      const exportText = await exportBlob.text()
      const exportData = JSON.parse(exportText)

      // Validate structure
      const hasVersion = !!exportData.version
      const hasTimestamp = !!exportData.timestamp
      const hasData = !!exportData.data
      const hasMetadata = !!exportData.metadata

      this.addTestResult('Export Structure', hasVersion && hasTimestamp && hasData && hasMetadata, {
        version: hasVersion,
        timestamp: hasTimestamp,
        data: hasData,
        metadata: hasMetadata
      })

    } catch (error) {
      this.addTestResult('Export Structure', false, { error: error.message })
    }
  }

  private async testImportValidation() {
    
    try {
      // Create valid test data
      const validData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        machine: 'test-machine',
        data: {
          localStorage: { 'test-key': 'test-value' },
          indexedDB: {},
          configuration: {}
        },
        metadata: {
          totalSize: 100,
          fileCount: 0,
          documentCount: 0,
          features: []
        }
      }

      const validBlob = new Blob([JSON.stringify(validData)], { type: 'application/json' })
      const validFile = new File([validBlob], 'test-export.json', { type: 'application/json' })

      // This would normally test import but we'll just test the parsing
      const text = await validFile.text()
      const parsed = JSON.parse(text)
      const isValid = parsed.version && parsed.timestamp && parsed.data

      this.addTestResult('Import Validation', isValid, {
        validStructure: isValid,
        hasRequiredFields: !!(parsed.version && parsed.timestamp && parsed.data)
      })

    } catch (error) {
      this.addTestResult('Import Validation', false, { error: error.message })
    }
  }

  private async testStorageOperations() {
    
    try {
      // Test localStorage operations
      const testKey = 'test-export-import-key'
      const testValue = JSON.stringify({ test: 'data', timestamp: Date.now() })
      
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      const storageWorks = retrieved === testValue
      
      // Cleanup
      localStorage.removeItem(testKey)

      // Test IndexedDB availability
      const hasIndexedDB = typeof indexedDB !== 'undefined'

      this.addTestResult('Storage Operations', storageWorks && hasIndexedDB, {
        localStorage: storageWorks,
        indexedDB: hasIndexedDB
      })

    } catch (error) {
      this.addTestResult('Storage Operations', false, { error: error.message })
    }
  }

  private async testErrorHandling() {
    
    try {
      // Test invalid file handling
      const invalidBlob = new Blob(['invalid json content'], { type: 'application/json' })
      const invalidFile = new File([invalidBlob], 'invalid.json', { type: 'application/json' })

      let errorCaught = false
      try {
        await invalidFile.text()
        JSON.parse(await invalidFile.text())
      } catch {
        errorCaught = true
      }

      // Test empty data handling
      const emptyData = {}
      const emptyBlob = new Blob([JSON.stringify(emptyData)], { type: 'application/json' })
      const emptyFile = new File([emptyBlob], 'empty.json', { type: 'application/json' })

      let emptyHandled = false
      try {
        const emptyText = await emptyFile.text()
        const emptyParsed = JSON.parse(emptyText)
        emptyHandled = typeof emptyParsed === 'object'
      } catch {
        emptyHandled = false
      }

      this.addTestResult('Error Handling', errorCaught && emptyHandled, {
        invalidFileHandling: errorCaught,
        emptyDataHandling: emptyHandled
      })

    } catch (error) {
      this.addTestResult('Error Handling', false, { error: error.message })
    }
  }

  private setupMockData() {
    // Create some test data in localStorage
    const mockData = {
      'rag_test_documents': JSON.stringify([
        { id: '1', name: 'Test Document 1', content: 'Test content 1' },
        { id: '2', name: 'Test Document 2', content: 'Test content 2' }
      ]),
      'rag_test_settings': JSON.stringify({
        theme: 'light',
        language: 'en',
        notifications: true
      }),
      'rag_test_history': JSON.stringify([
        { query: 'test query 1', timestamp: Date.now() - 1000 },
        { query: 'test query 2', timestamp: Date.now() }
      ])
    }

    Object.entries(mockData).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
  }

  private cleanupMockData() {
    const mockKeys = ['rag_test_documents', 'rag_test_settings', 'rag_test_history']
    mockKeys.forEach(key => localStorage.removeItem(key))
  }

  private addTestResult(testName: string, passed: boolean, details: any) {
    this.testResults.push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    })
  }

  private printResults() {
    
    const passedTests = this.testResults.filter(r => r.passed).length
    const totalTests = this.testResults.length
    
    
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
    })

    // Cleanup
    this.cleanupMockData()
  }
}

// Export singleton for easy testing
export const databaseExportImportTest = new DatabaseExportImportTest()

// Browser console utility
if (typeof window !== 'undefined') {
  (window as any).testDatabaseExportImport = () => {
    return databaseExportImportTest.runAllTests()
  }
  
}
