import { horseNamesMatch } from './horse-name-matcher';

/**
 * Normalize track name for comparison
 */
function normalizeTrackName(trackName: string): string {
  if (!trackName) return '';
  
  let normalized = trackName.toLowerCase().trim();
  
  // Replace hyphens with spaces for consistent matching
  normalized = normalized.replace(/-/g, ' ');
  
  // Remove common suffixes
  const suffixes = ['racecourse', 'gardens', 'hillside', 'lakeside', 'park', 'racing', 'raceway'];
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
export function tracksMatch(track1: string, track2: string): boolean {
  if (!track1 || !track2) return false;
  
  const normalized1 = normalizeTrackName(track1);
  const normalized2 = normalizeTrackName(track2);
  
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

export interface Scratching {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  trackName?: string;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}

export function isHorseScratched(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number,
  horseName: string,
  trackName?: string
): boolean {
  return scratchings.some(
    s =>
      s.meetingId === meetingId &&
      s.raceNumber === raceNumber &&
      horseNamesMatch(s.horseName, horseName) &&
      (!trackName || !s.trackName || tracksMatch(s.trackName, trackName))
  );
}

export function getScratchingInfo(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number,
  horseName: string,
  trackName?: string
): Scratching | undefined {
  console.log(`🔍 [Matcher] Looking for scratching:`, {
    meetingId,
    raceNumber,
    horseName,
    trackName,
    availableScratchings: scratchings.length
  });
  
  const result = scratchings.find(
    s => {
      const meetingMatch = s.meetingId === meetingId;
      const raceMatch = s.raceNumber === raceNumber;
      const nameMatch = horseNamesMatch(s.horseName, horseName);
      const trackMatch = !trackName || !s.trackName || tracksMatch(s.trackName, trackName);
      
      if (nameMatch && raceMatch) {
        console.log(`🎯 [Matcher] Potential match found:`, {
          scratchedHorse: s.horseName,
          searchHorse: horseName,
          meetingMatch,
          raceMatch,
          nameMatch,
          trackMatch,
          overallMatch: meetingMatch && raceMatch && nameMatch && trackMatch
        });
      }
      
      return meetingMatch && raceMatch && nameMatch && trackMatch;
    }
  );
  
  if (result) {
    console.log(`✅ [Matcher] Match found:`, result);
  } else {
    console.log(`❌ [Matcher] No match found for ${horseName} in R${raceNumber}`);
  }
  
  return result;
}

export function getScratchingsForRace(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number
): Scratching[] {
  return scratchings.filter(
    s => s.meetingId === meetingId && s.raceNumber === raceNumber
  );
}
