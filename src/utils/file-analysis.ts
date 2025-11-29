import type { 
  FileInfo, 
  FileContent, 
  AnalysisResult,
  SupportedFileType,
  FileTypeConfig,
  EntityData,
  SectionData,
  InsightData
} from '../types/file-analysis';

export const getFileInfo = (file: File): FileInfo => ({
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified
});

export const getSupportedFileTypes = (): SupportedFileType[] => [
  'pdf', 'docx', 'txt', 'md', 'html', 'json', 'csv', 'xlsx'
];

export const getFileTypeConfig = (fileType: SupportedFileType): FileTypeConfig => {
  const configs: Record<SupportedFileType, FileTypeConfig> = {
    pdf: {
      extensions: ['pdf'],
      mimeTypes: ['application/pdf'],
      maxSize: 50 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'image-extraction', 'table-extraction']
    },
    docx: {
      extensions: ['docx', 'doc'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSize: 25 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'style-analysis', 'structure-analysis']
    },
    txt: {
      extensions: ['txt'],
      mimeTypes: ['text/plain'],
      maxSize: 10 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'encoding-detection']
    },
    md: {
      extensions: ['md', 'markdown'],
      mimeTypes: ['text/markdown'],
      maxSize: 5 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'markdown-parsing', 'structure-analysis']
    },
    html: {
      extensions: ['html', 'htm'],
      mimeTypes: ['text/html'],
      maxSize: 10 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['text-extraction', 'link-extraction', 'image-extraction']
    },
    json: {
      extensions: ['json'],
      mimeTypes: ['application/json'],
      maxSize: 5 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['structure-analysis', 'validation']
    },
    csv: {
      extensions: ['csv'],
      mimeTypes: ['text/csv'],
      maxSize: 20 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['data-analysis', 'column-detection', 'statistics']
    },
    xlsx: {
      extensions: ['xlsx', 'xls'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      maxSize: 15 * 1024 * 1024,
      hasPreview: true,
      processingCapabilities: ['data-extraction', 'sheet-analysis', 'formula-analysis']
    }
  };
  
  return configs[fileType];
};

export const detectFileType = (file: File): SupportedFileType | 'unknown' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedTypes = getSupportedFileTypes();
  
  for (const type of supportedTypes) {
    const config = getFileTypeConfig(type);
    if (config.extensions.includes(extension || '') || config.mimeTypes.includes(file.type)) {
      return type;
    }
  }
  
  return 'unknown';
};

export const validateFileForAnalysis = (file: File): { isValid: boolean; error?: string } => {
  const fileType = detectFileType(file);
  
  if (fileType === 'unknown') {
    return { isValid: false, error: 'Unsupported file type for analysis' };
  }
  
  const config = getFileTypeConfig(fileType);
  
  if (file.size > config.maxSize) {
    return { 
      isValid: false, 
      error: `File size exceeds maximum of ${formatBytes(config.maxSize)}` 
    };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }
  
  return { isValid: true };
};

export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const estimateReadingTime = (wordCount: number): string => {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getReadabilityLevel = (score: number): string => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
};

export const extractTextPreview = (content: string, maxLength = 200): string => {
  if (content.length <= maxLength) return content;
  
  const preview = content.substring(0, maxLength);
  const lastSpaceIndex = preview.lastIndexOf(' ');
  
  return lastSpaceIndex > maxLength * 0.8 
    ? preview.substring(0, lastSpaceIndex) + '...'
    : preview + '...';
};

