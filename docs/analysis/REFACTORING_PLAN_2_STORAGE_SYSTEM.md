# Storage System Refactoring Plan

## Step 1: Create Storage Adapter Layer (Low risk)
**Folder:** `src/rag/storage/adapters/`

**Purpose:** Abstract different storage backends
**Risk Level:** 🟡 LOW - Interface implementations
**Dependencies:** None

```typescript
// src/rag/storage/adapters/StorageAdapter.ts
export interface StorageAdapter<T> {
  initialize(): Promise<void>
  get(key: string): Promise<T | null>
  set(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  size(): Promise<number>
}

// src/rag/storage/adapters/IndexedDBAdapter.ts
export class IndexedDBAdapter<T> implements StorageAdapter<T> {
  constructor(
    private dbName: string,
    private storeName: string,
    private version: number = 1
  ) {}

  async initialize(): Promise<void> {
    // IndexedDB initialization with proper error handling
  }

  async get(key: string): Promise<T | null> {
    // Type-safe IndexedDB operations
  }
  
  // ... other methods
}

// src/rag/storage/adapters/LocalStorageAdapter.ts
export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  constructor(private prefix: string) {}
  
  async get(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(`${this.prefix}:${key}`)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }
  
  // ... other methods
}
```

## Step 2: Create Repository Layer (Medium risk)
**Folder:** `src/rag/storage/repositories/`

**Purpose:** Domain-specific storage operations
**Risk Level:** 🟠 MEDIUM - Business logic integration
**Dependencies:** StorageAdapter interfaces

```typescript
// src/rag/storage/repositories/DocumentRepository.ts
import { Document } from '../../types'
import { StorageAdapter } from '../adapters/StorageAdapter'

export class DocumentRepository {
  constructor(private adapter: StorageAdapter<Document>) {}

  async findAll(): Promise<Document[]> {
    const keys = await this.adapter.keys()
    const documents = await Promise.all(
      keys.map(key => this.adapter.get(key))
    )
    return documents.filter(Boolean) as Document[]
  }

  async findById(id: string): Promise<Document | null> {
    return this.adapter.get(id)
  }

  async save(document: Document): Promise<void> {
    await this.adapter.set(document.id, document)
  }

  async delete(id: string): Promise<void> {
    await this.adapter.delete(id)
  }

  async saveMany(documents: Document[]): Promise<void> {
    await Promise.all(
      documents.map(doc => this.adapter.set(doc.id, doc))
    )
  }
}

// src/rag/storage/repositories/VectorRepository.ts
export class VectorRepository {
  constructor(private adapter: StorageAdapter<VectorData>) {}

  async storeVectors(documentId: string, vectors: VectorData[]): Promise<void> {
    // Batch vector storage with optimization
  }

  async searchSimilar(queryVector: number[], limit: number): Promise<SearchResult[]> {
    // Efficient similarity search
  }

  async deleteByDocument(documentId: string): Promise<void> {
    // Cascade deletion
  }
}
```

## Step 3: Create Storage Service Layer (High risk)
**Folder:** `src/rag/storage/services/`

**Purpose:** Orchestrate storage operations with transactions
**Risk Level:** 🔴 HIGH - Complex business logic and error handling
**Dependencies:** Repository layer

```typescript
// src/rag/storage/services/StorageService.ts
import { DocumentRepository } from '../repositories/DocumentRepository'
import { VectorRepository } from '../repositories/VectorRepository'
import { StorageTransaction } from '../transactions/StorageTransaction'

export class StorageService {
  constructor(
    private documentRepo: DocumentRepository,
    private vectorRepo: VectorRepository,
    private transactionManager: StorageTransaction
  ) {}

  async saveDocumentWithVectors(document: Document): Promise<void> {
    await this.transactionManager.execute(async (tx) => {
      // Save document
      await tx.add(() => this.documentRepo.save(document))
      
      // Save vectors if available
      if (document.chunks?.some(chunk => chunk.embedding)) {
        await tx.add(() => this.vectorRepo.storeVectors(
          document.id, 
          document.chunks.filter(chunk => chunk.embedding)
        ))
      }
    })
  }

  async deleteDocumentCascade(documentId: string): Promise<void> {
    await this.transactionManager.execute(async (tx) => {
      await tx.add(() => this.vectorRepo.deleteByDocument(documentId))
      await tx.add(() => this.documentRepo.delete(documentId))
    })
  }

  async loadAllDocuments(): Promise<Document[]> {
    return this.documentRepo.findAll()
  }
}
```

