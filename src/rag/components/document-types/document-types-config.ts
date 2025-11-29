// Comprehensive Document Types and Processing Configuration
// Centralized configuration for all supported document types and their processing strategies

export interface ChunkingStrategy {
  method: 'semantic' | 'fixed' | 'sliding' | 'paragraph' | 'sentence' | 'hybrid'
  maxTokens: number
  overlapTokens: number
  preserveStructure: boolean
  respectBoundaries: string[] // e.g., ['paragraph', 'section', 'page']
  customDelimiters?: string[]
  metadataExtraction: boolean
}

export interface VisualExtractionConfig {
  enabled: boolean
  extractCharts: boolean
  extractTables: boolean
  extractImages: boolean
  extractDiagrams: boolean
  ocrEnabled: boolean
  qualityThreshold: number
}

export interface ProcessingPipeline {
  textExtraction: string
  preprocessing: string[]
  chunking: ChunkingStrategy
  visualExtraction: VisualExtractionConfig
  embeddings: {
    model: string
    dimensions: number
    batchSize: number
  }
  indexing: {
    vectorStore: string
    metadata: string[]
  }
}

export interface DocumentTypeConfig {
  type: string
  extensions: string[]
  mimeTypes: string[]
  displayName: string
  description: string
  category: 'text' | 'structured' | 'presentation' | 'spreadsheet' | 'image' | 'media' | 'code' | 'archive'
  priority: 'high' | 'medium' | 'low'
  maxSize: number // in MB
  processingPipeline: ProcessingPipeline
  supportLevel: 'full' | 'partial' | 'experimental'
  libraryDependencies: string[]
  notes?: string
}

