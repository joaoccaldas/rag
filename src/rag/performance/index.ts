/**
 * Performance Module Index
 * Exports all performance optimization features
 */

// Core managers
export { ragCacheManager } from './cache-manager'
export { requestOptimizer } from './request-optimizer'
export { memoryManager } from './memory-manager'
export { backgroundProcessor } from './background-processor'

// Re-export types for convenience
export type { CacheConfig, CacheEntry, CacheStats } from './cache-manager'
export type { PendingRequest, BatchRequest, RequestStats } from './request-optimizer'
export type { MemoryStats, MemoryThresholds, MemoryCleanupTarget } from './memory-manager'
export type { BackgroundTask, TaskProgress, BackgroundWorkerStats } from './background-processor'
