// Utility for generating visual content placeholders and thumbnails

export function generatePlaceholderDataURL(type: string, title: string = ''): string {
  // Always use SVG fallback to avoid canvas issues in SSR/browser environments
  return generateSVGPlaceholder(type, title);
}

function generateSVGPlaceholder(type: string, title: string = ''): string {
  const iconText = getIconText(type);
  const displayTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
  
  const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="150" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2" rx="4"/>
    <rect x="75" y="45" width="50" height="30" fill="#3b82f6" rx="4"/>
    <text x="100" y="65" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${iconText}</text>
    <text x="100" y="90" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#374151">${displayTitle || type.toUpperCase()}</text>
    <text x="100" y="110" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#9ca3af">${type.toUpperCase()}</text>
  </svg>`;
  
  // Use encodeURIComponent for better browser compatibility
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getIconText(type: string): string {
  const iconMap: Record<string, string> = {
    chart: 'CHART',
    table: 'TABLE',
    graph: 'GRAPH',
    image: 'IMG',
    diagram: 'DIAG',
    visualization: 'VIZ'
  };
  
  return iconMap[type.toLowerCase()] || 'FILE';
}

export function isValidImageURL(url: string): boolean {
  if (!url) return false;
  
  // Check for data URLs
  if (url.startsWith('data:image/')) return true;
  
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

export function getValidThumbnailURL(visualContent: {
  thumbnail?: string;
  source?: string;
  data?: { url?: string; base64?: string };
  type?: string;
  title?: string;
}): string {
  // Priority order for thumbnail sources
  const sources = [
    visualContent.thumbnail,
    visualContent.source,
    visualContent.data?.url,
    visualContent.data?.base64
  ];
  
  for (const source of sources) {
    if (source && isValidImageURL(source)) {
      return source;
    }
  }
  
  // Generate placeholder if no valid image found
  return generatePlaceholderDataURL(
    visualContent.type || 'unknown',
    visualContent.title || ''
  );
}
