# Visual Content Architecture - Complete Flow

## Summary: How Visuals are Embedded in Chunks and Stored

### 🎯 **ANSWER TO YOUR QUESTIONS:**

#### 1. **Are visuals embedded in chunks?**
**NO** - Visuals are **NOT directly embedded** in text chunks. Instead:
- Chunks contain **text content only**
- Visuals are stored **separately** with their own IDs
- Documents have a `visualContent` array that links to visuals
- Chunks and visuals are **associated by documentId**, not embedded together

#### 2. **Where are OCR screenshots stored?**
**IndexedDB + localStorage** (dual storage):
- **Screenshots (base64 images)**: Stored in `data.base64` field of each `VisualContent` object
- **Thumbnails (< 50KB)**: Preserved in `thumbnail` field (recently fixed)
- **Storage locations**:
  - Primary: `localStorage` under key `rag_visual_content`
  - Fallback: File system (server-side) or IndexedDB for large data
  - Large base64 data (> 50KB) is removed from localStorage, only thumbnails kept

---

## 📊 Complete Visual Content Flow

### **Phase 1: Document Upload & Visual Extraction**

```typescript
// File: src/rag/services/document-upload.ts
async uploadDocument(file: File)
  ↓
// File: src/rag/utils/document-processing.ts
processDocument(file, documentId)
  ↓
extractVisualContent(file, documentId)  // Line 195
  ↓
// File: src/rag/services/ocr-extraction.ts
ocrExtractionService.extractFromFile(file, options)
```

#### **OCR Extraction Process:**

**For PDFs:**
```typescript
// src/rag/services/ocr-extraction.ts:175-262
private async processPDFFile(file: File, options: OCRExtractionOptions)
  ↓
1. Load PDF with pdf.js
2. For each page:
   - Try extracting text directly (page.getTextContent())
   - If no text found → OCR needed:
     a. renderPDFPageToImage(page) → Creates canvas
     b. canvas.toBlob() → PNG screenshot
     c. processImageBlob(blob) → Tesseract OCR
     d. Create VisualContent object with:
        - base64: Full page screenshot
        - thumbnail: Scaled-down version
        - extractedText: OCR text
        - metadata: page number, confidence, etc.
```

**Screenshot Creation (Line 264-287):**
```typescript
private async renderPDFPageToImage(page: any): Promise<Blob | null> {
  const viewport = page.getViewport({ scale: 2.0 })
  const canvas = document.createElement('canvas')  // ← CREATE CANVAS
  const context = canvas.getContext('2d')
  
  canvas.height = viewport.height
  canvas.width = viewport.width
  
  await page.render({
    canvasContext: context,  // ← RENDER PDF PAGE TO CANVAS
    viewport: viewport
  }).promise
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')  // ← CONVERT CANVAS TO PNG BLOB
  })
}
```

**VisualContent Object Structure (Line 224-242):**
```typescript
{
  id: `pdf_page_${pageNum}_${Date.now()}`,
  documentId: `doc_${Date.now()}`,
  type: 'image',
  title: `Page ${pageNum}`,
  description: `Page ${pageNum} from ${file.name}`,
  data: {
    base64: await this.blobToBase64(pageImage)  // ← FULL SCREENSHOT STORED HERE
  },
  metadata: {
    pageNumber: pageNum,
    extractedText: ocrResult.text,  // ← OCR TEXT
    confidence: ocrResult.confidence,
    extractedAt: new Date().toISOString(),
    documentTitle: file.name
  },
  thumbnail: await this.generateThumbnailFromBlob(pageImage, size)  // ← SMALL THUMBNAIL
}
```

---

### **Phase 2: Visual Storage**

```typescript
// File: src/rag/utils/document-processing.ts:280-286
const visualContent = await extractVisualContent(file, documentId)
console.log(`🎯 Visual content extraction: ${visualContent.length} elements found`)

return {
  content,      // Text content
  chunks,       // Text chunks (NO visuals embedded)
  wordCount,
  visualContent // Separate visual array
}
```

#### **Storage Implementation:**

**File: src/rag/utils/visual-content-storage.ts**

