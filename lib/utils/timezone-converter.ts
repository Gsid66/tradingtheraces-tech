const STATE_TIMEZONES: Record<string, string> = {
  'NSW': 'Australia/Sydney',
  'VIC': 'Australia/Melbourne',
  'ACT': 'Australia/Sydney',
  'TAS': 'Australia/Hobart',
  'QLD': 'Australia/Brisbane',
  'SA': 'Australia/Adelaide',
  'NT': 'Australia/Darwin',
  'WA': 'Australia/Perth',
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
  // SA
  'morphettville': 'SA',
  'murray bridge': 'SA',
  'gawler': 'SA',
  'port lincoln': 'SA',
  // WA
  'ascot': 'WA',
  'belmont': 'WA',
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
};

export function getStateFromTrackName(trackName: string): string {
  const normalized = trackName.toLowerCase().trim();
  return TRACK_TO_STATE[normalized] || 'NSW'; // Default to NSW/AEDT
}

export function convertToAEDT(timeStr: string, state: string): string {
  if (!timeStr || !state) return timeStr;
  
  const venueTimezone = STATE_TIMEZONES[state.toUpperCase()];
  if (!venueTimezone) return timeStr;
  
  try {
    const time12h = timeStr.trim().toLowerCase();
    const timeMatch = time12h.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
    if (!timeMatch) return timeStr;
    
    let [_, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);
    
    if (period) {
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dateStr = `${today}T${hour.toString().padStart(2, '0')}:${minutes}:00`;
    
    // Parse in venue timezone and format to AEDT
    const formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: venueTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const date = new Date(dateStr);
    const venueTime = date.toLocaleString('en-US', { timeZone: venueTimezone });
    const venueDate = new Date(venueTime);
    
    const aedtTime = venueDate.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return aedtTime;
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
