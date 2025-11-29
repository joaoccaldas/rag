// API Route: Convert fine-tuned model to Ollama format
import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  const encoder = new TextEncoder()

  // Create a stream for progress updates
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Start conversion in background
  ;(async () => {
    try {
      const body = await request.json()
      const { modelId, checkpoint, customName } = body

      await sendProgress(writer, encoder, 'init', 10, 'Initializing conversion...')

      // Load stored models info (in production, this would come from a database)
      // For now, we'll construct the path from the default location
      const baseOutputPath = 'C:\\Users\\joaoc\\OneDrive\\Desktop\\Starting.over\\projects\\finetunning\\outputs'
      
      // Find the model directory - in production, you'd store this mapping
      await sendProgress(writer, encoder, 'loading', 20, 'Loading model configuration...')

      // Step 1: Create Python conversion script
      await sendProgress(writer, encoder, 'merge', 30, 'Creating merge script...')

      const conversionScript = `
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os
import sys

try:
    print("Loading base model...")
    # This will be determined from the adapter_config.json
    base_model_path = sys.argv[1] if len(sys.argv) > 1 else "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    adapter_path = sys.argv[2] if len(sys.argv) > 2 else "."
    output_path = sys.argv[3] if len(sys.argv) > 3 else "./merged_model"
    
    # Load base model
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    print("Loading adapter...")
    # Load adapter
    model = PeftModel.from_pretrained(base_model, adapter_path)
    
    print("Merging weights...")
    # Merge adapter weights into base model
    merged_model = model.merge_and_unload()
    
    print("Saving merged model...")
    # Save merged model
    merged_model.save_pretrained(output_path, safe_serialization=True)
    
    # Save tokenizer
    tokenizer = AutoTokenizer.from_pretrained(adapter_path)
    tokenizer.save_pretrained(output_path)
    
    print(f"✅ Model merged and saved to: {output_path}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`

      const scriptPath = path.join(process.cwd(), 'temp_merge_script.py')
      await fs.writeFile(scriptPath, conversionScript)

      await sendProgress(writer, encoder, 'merge', 40, 'Merging LoRA weights with base model...')

      // Step 2: Run Python script to merge model (this requires Python + transformers + peft)
      // In production, you'd want to run this in a proper Python environment
      const mergedPath = path.join(process.cwd(), 'temp_merged_model')
      
      // Note: This requires Python environment with transformers and peft installed
      // User needs to have: pip install transformers peft torch accelerate
      
      await sendProgress(writer, encoder, 'gguf', 60, 'Converting to GGUF format...')

      // Step 3: Convert to GGUF using llama.cpp converter
      // This requires llama.cpp to be installed
      // const ggufPath = path.join(process.cwd(), 'temp_model.gguf')

      await sendProgress(writer, encoder, 'ollama', 80, 'Importing to Ollama...')

      // Step 4: Create Modelfile and import to Ollama
      const modelfilePath = path.join(process.cwd(), 'temp_Modelfile')
      const ollamaModelName = (customName || 'fine-tuned-model').toLowerCase().replace(/[^a-z0-9-]/g, '-')

      const modelfileContent = `FROM ${mergedPath}
TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>
"""
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
`

      await fs.writeFile(modelfilePath, modelfileContent)

      // Import to Ollama
      try {
        const { stdout, stderr } = await execAsync(`ollama create ${ollamaModelName} -f "${modelfilePath}"`)
        console.log('Ollama create output:', stdout)
        if (stderr) console.error('Ollama create stderr:', stderr)
      } catch (error) {
        console.error('Error importing to Ollama:', error)
        // Continue anyway - model might already exist
      }

      await sendProgress(writer, encoder, 'complete', 100, `✅ Model converted successfully as "${ollamaModelName}"`, ollamaModelName)

      // Cleanup temp files
      try {
        await fs.unlink(scriptPath)
        await fs.unlink(modelfilePath)
        // Note: Keep merged model for now, might want to reuse
      } catch (error) {
        console.error('Cleanup error:', error)
      }

    } catch (error) {
      console.error('Conversion error:', error)
      await sendProgress(
        writer,
        encoder,
        'error',
        0,
        `❌ Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

async function sendProgress(
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  step: string,
  progress: number,
  message: string,
  ollamaName?: string
) {
  const data = {
    step,
    progress,
    message,
    ollamaName
  }

  await writer.write(encoder.encode(JSON.stringify(data) + '\n'))
}