```typescript
// Line 27-93: Main storage function
export async function storeVisualContent(visuals: VisualContent[]): Promise<void> {
  
  // 1. Server-side storage (if available)
  if (typeof window === 'undefined') {
    const { storeVisualContentToFiles } = await import('./file-system-visual-storage')
    await storeVisualContentToFiles(visuals)
    return
  }

  // 2. Client-side: localStorage (with quota management)
  const existing = await getStoredVisualContent();
  const existingMap = new Map(existing.map(v => [v.id, v]));
  
  // Merge new visuals with existing (avoiding duplicates)
  visuals.forEach(visual => {
    existingMap.set(visual.id, visual);
  });
  
  const allVisuals = Array.from(existingMap.values());
  
  // ⚠️ CRITICAL: Remove large base64 data, keep thumbnails < 50KB
  const optimizedVisuals = allVisuals.map(visual => {
    const optimized = { ...visual };
    
    // Check if thumbnail exists and is small
    if (visual.thumbnail && visual.thumbnail.startsWith('data:')) {
      const thumbnailSize = visual.thumbnail.length;
      if (thumbnailSize < 50 * 1024) {  // 50KB threshold
        // KEEP small thumbnails
        console.log(`✅ Keeping thumbnail (${(thumbnailSize/1024).toFixed(1)}KB)`);
      } else {
        // Remove large thumbnails
        delete optimized.thumbnail;
      }
    }
    
    // Remove large base64 from source
    if (visual.source && visual.source.startsWith('data:')) {
      if (visual.source.length > 50 * 1024) {
        delete optimized.source;
      }
    }
    
    // Remove large base64 from data.base64
    if (visual.data?.base64 && visual.data.base64.length > 50 * 1024) {
      delete optimized.data.base64;
    }
    
    return optimized;
  });
  
  // Store in localStorage
  localStorage.setItem(VISUAL_CONTENT_KEY, JSON.stringify(optimizedVisuals));
  
  // Create indexes for fast lookup
  await indexVisualContent(visuals);
}
```

**Storage Key:**
```typescript
const VISUAL_CONTENT_KEY = 'rag_visual_content'
```

**Storage Structure in localStorage:**
```json
{
  "rag_visual_content": [
    {
      "id": "pdf_page_1_1729512345678",
      "documentId": "doc_1729512345000",
      "type": "image",
      "title": "Page 1",
      "description": "Page 1 from document.pdf",
      "thumbnail": "data:image/png;base64,iVBORw0KG...",  // ← SMALL THUMBNAIL KEPT
      "data": {
        // base64: REMOVED if > 50KB
      },
      "metadata": {
        "pageNumber": 1,
        "extractedText": "OCR extracted text here...",
        "confidence": 0.95,
        "documentTitle": "document.pdf"
      }
    }
  ],
  
  "rag_visual_index_document": [
    ["doc_1729512345000", ["pdf_page_1_1729512345678", "pdf_page_2_1729512345679"]]
  ],
  
  "rag_visual_index_type": [
    ["image", ["pdf_page_1_1729512345678", "pdf_page_2_1729512345679"]],
    ["chart", ["chart_1_1729512345680"]],
    ["table", ["table_1_1729512345681"]]
  ]
}
```

---

### **Phase 3: Chunking (Text Only)**

**File: src/rag/utils/document-processing.ts:198-280**

```typescript
// Chunks are created SEPARATELY from visuals
const chunks: DocumentChunk[] = useSemanticChunking 
  ? await semanticChunkingService.generateSemanticChunks(content, documentId)
  : tokenAwareChunking(content, documentId)

// DocumentChunk structure (NO visual data):
{
  id: string
  documentId: string
  content: string           // ← TEXT ONLY
  embedding?: number[]
  startIndex: number
  endIndex: number
  metadata: {
    page?: number
    section?: string
    importance?: number
    chunkIndex?: number
    tokenCount?: number
  }
}
```

**Key Point:** Chunks do **NOT** contain:
- ❌ Visual objects
- ❌ Base64 images
- ❌ Visual IDs
- ✅ Only text content and metadata

---

### **Phase 4: Document Storage**

**File: src/rag/services/document-upload.ts:259-267**

```typescript
private storeDocument(document: Document): void {
  const existingDocs = this.getStoredDocuments()
  const updatedDocs = [...existingDocs, document]
  localStorage.setItem('rag_documents', JSON.stringify(updatedDocs))
}
```

**Document Structure:**
```typescript
interface Document {
  id: string
  name: string
  type: DocumentType
  content: string          // Full text
  chunks: DocumentChunk[]  // Text chunks only
  visualContent?: VisualContent[]  // ← VISUAL REFERENCES (separate)
  metadata: DocumentMetadata
  embedding?: number[]
  // ... other fields
}
```

**Storage Keys:**
- Documents: `rag_documents`
- Visuals: `rag_visual_content`
- Visual indexes: `rag_visual_index_document`, `rag_visual_index_type`

---

## 🔍 How Search Works with Visuals

### **Search Flow:**

```typescript
// 1. User searches for text
searchContext.search(query)
  ↓
// 2. Search chunks (text-based)
vectorDB.similaritySearch(queryEmbedding, topK=10)
  ↓
// 3. Get matching chunks with documentIds
chunks: [
  { documentId: "doc_123", content: "...", score: 0.95 },
  { documentId: "doc_456", content: "...", score: 0.89 }
]
  ↓
// 4. Load visuals for those documents
const doc123Visuals = await getVisualContentByDocument("doc_123")
const doc456Visuals = await getVisualContentByDocument("doc_456")
  ↓
// 5. Display results with visuals
- Show chunk text
- Show associated visual thumbnails
- Allow viewing full visuals on click
```

