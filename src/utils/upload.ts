import type { 
  FileUploadItem, 
  ProcessingResult, 
  ProcessingStats,
  FileProcessingStage,
  SupportedFileType,
  FileTypeConfig
} from '../types/upload';

export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getFileType = (file: File): SupportedFileType | 'unknown' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, SupportedFileType> = {
    'pdf': 'pdf',
    'docx': 'docx',
    'doc': 'docx',
    'pptx': 'pptx',
    'ppt': 'pptx',
    'txt': 'txt',
    'md': 'md',
    'markdown': 'md',
    'html': 'html',
    'htm': 'html',
    'json': 'json',
    'csv': 'csv',
    'xlsx': 'xlsx',
    'xls': 'xlsx'
  };
  
  return typeMap[extension || ''] || 'unknown';
};

export const getFileTypeConfig = (fileType: SupportedFileType): FileTypeConfig => {
  const configs: Record<SupportedFileType, FileTypeConfig> = {
    pdf: {
      extensions: ['pdf'],
      mimeTypes: ['application/pdf'],
      maxSize: 50 * 1024 * 1024, // 50MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    docx: {
      extensions: ['docx', 'doc'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
      maxSize: 25 * 1024 * 1024, // 25MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    pptx: {
      extensions: ['pptx', 'ppt'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
      maxSize: 50 * 1024 * 1024, // 50MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    txt: {
      extensions: ['txt'],
      mimeTypes: ['text/plain'],
      maxSize: 10 * 1024 * 1024, // 10MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    md: {
      extensions: ['md', 'markdown'],
      mimeTypes: ['text/markdown', 'text/x-markdown'],
      maxSize: 5 * 1024 * 1024, // 5MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    html: {
      extensions: ['html', 'htm'],
      mimeTypes: ['text/html'],
      maxSize: 10 * 1024 * 1024, // 10MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    json: {
      extensions: ['json'],
      mimeTypes: ['application/json'],
      maxSize: 5 * 1024 * 1024, // 5MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding']
    },
    csv: {
      extensions: ['csv'],
      mimeTypes: ['text/csv'],
      maxSize: 20 * 1024 * 1024, // 20MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    },
    xlsx: {
      extensions: ['xlsx', 'xls'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      maxSize: 15 * 1024 * 1024, // 15MB
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'chunking', 'embedding', 'analysis']
    }
  };
  
  return configs[fileType];
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const fileType = getFileType(file);
  
  if (fileType === 'unknown') {
    return { isValid: false, error: 'Unsupported file type' };
  }
  
  const config = getFileTypeConfig(fileType);
  
  if (file.size > config.maxSize) {
    return { 
      isValid: false, 
      error: `File size exceeds limit of ${formatFileSize(config.maxSize)}` 
    };
  }
  
  if (!config.mimeTypes.includes(file.type) && file.type !== '') {
    return { isValid: false, error: 'File type mismatch' };
  }
  
  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const calculateProcessingStats = (files: FileUploadItem[]): ProcessingStats => {
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'error').length;
  
  const completedProcessingTimes = files
    .filter(f => f.status === 'completed' && f.result?.processingTime)
    .map(f => f.result!.processingTime);
  
  const avgProcessingTime = completedProcessingTimes.length > 0
    ? completedProcessingTimes.reduce((sum, time) => sum + time, 0) / completedProcessingTimes.length
    : 0;
  
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalChunks = files
    .filter(f => f.result?.chunks)
    .reduce((sum, f) => sum + f.result!.chunks.length, 0);
  
  const totalTokens = files
    .filter(f => f.result?.chunks)
    .reduce((sum, f) => sum + f.result!.chunks.reduce((chunkSum, chunk) => chunkSum + chunk.content.length, 0), 0);
  
  return {
    totalFiles,
    completedFiles,
    failedFiles,
    avgProcessingTime,
    totalSize,
    totalChunks,
    totalTokens
  };
};

export const getProcessingStageLabel = (stage: FileProcessingStage): string => {
  const labels: Record<FileProcessingStage, string> = {
    upload: 'Uploading file',
    parsing: 'Parsing content',
    chunking: 'Creating chunks',
    analysis: 'AI analysis',
    embedding: 'Generating embeddings',
    storage: 'Storing data',
    complete: 'Processing complete'
  };
  
  return labels[stage];
};

export const getProcessingStageProgress = (stage: FileProcessingStage): number => {
  const progressMap: Record<FileProcessingStage, number> = {
    upload: 10,
    parsing: 25,
    chunking: 40,
    analysis: 60,
    embedding: 80,
    storage: 95,
    complete: 100
  };
  
  return progressMap[stage];
};

export const estimateProcessingTime = (file: File): number => {
  const fileType = getFileType(file);
  const sizeInMB = file.size / (1024 * 1024);
  
  // Base processing time per MB for different file types (in seconds)
  const processingTimePerMB: Record<SupportedFileType | 'unknown', number> = {
    txt: 2,
    md: 2.5,
    html: 3,
    json: 1.5,
    csv: 2,
    xlsx: 4,
    docx: 5,
    pptx: 6,
    pdf: 8,
    unknown: 10
  };
  
  const baseTime = sizeInMB * processingTimePerMB[fileType];
  
  // Add overhead for AI analysis and embedding generation
  const analysisOverhead = Math.max(5, sizeInMB * 0.5);
  const embeddingOverhead = Math.max(10, sizeInMB * 1.2);
  
  return Math.round(baseTime + analysisOverhead + embeddingOverhead);
};

export const createMockProcessingResult = (file: File): ProcessingResult => {
  const fileType = getFileType(file);
  const sizeInMB = file.size / (1024 * 1024);
  const estimatedChunks = Math.max(1, Math.floor(sizeInMB * 2));
  
  return {
    id: generateFileId(),
    filename: file.name,
    fileType,
    size: file.size,
    content: `Mock content for ${file.name}`,
    chunks: Array(estimatedChunks).fill(null).map((_, i) => ({
      id: `chunk_${i}`,
      content: `Chunk ${i + 1} content from ${file.name}`,
      metadata: {
        position: i,
        length: 500,
        page: Math.floor(i / 2) + 1
      }
    })),
    metadata: {
      title: file.name.replace(/\.[^/.]+$/, ''),
      createdAt: new Date(),
      wordCount: Math.floor(sizeInMB * 250),
      pageCount: Math.max(1, Math.floor(sizeInMB * 0.5))
    },
    analysis: {
      summary: `This document appears to be a ${fileType.toUpperCase()} file containing structured information.`,
      keyTopics: ['Data Analysis', 'Documentation', 'Information Management'],
      entities: [
        { text: 'Document', type: 'OTHER', confidence: 0.9 },
        { text: file.name, type: 'OTHER', confidence: 0.95 }
      ],
      sentiment: { score: 0.1, label: 'neutral', confidence: 0.8 },
      readingLevel: 8,
      complexity: sizeInMB > 5 ? 'high' : sizeInMB > 1 ? 'medium' : 'low'
    },
    embeddings: Array(estimatedChunks).fill(null).map((_, i) => ({
      chunkId: `chunk_${i}`,
      vector: Array(384).fill(0).map(() => Math.random() - 0.5),
      model: 'all-MiniLM-L6-v2',
      createdAt: new Date()
    })),
    processingTime: estimateProcessingTime(file),
    status: 'success'
  };
};
