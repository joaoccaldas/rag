"use client"

import React from 'react';
import { RotateCcw, Trash2, Filter } from 'lucide-react';
import type { FileUploadItem, UploadDashboardState } from '../../types/upload';
import FileCard from './FileCard';
import StatsOverview from './StatsOverview';

interface ProcessingQueueProps {
  files: FileUploadItem[];
  stats: UploadDashboardState['stats'];
  filter: UploadDashboardState['filter'];
  viewMode: UploadDashboardState['viewMode'];
  isProcessing: boolean;
  onRemoveFile: (fileId: string) => void;
  onRetryFile: (fileId: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onSetFilter: (filter: UploadDashboardState['filter']) => void;
  onSetViewMode: (mode: UploadDashboardState['viewMode']) => void;
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({
  files,
  stats,
  filter,
  viewMode,
  isProcessing,
  onRemoveFile,
  onRetryFile,
  onClearCompleted,
  onClearAll,
  onSetFilter,
  onSetViewMode
}) => {
  const filteredFiles = React.useMemo(() => {
    if (filter === 'all') return files;
    return files.filter(file => file.status === filter);
  }, [files, filter]);

  const getFilterCount = (filterType: UploadDashboardState['filter']) => {
    if (filterType === 'all') return files.length;
    return files.filter(file => file.status === filterType).length;
  };

  const filterOptions: Array<{ 
    key: UploadDashboardState['filter']; 
    label: string; 
    color: string;
  }> = [
    { key: 'all', label: 'All Files', color: 'text-gray-600' },
    { key: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { key: 'processing', label: 'Processing', color: 'text-blue-600' },
    { key: 'completed', label: 'Completed', color: 'text-green-600' },
    { key: 'error', label: 'Failed', color: 'text-red-600' }
  ];

  const hasCompletedFiles = files.some(file => file.status === 'completed');
  const hasFailedFiles = files.some(file => file.status === 'error');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => onSetFilter(option.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === option.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label} ({getFilterCount(option.key)})
                </button>
              ))}
            </div>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => onSetViewMode('grid')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => onSetViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {hasFailedFiles && (
                <button
                  onClick={() => {
                    files.filter(f => f.status === 'error').forEach(f => onRetryFile(f.id));
                  }}
                  className="flex items-center px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retry Failed
                </button>
              )}

              {hasCompletedFiles && (
                <button
                  onClick={onClearCompleted}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Completed
                </button>
              )}

              {files.length > 0 && (
                <button
                  onClick={onClearAll}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-4 flex items-center space-x-2 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 font-medium">
              Processing files... ({files.filter(f => f.status === 'processing' || f.status === 'uploading').length} active)
            </span>
          </div>
        )}
      </div>

      {/* File Queue */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No files uploaded yet' : `No ${filter} files`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Upload some files to get started with processing'
                : `Switch to "All Files" to see files with other statuses`
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          }>
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onRemove={onRemoveFile}
                onPreview={(fileId) => console.log('Preview file:', fileId)}
                onDownload={(fileId) => console.log('Download file:', fileId)}
                compact={viewMode === 'list'}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingQueue;
