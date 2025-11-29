# RAG System File Type Support Summary

## Overview
This document lists all supported file types in the RAG system, their processing methods, and current status.

## Supported File Types

### 1. PDF Files (.pdf)
- **MIME Type**: `application/pdf`
- **Max Size**: 50 MB
- **Processing**: PDF.js library with OCR fallback using Tesseract.js
- **Features**: 
  - Text extraction from text-based PDFs
  - OCR for scanned/image-based PDFs
  - Page-by-page processing
  - Thumbnail generation
- **Status**: ✅ Full support

### 2. Microsoft Word (.docx, .doc)
- **MIME Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Max Size**: 25 MB
- **Processing**: Mammoth.js library for DOCX, basic extraction for DOC
- **Features**:
  - Text extraction with formatting preservation
  - Style analysis
  - Structure analysis (headings, paragraphs)
  - Embedded image handling
- **Status**: ✅ Full support

### 3. Microsoft PowerPoint (.pptx, .ppt) - NEWLY ADDED
- **MIME Types**: 
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX)
  - `application/vnd.ms-powerpoint` (PPT legacy)
- **Max Size**: 30 MB
- **Processing**: JSZip for PPTX extraction, fallback for PPT
- **Features**:
  - Slide-by-slide text extraction
  - Speaker notes extraction
  - Structure analysis
  - Presentation metadata
- **Status**: ✅ Newly implemented (fixed missing MIME type support)

### 4. Microsoft Excel (.xlsx, .xls)
- **MIME Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Max Size**: 15 MB
- **Processing**: JSZip-based extraction for XLSX
- **Features**:
  - Data extraction from sheets
  - Formula analysis
  - Cell content processing
- **Status**: ✅ Full support

### 5. Plain Text (.txt)
- **MIME Type**: `text/plain`
- **Max Size**: 10 MB
- **Processing**: Direct text reading
- **Features**:
  - Encoding detection
  - Raw text processing
  - Simple chunking
- **Status**: ✅ Full support

### 6. Markdown (.md, .markdown)
- **MIME Type**: `text/markdown`
- **Max Size**: 5 MB
- **Processing**: Direct text reading with markdown structure preservation
- **Features**:
  - Markdown syntax preservation
  - Structure analysis (headers, lists)
  - Link extraction
- **Status**: ✅ Full support

### 7. HTML (.html, .htm)
- **MIME Type**: `text/html`
- **Max Size**: 10 MB
- **Processing**: HTML parsing and text extraction
- **Features**:
  - Tag removal and text extraction
  - Structure preservation
  - Link and metadata extraction
- **Status**: ✅ Full support

### 8. JSON (.json)
- **MIME Type**: `application/json`
- **Max Size**: 5 MB
- **Processing**: JSON parsing and structure analysis
- **Features**:
  - Object structure analysis
  - Key-value extraction
  - Nested data handling
- **Status**: ✅ Full support

### 9. CSV (.csv)
- **MIME Type**: `text/csv`
- **Max Size**: 10 MB
- **Processing**: CSV parsing with delimiter detection
- **Features**:
  - Header detection
  - Column analysis
  - Data type inference
- **Status**: ✅ Full support

## Advanced File Types (Code Files)

The system also supports various code file types for development documentation:

