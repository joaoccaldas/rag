/**
 * Database Management Page Component
 * 
 * Provides a centralized interface for database operations including:
 * - Export/Import functionality
 * - Database backup and restore
 * - System data management
 * - Storage statistics
 * 
 * Separates database operations from document management to avoid confusion.
 */

"use client"

import React from 'react'
import { DatabaseExportImportPanel } from './DatabaseExportImportPanel'
import { Database, HardDrive, Download, Upload, Info, Shield } from 'lucide-react'

interface DatabaseManagementPageProps {
  className?: string
}

export function DatabaseManagementPage({ className = '' }: DatabaseManagementPageProps) {
  return (
    <div className={`p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Database Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Backup, restore, and manage your RAG system data
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Database vs Documents
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  This section handles system-level database operations (backup/restore). 
                  For document upload and management, use the &ldquo;Documents&rdquo; section in the main navigation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Create a complete backup of your RAG system including documents, embeddings, and settings.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Restore your system from a previous backup or import data from another instance.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Security</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Secure export with validation and integrity checks for safe data transfer.
            </p>
          </div>
        </div>

        {/* Main Export/Import Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export & Import Operations
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your database backups and data migrations
            </p>
          </div>
          
          <DatabaseExportImportPanel className="p-6" />
        </div>
      </div>
    </div>
  )
}

export default DatabaseManagementPage
