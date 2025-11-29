# RAG (Retrieval-Augmented Generation) Module

This module provides a comprehensive document management and search system for implementing RAG functionality in the Miele Dashboard application.

## Architecture

The RAG module is designed with separation of concerns and modularity:

```
src/rag/
├── components/           # UI components
│   ├── rag-view.tsx     # Main RAG interface with tabs
│   ├── document-manager.tsx  # Document library management
│   ├── search-interface.tsx  # Search and retrieval interface
│   ├── upload-progress.tsx   # File upload and processing
│   └── processing-stats.tsx  # Analytics and statistics
├── contexts/            # State management
│   └── RAGContext.tsx   # Global RAG state and actions
├── types/              # TypeScript definitions
│   └── index.ts        # Document, chunk, and search types
├── hooks/              # Custom React hooks (future use)
├── utils/              # Utility functions (future use)
└── README.md           # This file
```

## Features

### 🗂️ Document Management
- **Multi-format Support**: PDF, TXT, DOCX, Markdown, JSON, CSV, XLSX, HTML, XML
- **Bulk Operations**: Select multiple documents for batch actions
- **Status Tracking**: Real-time processing status (uploading, processing, chunking, embedding, ready, error)
- **Metadata Extraction**: Automatic extraction of document metadata
- **List/Grid Views**: Flexible viewing options with sorting and filtering

### 🔍 Advanced Search
- **Semantic Search**: Vector-based similarity search across document chunks
- **Filter Options**: Filter by document type, similarity threshold, date range
- **Search History**: Quick access to recent searches
- **Highlighted Results**: Query terms highlighted in search results
- **Context Preservation**: Shows relevant surrounding text for search hits

### 📊 Upload & Processing
- **Drag & Drop Interface**: Intuitive file upload experience
- **Progress Tracking**: Real-time upload and processing progress
- **Chunk Visualization**: See how documents are broken into searchable chunks
- **Error Handling**: Comprehensive error reporting and recovery
- **File Validation**: Type and size validation with user feedback

### 📈 Analytics & Statistics
- **Processing Metrics**: Total documents, chunks, storage usage
- **Status Distribution**: Visual charts showing document processing states
- **Type Analysis**: Breakdown of document types in your library
- **Timeline Tracking**: Processing activity over time
- **Performance Metrics**: Processing rates and system health

## Component Details

### RAGView
Main container component that:
- Manages tab navigation between different RAG functions
- Provides the RAG context to all child components
- Maintains consistent styling with the main application

### DocumentManager
Comprehensive document library featuring:
- Grid and list view modes
- Bulk selection and operations
- Document status indicators
- Search and filtering capabilities
- Context menus for individual document actions

### SearchInterface
Advanced search functionality including:
- Real-time search with debouncing
- Configurable filters and options
- Search history management
- Result highlighting and context
- Export and sharing capabilities

### UploadProgress
File upload and processing interface:
- Multi-file drag & drop support
- Real-time progress tracking
- Processing stage visualization
- Error reporting and retry options
- File type validation

### ProcessingStats
Analytics dashboard providing:
- System overview metrics
- Interactive charts and graphs
- Processing timeline analysis
- Storage and performance insights
- Recent activity logs

## State Management

The RAG module uses React Context for centralized state management:

### RAGContext
- **Documents**: Array of uploaded and processed documents
- **Upload Progress**: Real-time tracking of file uploads
- **Processing Stats**: Aggregated metrics and analytics
- **Search Results**: Current search results and history
- **Selection State**: Multi-select functionality for bulk operations

### Actions
- `uploadDocument(file)`: Process new document uploads
- `deleteDocument(id)`: Remove documents from the system
- `searchDocuments(query)`: Perform semantic search
- `toggleDocumentSelection(id)`: Manage bulk selections
- `refreshDocuments()`: Sync with backend state

## Integration

The RAG module is designed to integrate seamlessly with existing chatbot functionality:

1. **Independent Operation**: RAG works as a standalone module without affecting chat features
2. **Shared Styling**: Uses the same Tailwind CSS classes and design patterns
3. **Context Isolation**: RAG state is separate from chat state
4. **API Ready**: Designed for easy integration with backend RAG services

## Usage Example

```tsx
import { RAGView } from '@/rag/components/rag-view'

// In your main application
function App() {
  return (
    <div className="app">
      {/* Other components */}
      <RAGView />
    </div>
  )
}
```

## Future Enhancements

### Planned Features
- **Vector Database Integration**: Connect to Pinecone, Weaviate, or Chroma
- **Advanced Chunking**: Smart chunking based on document structure
- **Embedding Models**: Support for different embedding providers
- **RAG Chat Integration**: Direct integration with the existing chat system
- **Collaborative Features**: Document sharing and team workspaces
- **API Endpoints**: RESTful API for programmatic access

### Hooks (Future)
- `useDocumentSearch()`: Advanced search functionality
- `useDocumentUpload()`: Upload management with retry logic
- `useRAGIntegration()`: Integration with chat system

### Utils (Future)
- Document parsing utilities
- Embedding generation helpers
- Vector similarity calculations
- Chunk optimization algorithms

## Styling & Theming

The RAG module follows the existing application design system:
- **Dark/Light Mode**: Full support for theme switching
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessible**: ARIA labels and keyboard navigation
- **Consistent Icons**: Uses Lucide React for all icons

## Development Notes

### Best Practices
1. **Modular Components**: Each component has a single responsibility
2. **Type Safety**: Comprehensive TypeScript types for all data structures
3. **Error Boundaries**: Graceful error handling throughout
4. **Performance**: Optimized with React.memo and useCallback where appropriate
5. **Testing Ready**: Components designed for easy unit testing

### Dependencies
- React 18+ with hooks
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization

This RAG module provides a solid foundation for document-based AI applications while maintaining the quality and consistency of the existing Miele Dashboard.
