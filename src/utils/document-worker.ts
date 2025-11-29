// Web Worker for document processing to prevent UI blocking
export interface ProcessingTask {
  id: string
  type: 'pdf' | 'docx' | 'txt' | 'chunk'
  data: ArrayBuffer | string
  options?: {
    chunkSize?: number
    overlap?: number
  }
}

export interface ProcessingResult {
  id: string
  success: boolean
  data?: {
    text?: string
    chunks?: string[]
    metadata?: Record<string, unknown>
  }
  error?: string
  progress?: number
}

class DocumentProcessingWorker {
  private worker: Worker | null = null
  private tasks = new Map<string, {
    resolve: (result: ProcessingResult) => void
    reject: (error: Error) => void
  }>()

  constructor() {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      this.initWorker()
    }
  }

  private initWorker() {
    try {
      // Create worker from inline code to avoid separate file
      const workerCode = `
        // Import required libraries
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js');
        
        self.onmessage = async function(e) {
          const { id, type, data, options } = e.data;
          
          try {
            let result;
            
            switch (type) {
              case 'pdf':
                result = await processPDF(data, options);
                break;
              case 'docx':
                result = await processDocx(data, options);
                break;
              case 'txt':
                result = await processText(data, options);
                break;
              case 'chunk':
                result = await chunkText(data, options);
                break;
              default:
                throw new Error('Unknown processing type: ' + type);
            }
            
            self.postMessage({
              id,
              success: true,
              data: result
            });
          } catch (error) {
            self.postMessage({
              id,
              success: false,
              error: error.message
            });
          }
        };
        
        async function processPDF(data, options) {
          // PDF processing logic here
          return { text: 'PDF processing not implemented in worker yet', chunks: [] };
        }
        
        async function processDocx(data, options) {
          // DOCX processing logic here
          return { text: 'DOCX processing not implemented in worker yet', chunks: [] };
        }
        
        async function processText(data, options) {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
          const chunks = chunkText(text, options);
          return { text, chunks };
        }
        
        function chunkText(text, options = {}) {
          const chunkSize = options.chunkSize || 1000;
          const overlap = options.overlap || 100;
          const chunks = [];
          
          for (let i = 0; i < text.length; i += chunkSize - overlap) {
            const chunk = text.slice(i, i + chunkSize);
            if (chunk.trim()) {
              chunks.push(chunk.trim());
            }
          }
          
          return chunks;
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.worker = new Worker(URL.createObjectURL(blob))

      this.worker.onmessage = (e) => {
        const result: ProcessingResult = e.data
        const task = this.tasks.get(result.id)
        
        if (task) {
          this.tasks.delete(result.id)
          
          if (result.success) {
            task.resolve(result)
          } else {
            task.reject(new Error(result.error || 'Processing failed'))
          }
        }
      }

      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        // Reject all pending tasks
        this.tasks.forEach(({ reject }) => {
          reject(new Error('Worker error'))
        })
        this.tasks.clear()
      }
    } catch (error) {
      console.warn('Could not initialize worker:', error)
    }
  }

  async processDocument(task: ProcessingTask): Promise<ProcessingResult> {
    if (!this.worker) {
      throw new Error('Worker not available, falling back to main thread')
    }

    return new Promise((resolve, reject) => {
      this.tasks.set(task.id, { resolve, reject })
      this.worker!.postMessage(task)

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.tasks.has(task.id)) {
          this.tasks.delete(task.id)
          reject(new Error('Processing timeout'))
        }
      }, 30000)
    })
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.tasks.clear()
  }
}

// Singleton instance
let workerInstance: DocumentProcessingWorker | null = null

export function getDocumentWorker(): DocumentProcessingWorker {
  if (!workerInstance) {
    workerInstance = new DocumentProcessingWorker()
  }
  return workerInstance
}

export function terminateDocumentWorker() {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
  }
}
