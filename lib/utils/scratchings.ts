import { Scratching } from '@/lib/hooks/useScratchings';

/**
 * Safe string comparison (handles undefined/null)
 */
function safeStringMatch(str1: string | undefined, str2: string | undefined): boolean {
  if (!str1 || !str2) return false;
  return str1.toLowerCase().trim() === str2.toLowerCase().trim();
}

/**
 * Check if a horse is scratched
 */
export function isHorseScratched(
  horseName: string,
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): boolean {
  if (!horseName || !trackName || !raceNumber) return false;
  
  return scratchings.some((s) => {
    // Try multiple property name variations
    const scratchingRecord = s as unknown as Record<string, unknown>;
    const sHorseName = s.horseName || scratchingRecord.runner || scratchingRecord.name;
    const sTrackName = s.trackName || scratchingRecord.track || scratchingRecord.venueName;
    const sRaceNumber = s.raceNumber || scratchingRecord.raceNo || scratchingRecord.race;
    
    return (
      safeStringMatch(String(sHorseName), horseName) &&
      safeStringMatch(String(sTrackName), trackName) &&
      sRaceNumber === raceNumber
    );
  });
}

/**
 * Get scratching details for a horse
 */
export function getScratchingDetails(
  horseName: string,
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): Scratching | undefined {
  if (!horseName || !trackName || !raceNumber) return undefined;
  
  return scratchings.find((s) => {
    const scratchingRecord = s as unknown as Record<string, unknown>;
    const sHorseName = s.horseName || scratchingRecord.runner || scratchingRecord.name;
    const sTrackName = s.trackName || scratchingRecord.track || scratchingRecord.venueName;
    const sRaceNumber = s.raceNumber || scratchingRecord.raceNo || scratchingRecord.race;
    
    return (
      safeStringMatch(String(sHorseName), horseName) &&
      safeStringMatch(String(sTrackName), trackName) &&
      sRaceNumber === raceNumber
    );
  });
}

/**
 * Count scratchings for a specific race
 */
export function countScratchingsForRace(
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): number {
  if (!trackName || !raceNumber) return 0;
  
  return scratchings.filter((s) => {
    const scratchingRecord = s as unknown as Record<string, unknown>;
    const sTrackName = s.trackName || scratchingRecord.track || scratchingRecord.venueName;
    const sRaceNumber = s.raceNumber || scratchingRecord.raceNo || scratchingRecord.race;
    
    return (
      safeStringMatch(String(sTrackName), trackName) &&
      sRaceNumber === raceNumber
    );
  }).length;
}

/**
 * Filter out scratched horses from a race
 */
export function filterScratched<T extends { horse_name: string }>(
  horses: T[],
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): T[] {
  if (!horses || !trackName || !raceNumber) return horses;
  
  return horses.filter(
    (horse) => !isHorseScratched(horse.horse_name, trackName, raceNumber, scratchings)
  );
}
