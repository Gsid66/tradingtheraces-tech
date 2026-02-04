/**
 * Track Name Mappings Configuration
 * 
 * This file contains comprehensive mappings for track names between:
 * - TTR (Trading The Races) ratings data
 * - PuntingForm API data
 * 
 * Handles surface-specific track variations where the same venue has
 * different names based on racing surface (turf vs synthetic).
 */

/**
 * Surface-specific track mappings
 * 
 * For tracks that have different names based on racing surface.
 * Each entry contains:
 * - turfName: Name used for turf racing
 * - syntheticName: Name used for synthetic surface racing
 * - location: Physical location for reference
 */
export const SURFACE_SPECIFIC_TRACKS: Record<string, {
  turfName: string;
  syntheticName: string;
  location: string;
}> = {
  'newcastle': {
    turfName: 'Newcastle',
    syntheticName: 'Beaumont',
    location: 'Newcastle, NSW'
  },
  // Add more surface-specific tracks as identified
};

/**
 * TTR to PuntingForm track name mapping
 * 
 * Maps TTR track names to all possible PuntingForm variations.
 * Returns array to handle:
 * - Surface-specific variations (Newcastle -> Newcastle or Beaumont)
 * - Name variations (Canterbury -> Canterbury Park)
 */
export const TTR_TO_PUNTINGFORM: Record<string, string[]> = {
  // Surface-specific tracks
  'newcastle': ['Newcastle', 'Beaumont'],
  
  // Common name variations
  'sandown': ['Sandown Hillside', 'Sandown Lakeside'],
  'canterbury': ['Canterbury Park'],
  'rosehill': ['Rosehill Gardens'],
  'moonee valley': ['Moonee Valley', 'The Valley'],
  'warwick farm': ['Warwick Farm'],
  
  // Tracks with exact match (no variation)
  'flemington': ['Flemington'],
  'randwick': ['Randwick'],
  'caulfield': ['Caulfield'],
  'doomben': ['Doomben'],
  'eagle farm': ['Eagle Farm'],
  'morphettville': ['Morphettville'],
  'ascot': ['Ascot'],
  'belmont': ['Belmont Park'],
  'gold coast': ['Gold Coast'],
  'sunshine coast': ['Sunshine Coast'],
  'ipswich': ['Ipswich'],
  'toowoomba': ['Toowoomba'],
  'rockhampton': ['Rockhampton'],
  'townsville': ['Townsville'],
  'cairns': ['Cairns'],
  'mackay': ['Mackay'],
  'bundaberg': ['Bundaberg'],
  'murray bridge': ['Murray Bridge'],
  'gawler': ['Gawler'],
  'strathalbyn': ['Strathalbyn'],
  'port lincoln': ['Port Lincoln'],
  'bordertown': ['Bordertown'],
  'mornington': ['Mornington'],
  'geelong': ['Geelong'],
  'ballarat': ['Ballarat'],
  'bendigo': ['Bendigo'],
  'hamilton': ['Hamilton'],
  'horsham': ['Horsham'],
  'sale': ['Sale'],
  'pakenham': ['Pakenham'],
  'cranbourne': ['Cranbourne'],
  'werribee': ['Werribee'],
  'kyneton': ['Kyneton'],
  'kilmore': ['Kilmore'],
  'gosford': ['Gosford'],
  'wyong': ['Wyong'],
  'hawkesbury': ['Hawkesbury'],
  'kembla grange': ['Kembla Grange'],
  'nowra': ['Nowra'],
  'goulburn': ['Goulburn'],
  'wagga': ['Wagga'],
  'albury': ['Albury'],
  'canberra': ['Canberra'],
  'moree': ['Moree'],
  'tamworth': ['Tamworth'],
  'armidale': ['Armidale'],
  'port macquarie': ['Port Macquarie'],
  'taree': ['Taree'],
  'scone': ['Scone'],
  'muswellbrook': ['Muswellbrook'],
  'dubbo': ['Dubbo'],
  'orange': ['Orange'],
  'bathurst': ['Bathurst'],
  'grafton': ['Grafton'],
  'lismore': ['Lismore'],
  'casino': ['Casino'],
  'ballina': ['Ballina'],
  'coffs harbour': ['Coffs Harbour'],
  'gilgandra': ['Gilgandra'],
  'inverell': ['Inverell'],
  'glen innes': ['Glen Innes'],
  'quirindi': ['Quirindi'],
  'mudgee': ['Mudgee'],
  'parkes': ['Parkes'],
  'forbes': ['Forbes'],
  'coonamble': ['Coonamble'],
  'coonabarabran': ['Coonabarabran'],
  'narromine': ['Narromine'],
  'wellington': ['Wellington'],
  'cowra': ['Cowra'],
  'young': ['Young'],
  'cootamundra': ['Cootamundra'],
  'junee': ['Junee'],
  'narrandera': ['Narrandera'],
  'griffith': ['Griffith'],
  'leeton': ['Leeton'],
  'hay': ['Hay'],
  'deniliquin': ['Deniliquin'],
  'corowa': ['Corowa'],
  'wodonga': ['Wodonga'],
  'wangaratta': ['Wangaratta'],
  'benalla': ['Benalla'],
  'mansfield': ['Mansfield'],
  'seymour': ['Seymour'],
  'yarra valley': ['Yarra Valley'],
  'swan hill': ['Swan Hill'],
  'mildura': ['Mildura'],
  'echuca': ['Echuca'],
  'yarrawonga': ['Yarrawonga'],
  'shepparton': ['Shepparton'],
  'wagga wagga': ['Wagga Wagga'],
};

