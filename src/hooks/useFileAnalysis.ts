"use client"

import { useState, useCallback } from 'react';
import type { 
  FileAnalysisState, 
  FileContent, 
  AnalysisTab,
  SupportedFileType
} from '../types/file-analysis';
import { 
  getFileInfo, 
  validateFileForAnalysis, 
  detectFileType,
  generateMockAnalysis,
  mockFileContentReaders
} from '../utils/file-analysis';

export interface UseFileAnalysisReturn {
  state: FileAnalysisState;
  selectFile: (file: File) => Promise<void>;
  analyzeFile: () => Promise<void>;
  clearAnalysis: () => void;
  setActiveTab: (tab: AnalysisTab) => void;
  activeTab: AnalysisTab;
  supportedTypes: SupportedFileType[];
}

export const useFileAnalysis = (): UseFileAnalysisReturn => {
  const [state, setState] = useState<FileAnalysisState>({
    selectedFile: undefined,
    fileInfo: undefined,
    content: undefined,
    analysis: undefined,
    isAnalyzing: false,
    isLoading: false,
    error: undefined,
    progress: 0
  });

  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');

  const selectFile = useCallback(async (file: File) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: undefined,
        selectedFile: file,
        content: undefined,
        analysis: undefined,
        progress: 0
      }));

      // Validate file
      const validation = validateFileForAnalysis(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get file info
      const fileInfo = getFileInfo(file);
      const fileType = detectFileType(file);

      setState(prev => ({ ...prev, fileInfo, progress: 20 }));

      // Read file content based on type
      let content: FileContent;
      
      switch (fileType) {
        case 'pdf':
          content = await mockFileContentReaders.readPdfFile(file);
          break;
        case 'docx':
          content = await mockFileContentReaders.readDocxFile(file);
          break;
        case 'txt':
        case 'md':
        case 'html':
        case 'json':
        case 'csv':
          content = await mockFileContentReaders.readTextFile(file);
          break;
        default:
          content = await mockFileContentReaders.readTextFile(file);
      }

      setState(prev => ({ 
        ...prev, 
        content, 
        isLoading: false,
        progress: 100
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to process file',
        isLoading: false
      }));
    }
  }, []);

  const analyzeFile = useCallback(async () => {
    if (!state.fileInfo || !state.content) {
      setState(prev => ({ ...prev, error: 'No file selected or content not loaded' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: true, 
        error: undefined,
        progress: 0
      }));

      // Simulate analysis progress
      const progressSteps = [
        { progress: 10, message: 'Initializing analysis...' },
        { progress: 30, message: 'Extracting entities...' },
        { progress: 50, message: 'Analyzing structure...' },
        { progress: 70, message: 'Calculating readability...' },
        { progress: 90, message: 'Generating insights...' },
        { progress: 100, message: 'Analysis complete' }
      ];

      for (const step of progressSteps) {
        setState(prev => ({ ...prev, progress: step.progress }));
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      }

      // Generate analysis result
      const analysis = generateMockAnalysis(state.fileInfo, state.content);

      setState(prev => ({ 
        ...prev, 
        analysis,
        isAnalyzing: false,
        progress: 100
      }));

      // Switch to overview tab after analysis
      setActiveTab('overview');

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAnalyzing: false
      }));
    }
  }, [state.fileInfo, state.content]);

  const clearAnalysis = useCallback(() => {
    setState({
      selectedFile: undefined,
      fileInfo: undefined,
      content: undefined,
      analysis: undefined,
      isAnalyzing: false,
      isLoading: false,
      error: undefined,
      progress: 0
    });
    setActiveTab('overview');
  }, []);

  const supportedTypes: SupportedFileType[] = [
    'pdf', 'docx', 'txt', 'md', 'html', 'json', 'csv', 'xlsx'
  ];

  return {
    state,
    selectFile,
    analyzeFile,
    clearAnalysis,
    setActiveTab,
    activeTab,
    supportedTypes
  };
};

export default useFileAnalysis;