### Programming Languages Supported:
- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Python**: `.py`
- **CSS/SCSS**: `.css`, `.scss`, `.sass`
- **SQL**: `.sql`
- **PHP**: `.php`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`, `.cc`
- **Ruby**: `.rb`
- **Go**: `.go`
- **Rust**: `.rs`
- **Swift**: `.swift`
- **Kotlin**: `.kt`, `.kts`

### Configuration Files:
- **YAML**: `.yaml`, `.yml`
- **TOML**: `.toml`
- **INI/Config**: `.ini`, `.cfg`
- **XML**: `.xml`

### E-book Formats:
- **EPUB**: `.epub`
- **MOBI**: `.mobi`
- **AZW**: `.azw`

### Document Formats:
- **RTF**: `.rtf`
- **OpenDocument**: `.odt`, `.ods`, `.odp`

### System Files:
- **Logs**: `.log`

## Processing Pipeline

### 1. File Upload & Validation
- MIME type detection
- File size validation
- Extension verification
- Security scanning

### 2. Content Extraction
- Type-specific processing
- Text extraction
- Metadata collection
- Structure analysis

### 3. Content Processing
- Text chunking (configurable size: 1000 chars, overlap: 200 chars)
- Token estimation
- Embedding preparation
- Search index creation

### 4. Storage Management
- **Small files** (< 4MB): localStorage with base64 encoding
- **Large files** (> 4MB): IndexedDB for content, localStorage for metadata
- **Automatic migration**: System automatically moves large files to IndexedDB when localStorage quota is exceeded

## Storage Architecture

### localStorage Structure:
```json
{
  "rag-documents": "Document metadata and search index",
  "rag-stored-files": "File metadata and small file content",
  "rag-settings": "System configuration",
  "domainKeywords": "Domain-specific keywords"
}
```

### IndexedDB Structure:
```
Database: rag-file-storage
Store: files
Content: { id: string, content: base64string }
```

## Recent Fixes Applied

### 1. PowerPoint Support Fixed ✅
- **Issue**: PPTX files were being rejected with "not supported" error
- **Root Cause**: Missing from `SupportedFileType` array and configuration
- **Solution**: Added PPTX to type definitions, configurations, and worker processing

### 2. localStorage Quota Exceeded Fixed ✅
- **Issue**: Large files causing storage quota errors
- **Root Cause**: Duplicate storage operations in file-storage.ts
- **Solution**: 
  - Fixed duplicate localStorage.setItem calls
  - Improved large file detection (> 4MB threshold)
  - Enhanced fallback to IndexedDB for large files
  - Created migration script for existing large files

### 3. File Storage Optimization ✅
- **Improvements**:
  - Automatic file size detection
  - Smart storage routing (localStorage vs IndexedDB)
  - Storage quota monitoring
  - Cleanup and migration utilities

## File Type Detection Logic

The system uses a multi-tier detection approach:

1. **Extension-based**: Primary detection using file extension
2. **MIME-type**: Secondary verification using browser-detected MIME type
3. **Content-based**: Fallback for ambiguous files
4. **User confirmation**: Manual override for edge cases

## Error Handling

### Common Issues & Solutions:

1. **"File type not supported"**
   - Check if file extension is in supported list
   - Verify MIME type matches configuration
   - Use file analysis tools to identify format

2. **"Storage quota exceeded"**
   - Run storage optimization tool
   - Clear unnecessary cached data
   - Enable IndexedDB fallback

3. **"Processing failed"**
   - Check file integrity
   - Verify file isn't corrupted
   - Try re-uploading with different encoding

## Performance Considerations

### File Size Recommendations:
- **Optimal**: < 10 MB per file
- **Good**: 10-25 MB per file
- **Acceptable**: 25-50 MB per file (may have longer processing times)

### Processing Speed:
- **Text files**: ~1-2 seconds
- **Office documents**: ~3-10 seconds
- **PDFs**: ~5-15 seconds (depending on OCR requirements)
- **Large files**: ~15-60 seconds

## Future Enhancements

### Planned File Types:
- **Images**: PNG, JPG, GIF (with OCR)
- **Audio**: MP3, WAV (with transcription)
- **Video**: MP4 (with transcript extraction)
- **Archives**: ZIP, RAR (with content extraction)

### Planned Features:
- **Batch processing**: Multiple file upload and processing
- **Cloud storage**: Integration with Google Drive, Dropbox
- **Version control**: File update tracking and history
- **Collaborative editing**: Multi-user document annotation

---

*Last updated: January 2024*
*System version: 1.0*
