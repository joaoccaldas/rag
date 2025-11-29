export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface FileContent {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
    language?: string;
    encoding?: string;
  };
  extractedData?: {
    images?: ImageData[];
    links?: LinkData[];
    tables?: TableData[];
  };
}

export interface ImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface LinkData {
  url: string;
  text: string;
  title?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  topics: string[];
  entities: EntityData[];
  readability: {
    score: number;
    level: string;
    grade: number;
  };
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  structure: {
    sections: SectionData[];
    hierarchy: string[];
  };
  insights: InsightData[];
}

export interface EntityData {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'OTHER';
  confidence: number;
  startOffset?: number;
  endOffset?: number;
}

export interface SectionData {
  title: string;
  content: string;
  level: number;
  wordCount: number;
  startOffset: number;
  endOffset: number;
}

export interface InsightData {
  type: 'warning' | 'info' | 'recommendation' | 'highlight';
  title: string;
  description: string;
  confidence: number;
  relevance: number;
}

export interface FileAnalysisState {
  selectedFile?: File;
  fileInfo?: FileInfo;
  content?: FileContent;
  analysis?: AnalysisResult;
  isAnalyzing: boolean;
  isLoading: boolean;
  error?: string;
  progress: number;
}

export type SupportedFileType = 
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'html'
  | 'json'
  | 'csv'
  | 'xlsx'
  | 'pptx';

export interface FileTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  maxSize: number;
  hasPreview: boolean;
  processingCapabilities: string[];
}

export type AnalysisTab = 'overview' | 'content' | 'structure' | 'insights' | 'entities';
