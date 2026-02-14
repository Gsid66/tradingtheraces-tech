// Configuration for racing-bet-data.com scraper

export const SCRAPER_CONFIG = {
  // Base URL for racing-bet-data.com
  baseUrl: 'https://www.racing-bet-data.com',
  
  // Browser options
  headless: process.env.NODE_ENV === 'production',
  timeout: 30000, // 30 seconds
  
  // Download directory
  downloadDir: '/tmp/racing-downloads',
  
  // File retention
  retentionDays: 7, // Keep downloaded files for 7 days
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  
  // Rate limiting (to be respectful to the source website)
  requestDelay: 2000, // 2 seconds between requests
  
  // File patterns
  filePatterns: {
    results: /RBDResults.*\.(csv|xlsx)$/i,
    ratings: /Daily.*\.(csv|xlsx)$/i,
  },
  
  // Expected CSV columns for results
  resultsColumns: [
    'Date of Race',
    'Track',
    'Horse',
    'Jockey',
    'Trainer',
    'Distance',
    'Weight',
    'Place',
    'Winning Distance',
    'Official Rating',
    'RBD Rating',
    'RBD Rank',
    'SP',
    'Betfair SP',
  ],
  
  // Expected CSV columns for ratings/fields
  ratingsColumns: [
    'Date',
    'Track',
    'Horse',
    'Jockey',
    'Trainer',
    'Distance',
    'Weight',
    'RBD Rating',
    'RBD Rank',
    'Forecasted Odds',
  ],
  
  // Jurisdiction filters
  jurisdictions: {
    uk: 'UK',
    ireland: 'IRE',
    both: 'UK & IRE',
  },
} as const;

// CSV parsing options
export const CSV_PARSE_OPTIONS = {
  encoding: 'utf-8' as const,
  fallbackEncodings: ['utf-8-sig', 'iso-8859-1', 'windows-1252'],
  skipEmptyLines: true,
  trim: true,
};

// Database batch size
export const DB_BATCH_SIZE = 100;

// Common track name mappings (for normalization)
export const TRACK_NAME_MAPPINGS: Record<string, { normalized: string; country: 'UK' | 'IRE' }> = {
  'ascot': { normalized: 'Ascot', country: 'UK' },
  'cheltenham': { normalized: 'Cheltenham', country: 'UK' },
  'newmarket': { normalized: 'Newmarket', country: 'UK' },
  'york': { normalized: 'York', country: 'UK' },
  'epsom': { normalized: 'Epsom', country: 'UK' },
  'goodwood': { normalized: 'Goodwood', country: 'UK' },
  'sandown': { normalized: 'Sandown', country: 'UK' },
  'kempton': { normalized: 'Kempton', country: 'UK' },
  'doncaster': { normalized: 'Doncaster', country: 'UK' },
  'aintree': { normalized: 'Aintree', country: 'UK' },
  
  'curragh': { normalized: 'Curragh', country: 'IRE' },
  'leopardstown': { normalized: 'Leopardstown', country: 'IRE' },
  'galway': { normalized: 'Galway', country: 'IRE' },
  'fairyhouse': { normalized: 'Fairyhouse', country: 'IRE' },
  'punchestown': { normalized: 'Punchestown', country: 'IRE' },
  'navan': { normalized: 'Navan', country: 'IRE' },
  'downpatrick': { normalized: 'Downpatrick', country: 'IRE' },
  'gowran park': { normalized: 'Gowran Park', country: 'IRE' },
  'cork': { normalized: 'Cork', country: 'IRE' },
  'tipperary': { normalized: 'Tipperary', country: 'IRE' },
};

// Determine country from track name
export function getTrackCountry(trackName: string): 'UK' | 'IRE' {
  const normalized = trackName.toLowerCase().trim();
  
  if (TRACK_NAME_MAPPINGS[normalized]) {
    return TRACK_NAME_MAPPINGS[normalized].country;
  }
  
  // Default heuristics
  const irishIndicators = ['curragh', 'leopardstown', 'galway', 'punchestown', 'fairyhouse', 'navan', 'cork', 'tipperary', 'downpatrick', 'gowran'];
  if (irishIndicators.some(indicator => normalized.includes(indicator))) {
    return 'IRE';
  }
  
  // Default to UK
  return 'UK';
}

// Normalize track name
export function normalizeTrackName(trackName: string): string {
  const normalized = trackName.toLowerCase().trim();
  
  if (TRACK_NAME_MAPPINGS[normalized]) {
    return TRACK_NAME_MAPPINGS[normalized].normalized;
  }
  
  // Capitalize first letter of each word
  return trackName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}
