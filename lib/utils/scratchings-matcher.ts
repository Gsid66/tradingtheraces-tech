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
  trackName?: string,
  tabNumber?: number
): boolean {
  return scratchings.some(s => {
    const meetingMatch = s.meetingId === meetingId;
    const raceMatch = s.raceNumber === raceNumber;
    
    // PRIORITY 1: TAB number matching (most reliable)
    if (tabNumber && s.tabNumber) {
      const tabMatch = s.tabNumber === tabNumber;
      if (meetingMatch && raceMatch && tabMatch) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [Matcher] TAB number match: ${horseName} (#${tabNumber})`);
        }
        return true;
      }
    }
    
    // PRIORITY 2: Horse name matching (fallback)
    const nameMatch = horseNamesMatch(s.horseName, horseName);
    const trackMatch = !trackName || !s.trackName || tracksMatch(s.trackName, trackName);
    
    const fullMatch = meetingMatch && raceMatch && nameMatch && trackMatch;
    
    if (fullMatch && process.env.NODE_ENV === 'development') {
      console.log(`✅ [Matcher] Name match: ${horseName} -> ${s.horseName}`);
    }
    
    return fullMatch;
  });
}

export function getScratchingInfo(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number,
  horseName: string,
  trackName?: string,
  tabNumber?: number
): Scratching | undefined {
  console.log(`🔍 [Matcher] Looking for scratching:`, {
    meetingId,
    raceNumber,
    horseName,
    tabNumber,
    trackName,
    availableScratchings: scratchings.length
  });
  
  // Try TAB number match first
  if (tabNumber) {
    const tabMatch = scratchings.find(
      s => s.meetingId === meetingId && 
           s.raceNumber === raceNumber && 
           s.tabNumber === tabNumber
    );
    
    if (tabMatch) {
      console.log(`✅ [Matcher] TAB number match found:`, tabMatch);
      return tabMatch;
    }
  }
  
  // Fall back to name matching
  const result = scratchings.find(s => {
    const meetingMatch = s.meetingId === meetingId;
    const raceMatch = s.raceNumber === raceNumber;
    const nameMatch = horseNamesMatch(s.horseName, horseName);
    const trackMatch = !trackName || !s.trackName || tracksMatch(s.trackName, trackName);
    
    if (nameMatch && raceMatch) {
      console.log(`🎯 [Matcher] Potential match found:`, {
        scratchedHorse: s.horseName,
        scratchedTabNo: s.tabNumber,
        searchHorse: horseName,
        searchTabNo: tabNumber,
        meetingMatch,
        raceMatch,
        nameMatch,
        trackMatch,
        overallMatch: meetingMatch && raceMatch && nameMatch && trackMatch
      });
    }
    
    return meetingMatch && raceMatch && nameMatch && trackMatch;
  });
  
  if (result) {
    console.log(`✅ [Matcher] Name-based match found:`, result);
  } else {
    console.log(`❌ [Matcher] No match found for ${horseName} (#${tabNumber || 'N/A'}) in R${raceNumber}`);
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
