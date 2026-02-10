export function normalizeHorseName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/['`'']/g, '')      // Remove all apostrophe variants
    .replace(/[.]/g, '')          // Remove periods
    .replace(/[-–—]/g, ' ')       // Replace all dash variants with space
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * (measure of similarity - lower is more similar)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Fuzzy horse name matching - handles common variations
 */
export function horseNamesMatch(name1: string | null | undefined, name2: string | null | undefined): boolean {
  const normalized1 = normalizeHorseName(name1);
  const normalized2 = normalizeHorseName(name2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // FUZZY MATCHING: Handle common variations
  
  // 1. Remove all spaces and compare (handles "FAST LANE" vs "Fastlane")
  const noSpaces1 = normalized1.replace(/\s/g, '');
  const noSpaces2 = normalized2.replace(/\s/g, '');
  if (noSpaces1 === noSpaces2) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [Matcher] Fuzzy match (no spaces): "${name1}" ≈ "${name2}"`);
    }
    return true;
  }
  
  // 2. Check if one name contains the other (with minimum length threshold)
  const minLength = Math.min(normalized1.length, normalized2.length);
  if (minLength >= 8) {  // Only for reasonably long names
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [Matcher] Fuzzy match (substring): "${name1}" ≈ "${name2}"`);
      }
      return true;
    }
  }
  
  // 3. Calculate Levenshtein distance for very close matches (typos)
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxAllowedDistance = Math.floor(Math.max(normalized1.length, normalized2.length) * 0.15); // Allow 15% difference
  
  if (distance <= maxAllowedDistance && distance <= 3) {  // Max 3 character difference
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [Matcher] Fuzzy match (typo tolerance): "${name1}" ≈ "${name2}" (distance: ${distance})`);
    }
    return true;
  }
  
  return false;
}