## Step 4: Create Transaction Manager (High risk)
**Folder:** `src/rag/storage/transactions/`

**Purpose:** Ensure ACID properties for storage operations
**Risk Level:** 🔴 HIGH - Critical for data consistency
**Dependencies:** Adapter layer

```typescript
// src/rag/storage/transactions/StorageTransaction.ts
export class StorageTransaction {
  private operations: Array<() => Promise<void>> = []
  private rollbacks: Array<() => Promise<void>> = []

  async execute<T>(transactionFn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const context = new TransactionContext(this)
    
    try {
      const result = await transactionFn(context)
      
      // Execute all operations
      for (const operation of this.operations) {
        await operation()
      }
      
      return result
    } catch (error) {
      // Rollback all operations
      for (const rollback of this.rollbacks.reverse()) {
        try {
          await rollback()
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError)
        }
      }
      throw error
    } finally {
      this.operations = []
      this.rollbacks = []
    }
  }
}

class TransactionContext {
  constructor(private transaction: StorageTransaction) {}

  async add(operation: () => Promise<void>, rollback?: () => Promise<void>): Promise<void> {
    this.transaction.operations.push(operation)
    if (rollback) {
      this.transaction.rollbacks.push(rollback)
    }
  }
}
```

## Step 5: Create Storage Factory (Medium risk)
**Folder:** `src/rag/storage/factory/`

**Purpose:** Configure and create storage instances
**Risk Level:** 🟠 MEDIUM - Configuration and dependency injection
**Dependencies:** All storage components

```typescript
// src/rag/storage/factory/StorageFactory.ts
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter'
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter'
import { DocumentRepository } from '../repositories/DocumentRepository'
import { VectorRepository } from '../repositories/VectorRepository'
import { StorageService } from '../services/StorageService'
import { StorageTransaction } from '../transactions/StorageTransaction'

export class StorageFactory {
  static async createDocumentStorage(): Promise<StorageService> {
    // Try IndexedDB first, fallback to localStorage
    let documentAdapter
    let vectorAdapter
    
    try {
      documentAdapter = new IndexedDBAdapter<Document>('rag-documents', 'documents')
      await documentAdapter.initialize()
      
      vectorAdapter = new IndexedDBAdapter<VectorData>('rag-vectors', 'vectors')
      await vectorAdapter.initialize()
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error)
      
      documentAdapter = new LocalStorageAdapter<Document>('rag-docs')
      vectorAdapter = new LocalStorageAdapter<VectorData>('rag-vectors')
    }

    const documentRepo = new DocumentRepository(documentAdapter)
    const vectorRepo = new VectorRepository(vectorAdapter)
    const transactionManager = new StorageTransaction()

    return new StorageService(documentRepo, vectorRepo, transactionManager)
  }
}
```

## Step 6: Create Health Monitor (Low risk)
**Folder:** `src/rag/storage/monitoring/`

**Purpose:** Monitor storage health and performance
**Risk Level:** 🟡 LOW - Monitoring and diagnostics
**Dependencies:** Storage services

```typescript
// src/rag/storage/monitoring/StorageHealthMonitor.ts
export class StorageHealthMonitor {
  constructor(private storageService: StorageService) {}

  async performHealthCheck(): Promise<HealthReport> {
    const report: HealthReport = {
      healthy: true,
      issues: [],
      metrics: {
        documentCount: 0,
        vectorCount: 0,
        storageSize: 0,
        lastSync: null
      },
      recommendations: []
    }

    try {
      // Check document count
      const documents = await this.storageService.loadAllDocuments()
      report.metrics.documentCount = documents.length

      // Check vector consistency
      const vectorStats = await this.checkVectorConsistency(documents)
      report.metrics.vectorCount = vectorStats.vectorCount

      // Check storage quota
      const storageInfo = await this.checkStorageQuota()
      report.metrics.storageSize = storageInfo.used

      // Validate data integrity
      const integrityIssues = await this.validateDataIntegrity(documents)
      report.issues.push(...integrityIssues)

      report.healthy = report.issues.length === 0

    } catch (error) {
      report.healthy = false
      report.issues.push(`Health check failed: ${error.message}`)
    }

    return report
  }

  private async checkVectorConsistency(documents: Document[]): Promise<VectorStats> {
    // Implementation
  }

  private async checkStorageQuota(): Promise<StorageQuotaInfo> {
    // Implementation
  }

  private async validateDataIntegrity(documents: Document[]): Promise<string[]> {
    // Implementation
  }
}
```

