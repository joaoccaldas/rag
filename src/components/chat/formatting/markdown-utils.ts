/**
 * Markdown formatting utilities for chat messages
 * Provides consistent markdown rendering across chat components
 */

export interface MarkdownFormattingOptions {
  enableHeaders?: boolean
  enableLists?: boolean
  enableBlockquotes?: boolean
  enableCodeBlocks?: boolean
  enableLinks?: boolean
  maxListDepth?: number
}

const DEFAULT_OPTIONS: MarkdownFormattingOptions = {
  enableHeaders: true,
  enableLists: true,
  enableBlockquotes: true,
  enableCodeBlocks: true,
  enableLinks: true,
  maxListDepth: 3
}

/**
 * Format inline text elements (bold, italic, code)
 */
export function formatInlineText(text: string): string {
  // Handle bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
  
  // Handle italic text
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
  
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">$1</code>')
  
  // Handle strikethrough
  text = text.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500 dark:text-gray-400">$1</del>')
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
  
  return text
}

/**
 * Parse and format markdown content into structured HTML
 */
export function parseMarkdown(content: string, options: MarkdownFormattingOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const lines = content.split('\n')
  const result: string[] = []
  
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle code blocks
    if (opts.enableCodeBlocks && line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true
        // Future: could use language for syntax highlighting
        codeBlockContent = []
      } else {
        // End of code block
        inCodeBlock = false
        const codeContent = codeBlockContent.join('\n')
        result.push(`<pre class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 overflow-x-auto my-3"><code class="text-sm font-mono text-gray-800 dark:text-gray-200">${escapeHtml(codeContent)}</code></pre>`)
        codeBlockContent = []
      }
      continue
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }
    
    // Skip empty lines
    if (!line.trim()) {
      result.push('<br />')
      continue
    }
    
    // Handle headers
    if (opts.enableHeaders) {
      if (line.startsWith('### ')) {
        result.push(`<h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">${formatInlineText(line.replace('### ', ''))}</h3>`)
        continue
      } else if (line.startsWith('## ')) {
        result.push(`<h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">${formatInlineText(line.replace('## ', ''))}</h2>`)
        continue
      } else if (line.startsWith('# ')) {
        result.push(`<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 first:mt-0">${formatInlineText(line.replace('# ', ''))}</h1>`)
        continue
      }
    }
    
    // Handle unordered lists
    if (opts.enableLists && (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* '))) {
      const listContent = formatInlineText(line.replace(/^[-•*]\s*/, ''))
      result.push(`<ul class="list-disc list-inside ml-4 space-y-1 my-2"><li class="text-gray-700 dark:text-gray-300 leading-relaxed">${listContent}</li></ul>`)
      continue
    }
    
    // Handle numbered lists
    if (opts.enableLists && line.match(/^\d+\.\s+/)) {
      const listContent = formatInlineText(line.replace(/^\d+\.\s+/, ''))
      result.push(`<ol class="list-decimal list-inside ml-4 space-y-1 my-2"><li class="text-gray-700 dark:text-gray-300 leading-relaxed">${listContent}</li></ol>`)
      continue
    }
    
    // Handle blockquotes
    if (opts.enableBlockquotes && line.startsWith('> ')) {
      const quoteContent = formatInlineText(line.replace(/^>\s*/, ''))
      result.push(`<blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-3 italic"><span class="text-gray-700 dark:text-gray-300">${quoteContent}</span></blockquote>`)
      continue
    }
    
    // Regular paragraphs
    result.push(`<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 last:mb-0">${formatInlineText(line)}</p>`)
  }
  
  return result.join('')
}

/**
 * Escape HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Enhanced markdown renderer with full feature support
 */
export function renderMarkdown(content: string, options?: MarkdownFormattingOptions): string {
  return `<div class="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-50 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-600 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-ul:space-y-1 prose-ol:space-y-1 prose-li:text-gray-700 dark:prose-li:text-gray-300">${parseMarkdown(content, options)}</div>`
}

/**
 * Simple markdown renderer for basic formatting (backward compatibility)
 */
export function renderSimpleMarkdown(content: string): string {
  return content
    .replace(/\n/g, '<br />')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">$1</code>')
}
