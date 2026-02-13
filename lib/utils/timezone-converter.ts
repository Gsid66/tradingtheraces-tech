export const STATE_TIMEZONES: Record<string, string> = {
  'NSW': 'Australia/Sydney',
  'VIC': 'Australia/Melbourne',
  'ACT': 'Australia/Sydney',
  'TAS': 'Australia/Hobart',
  'QLD': 'Australia/Brisbane',
  'SA': 'Australia/Adelaide',
  'NT': 'Australia/Darwin',
  'WA': 'Australia/Perth',
  'NZ': 'Pacific/Auckland',
};

// Mapping of track names to states for timezone conversion
const TRACK_TO_STATE: Record<string, string> = {
  // NSW
  'randwick': 'NSW',
  'rosehill': 'NSW',
  'warwick farm': 'NSW',
  'canterbury': 'NSW',
  'kensington': 'NSW',
  'newcastle': 'NSW',
  'gosford': 'NSW',
  'wyong': 'NSW',
  'hawkesbury': 'NSW',
  'muswellbrook': 'NSW',
  'scone': 'NSW',
  'tamworth': 'NSW',
  'dubbo': 'NSW',
  'bathurst': 'NSW',
  'wagga': 'NSW',
  'albury': 'NSW',
  'canberra': 'ACT',
  // VIC
  'flemington': 'VIC',
  'caulfield': 'VIC',
  'moonee valley': 'VIC',
  'sandown': 'VIC',
  'bendigo': 'VIC',
  'ballarat': 'VIC',
  'geelong': 'VIC',
  'cranbourne': 'VIC',
  'pakenham': 'VIC',
  'mornington': 'VIC',
  'sale': 'VIC',
  'warrnambool': 'VIC',
  'hamilton': 'VIC',
  'kilmore': 'VIC',
  // QLD
  'eagle farm': 'QLD',
  'doomben': 'QLD',
  'gold coast': 'QLD',
  'sunshine coast': 'QLD',
  'ipswich': 'QLD',
  'toowoomba': 'QLD',
  'cairns': 'QLD',
  'townsville': 'QLD',
  'rockhampton': 'QLD',
  'mackay': 'QLD',
  'bundaberg': 'QLD',
  'gatton': 'QLD',
  'beaudesert': 'QLD',
  'dalby': 'QLD',
  'chinchilla': 'QLD',
  'roma': 'QLD',
  'warwick': 'QLD',
  // SA
  'morphettville': 'SA',
  'murray bridge': 'SA',
  'gawler': 'SA',
  'port lincoln': 'SA',
  // WA
  'ascot': 'WA',
  'belmont': 'WA',
  'belmont park': 'WA',
  'bunbury': 'WA',
  'albany': 'WA',
  'geraldton': 'WA',
  'kalgoorlie': 'WA',
  'northam': 'WA',
  'pinjarra': 'WA',
  // TAS
  'launceston': 'TAS',
  'hobart': 'TAS',
  'devonport': 'TAS',
  'elwick': 'TAS',
  'mowbray': 'TAS',
  // NT
  'darwin': 'NT',
  'fannie bay': 'NT',
  'alice springs': 'NT',
  'pioneer park': 'NT',  // ← ADDED THIS LINE
  // NZ
  'te rapa': 'NZ',
  'ellerslie': 'NZ',
  'trentham': 'NZ',
  'riccarton': 'NZ',
  'awapuni': 'NZ',
  'hastings': 'NZ',
  'new plymouth': 'NZ',
  'wanganui': 'NZ',
  'woodville': 'NZ',
  'avondale': 'NZ',
  'rotorua': 'NZ',
  'ruakaka': 'NZ',
  'matamata': 'NZ',
  'pukekohe': 'NZ',
  'paeroa': 'NZ',
  'otaki': 'NZ',
  'foxton': 'NZ',
  'waverley': 'NZ',
  'hawera': 'NZ',
  'stratford': 'NZ',
  'taranaki': 'NZ',
  'wanganui jockey club': 'NZ',
  'manawatu': 'NZ',
  'ashburton': 'NZ',
  'timaru': 'NZ',
  'oamaru': 'NZ',
  'waimate': 'NZ',
  'ashburton trotting': 'NZ',
  'banks peninsula': 'NZ',
  'methven': 'NZ',
  'reefton': 'NZ',
  'westport': 'NZ',
  'hokitika': 'NZ',
  'greymouth': 'NZ',
  'nelson': 'NZ',
  'blenheim': 'NZ',
  'omakau': 'NZ',
  'gore': 'NZ',
  'invercargill': 'NZ',
  'winton': 'NZ',
  'riverton': 'NZ',
  'queenstown': 'NZ',
  'cromwell': 'NZ',
  'alexandra': 'NZ',
  'kurow': 'NZ',
  'tauherenikau': 'NZ',
  'te aroha': 'NZ',
};

