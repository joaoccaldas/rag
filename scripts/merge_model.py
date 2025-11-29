"""
Fine-Tuned Model Conversion Script
Merges LoRA adapters into base models and prepares them for Ollama
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os
import sys
import json
from pathlib import Path

def merge_lora_adapter(base_model_path: str, adapter_path: str, output_path: str):
    """
    Merge LoRA adapter weights into base model
    
    Args:
        base_model_path: Path or Hugging Face model ID for base model
        adapter_path: Path to LoRA adapter directory
        output_path: Path to save merged model
    """
    print(f"🔄 Loading base model: {base_model_path}")
    try:
        # Load base model
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_path,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
            low_cpu_mem_usage=True
        )
        print("✅ Base model loaded")
        
        print(f"🔄 Loading LoRA adapter: {adapter_path}")
        # Load PEFT model with adapter
        model = PeftModel.from_pretrained(base_model, adapter_path)
        print("✅ Adapter loaded")
        
        print("🔄 Merging adapter weights into base model...")
        # Merge adapter weights
        merged_model = model.merge_and_unload()
        print("✅ Weights merged")
        
        print(f"💾 Saving merged model to: {output_path}")
        # Save merged model
        os.makedirs(output_path, exist_ok=True)
        merged_model.save_pretrained(
            output_path,
            safe_serialization=True,
            max_shard_size="2GB"
        )
        print("✅ Model saved")
        
        print("💾 Saving tokenizer...")
        # Save tokenizer
        tokenizer = AutoTokenizer.from_pretrained(adapter_path)
        tokenizer.save_pretrained(output_path)
        print("✅ Tokenizer saved")
        
        # Save metadata
        metadata = {
            "base_model": base_model_path,
            "adapter_path": adapter_path,
            "merged_by": "rag-dashboard",
            "dtype": "float16"
        }
        
        with open(os.path.join(output_path, "merge_info.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Successfully merged model saved to: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error during merge: {str(e)}", file=sys.stderr)
        return False

def main():
    if len(sys.argv) < 4:
        print("Usage: python merge_model.py <base_model> <adapter_path> <output_path>")
        print("\nExample:")
        print('  python merge_model.py "TinyLlama/TinyLlama-1.1B-Chat-v1.0" "./neo_final_model" "./merged_neo"')
        sys.exit(1)
    
    base_model_path = sys.argv[1]
    adapter_path = sys.argv[2]
    output_path = sys.argv[3]
    
    # Verify paths exist
    if not os.path.exists(adapter_path):
        print(f"❌ Adapter path does not exist: {adapter_path}", file=sys.stderr)
        sys.exit(1)
    
    # Check for required files
    required_files = ["adapter_config.json", "adapter_model.safetensors"]
    missing_files = [f for f in required_files if not os.path.exists(os.path.join(adapter_path, f))]
    
    if missing_files:
        print(f"❌ Missing required files in adapter directory: {', '.join(missing_files)}", file=sys.stderr)
        sys.exit(1)
    
    print("=" * 60)
    print("Fine-Tuned Model Merger")
    print("=" * 60)
    print(f"Base Model: {base_model_path}")
    print(f"Adapter: {adapter_path}")
    print(f"Output: {output_path}")
    print("=" * 60)
    print()
    
    success = merge_lora_adapter(base_model_path, adapter_path, output_path)
    
    if success:
        print()
        print("=" * 60)
        print("✅ MERGE COMPLETE!")
        print("=" * 60)
        print()
        print("Next steps:")
        print(f'1. Convert to GGUF: python llama.cpp/convert.py "{output_path}" --outfile model.gguf')
        print('2. Import to Ollama: ollama create mymodel -f Modelfile')
        print()
        sys.exit(0)
    else:
        print()
        print("=" * 60)
        print("❌ MERGE FAILED")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