// Comprehensive document type configurations
export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  // TEXT DOCUMENTS
  pdf: {
    type: 'pdf',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    displayName: 'PDF Documents',
    description: 'Portable Document Format files with full text and visual extraction',
    category: 'text',
    priority: 'high',
    maxSize: 100,
    processingPipeline: {
      textExtraction: 'pdfjs-dist',
      preprocessing: ['normalize-whitespace', 'remove-headers-footers', 'detect-language'],
      chunking: {
        method: 'hybrid',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: true,
        respectBoundaries: ['paragraph', 'section', 'page'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: true,
        extractDiagrams: true,
        ocrEnabled: true,
        qualityThreshold: 0.8
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 100
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['page', 'section', 'author', 'title']
      }
    },
    supportLevel: 'full',
    libraryDependencies: ['pdfjs-dist', 'pdf-parse']
  },

  docx: {
    type: 'docx',
    extensions: ['.docx', '.doc'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
    displayName: 'Word Documents',
    description: 'Microsoft Word documents with structure preservation',
    category: 'text',
    priority: 'high',
    maxSize: 50,
    processingPipeline: {
      textExtraction: 'mammoth',
      preprocessing: ['normalize-whitespace', 'preserve-formatting', 'extract-styles'],
      chunking: {
        method: 'semantic',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: true,
        respectBoundaries: ['paragraph', 'section', 'heading'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: true,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0.7
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 100
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['heading', 'style', 'author', 'title']
      }
    },
    supportLevel: 'full',
    libraryDependencies: ['mammoth']
  },

  // PRESENTATION FILES
  pptx: {
    type: 'pptx',
    extensions: ['.pptx', '.ppt'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
    displayName: 'PowerPoint Presentations',
    description: 'Microsoft PowerPoint presentations with slide-based chunking',
    category: 'presentation',
    priority: 'high',
    maxSize: 100,
    processingPipeline: {
      textExtraction: 'pptx-parser',
      preprocessing: ['normalize-whitespace', 'extract-speaker-notes', 'preserve-slide-structure'],
      chunking: {
        method: 'semantic',
        maxTokens: 256,
        overlapTokens: 25,
        preserveStructure: true,
        respectBoundaries: ['slide', 'section'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: true,
        extractDiagrams: true,
        ocrEnabled: true,
        qualityThreshold: 0.8
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 50
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['slide-number', 'slide-title', 'section', 'notes']
      }
    },
    supportLevel: 'experimental',
    libraryDependencies: ['pptx-parser', 'office-parser'],
    notes: 'Requires additional parsing library implementation'
  },

  // SPREADSHEETS
  xlsx: {
    type: 'xlsx',
    extensions: ['.xlsx', '.xls'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    displayName: 'Excel Spreadsheets',
    description: 'Microsoft Excel files with data structure preservation',
    category: 'spreadsheet',
    priority: 'high',
    maxSize: 25,
    processingPipeline: {
      textExtraction: 'xlsx-parser',
      preprocessing: ['convert-to-text', 'preserve-structure', 'extract-formulas'],
      chunking: {
        method: 'fixed',
        maxTokens: 256,
        overlapTokens: 0,
        preserveStructure: true,
        respectBoundaries: ['sheet', 'table', 'row'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0.9
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 100
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['sheet-name', 'table-range', 'formulas']
      }
    },
    supportLevel: 'partial',
    libraryDependencies: ['xlsx', 'exceljs']
  },

  csv: {
    type: 'csv',
    extensions: ['.csv'],
    mimeTypes: ['text/csv', 'application/csv'],
    displayName: 'CSV Files',
    description: 'Comma-separated values with automatic schema detection',
    category: 'structured',
    priority: 'high',
    maxSize: 50,
    processingPipeline: {
      textExtraction: 'csv-parser',
      preprocessing: ['detect-schema', 'normalize-values', 'handle-missing-data'],
      chunking: {
        method: 'fixed',
        maxTokens: 256,
        overlapTokens: 0,
        preserveStructure: true,
        respectBoundaries: ['row', 'column-group'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: false,
        extractCharts: false,
        extractTables: true,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0.9
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 200
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['headers', 'data-types', 'row-count']
      }
    },
    supportLevel: 'full',
    libraryDependencies: ['csv-parser', 'papa-parse']
  },

  // PLAIN TEXT
  txt: {
    type: 'txt',
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    displayName: 'Plain Text',
    description: 'Simple text files with paragraph-based chunking',
    category: 'text',
    priority: 'high',
    maxSize: 10,
    processingPipeline: {
      textExtraction: 'direct',
      preprocessing: ['normalize-whitespace', 'detect-encoding', 'detect-language'],
      chunking: {
        method: 'paragraph',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: false,
        respectBoundaries: ['paragraph', 'sentence'],
        metadataExtraction: false
      },
      visualExtraction: {
        enabled: false,
        extractCharts: false,
        extractTables: false,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 200
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['encoding', 'language']
      }
    },
    supportLevel: 'full',
    libraryDependencies: []
  },

  markdown: {
    type: 'markdown',
    extensions: ['.md', '.markdown'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    displayName: 'Markdown',
    description: 'Markdown files with structure-aware processing',
    category: 'text',
    priority: 'high',
    maxSize: 10,
    processingPipeline: {
      textExtraction: 'markdown-parser',
      preprocessing: ['parse-markdown', 'extract-metadata', 'preserve-structure'],
      chunking: {
        method: 'semantic',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: true,
        respectBoundaries: ['heading', 'paragraph', 'code-block'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: false,
        extractCharts: false,
        extractTables: true,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 200
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['headings', 'frontmatter', 'code-language']
      }
    },
    supportLevel: 'full',
    libraryDependencies: ['marked', 'gray-matter']
  },

  // WEB DOCUMENTS
  html: {
    type: 'html',
    extensions: ['.html', '.htm'],
    mimeTypes: ['text/html'],
    displayName: 'HTML Documents',
    description: 'HTML files with DOM structure preservation',
    category: 'text',
    priority: 'medium',
    maxSize: 25,
    processingPipeline: {
      textExtraction: 'html-parser',
      preprocessing: ['parse-dom', 'extract-text', 'preserve-semantic-structure'],
      chunking: {
        method: 'semantic',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: true,
        respectBoundaries: ['section', 'article', 'div', 'paragraph'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: false,
        extractTables: true,
        extractImages: true,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0.7
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 100
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['title', 'headings', 'meta-tags', 'semantic-tags']
      }
    },
    supportLevel: 'full',
    libraryDependencies: ['jsdom', 'cheerio']
  },

  xml: {
    type: 'xml',
    extensions: ['.xml'],
    mimeTypes: ['application/xml', 'text/xml'],
    displayName: 'XML Documents',
    description: 'XML files with schema-aware processing',
    category: 'structured',
    priority: 'medium',
    maxSize: 25,
    processingPipeline: {
      textExtraction: 'xml-parser',
      preprocessing: ['parse-xml', 'extract-text-nodes', 'preserve-hierarchy'],
      chunking: {
        method: 'fixed',
        maxTokens: 256,
        overlapTokens: 25,
        preserveStructure: true,
        respectBoundaries: ['element', 'section'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: false,
        extractCharts: false,
        extractTables: false,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 150
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['schema', 'namespaces', 'attributes']
      }
    },
    supportLevel: 'partial',
    libraryDependencies: ['xml2js', 'fast-xml-parser']
  },

  // CODE FILES
  javascript: {
    type: 'javascript',
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    mimeTypes: ['application/javascript', 'text/javascript', 'application/typescript'],
    displayName: 'JavaScript/TypeScript',
    description: 'JavaScript and TypeScript code files',
    category: 'code',
    priority: 'medium',
    maxSize: 5,
    processingPipeline: {
      textExtraction: 'code-parser',
      preprocessing: ['parse-ast', 'extract-comments', 'identify-functions'],
      chunking: {
        method: 'semantic',
        maxTokens: 256,
        overlapTokens: 25,
        preserveStructure: true,
        respectBoundaries: ['function', 'class', 'module'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: false,
        extractCharts: false,
        extractTables: false,
        extractImages: false,
        extractDiagrams: false,
        ocrEnabled: false,
        qualityThreshold: 0
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 100
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['language', 'functions', 'imports', 'exports']
      }
    },
    supportLevel: 'experimental',
    libraryDependencies: ['@babel/parser', 'typescript'],
    notes: 'Code understanding requires specialized processing'
  },

  // IMAGES
  image: {
    type: 'image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'],
    displayName: 'Images',
    description: 'Image files with OCR text extraction',
    category: 'image',
    priority: 'medium',
    maxSize: 10,
    processingPipeline: {
      textExtraction: 'ocr',
      preprocessing: ['image-preprocessing', 'ocr-optimization'],
      chunking: {
        method: 'fixed',
        maxTokens: 256,
        overlapTokens: 0,
        preserveStructure: false,
        respectBoundaries: ['text-block'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: true,
        extractDiagrams: true,
        ocrEnabled: true,
        qualityThreshold: 0.8
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 50
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['dimensions', 'format', 'ocr-confidence']
      }
    },
    supportLevel: 'experimental',
    libraryDependencies: ['tesseract.js', 'sharp'],
    notes: 'Requires OCR implementation for text extraction'
  },

  // ARCHIVE FILES
  zip: {
    type: 'zip',
    extensions: ['.zip'],
    mimeTypes: ['application/zip'],
    displayName: 'ZIP Archives',
    description: 'ZIP archives with recursive file processing',
    category: 'archive',
    priority: 'low',
    maxSize: 100,
    processingPipeline: {
      textExtraction: 'archive-extractor',
      preprocessing: ['extract-files', 'filter-supported', 'recursive-processing'],
      chunking: {
        method: 'hybrid',
        maxTokens: 512,
        overlapTokens: 50,
        preserveStructure: true,
        respectBoundaries: ['file', 'folder'],
        metadataExtraction: true
      },
      visualExtraction: {
        enabled: true,
        extractCharts: true,
        extractTables: true,
        extractImages: true,
        extractDiagrams: true,
        ocrEnabled: false,
        qualityThreshold: 0.7
      },
      embeddings: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 50
      },
      indexing: {
        vectorStore: 'pinecone',
        metadata: ['archive-path', 'file-count', 'extracted-types']
      }
    },
    supportLevel: 'experimental',
    libraryDependencies: ['jszip', 'node-stream-zip'],
    notes: 'Requires recursive processing of extracted files'
  }
}

// Helper functions
export function getSupportedExtensions(): string[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS).flatMap(config => config.extensions)
}

export function getSupportedMimeTypes(): string[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS).flatMap(config => config.mimeTypes)
}

export function getConfigByExtension(extension: string): DocumentTypeConfig | null {
  const normalizedExt = extension.toLowerCase()
  return Object.values(DOCUMENT_TYPE_CONFIGS).find(config => 
    config.extensions.includes(normalizedExt)
  ) || null
}

export function getConfigByMimeType(mimeType: string): DocumentTypeConfig | null {
  return Object.values(DOCUMENT_TYPE_CONFIGS).find(config => 
    config.mimeTypes.includes(mimeType)
  ) || null
}

export function getConfigsByCategory(category: DocumentTypeConfig['category']): DocumentTypeConfig[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS).filter(config => config.category === category)
}

export function getConfigsBySupportLevel(level: DocumentTypeConfig['supportLevel']): DocumentTypeConfig[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS).filter(config => config.supportLevel === level)
}

export function getHighPriorityConfigs(): DocumentTypeConfig[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS).filter(config => config.priority === 'high')
}

export function getRequiredLibraries(): string[] {
  const allLibraries = Object.values(DOCUMENT_TYPE_CONFIGS).flatMap(config => config.libraryDependencies)
  return [...new Set(allLibraries)]
}
