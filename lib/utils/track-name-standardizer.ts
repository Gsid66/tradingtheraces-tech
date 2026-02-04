/**
 * Track Name Standardizer Service
 * 
 * This service ensures all track names in the database match the canonical
 * track names used by PuntingForm API.
 */

import { getPuntingFormClient } from '@/lib/integrations/punting-form/client';
import { format, subDays, addDays } from 'date-fns';

// Cache for track name mapping
let trackNameCache: Map<string, string> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Common track name variations and their canonical forms
 * This helps with basic normalization before checking the API
 */
const COMMON_VARIATIONS: Record<string, string> = {
  'canterbury': 'Canterbury Park',
  'canterbury park': 'Canterbury Park',
  'sandown': 'Sandown Hillside',
  'sandown hillside': 'Sandown Hillside',
  'flemington': 'Flemington',
  'randwick': 'Randwick',
  'caulfield': 'Caulfield',
  'rosehill': 'Rosehill Gardens',
  'rosehill gardens': 'Rosehill Gardens',
  'moonee valley': 'Moonee Valley',
  'doomben': 'Doomben',
  'eagle farm': 'Eagle Farm',
  'morphettville': 'Morphettville',
};

/**
 * Normalize track name for comparison
 */
function normalizeForComparison(trackName: string): string {
  if (!trackName) return '';
  
  let normalized = trackName.toLowerCase().trim();
  
  // Remove common suffixes
  const suffixes = ['racecourse', 'gardens', 'hillside', 'park', 'racing', 'raceway'];
  for (const suffix of suffixes) {
    normalized = normalized.replace(new RegExp(`\\s+${suffix}$`, 'i'), '');
  }
  
  // Remove special characters and extra spaces
  normalized = normalized.replace(/[^a-z0-9\s]/gi, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Check if two track names match (handles variations)
 */
function tracksMatch(track1: string, track2: string): boolean {
  if (!track1 || !track2) return false;
  
  const normalized1 = normalizeForComparison(track1);
  const normalized2 = normalizeForComparison(track2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (with minimum length threshold)
  const minLength = Math.min(normalized1.length, normalized2.length);
  if (minLength >= 5) {
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
  
  return false;
}

/**
 * Fetch canonical track names from PuntingForm API
 * Looks at meetings from yesterday, today, and tomorrow
 */
async function fetchCanonicalTrackNames(): Promise<Map<string, string>> {
  const pfClient = getPuntingFormClient();
  const trackMap = new Map<string, string>();
  
  try {
    // Fetch meetings for yesterday, today, and tomorrow
    const dates = [
      subDays(new Date(), 1),
      new Date(),
      addDays(new Date(), 1),
    ];
    
    for (const date of dates) {
      try {
        const response = await pfClient.getMeetingsByDate(date);
        const meetings = response.payLoad || [];
        
        for (const meeting of meetings) {
          if (meeting.track?.name) {
            const canonical = meeting.track.name;
            const normalized = normalizeForComparison(canonical);
            
            // Store both the normalized version and the original
            trackMap.set(normalized, canonical);
            trackMap.set(canonical.toLowerCase(), canonical);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch meetings for ${format(date, 'yyyy-MM-dd')}:`, error);
      }
    }
    
    console.log(`✅ Fetched ${trackMap.size} track name mappings from PuntingForm API`);
  } catch (error) {
    console.error('❌ Error fetching canonical track names:', error);
  }
  
  return trackMap;
}

/**
 * Build track name mapping (normalized -> canonical)
 */
async function buildTrackNameMapping(): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();
  
  // Start with API data
  const apiMapping = await fetchCanonicalTrackNames();
  
  // Merge API mapping
  for (const [key, value] of apiMapping) {
    mapping.set(key, value);
  }
  
  // Add common variations
  for (const [variation, canonical] of Object.entries(COMMON_VARIATIONS)) {
    const normalized = normalizeForComparison(variation);
    if (!mapping.has(normalized)) {
      mapping.set(normalized, canonical);
    }
  }
  
  return mapping;
}

/**
 * Get track name mapping with caching
 */
async function getTrackNameMapping(forceRefresh: boolean = false): Promise<Map<string, string>> {
  const now = Date.now();
  
  // Check if cache is valid
  if (!forceRefresh && trackNameCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    console.log('📦 Using cached track name mapping');
    return trackNameCache;
  }
  
  // Rebuild cache
  console.log('🔄 Rebuilding track name mapping cache');
  trackNameCache = await buildTrackNameMapping();
  cacheTimestamp = now;
  
  return trackNameCache;
}

/**
 * Standardize a track name to its canonical PuntingForm equivalent
 * 
 * @param trackName - The track name to standardize
 * @param options - Options for standardization
 * @returns The standardized track name, or original if no match found
 */
export async function standardizeTrackName(
  trackName: string,
  options: { forceRefresh?: boolean; throwOnMissing?: boolean } = {}
): Promise<string> {
  if (!trackName) return trackName;
  
  const { forceRefresh = false, throwOnMissing = false } = options;
  
  // Get mapping
  const mapping = await getTrackNameMapping(forceRefresh);
  
  // Try exact lowercase match first
  const lowerTrackName = trackName.toLowerCase();
  if (mapping.has(lowerTrackName)) {
    const result = mapping.get(lowerTrackName)!;
    console.log(`🔄 Standardized track name: "${trackName}" -> "${result}"`);
    return result;
  }
  
  // Try normalized match
  const normalized = normalizeForComparison(trackName);
  if (mapping.has(normalized)) {
    const result = mapping.get(normalized)!;
    console.log(`🔄 Standardized track name: "${trackName}" -> "${result}" (via normalization)`);
    return result;
  }
  
  // Try fuzzy match
  for (const [key, canonical] of mapping) {
    if (tracksMatch(trackName, key) || tracksMatch(trackName, canonical)) {
      console.log(`🔄 Standardized track name: "${trackName}" -> "${canonical}" (via fuzzy match)`);
      return canonical;
    }
  }
  
  // No match found
  console.warn(`⚠️ No canonical track name found for: "${trackName}"`);
  
  if (throwOnMissing) {
    throw new Error(`No canonical track name found for: "${trackName}"`);
  }
  
  // Return original
  return trackName;
}

/**
 * Validate if a track name exists in PuntingForm's current meetings
 * 
 * @param trackName - The track name to validate
 * @returns Validation result with suggestion if not found
 */
export async function validateTrackName(
  trackName: string
): Promise<{ valid: boolean; suggestion?: string; canonical?: string }> {
  if (!trackName) {
    return { valid: false };
  }
  
  const mapping = await getTrackNameMapping();
  
  // Check exact match
  const lowerTrackName = trackName.toLowerCase();
  if (mapping.has(lowerTrackName)) {
    return { valid: true, canonical: mapping.get(lowerTrackName) };
  }
  
  // Check normalized match
  const normalized = normalizeForComparison(trackName);
  if (mapping.has(normalized)) {
    return { valid: true, canonical: mapping.get(normalized) };
  }
  
  // Try fuzzy match for suggestion
  for (const [key, canonical] of mapping) {
    if (tracksMatch(trackName, key) || tracksMatch(trackName, canonical)) {
      return { 
        valid: false, 
        suggestion: canonical,
        canonical 
      };
    }
  }
  
  return { valid: false };
}

/**
 * Get all known canonical track names
 */
export async function getAllCanonicalTrackNames(): Promise<string[]> {
  const mapping = await getTrackNameMapping();
  const uniqueCanonical = new Set<string>(mapping.values());
  return Array.from(uniqueCanonical).sort();
}

/**
 * Clear the track name cache (useful for testing or forcing refresh)
 */
export function clearTrackNameCache(): void {
  trackNameCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Track name cache cleared');
}