**File: src/rag/utils/visual-content-storage.ts:130-133**
```typescript
export async function getVisualContentByDocument(documentId: string): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => visual.documentId === documentId);
}
```

---

## 📦 Storage Breakdown

### **localStorage Keys:**

| Key | Content | Size Limit |
|-----|---------|------------|
| `rag_documents` | Full documents with metadata | 5-10MB total |
| `rag_visual_content` | Visual objects (thumbnails only) | Optimized < 50KB per item |
| `rag_visual_index_document` | documentId → visualIds mapping | Small |
| `rag_visual_index_type` | type → visualIds mapping | Small |
| `rag_original_files` | File metadata only | Small |

### **IndexedDB (Fallback):**

| Store | Content |
|-------|---------|
| `files` | Large file base64 content |
| `metadata` | File metadata (if localStorage full) |
| Future: `visual_content_large` | Large screenshots if needed |

---

## 🔧 Current Implementation Status

### ✅ **Working:**
1. **OCR Extraction**: PDF pages → canvas → PNG screenshots
2. **Visual Storage**: localStorage with thumbnail preservation (< 50KB)
3. **Visual Retrieval**: By document ID, type, or search query
4. **Indexing**: Fast lookup by document and type
5. **Thumbnail Generation**: Scaled-down versions for display

### ⚠️ **Fixed Recently:**
1. **Thumbnail Preservation**: Was deleting ALL thumbnails, now keeps < 50KB
2. **Storage Optimization**: Removes large base64 data, preserves small thumbnails

### 🚧 **Current Issue (In Progress):**
1. **File Storage Quota**: localStorage full when uploading large PDFs
   - **Fix**: Using IndexedDB as primary storage for files
   - **Status**: Implementing `cleanupLocalStorageForMetadata()` function

---

## 💡 Architecture Decision Summary

### **Why Separate Chunks from Visuals?**

1. **Embedding Efficiency**: 
   - Text embeddings are 768-dimensional vectors (nomic-embed-text)
   - Images cannot be embedded with text models
   - Separating allows optimal text-based semantic search

2. **Storage Optimization**:
   - Chunks are small (400 tokens avg = ~2KB text)
   - Visuals are large (base64 PNG = 100KB-500KB)
   - Keeping them separate prevents localStorage overflow

3. **Retrieval Speed**:
   - Search chunks first (fast vector similarity)
   - Load visuals only when needed (lazy loading)
   - Better performance for text-heavy searches

4. **Flexibility**:
   - Can associate multiple visuals with one chunk
   - Can search visuals independently
   - Can update visuals without re-chunking

### **Visual-to-Chunk Association:**
- **Implicit**: Both share `documentId`
- **Metadata**: Visuals have `pageNumber`, chunks have `metadata.page`
- **Query Time**: When chunk matches, load all visuals for that document
- **Display**: Show visuals alongside relevant chunks

---

## 🎬 Example: Complete Upload Flow

```typescript
// User uploads "report.pdf" (10 pages, 5MB)

1. OCR Extraction:
   - Page 1: Canvas render → PNG blob → base64 (450KB)
   - Page 2: Canvas render → PNG blob → base64 (420KB)
   - ... (10 pages total)
   - Result: 10 VisualContent objects with screenshots

2. Visual Storage:
   - Optimize: Keep thumbnails < 50KB, remove large base64
   - Store in localStorage['rag_visual_content']
   - Create indexes: doc_123 → [visual_1, visual_2, ...]

3. Text Processing:
   - Extract text from PDF (or use OCR text if needed)
   - Semantic chunking → 25 chunks (400 tokens avg)
   - Store chunks in Document object

4. Document Storage:
   - Document with chunks and visual references
   - Store in localStorage['rag_documents']

5. Search Ready:
   - Text chunks have embeddings for similarity search
   - Visuals linked by documentId for display
```

---

## 📋 File Reference Guide

| File | Purpose | Key Functions |
|------|---------|---------------|
| `ocr-extraction.ts` | OCR & screenshot creation | `renderPDFPageToImage()`, `processPDFFile()` |
| `visual-content-storage.ts` | Visual storage & retrieval | `storeVisualContent()`, `getVisualContentByDocument()` |
| `document-processing.ts` | Document parsing & chunking | `extractVisualContent()`, `processDocument()` |
| `document-upload.ts` | Upload orchestration | `uploadDocument()`, `storeDocument()` |
| `visual-content-library.tsx` | UI component for display | Renders thumbnails and full visuals |

---

## 🚀 Next Steps: Fixing Storage Issues

Now implementing the file storage fix to use IndexedDB as primary storage:

```typescript
// New flow:
1. Always store file content in IndexedDB
2. Store only lightweight metadata in localStorage
3. Cleanup localStorage proactively before storing metadata
4. Fallback to IndexedDB for metadata if localStorage still full
```

This will resolve the quota exceeded error you encountered when uploading large PDFs.
