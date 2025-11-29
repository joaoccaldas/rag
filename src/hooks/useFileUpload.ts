"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  FileUploadItem,
  UploadDashboardState,
  FileProcessingStage 
} from '../types/upload';
import { 
  generateFileId, 
  validateFile, 
  calculateProcessingStats,
  createMockProcessingResult,
  getProcessingStageProgress
} from '../utils/upload';

export interface UseFileUploadReturn {
  state: UploadDashboardState;
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  retryFile: (fileId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  setFilter: (filter: UploadDashboardState['filter']) => void;
  setViewMode: (mode: UploadDashboardState['viewMode']) => void;
  selectFile: (fileId: string | undefined) => void;
  isProcessing: boolean;
  filteredFiles: FileUploadItem[];
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [state, setState] = useState<UploadDashboardState>({
    files: [],
    isProcessing: false,
    stats: {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      avgProcessingTime: 0,
      totalSize: 0,
      totalChunks: 0,
      totalTokens: 0
    },
    selectedFile: undefined,
    viewMode: 'grid',
    filter: 'all'
  });

  const processingQueue = useRef<Set<string>>(new Set());

  const updateStats = useCallback((files: FileUploadItem[]) => {
    const stats = calculateProcessingStats(files);
    setState(prev => ({ ...prev, stats }));
  }, []);

  const processFile = useCallback(async (fileItem: FileUploadItem) => {
    const stages: FileProcessingStage[] = ['upload', 'parsing', 'chunking', 'analysis', 'embedding', 'storage', 'complete'];
    
    try {
      processingQueue.current.add(fileItem.id);
      
      setState(prev => ({
        ...prev,
        isProcessing: true,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      }));

      // Simulate processing stages
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const progress = getProcessingStageProgress(stage);
        
        setState(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: stage === 'complete' ? 'completed' : 'processing',
                  progress 
                }
              : f
          )
        }));

        // Simulate processing time for each stage
        const stageDelay = stage === 'complete' ? 0 : Math.random() * 1000 + 500;
        await new Promise(resolve => setTimeout(resolve, stageDelay));

        // Check if processing was cancelled
        if (!processingQueue.current.has(fileItem.id)) {
          return;
        }
      }

      // Generate mock processing result
      const result = createMockProcessingResult(fileItem.file);

      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'completed',
                progress: 100,
                result
              }
            : f
        )
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Processing failed'
              }
            : f
        )
      }));
    } finally {
      processingQueue.current.delete(fileItem.id);
      
      setState(prev => {
        const hasProcessing = prev.files.some(f => 
          f.status === 'uploading' || f.status === 'processing'
        );
        return { ...prev, isProcessing: hasProcessing };
      });
    }
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newFileItems: FileUploadItem[] = files
      .map(file => {
        const validation = validateFile(file);
        return {
          id: generateFileId(),
          file,
          status: validation.isValid ? 'pending' : 'error',
          progress: 0,
          error: validation.error,
          uploadedAt: new Date()
        } as FileUploadItem;
      });

    setState(prev => ({
      ...prev,
      files: [...prev.files, ...newFileItems]
    }));

    // Start processing valid files
    newFileItems
      .filter(item => item.status === 'pending')
      .forEach(item => {
        processFile(item);
      });

  }, [processFile]);

  const removeFile = useCallback((fileId: string) => {
    processingQueue.current.delete(fileId);
    
    setState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId),
      selectedFile: prev.selectedFile?.id === fileId ? undefined : prev.selectedFile
    }));
  }, []);

  const retryFile = useCallback((fileId: string) => {
    const file = state.files.find(f => f.id === fileId);
    if (file && file.status === 'error') {
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId 
            ? { ...f, status: 'pending', progress: 0, error: undefined }
            : f
        )
      }));
      
      processFile(file);
    }
  }, [state.files, processFile]);

  const clearCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.status !== 'completed'),
      selectedFile: prev.selectedFile?.status === 'completed' ? undefined : prev.selectedFile
    }));
  }, []);

  const clearAll = useCallback(() => {
    // Cancel all processing
    processingQueue.current.clear();
    
    setState(prev => ({
      ...prev,
      files: [],
      selectedFile: undefined,
      isProcessing: false
    }));
  }, []);

  const setFilter = useCallback((filter: UploadDashboardState['filter']) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  const setViewMode = useCallback((viewMode: UploadDashboardState['viewMode']) => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  const selectFile = useCallback((fileId: string | undefined) => {
    const selectedFile = fileId ? state.files.find(f => f.id === fileId) : undefined;
    setState(prev => ({ ...prev, selectedFile }));
  }, [state.files]);

  // Update stats whenever files change
  useEffect(() => {
    updateStats(state.files);
  }, [state.files, updateStats]);

  // Filter files based on current filter
  const filteredFiles = useMemo(() => {
    if (state.filter === 'all') return state.files;
    return state.files.filter(file => file.status === state.filter);
  }, [state.files, state.filter]);

  return {
    state,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
    setFilter,
    setViewMode,
    selectFile,
    isProcessing: state.isProcessing,
    filteredFiles
  };
};

export default useFileUpload;
