# Visual Content Storage & Integration System

## Overview
This document explains where and how visual content (charts, tables, graphs, diagrams) is stored after extraction from uploaded documents and how it's integrated into the visual content rendering system.

## Storage Architecture

### 1. Document Processing Pipeline
When documents are uploaded and processed through the RAG system:

```
Document Upload → Content Extraction → Visual Element Detection → Storage → Indexing
```

### 2. Storage Locations

#### Browser Storage (Current Implementation)
- **Location**: `localStorage` and `indexedDB`
- **Key Structure**: 
  - `rag_documents`: Metadata and text content
  - `rag_visual_content`: Extracted visual elements
  - `rag_processed_chunks`: Text chunks with visual references

#### Visual Content Storage Schema
```typescript
interface VisualContent {
  id: string;
  documentId: string;
  type: 'chart' | 'table' | 'graph' | 'diagram' | 'image';
  title?: string;
  data: {
    // For charts/graphs
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    dataPoints?: Array<{x: any, y: any}>;
    
    // For tables
    headers?: string[];
    rows?: string[][];
    
    // For images/diagrams
    base64?: string;
    url?: string;
  };
  metadata: {
    pageNumber?: number;
    boundingBox?: {x: number, y: number, width: number, height: number};
    extractedAt: string;
    confidence: number;
  };
}
```

### 3. File System Structure (Future Implementation)
```
/data/
├── documents/
│   ├── {docId}/
│   │   ├── content.json
│   │   ├── visuals/
│   │   │   ├── charts/
│   │   │   ├── tables/
│   │   │   ├── graphs/
│   │   │   └── images/
│   │   └── metadata.json
└── indexes/
    ├── visual_index.json
    └── content_index.json
```

## Visual Content Extraction Process

### 1. Document Analysis (`src/rag/utils/document-processing.ts`)
```typescript
export async function extractVisualContent(file: File): Promise<VisualContent[]> {
  const visuals: VisualContent[] = [];
  
  // For PDFs: Use PDF.js to extract images and detect tables
  if (file.type === 'application/pdf') {
    visuals.push(...await extractPDFVisuals(file));
  }
  
  // For Excel: Extract charts and tables
  if (file.type.includes('spreadsheet')) {
    visuals.push(...await extractSpreadsheetVisuals(file));
  }
  
  // For Word: Extract embedded images and tables
  if (file.type.includes('document')) {
    visuals.push(...await extractDocumentVisuals(file));
  }
  
  return visuals;
}
```

### 2. Storage Integration (`src/rag/utils/storage.ts`)
```typescript
export async function storeVisualContent(visuals: VisualContent[]): Promise<void> {
  const existing = await getStoredVisualContent();
  const updated = [...existing, ...visuals];
  
  localStorage.setItem('rag_visual_content', JSON.stringify(updated));
  
  // Also index by document and type for quick retrieval
  await indexVisualContent(visuals);
}

export async function getVisualContentByDocument(documentId: string): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => visual.documentId === documentId);
}

export async function getVisualContentByType(type: VisualContent['type']): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  return allVisuals.filter(visual => visual.type === type);
}
```

## Integration with Visual Content Renderer

### 1. Bot Message Renderer Enhancement
The `bot-message-renderer.tsx` component should be enhanced to utilize stored visual content:

```typescript
// Enhanced visual content rendering
const renderVisualContent = (content: string) => {
  // 1. Parse content for visual references
  const visualRefs = extractVisualReferences(content);
  
  // 2. Fetch stored visuals
  const storedVisuals = getVisualContentByIds(visualRefs);
  
  // 3. Render with actual data
  return storedVisuals.map(visual => (
    <VisualContentComponent key={visual.id} visual={visual} />
  ));
};
```

### 2. Visual Content Component System
```typescript
// components/visual-content/
├── ChartRenderer.tsx     // For chart visualization
├── TableRenderer.tsx     // For table display
├── GraphRenderer.tsx     // For graph visualization
├── ImageRenderer.tsx     // For image display
└── VisualContentHub.tsx  // Main coordinator
```

### 3. Search Integration
Visual content is indexed and searchable through the RAG system:

```typescript
// Search includes visual content metadata
export async function searchVisualContent(query: string): Promise<VisualContent[]> {
  const allVisuals = await getStoredVisualContent();
  
  return allVisuals.filter(visual => 
    visual.title?.toLowerCase().includes(query.toLowerCase()) ||
    visual.metadata.documentTitle?.toLowerCase().includes(query.toLowerCase())
  );
}
```

## Usage in Visual Content Submenus

### 1. Charts & Graphs Submenu
- **Data Source**: Stored visual content with `type: 'chart'` or `type: 'graph'`
- **Rendering**: Dynamic chart recreation using the stored data points
- **Features**: Interactive charts, zoom, export capabilities

### 2. Tables Submenu
- **Data Source**: Stored visual content with `type: 'table'`
- **Rendering**: Sortable, filterable table components
- **Features**: Search within tables, export to CSV/Excel

### 3. Images & Diagrams Submenu
- **Data Source**: Stored visual content with `type: 'image'` or `type: 'diagram'`
- **Rendering**: Image gallery with zoom and annotation capabilities
- **Features**: OCR text overlay, metadata display

## Data Flow Example

1. **Document Upload**: User uploads a PDF with financial charts
2. **Processing**: System extracts chart data and stores it
3. **Storage**: Visual content saved in `localStorage['rag_visual_content']`
4. **Indexing**: Charts indexed by type, document, and keywords
5. **Query**: User asks "Show me the revenue chart from Q3 report"
6. **Retrieval**: System finds matching visual content
7. **Rendering**: Chart component recreates the visualization with stored data

## Technical Implementation Status

### Currently Implemented ✅
- Basic visual content detection in chat responses
- Storage utilities for document content
- Visual content renderer component structure

### Needs Implementation 📋
- Visual content extraction during document processing
- Enhanced storage schema for visual elements
- Integration with visual content submenus
- Search functionality for visual content
- Export/download capabilities for visual elements

## Future Enhancements

1. **AI-Enhanced Visual Understanding**
   - Automatic chart data extraction
   - Intelligent visual content categorization
   - Smart visual content recommendations

2. **Advanced Rendering**
   - Interactive visualizations
   - Real-time data updates
   - Custom visualization creation

3. **Collaboration Features**
   - Visual content sharing
   - Annotation and comments
   - Version tracking for visual elements