/**
 * PuntingForm to TTR track name mapping (reverse)
 * 
 * Maps PuntingForm track names back to their TTR canonical name.
 * Used when matching TTR ratings with PuntingForm race data.
 */
export const PUNTINGFORM_TO_TTR: Record<string, string> = {
  // Surface-specific tracks
  'beaumont': 'Newcastle',
  'newcastle': 'Newcastle',
  
  // Common variations
  'sandown hillside': 'Sandown',
  'sandown lakeside': 'Sandown',
  'canterbury park': 'Canterbury',
  'rosehill gardens': 'Rosehill',
  'moonee valley': 'Moonee Valley',
  'the valley': 'Moonee Valley',
  'warwick farm': 'Warwick Farm',
  'belmont park': 'Belmont',
  
  // Exact matches
  'flemington': 'Flemington',
  'randwick': 'Randwick',
  'caulfield': 'Caulfield',
  'doomben': 'Doomben',
  'eagle farm': 'Eagle Farm',
  'morphettville': 'Morphettville',
  'ascot': 'Ascot',
  'gold coast': 'Gold Coast',
  'sunshine coast': 'Sunshine Coast',
  'ipswich': 'Ipswich',
  'toowoomba': 'Toowoomba',
  'rockhampton': 'Rockhampton',
  'townsville': 'Townsville',
  'cairns': 'Cairns',
  'mackay': 'Mackay',
  'bundaberg': 'Bundaberg',
  'murray bridge': 'Murray Bridge',
  'gawler': 'Gawler',
  'strathalbyn': 'Strathalbyn',
  'port lincoln': 'Port Lincoln',
  'bordertown': 'Bordertown',
  'mornington': 'Mornington',
  'geelong': 'Geelong',
  'ballarat': 'Ballarat',
  'bendigo': 'Bendigo',
  'hamilton': 'Hamilton',
  'horsham': 'Horsham',
  'sale': 'Sale',
  'pakenham': 'Pakenham',
  'cranbourne': 'Cranbourne',
  'werribee': 'Werribee',
  'kyneton': 'Kyneton',
  'kilmore': 'Kilmore',
  'gosford': 'Gosford',
  'wyong': 'Wyong',
  'hawkesbury': 'Hawkesbury',
  'kembla grange': 'Kembla Grange',
  'nowra': 'Nowra',
  'goulburn': 'Goulburn',
  'wagga': 'Wagga',
  'albury': 'Albury',
  'canberra': 'Canberra',
  'moree': 'Moree',
  'tamworth': 'Tamworth',
  'armidale': 'Armidale',
  'port macquarie': 'Port Macquarie',
  'taree': 'Taree',
  'scone': 'Scone',
  'muswellbrook': 'Muswellbrook',
  'dubbo': 'Dubbo',
  'orange': 'Orange',
  'bathurst': 'Bathurst',
  'grafton': 'Grafton',
  'lismore': 'Lismore',
  'casino': 'Casino',
  'ballina': 'Ballina',
  'coffs harbour': 'Coffs Harbour',
  'gilgandra': 'Gilgandra',
  'inverell': 'Inverell',
  'glen innes': 'Glen Innes',
  'quirindi': 'Quirindi',
  'mudgee': 'Mudgee',
  'parkes': 'Parkes',
  'forbes': 'Forbes',
  'coonamble': 'Coonamble',
  'coonabarabran': 'Coonabarabran',
  'narromine': 'Narromine',
  'wellington': 'Wellington',
  'cowra': 'Cowra',
  'young': 'Young',
  'cootamundra': 'Cootamundra',
  'junee': 'Junee',
  'narrandera': 'Narrandera',
  'griffith': 'Griffith',
  'leeton': 'Leeton',
  'hay': 'Hay',
  'deniliquin': 'Deniliquin',
  'corowa': 'Corowa',
  'wodonga': 'Wodonga',
  'wangaratta': 'Wangaratta',
  'benalla': 'Benalla',
  'mansfield': 'Mansfield',
  'seymour': 'Seymour',
  'yarra valley': 'Yarra Valley',
  'swan hill': 'Swan Hill',
  'mildura': 'Mildura',
  'echuca': 'Echuca',
  'yarrawonga': 'Yarrawonga',
  'shepparton': 'Shepparton',
  'wagga wagga': 'Wagga Wagga',
};

/**
 * Get the normalized key for track name lookup
 */
export function normalizeTrackKey(trackName: string): string {
  return trackName.toLowerCase().trim();
}
