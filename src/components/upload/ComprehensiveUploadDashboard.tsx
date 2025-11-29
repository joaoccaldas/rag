"use client"

import React from 'react';
import { Upload, FileText, Activity, Database } from 'lucide-react';
import { ComponentErrorBoundary } from '../error-boundary/error-boundary';
import useFileUpload from '../../hooks/useFileUpload';
import FileDropZone from './FileDropZone';
import ProcessingQueue from './ProcessingQueue';

export const ComprehensiveUploadDashboard: React.FC = () => {
  const {
    state,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
    setFilter,
    setViewMode,
    isProcessing,
    filteredFiles
  } = useFileUpload();

  const handleFilesAdded = (files: File[]) => {
    addFiles(files);
  };

  const getHeaderStats = () => {
    const { stats } = state;
    return [
      {
        label: 'Total Files',
        value: stats.totalFiles,
        icon: FileText,
        color: 'text-blue-600'
      },
      {
        label: 'Processing',
        value: state.files.filter(f => f.status === 'processing' || f.status === 'uploading').length,
        icon: Activity,
        color: 'text-orange-600'
      },
      {
        label: 'Completed',
        value: stats.completedFiles,
        icon: Database,
        color: 'text-green-600'
      },
      {
        label: 'Failed',
        value: stats.failedFiles,
        icon: Upload,
        color: 'text-red-600'
      }
    ];
  };

  const maxFiles = 20;
  const canUpload = state.files.length < maxFiles && !isProcessing;

  return (
    <ComponentErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Document Upload & Processing
                </h1>
                <p className="text-sm text-gray-600">
                  Upload files for AI-powered analysis and RAG integration
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-6">
                {getHeaderStats().map((stat, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-600">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Upload Section */}
            <section>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Files
                </h2>
                <p className="text-sm text-gray-600">
                  Drag and drop files or click to browse. Supported formats: PDF, DOCX, TXT, MD, HTML, JSON, CSV, XLSX
                </p>
              </div>

              <FileDropZone
                onFilesAdded={handleFilesAdded}
                maxFiles={maxFiles - state.files.length}
                disabled={!canUpload}
              />

              {!canUpload && state.files.length >= maxFiles && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Maximum of {maxFiles} files allowed. Please remove some files before uploading more.
                  </p>
                </div>
              )}
            </section>

            {/* Processing Queue Section */}
            {state.files.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing Queue
                  </h2>
                  <p className="text-sm text-gray-600">
                    Monitor file processing progress and manage your uploads
                  </p>
                </div>

                <ProcessingQueue
                  files={filteredFiles}
                  stats={state.stats}
                  filter={state.filter}
                  viewMode={state.viewMode}
                  isProcessing={isProcessing}
                  onRemoveFile={removeFile}
                  onRetryFile={retryFile}
                  onClearCompleted={clearCompleted}
                  onClearAll={clearAll}
                  onSetFilter={setFilter}
                  onSetViewMode={setViewMode}
                />
              </section>
            )}

            {/* Help Section */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Processing Pipeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { step: '1', title: 'Upload', desc: 'File validation & upload', color: 'bg-blue-50 text-blue-700' },
                  { step: '2', title: 'Parse', desc: 'Content extraction', color: 'bg-green-50 text-green-700' },
                  { step: '3', title: 'Chunk', desc: 'Text segmentation', color: 'bg-purple-50 text-purple-700' },
                  { step: '4', title: 'Analyze', desc: 'AI-powered analysis', color: 'bg-orange-50 text-orange-700' },
                  { step: '5', title: 'Embed', desc: 'Vector generation', color: 'bg-teal-50 text-teal-700' },
                  { step: '6', title: 'Store', desc: 'Database storage', color: 'bg-indigo-50 text-indigo-700' }
                ].map((stage, index) => (
                  <div key={index} className={`p-4 rounded-lg ${stage.color}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-white bg-opacity-80 flex items-center justify-center text-sm font-bold">
                        {stage.step}
                      </div>
                      <h4 className="font-semibold">{stage.title}</h4>
                    </div>
                    <p className="text-sm opacity-80">{stage.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Supported File Types:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Documents:</strong><br />
                    PDF, DOCX, TXT, MD
                  </div>
                  <div>
                    <strong>Web:</strong><br />
                    HTML, JSON
                  </div>
                  <div>
                    <strong>Data:</strong><br />
                    CSV, XLSX
                  </div>
                  <div>
                    <strong>Max Size:</strong><br />
                    50MB per file
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
};

export default ComprehensiveUploadDashboard;
