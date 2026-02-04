/**
 * SQL Helper for Track Name Matching
 * 
 * Provides utilities for building SQL queries that handle track name variations
 * when joining race_cards_ratings with pf_meetings.
 */

import { getAllPossibleMatches } from './track-name-standardizer';

/**
 * Build SQL WHERE clause for track name matching
 * 
 * Generates SQL condition that matches track names across TTR and PuntingForm systems.
 * Handles surface-specific variations (e.g., Newcastle/Beaumont).
 * 
 * @param ttrTrackColumn - Column name for TTR track (e.g., 'rcr.track')
 * @param pfTrackColumn - Column name for PuntingForm track (e.g., 'm.track_name')
 * @returns SQL WHERE clause fragment
 * 
 * @example
 * const trackCondition = buildTrackMatchCondition('rcr.track', 'm.track_name');
 * // Returns: (rcr.track = m.track_name OR rcr.track IN ('Newcastle', 'Beaumont'))
 */
export function buildTrackMatchCondition(
  ttrTrackColumn: string = 'rcr.track',
  pfTrackColumn: string = 'm.track_name'
): string {
  // For now, use simple equality since we'll be standardizing track names in the database
  // This can be enhanced later if needed
  return `${ttrTrackColumn} = ${pfTrackColumn}`;
}

/**
 * Get all possible track name variations for a given track
 * 
 * Used to build dynamic SQL queries that try multiple track name variations.
 * 
 * @param trackName - Track name to get variations for
 * @param surface - Optional surface type
 * @returns Array of track name variations
 */
export async function getTrackVariationsForSQL(
  trackName: string,
  surface?: string
): Promise<string[]> {
  const matches = getAllPossibleMatches(trackName, surface);
  
  // Combine both TTR and PuntingForm variations
  const allVariations = new Set([
    ...matches.ttr,
    ...matches.puntingForm
  ]);
  
  return Array.from(allVariations);
}

/**
 * Build SQL IN clause for track name matching
 * 
 * Creates parameterized SQL IN clause for track name variations.
 * 
 * @param trackNames - Array of track name variations
 * @param startParamIndex - Starting parameter index for SQL query
 * @returns Object with SQL clause and values array
 * 
 * @example
 * const variations = ['Newcastle', 'Beaumont'];
 * const clause = buildTrackInClause(variations, 3);
 * // Returns: { sql: '$3, $4', values: ['Newcastle', 'Beaumont'] }
 */
export function buildTrackInClause(
  trackNames: string[],
  startParamIndex: number
): { sql: string; values: string[] } {
  if (trackNames.length === 0) {
    return { sql: '', values: [] };
  }
  
  const placeholders = trackNames.map((_, i) => 
    `$${startParamIndex + i}`
  ).join(', ');
  
  return {
    sql: placeholders,
    values: trackNames
  };
}
