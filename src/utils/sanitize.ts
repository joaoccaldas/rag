import DOMPurify from 'dompurify';

// Allowed HTML tags and attributes for formatted message content
const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'strong', 'em', 'code', 'del', 'a', 'br', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'p', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'sup', 'sub'
  ],
  ALLOWED_ATTR: [
    'class', 'href', 'target', 'rel', 'title', 'id'
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML content before rendering via dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and other XSS vectors while preserving
 * allowed formatting tags.
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}
