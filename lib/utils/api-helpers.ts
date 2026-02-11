/**
 * API Helper Utilities for Server-Side Rendering
 * 
 * Provides utilities for making internal API calls during server-side rendering (SSR).
 * Handles absolute URL construction for fetch calls that would fail with relative URLs.
 */

/**
 * Get the base URL for internal API calls during server-side rendering.
 * Falls back to localhost in development.
 * 
 * Priority order:
 * 1. VERCEL_URL (automatically set by Vercel)
 * 2. NEXT_PUBLIC_BASE_URL (custom override)
 * 3. http://localhost:3000 (development fallback)
 * 
 * @returns {string} The base URL to use for internal API calls
 */
export function getBaseUrl(): string {
  // Check for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for custom base URL (production)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Fetch wrapper that automatically uses base URL for server-side calls.
 * Provides consistent error handling and logging for all API calls.
 * 
 * @param {string} endpoint - API endpoint (e.g., '/api/scratchings?jurisdiction=0')
 * @param {RequestInit} options - Optional fetch options
 * @returns {Promise<T>} Parsed JSON response
 * @throws {Error} If the fetch fails or returns non-OK status
 * 
 * @example
 * ```typescript
 * const data = await fetchAPI<{ success: boolean; data: any[] }>('/api/scratchings?jurisdiction=0&hoursAgo=48');
 * ```
 */
export async function fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : endpoint;
  
  console.log(`🌐 [API Fetch] ${url}`);
  
  try {
    const response = await fetch(url, {
      // Add cache: 'no-store' for dynamic data by default, but allow override
      cache: 'no-store',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`❌ [API Fetch] Failed to fetch ${url}:`, error);
    throw error;
  }
}
