# DocumentManagementContext Refactoring Plan

## Step 1: Extract Type Definitions (0 risk)
**File:** `src/rag/contexts/document-management/documentTypes.ts`

**Purpose:** Centralize all TypeScript interfaces and types
**Risk Level:** ✅ ZERO - Only moving type definitions
**Dependencies:** None

```typescript
// All interfaces and types moved here
export interface DocumentState {
  documents: Document[]
  selectedDocuments: string[]
  isLoading: boolean
  error: string | null
}

export type DocumentAction = 
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<Document> } }
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  // ... other actions

export interface DocumentOperations {
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  // ... other operations
}
```

## Step 2: Extract Reducer Logic (Low risk)
**File:** `src/rag/contexts/document-management/reducer/documentReducer.ts`

**Purpose:** Pure state management without side effects
**Risk Level:** 🟡 LOW - Pure functions, easy to test
**Dependencies:** documentTypes.ts

```typescript
import { DocumentState, DocumentAction } from '../documentTypes'

export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] }
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id 
            ? { ...doc, ...action.payload.updates }
            : doc
        )
      }
    // ... other cases
    default:
      return state
  }
}
```

## Step 3: Extract Service Layer (Medium risk)
**File:** `src/rag/contexts/document-management/services/DocumentService.ts`

**Purpose:** Business logic and storage operations
**Risk Level:** 🟠 MEDIUM - Handles async operations and side effects
**Dependencies:** documentTypes.ts, enhanced-storage-manager.ts

```typescript
import { Document } from '../../types'
import { storageManager } from '../../utils/enhanced-storage-manager'
import { enhanceDocumentsWithAI } from '../../utils/ai-analysis-generator'

export class DocumentService {
  async loadDocuments(): Promise<Document[]> {
    try {
      await storageManager.initialize()
      const documents = await storageManager.loadDocuments()
      return enhanceDocumentsWithAI(documents)
    } catch (error) {
      console.error('Failed to load documents:', error)
      throw new Error('Failed to load documents from storage')
    }
  }

  async saveDocument(document: Document): Promise<void> {
    // Implementation with error handling
  }

  async deleteDocument(id: string): Promise<void> {
    // Implementation with cascade cleanup
  }
}
```

## Step 4: Create Custom Hooks (Low risk)
**File:** `src/rag/contexts/document-management/hooks/useDocumentOperations.ts`

**Purpose:** Reusable document operation hooks
**Risk Level:** 🟡 LOW - Wraps existing functionality
**Dependencies:** DocumentService.ts

```typescript
import { useCallback } from 'react'
import { DocumentService } from '../services/DocumentService'

export function useDocumentOperations(service: DocumentService, dispatch: Dispatch<DocumentAction>) {
  const addDocument = useCallback((document: Document) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: document })
  }, [dispatch])

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      await service.updateDocument(id, updates)
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, updates } })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [service, dispatch])

  return { addDocument, updateDocument }
}
```

## Step 5: Refactor Main Context (Low risk)
**File:** `src/rag/contexts/document-management/DocumentManagementContext.tsx`

**Purpose:** Clean context definition
**Risk Level:** 🟡 LOW - Only context creation
**Dependencies:** documentTypes.ts

```typescript
import React, { createContext, useContext } from 'react'
import { DocumentState, DocumentOperations } from './documentTypes'

interface DocumentManagementContextType extends DocumentState, DocumentOperations {}

export const DocumentManagementContext = createContext<DocumentManagementContextType | null>(null)

export function useDocumentManagement() {
  const context = useContext(DocumentManagementContext)
  if (!context) {
    throw new Error('useDocumentManagement must be used within DocumentManagementProvider')
  }
  return context
}
```

## Step 6: Create Provider Component (Medium risk)
**File:** `src/rag/contexts/document-management/DocumentManagementProvider.tsx`

**Purpose:** State management and service integration
**Risk Level:** 🟠 MEDIUM - Combines all pieces
**Dependencies:** All previous files

```typescript
import React, { useReducer, useEffect, useMemo } from 'react'
import { DocumentManagementContext } from './DocumentManagementContext'
import { documentReducer } from './reducer/documentReducer'
import { DocumentService } from './services/DocumentService'
import { useDocumentOperations } from './hooks/useDocumentOperations'

export function DocumentManagementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(documentReducer, initialState)
  const documentService = useMemo(() => new DocumentService(), [])
  const operations = useDocumentOperations(documentService, dispatch)

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        const documents = await documentService.loadDocuments()
        dispatch({ type: 'SET_DOCUMENTS', payload: documents })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    loadDocuments()
  }, [documentService])

  const value = {
    ...state,
    ...operations
  }

  return (
    <DocumentManagementContext.Provider value={value}>
      {children}
    </DocumentManagementContext.Provider>
  )
}
```

## Step 7: Create Public API (Zero risk)
**File:** `src/rag/contexts/document-management/index.ts`

**Purpose:** Clean public exports
**Risk Level:** ✅ ZERO - Only exports
**Dependencies:** All modules

```typescript
// Public API - only export what's needed
export { DocumentManagementProvider } from './DocumentManagementProvider'
export { useDocumentManagement } from './DocumentManagementContext'
export type { DocumentState, DocumentOperations } from './documentTypes'

// Re-export specific hooks for advanced usage
export { useDocumentOperations } from './hooks/useDocumentOperations'
export { useDocumentSelection } from './hooks/useDocumentSelection'
```

## Step 8: Update Imports (Low risk)
**Files:** All files that import from DocumentManagementContext.tsx

**Purpose:** Update import statements
**Risk Level:** 🟡 LOW - Simple import changes
**Dependencies:** New index.ts

```typescript
// Before
import { useDocumentManagement } from '../contexts/DocumentManagementContext'

// After  
import { useDocumentManagement } from '../contexts/document-management'
```

## Validation & Testing Strategy

### Phase A: Isolated Testing
1. **Unit test each service** independently
2. **Test reducers** with various action combinations
3. **Test hooks** with mock services
4. **Validate TypeScript** compilation

### Phase B: Integration Testing
1. **Test Provider** with all services
2. **Test context** value propagation
3. **Test error handling** scenarios
4. **Performance testing** with large datasets

### Phase C: Regression Testing
1. **Test existing features** still work
2. **Test document CRUD** operations
3. **Test storage persistence** 
4. **Test AI analysis** integration

## Migration Strategy

### Week 1: Foundation
- Create new folder structure
- Extract types and interfaces
- Extract reducer logic
- Unit test all pure functions

### Week 2: Services
- Extract service layer
- Create custom hooks
- Integration testing
- Performance validation

### Week 3: Integration
- Create new context and provider
- Update all import statements
- End-to-end testing
- Remove old files

## Risk Mitigation

### Backup Strategy
- **Git branching**: Create feature branch before changes
- **File backups**: Keep original files until testing complete
- **Rollback plan**: Document exact steps to revert

### Testing Checklist
- [ ] All existing tests pass
- [ ] New unit tests for extracted modules
- [ ] Integration tests for service layer
- [ ] Performance benchmarks maintained
- [ ] TypeScript compilation successful
- [ ] No runtime errors in development
- [ ] No runtime errors in production build

### Success Metrics
- **Code maintainability**: Reduced cyclomatic complexity
- **Test coverage**: 90%+ coverage on new modules
- **Performance**: No regression in load times
- **Developer experience**: Easier to add new features
- **Bug reduction**: Fewer state-related bugs