export function getStateFromTrackName(trackName: string): string {
  const normalized = trackName.toLowerCase().trim();
  const state = TRACK_TO_STATE[normalized];
  
  if (!state) {
    console.warn(`Track '${trackName}' not found in timezone mapping, defaulting to NSW/AEDT`);
    return 'NSW'; // Default to NSW/AEDT
  }
  
  return state;
}

export function convertToAEDT(timeStr: string, state: string, raceDate?: Date): string {
  if (!timeStr || !state) return timeStr;
  
  const venueTimezone = STATE_TIMEZONES[state.toUpperCase()];
  if (!venueTimezone) return timeStr;
  
  try {
    // Parse the time string
    const time12h = timeStr.trim().toLowerCase();
    const timeMatch = time12h.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
    if (!timeMatch) return timeStr;
    
    const [_, hours, minutes, period] = timeMatch;
    
    // Use the race date if provided, otherwise use today
    const baseDate = raceDate || new Date();
    
    // Create a time string for parsing
    const timeFor12HourFormat = period 
      ? `${hours}:${minutes} ${period.toUpperCase()}`
      : `${hours}:${minutes}`;
    
    // Import date-fns functions at runtime
    const { fromZonedTime, formatInTimeZone } = require('date-fns-tz');
    const { parse } = require('date-fns');
    
    // Parse as 12-hour or 24-hour depending on format
    const parsedTime = period
      ? parse(timeFor12HourFormat, 'h:mm a', baseDate)
      : parse(timeFor12HourFormat, 'H:mm', baseDate);
    
    // Interpret this time as being in the venue's timezone and convert to UTC
    const utcTime = fromZonedTime(parsedTime, venueTimezone);
    
    // Format directly from UTC to AEDT timezone
    return formatInTimeZone(utcTime, 'Australia/Sydney', 'h:mm a');
    
  } catch (error) {
    console.error('Error converting time:', error);
    return timeStr;
  }
}

export function convertTo24Hour(time12h: string): string {
  if (!time12h) return '00:00';
  
  const cleaned = time12h.trim().toLowerCase();
  if (!cleaned.includes('am') && !cleaned.includes('pm')) {
    return cleaned;
  }
  
  const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (!timeMatch) return cleaned;
  
  let [_, hours, minutes, period] = timeMatch;
  let hour = parseInt(hours);
  
  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Convert a full datetime string from track local time to AEDT
 * Handles format: "1/29/2026 1:40:00 PM"
 */
export function convertDateTimeToAEDT(dateTimeStr: string, state: string): Date | null {
  if (!dateTimeStr || !state) return null;
  
  const venueTimezone = STATE_TIMEZONES[state.toUpperCase()];
  if (!venueTimezone) return null;
  
  try {
    // Parse the datetime string: "M/d/yyyy h:mm:ss a"
    const match = dateTimeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (!match) return null;
    
    const [, month, day, year, hours, minutes, seconds, period] = match;
    
    // Import date-fns functions at runtime
    const { fromZonedTime, toZonedTime } = require('date-fns-tz');
    const { parse } = require('date-fns');
    
    // Create date string in a parseable format
    const dateStr = `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${period}`;
    const parsedDate = parse(dateStr, 'M/d/yyyy h:mm:ss a', new Date());
    
    // Interpret as being in the venue's timezone and convert to UTC
    const utcTime = fromZonedTime(parsedDate, venueTimezone);
    
    // Convert to AEDT and return as Date object
    return toZonedTime(utcTime, 'Australia/Sydney');
    
  } catch (error) {
    console.error('Error converting datetime:', error);
    return null;
  }
}
