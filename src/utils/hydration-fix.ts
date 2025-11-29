/**
 * Hydration Fix Utilities
 * Handles React hydration mismatches caused by browser extensions and dynamic content
 */

import React, { useEffect, useState } from 'react';

/**
 * Hook to handle hydration mismatch by suppressing rendering until client-side
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useEffect : () => {};

/**
 * Hook to prevent hydration mismatch for client-only components
 */
export function useHydrationSafe() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

/**
 * Remove browser extension attributes that cause hydration mismatches
 */
export function cleanBrowserExtensionAttributes(element: HTMLElement) {
  if (typeof window === 'undefined') return;
  
  // Common browser extension attributes
  const extensionAttributes = [
    'fdprocessedid',
    'data-lastpass-icon-root',
    'data-1password-root',
    'data-bitwarden-watching',
    'data-dashlane-rid',
    'data-kwift-id'
  ];

  extensionAttributes.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });

  // Clean child elements recursively
  Array.from(element.children).forEach(child => {
    cleanBrowserExtensionAttributes(child as HTMLElement);
  });
}

// Counter for unique ID generation with session tracking
let idCounter = 0;
const sessionId = typeof window !== 'undefined' 
  ? Math.random().toString(36).substring(2, 8)
  : 'server';

/**
 * Generate unique, deterministic IDs that won't conflict during hydration
 */
export function generateHydrationSafeId(prefix: string, ...parts: (string | number)[]): string {
  // Use a deterministic approach that works on both server and client
  const combined = [prefix, ...parts].join('_');
  
  // Simple hash function that's deterministic
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add counter and session ID to ensure uniqueness even for identical inputs
  idCounter++;
  return `${prefix}_${Math.abs(hash).toString(36)}_${sessionId}_${idCounter.toString(36)}`;
}

/**
 * Clean up duplicate IDs and ensure uniqueness
 */
export function deduplicateIds<T extends { id: string }>(
  items: T[],
  idGenerator?: (item: T, index: number) => string
): T[] {
  const seenIds = new Set<string>();
  const cleaned: T[] = [];

  items.forEach((item, index) => {
    let itemId = item.id;
    
    // If ID already exists, generate a new one
    if (seenIds.has(itemId)) {
      itemId = idGenerator 
        ? idGenerator(item, index)
        : `${item.id}_dup_${index}_${Date.now()}`;
      
      // Only show warnings in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Duplicate ID detected: ${item.id}, reassigned to: ${itemId}`);
      }
    }

    seenIds.add(itemId);
    cleaned.push({ ...item, id: itemId });
  });

  return cleaned;
}

/**
 * Wrapper component to prevent hydration mismatches
 */
export function HydrationBoundary({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasMounted = useHydrationSafe();

  if (!hasMounted) {
    return fallback as React.ReactElement;
  }

  return children as React.ReactElement;
}

/**
 * Effect to clean browser extension attributes after mount
 */
export function useBrowserExtensionCleanup(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const cleanupInterval = setInterval(() => {
      cleanBrowserExtensionAttributes(containerRef.current!);
    }, 1000);

    // Initial cleanup
    cleanBrowserExtensionAttributes(containerRef.current);

    return () => clearInterval(cleanupInterval);
  }, [containerRef]);
}