export const generateMockAnalysis = (fileInfo: FileInfo, content: FileContent): AnalysisResult => {
  const wordCount = content.metadata.wordCount || 0;
  const characterCount = content.metadata.characterCount || content.text.length;
  
  // Generate mock entities
  const entities: EntityData[] = [
    { text: 'Document Analysis', type: 'OTHER', confidence: 0.9 },
    { text: 'Data Processing', type: 'OTHER', confidence: 0.85 },
    { text: 'Information System', type: 'ORGANIZATION', confidence: 0.8 }
  ];
  
  // Generate mock sections
  const sections: SectionData[] = [
    {
      title: 'Introduction',
      content: extractTextPreview(content.text, 300),
      level: 1,
      wordCount: Math.floor(wordCount * 0.2),
      startOffset: 0,
      endOffset: Math.floor(characterCount * 0.2)
    },
    {
      title: 'Main Content',
      content: extractTextPreview(content.text.substring(Math.floor(characterCount * 0.2)), 300),
      level: 1,
      wordCount: Math.floor(wordCount * 0.6),
      startOffset: Math.floor(characterCount * 0.2),
      endOffset: Math.floor(characterCount * 0.8)
    },
    {
      title: 'Conclusion',
      content: extractTextPreview(content.text.substring(Math.floor(characterCount * 0.8)), 300),
      level: 1,
      wordCount: Math.floor(wordCount * 0.2),
      startOffset: Math.floor(characterCount * 0.8),
      endOffset: characterCount
    }
  ];
  
  // Generate mock insights
  const insights: InsightData[] = [
    {
      type: 'info',
      title: 'Document Structure',
      description: 'This document has a clear hierarchical structure with well-defined sections.',
      confidence: 0.9,
      relevance: 0.8
    },
    {
      type: 'recommendation',
      title: 'Content Optimization',
      description: 'Consider adding more subheadings to improve readability.',
      confidence: 0.7,
      relevance: 0.6
    }
  ];
  
  return {
    summary: `This ${fileInfo.name} contains ${wordCount} words and appears to be a structured document with multiple sections. The content focuses on data analysis and information processing topics.`,
    keyPoints: [
      'Well-structured document with clear sections',
      'Focuses on data analysis and processing',
      'Contains technical information and procedures',
      'Suitable for knowledge base integration'
    ],
    topics: ['Data Analysis', 'Information Processing', 'Documentation', 'Technical Content'],
    entities,
    readability: {
      score: Math.max(30, Math.min(90, 60 + Math.random() * 20)),
      level: 'Standard',
      grade: Math.floor(8 + Math.random() * 4)
    },
    sentiment: {
      score: Math.random() * 0.4 - 0.2, // -0.2 to 0.2 for neutral
      label: 'neutral',
      confidence: 0.8
    },
    structure: {
      sections,
      hierarchy: ['Introduction', 'Main Content', 'Conclusion']
    },
    insights
  };
};

export const mockFileContentReaders = {
  async readTextFile(file: File): Promise<FileContent> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string || '';
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        
        resolve({
          text,
          metadata: {
            wordCount,
            characterCount: text.length,
            language: 'en',
            encoding: 'UTF-8'
          }
        });
      };
      reader.readAsText(file);
    });
  },
  
  async readPdfFile(file: File): Promise<FileContent> {
    // Mock PDF reading - in real implementation would use PDF.js
    const mockText = `Mock PDF content from ${file.name}\n\nThis is a simulated PDF document with multiple pages and structured content.`;
    return {
      text: mockText,
      metadata: {
        pageCount: Math.floor(file.size / (1024 * 100)) + 1,
        wordCount: mockText.split(/\s+/).length,
        characterCount: mockText.length,
        language: 'en'
      }
    };
  },
  
  async readDocxFile(file: File): Promise<FileContent> {
    // Mock DOCX reading - in real implementation would use mammoth.js
    const mockText = `Mock DOCX content from ${file.name}\n\nThis is a simulated Word document with formatted text and structure.`;
    return {
      text: mockText,
      metadata: {
        wordCount: mockText.split(/\s+/).length,
  async readDocxFile(file: File): Promise<FileContent> {
    // Mock DOCX reading - in real implementation would use mammoth.js
    const mockText = `Mock DOCX content from ${file.name}\n\nThis is a simulated Word document with formatted text and structure.`;
    return {
      text: mockText,
      metadata: {
        wordCount: mockText.split(/\s+/).length,
        characterCount: mockText.length,
        language: 'en'
      }
    };
  },

  async readPptxFile(file: File): Promise<FileContent> {
    // Mock PPTX reading - in real implementation would use pptx extraction library
    const mockText = `Mock PowerPoint content from ${file.name}\n\nSlide 1: Introduction\nSlide 2: Main Content\nSlide 3: Conclusion\n\nThis is a simulated PowerPoint presentation with multiple slides and structured content.`;
    return {
      text: mockText,
      metadata: {
        pageCount: Math.floor(file.size / (1024 * 200)) + 3, // Estimate slide count
        wordCount: mockText.split(/\s+/).length,
        characterCount: mockText.length,
        language: 'en'
      }
    };
  }