/**
 * Markdown formatting utilities for chat messages
 * Provides consistent markdown rendering across all chat components
 */

export interface MarkdownOptions {
  enableHeadings?: boolean
  enableLists?: boolean
  enableBlockquotes?: boolean
  enableInlineFormatting?: boolean
  enableLinks?: boolean
  enableCodeBlocks?: boolean
  maxHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

const defaultOptions: MarkdownOptions = {
  enableHeadings: true,
  enableLists: true,
  enableBlockquotes: true,
  enableInlineFormatting: true,
  enableLinks: true,
  enableCodeBlocks: true,
  maxHeadingLevel: 3
}

/**
 * Format inline text elements (bold, italic, code, links, strikethrough)
 */
export function formatInlineText(text: string, options: MarkdownOptions = {}): string {
  const opts = { ...defaultOptions, ...options }
  let result = text

  if (opts.enableInlineFormatting) {
    // Handle bold text
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    
    // Handle italic text
    result = result.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
    
    // Handle inline code
    result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">$1</code>')
    
    // Handle strikethrough
    result = result.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500 dark:text-gray-400">$1</del>')
  }

  if (opts.enableLinks) {
    // Handle links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
  }

  return result
}

/**
 * Parse and render a single paragraph with appropriate formatting
 */
export function renderParagraph(paragraph: string, index: number, options: MarkdownOptions = {}) {
  const opts = { ...defaultOptions, ...options }
  
  if (!paragraph.trim()) return null

  // Handle headings
  if (opts.enableHeadings) {
    for (let level = 1; level <= (opts.maxHeadingLevel || 3); level++) {
      const prefix = '#'.repeat(level) + ' '
      if (paragraph.startsWith(prefix)) {
        const text = paragraph.replace(prefix, '')
        const sizes = {
          1: 'text-2xl font-bold',
          2: 'text-xl font-semibold', 
          3: 'text-lg font-semibold',
          4: 'text-base font-semibold',
          5: 'text-sm font-semibold',
          6: 'text-xs font-semibold'
        }
        return (
          <div 
            key={index} 
            className={`${sizes[level as keyof typeof sizes]} text-gray-900 dark:text-white mt-6 mb-3 first:mt-0`}
            dangerouslySetInnerHTML={{ __html: formatInlineText(text, opts) }}
          />
        )
      }
    }
  }

  // Handle lists
  if (opts.enableLists) {
    if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
      return (
        <ul key={index} className="list-disc list-inside ml-4 space-y-1">
          <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
            <span dangerouslySetInnerHTML={{ 
              __html: formatInlineText(paragraph.replace(/^[-•]\s*/, ''), opts)
            }} />
          </li>
        </ul>
      )
    }

    // Handle numbered lists
    if (paragraph.match(/^\d+\.\s+/)) {
      return (
        <ol key={index} className="list-decimal list-inside ml-4 space-y-1">
          <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
            <span dangerouslySetInnerHTML={{ 
              __html: formatInlineText(paragraph.replace(/^\d+\.\s+/, ''), opts)
            }} />
          </li>
        </ol>
      )
    }
  }

  // Handle blockquotes
  if (opts.enableBlockquotes && paragraph.startsWith('> ')) {
    return (
      <blockquote key={index} className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-3 italic">
        <span 
          className="text-gray-700 dark:text-gray-300" 
          dangerouslySetInnerHTML={{ 
            __html: formatInlineText(paragraph.replace(/^>\s*/, ''), opts)
          }} 
        />
      </blockquote>
    )
  }

  // Regular paragraphs
  return (
    <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 last:mb-0">
      <span dangerouslySetInnerHTML={{ __html: formatInlineText(paragraph, opts) }} />
    </p>
  )
}

/**
 * Main markdown rendering function - processes entire message content
 */
export function renderMarkdown(content: string, options: MarkdownOptions = {}) {
  if (!content) return null

  const paragraphs = content.split('\n')
  const elements: JSX.Element[] = []

  for (let i = 0; i < paragraphs.length; i++) {
    const element = renderParagraph(paragraphs[i], i, options)
    if (element) {
      elements.push(element)
    }
  }

  return elements
}

/**
 * Simple markdown rendering for basic use cases (returns HTML string)
 */
export function renderMarkdownHTML(content: string): string {
  return content
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">$1</code>')
}
