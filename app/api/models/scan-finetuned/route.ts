// API Route: Scan for fine-tuned models
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface FineTunedModel {
  id: string
  name: string
  path: string
  baseModel: string
  size: number
  type: 'lora' | 'full'
  dateCreated: string
  status: 'pending' | 'processing' | 'converted' | 'error'
  checkpoints?: string[]
  config?: {
    loraRank?: number
    loraAlpha?: number
    targetModules?: string[]
  }
}

async function scanDirectory(dirPath: string): Promise<FineTunedModel[]> {
  const models: FineTunedModel[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const fullPath = path.join(dirPath, entry.name)

      try {
        // Check for adapter_config.json (LoRA model)
        const configPath = path.join(fullPath, 'adapter_config.json')
        let isLoRA = false
        let config: any = {}

        try {
          const configContent = await fs.readFile(configPath, 'utf-8')
          config = JSON.parse(configContent)
          isLoRA = true
        } catch {
          // Not a LoRA model, might be full model
        }

        // Check for model files
        const files = await fs.readdir(fullPath)
        const hasAdapterModel = files.some(f => f.includes('adapter_model'))
        const hasModelSafetensors = files.some(f => f === 'model.safetensors')
        const hasGGUF = files.some(f => f.endsWith('.gguf'))

        if (!hasAdapterModel && !hasModelSafetensors && !hasGGUF) {
          // Check for checkpoints subdirectories
          const checkpoints: string[] = []
          for (const file of files) {
            const subPath = path.join(fullPath, file)
            const stat = await fs.stat(subPath)
            if (stat.isDirectory() && (file.startsWith('checkpoint-') || file === 'final_model')) {
              checkpoints.push(file)
            }
          }

          if (checkpoints.length > 0) {
            // This is a training directory with checkpoints
            const stats = await fs.stat(fullPath)
            const totalSize = await getFolderSize(fullPath)

            models.push({
              id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: entry.name,
              path: fullPath,
              baseModel: config.base_model_name_or_path || 'Unknown',
              size: totalSize,
              type: isLoRA ? 'lora' : 'full',
              dateCreated: stats.mtime.toISOString(),
              status: 'pending',
              checkpoints: checkpoints.sort(),
              config: isLoRA ? {
                loraRank: config.r,
                loraAlpha: config.lora_alpha,
                targetModules: config.target_modules
              } : undefined
            })
          }
          continue
        }

        // Calculate directory size
        const stats = await fs.stat(fullPath)
        const totalSize = await getFolderSize(fullPath)

        models.push({
          id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: entry.name,
          path: fullPath,
          baseModel: config.base_model_name_or_path || 'Unknown',
          size: totalSize,
          type: isLoRA ? 'lora' : 'full',
          dateCreated: stats.mtime.toISOString(),
          status: 'pending',
          config: isLoRA ? {
            loraRank: config.r,
            loraAlpha: config.lora_alpha,
            targetModules: config.target_modules
          } : undefined
        })
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error)
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }

  return models
}

async function getFolderSize(dirPath: string): Promise<number> {
  let totalSize = 0

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        totalSize += await getFolderSize(fullPath)
      } else {
        const stats = await fs.stat(fullPath)
        totalSize += stats.size
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }

  return totalSize
}

export async function GET() {
  try {
    // Default fine-tuning directory
    const defaultPath = 'C:\\Users\\joaoc\\OneDrive\\Desktop\\Starting.over\\projects\\finetunning\\outputs'

    const models = await scanDirectory(defaultPath)

    return NextResponse.json({
      success: true,
      models,
      count: models.length
    })
  } catch (error) {
    console.error('Error scanning for models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan for models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
