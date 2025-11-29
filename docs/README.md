# Miele Dashboard Documentation

## Overview
This documentation directory contains all project documentation organized by category.

## Directory Structure

### 📊 `/analysis/`
Technical analysis and system evaluation documents:
- RAG system analysis and improvements
- Storage audit and performance optimization
- System refactoring plans

### 🔧 `/implementation/`
Implementation progress and fix documentation:
- AI feature integration progress
- Critical fixes and error resolution
- Feature implementation summaries

### 📖 `/guides/`
User guides and setup instructions:
- System audit documentation
- Feature support guides
- Visual content storage guides

### 🛠️ `/scripts/`
Utility scripts for maintenance:
- Storage clearing scripts
- Development tools

## Core Configuration Files

### Root Directory Files:
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.js` - PostCSS configuration
- `.env.local` - Environment variables (local)
- `.env.example` - Environment template
- `.gitignore` - Git ignore patterns

## Quick Start
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open http://localhost:3000

## Architecture
- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Ollama API
- **RAG System**: Custom vector storage with enhanced chunking
- **State Management**: React Context
