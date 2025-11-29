export interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: ProcessingResult;
  uploadedAt: Date;
}

export interface ProcessingResult {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  content: string;
  chunks: ChunkData[];
  metadata: FileMetadata;
  analysis: AIAnalysis;
  embeddings: EmbeddingData[];
  processingTime: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

export interface ChunkData {
  id: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    position: number;
    length: number;
  };
  embedding?: number[];
  similarity?: number;
}

export interface FileMetadata {
  title?: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  tags?: string[];
}

export type SupportedFileType = 
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'txt'
  | 'md'
  | 'html'
  | 'json'
  | 'csv'
  | 'xlsx';

export interface FileTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  maxSize: number;
  hasPreview: boolean;
  processingCapabilities: string[];
}

export interface AIAnalysis {
  summary: string;
  keyTopics: string[];
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  readingLevel?: number;
  complexity?: 'low' | 'medium' | 'high';
}

export interface EmbeddingData {
  chunkId: string;
  vector: number[];
  model: string;
  createdAt: Date;
}

export interface ProcessingStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  avgProcessingTime: number;
  totalSize: number;
  totalChunks: number;
  totalTokens: number;
}

export interface UploadDashboardState {
  files: FileUploadItem[];
  isProcessing: boolean;
  stats: ProcessingStats;
  selectedFile?: FileUploadItem;
  viewMode: 'grid' | 'list';
  filter: 'all' | 'pending' | 'processing' | 'completed' | 'error';
}

export type FileProcessingStage = 
  | 'upload'
  | 'parsing'
  | 'chunking'
  | 'analysis'
  | 'embedding'
  | 'storage'
  | 'complete';

export interface ProcessingProgress {
  stage: FileProcessingStage;
  progress: number;
  message: string;
  startTime: Date;
  estimatedCompletion?: Date;
}
