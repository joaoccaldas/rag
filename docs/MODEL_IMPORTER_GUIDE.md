# Fine-Tuned Model Import System - Installation & Usage Guide

## 🎯 Overview
The Model Importer allows you to:
1. **Scan** for fine-tuned models on your system
2. **Select** a checkpoint to convert
3. **Convert** LoRA adapters to full models
4. **Import** to Ollama for use in your RAG chatbot

---

## 📋 Prerequisites

### 1. Python Environment
```bash
pip install torch transformers peft accelerate safetensors
```

### 2. llama.cpp (for GGUF conversion)
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make
```

### 3. Ollama (for model serving)
Download from: https://ollama.ai

---

## 🚀 Quick Start

### Step 1: Open Model Importer
1. Go to your RAG Dashboard
2. Click on the **"Model Importer"** tab
3. Click **"Scan for Models"**

### Step 2: Select Your Model
- The system will automatically scan: `C:\Users\joaoc\OneDrive\Desktop\Starting.over\projects\finetunning\outputs`
- Your models will appear with:
  - ✅ Name and base model
  - 📊 Size and type (LoRA/Full)
  - 📁 Available checkpoints

### Step 3: Choose Checkpoint
- Select your model from the list
- In the conversion panel, choose:
  - **"Final Model"** (recommended) - the fully trained model
  - Or any specific checkpoint (e.g., checkpoint-3600)

### Step 4: Convert to Ollama
- Click **"Convert to Ollama"** button
- Watch the progress:
  1. ⏳ Loading base model
  2. 🔗 Loading adapter weights
  3. 🔄 Merging weights
  4. 📦 Converting to GGUF format
  5. 🚀 Importing to Ollama
  6. ✅ Done!

### Step 5: Use as Chatbot
- Once converted, click **"Use as Chatbot"**
- Your fine-tuned model is now active!
- Go to the chat interface and start asking questions

---

## 🛠️ Manual Conversion (Advanced)

If automatic conversion fails, you can convert manually:

### Option 1: Python Script
```bash
cd C:\Users\joaoc\OneDrive\Desktop\Starting.over\projects\ai\rag\miele\dashboard

python scripts/merge_model.py \
  "TinyLlama/TinyLlama-1.1B-Chat-v1.0" \
  "C:\Users\joaoc\OneDrive\Desktop\Starting.over\projects\finetunning\outputs\neo_20251020_062829\final_model" \
  "C:\Users\joaoc\models\neo-merged"
```

### Option 2: llama.cpp Conversion
```bash
cd C:\Users\joaoc\llama.cpp

python convert.py \
  "C:\Users\joaoc\models\neo-merged" \
  --outfile neo-model.gguf \
  --outtype q4_K_M
```

### Option 3: Ollama Import
```bash
# Create Modelfile
echo FROM ./neo-model.gguf > Modelfile
echo TEMPLATE """{{ .Prompt }}""" >> Modelfile
echo PARAMETER temperature 0.7 >> Modelfile

# Import
ollama create neo-finetuned -f Modelfile

# Test
ollama run neo-finetuned "Hello, what can you do?"
```

---

## 📁 Supported Model Formats

### LoRA Adapters
✅ Requires:
- `adapter_model.safetensors` - Adapter weights
- `adapter_config.json` - Configuration
- `tokenizer.json` - Tokenizer
- Base model ID in config

### Full Models
✅ Requires:
- `model.safetensors` or `pytorch_model.bin` - Model weights
- `config.json` - Model configuration  
- `tokenizer.json` - Tokenizer

### GGUF Models
✅ Requires:
- `*.gguf` file - Quantized model
- Ready for Ollama directly!

---

## 🎯 Your Fine-Tuned Models

Based on your setup, you have:

### 1. neo_20251020_062829 ⭐ **RECOMMENDED**
- **Location**: `finetunning/outputs/neo_20251020_062829/`
- **Base**: TinyLlama-1.1B-Chat-v1.0
- **Type**: LoRA (rank 32, alpha 64)
- **Size**: 390 MB
- **Status**: ✅ Complete with final_model
- **Checkpoints**: 55+ including final_model

### 2. TEST2_20251020_204638
- **Location**: `finetunning/outputs/TEST2_20251020_204638/`
- **Base**: TinyLlama-1.1B-Chat-v1.0
- **Size**: 290 MB
- **Latest**: checkpoint-1201

### 3. training_20251019_152558
- **Location**: `finetunning/outputs/training_20251019_152558/`
- **Size**: 340 MB
- **Latest**: checkpoint-100

### 4. nasaBig_20251020_224507
- **Location**: `finetunning/outputs/nasaBig_20251020_224507/`
- **Size**: 350 MB
- **Latest**: checkpoint-201

---

## 🔧 Troubleshooting

### "Failed to scan models"
✅ **Solution**: Check that the path exists:
```powershell
Test-Path "C:\Users\joaoc\OneDrive\Desktop\Starting.over\projects\finetunning\outputs"
```

### "Conversion failed"
✅ **Solutions**:
1. Ensure Python packages installed:
   ```bash
   pip install transformers peft torch accelerate
   ```

2. Check CUDA/GPU available (optional but faster):
   ```bash
   python -c "import torch; print(torch.cuda.is_available())"
   ```

3. Use manual conversion (see above)

### "Ollama import failed"
✅ **Solutions**:
1. Verify Ollama is running:
   ```bash
   ollama list
   ```

2. Check Ollama service:
   ```powershell
   Get-Process ollama
   ```

3. Restart Ollama:
   ```bash
   ollama serve
   ```

### "Out of memory"
✅ **Solutions**:
1. Close other applications
2. Use quantized conversion (q4_K_M instead of fp16)
3. Convert on a machine with more RAM

---

## 📊 Performance Tips

### For Faster Conversion:
1. Use GPU if available (CUDA)
2. Use SSD for model storage
3. Close unnecessary applications

### For Better Quality:
1. Use `final_model` checkpoint (fully trained)
2. Choose higher precision (fp16 vs q4)
3. Test multiple checkpoints to find best one

### For Smaller Size:
1. Use GGUF quantization (q4_K_M, q5_K_M)
2. Use smaller base models (TinyLlama vs larger)

---

## 🎓 Example Usage

```typescript
// After conversion, your model is available in Ollama!

// 1. In RAG Settings, select your model:
localStorage.setItem('miele-rag-settings', JSON.stringify({
  selectedModel: 'neo-finetuned',
  temperature: 0.7,
  maxTokens: 2000
}))

// 2. Use in chatbot - it will automatically use your fine-tuned model!
```

---

## ✅ Success Checklist

- [ ] Python environment with transformers, peft, torch installed
- [ ] llama.cpp cloned and compiled (optional)
- [ ] Ollama installed and running
- [ ] Fine-tuned model scanned and visible
- [ ] Checkpoint selected (recommend: final_model)
- [ ] Conversion completed successfully
- [ ] Model appears in Ollama list
- [ ] Model set as active chatbot
- [ ] Test query successful!

---

## 🆘 Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Check Ollama logs: `ollama logs`
3. Review conversion output in terminal
4. Try manual conversion steps above

Your fine-tuned models are ready to power your RAG chatbot! 🚀