## Step 7: Migration Strategy (High risk)
**Purpose:** Safely migrate from old storage to new architecture
**Risk Level:** 🔴 HIGH - Data migration with zero loss
**Dependencies:** Both old and new storage systems

```typescript
// src/rag/storage/migration/StorageMigrator.ts
export class StorageMigrator {
  async migrateFromLegacyStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      documentsTransferred: 0,
      vectorsTransferred: 0,
      errors: []
    }

    try {
      // Step 1: Create backup
      await this.createBackup()

      // Step 2: Load legacy data
      const legacyDocuments = await this.loadLegacyDocuments()
      const legacyVectors = await this.loadLegacyVectors()

      // Step 3: Validate data integrity
      const validationErrors = await this.validateLegacyData(legacyDocuments, legacyVectors)
      if (validationErrors.length > 0) {
        result.errors = validationErrors
        return result
      }

      // Step 4: Transfer to new storage
      const storageService = await StorageFactory.createDocumentStorage()
      
      for (const document of legacyDocuments) {
        await storageService.saveDocumentWithVectors(document)
        result.documentsTransferred++
      }

      // Step 5: Verify migration
      const verificationResult = await this.verifyMigration(legacyDocuments)
      if (!verificationResult.success) {
        throw new Error('Migration verification failed')
      }

      // Step 6: Clean up legacy storage (optional)
      // await this.cleanupLegacyStorage()

      result.success = true

    } catch (error) {
      result.errors.push(`Migration failed: ${error.message}`)
      await this.restoreFromBackup()
    }

    return result
  }
}
```

## Implementation Order & Risk Management

### Phase 1: Foundation (Week 1) - Low Risk
1. Create adapter interfaces ✅ ZERO RISK
2. Implement IndexedDB adapter 🟡 LOW RISK
3. Implement localStorage adapter ✅ ZERO RISK
4. Unit test all adapters 🟡 LOW RISK

### Phase 2: Repository Layer (Week 2) - Medium Risk  
1. Create document repository 🟠 MEDIUM RISK
2. Create vector repository 🟠 MEDIUM RISK
3. Integration testing 🟠 MEDIUM RISK
4. Performance benchmarking 🟡 LOW RISK

### Phase 3: Service Layer (Week 3) - High Risk
1. Create storage service 🔴 HIGH RISK
2. Implement transaction manager 🔴 HIGH RISK
3. Create storage factory 🟠 MEDIUM RISK
4. End-to-end testing 🔴 HIGH RISK

### Phase 4: Migration (Week 4) - Critical Risk
1. Create migration tools 🔴 HIGH RISK
2. Test migration with backup data 🔴 HIGH RISK
3. Gradual rollout with rollback plan 🔴 HIGH RISK
4. Monitor production migration 🔴 HIGH RISK

## Testing Strategy

### Unit Testing
- **Adapter layer**: Mock IndexedDB/localStorage operations
- **Repository layer**: Mock adapters with predictable data
- **Service layer**: Mock repositories with controlled responses
- **Transaction manager**: Test rollback scenarios

### Integration Testing
- **Cross-adapter compatibility**: Same operations on different backends
- **Transaction integrity**: Verify ACID properties
- **Error handling**: Network failures, quota exceeded, corruption
- **Performance**: Large datasets, concurrent operations

### End-to-End Testing
- **Full workflow**: Document upload → processing → storage → retrieval
- **Error scenarios**: Browser crashes, storage quota, network issues
- **Migration testing**: Legacy → new system with data validation
- **Production simulation**: Real-world load and usage patterns

## Rollback Strategy

### Immediate Rollback (< 5 minutes)
1. **Feature flag**: Toggle back to legacy storage
2. **Code rollback**: Git revert to previous working state
3. **Data validation**: Verify no data corruption occurred

### Data Recovery (< 30 minutes)
1. **Backup restoration**: Restore from automatic backups
2. **Manual data export**: Export data from new system
3. **Legacy system restore**: Import back to legacy storage

### Long-term Recovery (< 2 hours)
1. **Database repair**: Fix any corrupted IndexedDB
2. **Data reconciliation**: Merge data from multiple sources
3. **System validation**: Full testing before re-enabling

## Success Metrics

### Performance Improvements
- **Load time**: 50% faster document loading
- **Memory usage**: 30% reduction in memory footprint
- **Storage efficiency**: 25% better compression
- **Error rate**: 90% reduction in storage-related errors

### Code Quality Improvements  
- **Maintainability**: Reduced cyclomatic complexity
- **Testability**: 95% test coverage on storage layer
- **Modularity**: Clear separation of concerns
- **Documentation**: Comprehensive API documentation
