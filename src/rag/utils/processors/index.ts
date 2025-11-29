// Modular File Processors Index

export { BaseProcessor, ProcessorRegistry, processorRegistry } from './base'
export { PowerPointProcessor } from './powerpoint'
export { RTFProcessor } from './rtf'
export { YAMLProcessor } from './yaml'
export { EPUBProcessor } from './epub'

// Import and register all processors
import { processorRegistry } from './base'
import { PowerPointProcessor } from './powerpoint'
import { RTFProcessor } from './rtf'
import { YAMLProcessor } from './yaml'
import { EPUBProcessor } from './epub'

// Register processors on module load
processorRegistry.register(new PowerPointProcessor())
processorRegistry.register(new RTFProcessor())
processorRegistry.register(new YAMLProcessor())
processorRegistry.register(new EPUBProcessor())

// Export convenience function for processing files
export async function processFileWithRegistry(file: File): Promise<string> {
  return processorRegistry.processFile(file)
}

// Export function to get supported file types
export function getSupportedFileTypes(): string[] {
  return processorRegistry.getSupportedTypes()
}

// Export function to check if a file type is supported
export function isFileTypeSupported(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? processorRegistry.getSupportedTypes().includes(extension) : false
}
