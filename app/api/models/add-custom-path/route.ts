// API Route: Add custom model path
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { path: modelPath } = body

    if (!modelPath) {
      return NextResponse.json(
        { success: false, error: 'Model path is required' },
        { status: 400 }
      )
    }

    // Verify path exists
    try {
      await fs.access(modelPath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Path does not exist or is not accessible' },
        { status: 400 }
      )
    }

    // Check for model files
    const files = await fs.readdir(modelPath)
    const hasAdapterModel = files.some(f => f.includes('adapter_model'))
    const hasModelSafetensors = files.some(f => f === 'model.safetensors')
    const hasGGUF = files.some(f => f.endsWith('.gguf'))
    const hasConfig = files.some(f => f === 'adapter_config.json' || f === 'config.json')

    if (!hasAdapterModel && !hasModelSafetensors && !hasGGUF) {
      return NextResponse.json(
        { success: false, error: 'No valid model files found in this directory' },
        { status: 400 }
      )
    }

    // Read config if available
    let config: any = {}
    let isLoRA = false

    if (hasConfig) {
      try {
        const configPath = path.join(modelPath, 'adapter_config.json')
        const configContent = await fs.readFile(configPath, 'utf-8')
        config = JSON.parse(configContent)
        isLoRA = true
      } catch {
        try {
          const configPath = path.join(modelPath, 'config.json')
          const configContent = await fs.readFile(configPath, 'utf-8')
          config = JSON.parse(configContent)
        } catch {
          // No config available
        }
      }
    }

    // Calculate size
    const stats = await fs.stat(modelPath)
    let totalSize = 0

    for (const file of files) {
      try {
        const filePath = path.join(modelPath, file)
        const fileStat = await fs.stat(filePath)
        if (fileStat.isFile()) {
          totalSize += fileStat.size
        }
      } catch {
        // Skip files we can't access
      }
    }

    // Create model object
    const model = {
      id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: path.basename(modelPath),
      path: modelPath,
      baseModel: config.base_model_name_or_path || config._name_or_path || 'Unknown',
      size: totalSize,
      type: isLoRA ? 'lora' : 'full',
      dateCreated: stats.mtime.toISOString(),
      status: 'pending',
      config: isLoRA ? {
        loraRank: config.r,
        loraAlpha: config.lora_alpha,
        targetModules: config.target_modules
      } : undefined
    }

    return NextResponse.json({
      success: true,
      model
    })
  } catch (error) {
    console.error('Error adding custom path:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add custom path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
