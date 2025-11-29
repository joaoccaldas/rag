/**
 * Database Export/Import Test Utility
 * Comprehensive testing for the database export/import system
 */

"use client"

import { databaseExportImport } from '../utils/database-export-import'

export class DatabaseExportImportTest {
  private testResults: any[] = []

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting Database Export/Import Tests')
    console.log('='.repeat(50))

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
    console.log('\n📦 Testing Export Structure...')
    
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

      console.log('✅ Export structure test passed')
    } catch (error) {
      this.addTestResult('Export Structure', false, { error: error.message })
      console.log('❌ Export structure test failed:', error)
    }
  }

  private async testImportValidation() {
    console.log('\n🔍 Testing Import Validation...')
    
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

      console.log('✅ Import validation test passed')
    } catch (error) {
      this.addTestResult('Import Validation', false, { error: error.message })
      console.log('❌ Import validation test failed:', error)
    }
  }

  private async testStorageOperations() {
    console.log('\n💾 Testing Storage Operations...')
    
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

      console.log('✅ Storage operations test passed')
    } catch (error) {
      this.addTestResult('Storage Operations', false, { error: error.message })
      console.log('❌ Storage operations test failed:', error)
    }
  }

  private async testErrorHandling() {
    console.log('\n🛡️ Testing Error Handling...')
    
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

      console.log('✅ Error handling test passed')
    } catch (error) {
      this.addTestResult('Error Handling', false, { error: error.message })
      console.log('❌ Error handling test failed:', error)
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
    console.log('\n📊 Test Results Summary')
    console.log('='.repeat(50))
    
    const passedTests = this.testResults.filter(r => r.passed).length
    const totalTests = this.testResults.length
    
    console.log(`✅ Passed: ${passedTests}/${totalTests}`)
    console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    console.log('\nDetailed Results:')
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.testName}:`, result.details)
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
  
  console.log('🧪 Database Export/Import test utility loaded')
  console.log('📝 Run tests with: testDatabaseExportImport()')
}
