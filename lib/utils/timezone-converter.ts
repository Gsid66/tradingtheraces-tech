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
  const state = TRACK_TO_STATE[normalized];
  
  if (!state) {
    console.warn(`Track '${trackName}' not found in timezone mapping, defaulting to NSW/AEDT`);
    return 'NSW'; // Default to NSW/AEDT
  }
  
  return state;
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
    
    // Get today's date in the venue's timezone
    const venueDate = new Date().toLocaleString('en-US', { 
      timeZone: venueTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = venueDate.split(',')[0].split('/');
    
    // Create a date string in the venue's timezone
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minutes}:00`;
    
    // Parse the date as if it's in the venue timezone by using toLocaleString
    // We create a formatter that will interpret the time in the venue timezone
    const venueDateObj = new Date(dateStr + 'Z'); // Treat as UTC first
    
    // Get the offset difference between venue timezone and UTC
    const venueOffsetStr = venueDateObj.toLocaleString('en-US', {
      timeZone: venueTimezone,
      timeZoneName: 'short'
    });
    
    // Now create the actual time in the venue timezone
    // by using a more reliable method: create ISO string and parse in venue timezone
    const testDate = new Date();
    testDate.setHours(hour, parseInt(minutes), 0, 0);
    
    // Format the time in AEDT
    const aedtTime = testDate.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: undefined
    });
    
    // Get UTC offsets to calculate the time difference
    const venueFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: venueTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const aedtFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute: '2-digit', 
      hour12: false
    });
    
    // Create a reference date to calculate offset
    const refDate = new Date('2024-01-15T12:00:00Z'); // Mid-summer date when DST is active
    const venueTime24 = venueFormatter.format(refDate);
    const aedtTime24 = aedtFormatter.format(refDate);
    
    // Calculate hour offset
    const [venueHour, venueMin] = venueTime24.split(':').map(Number);
    const [aedtHour, aedtMin] = aedtTime24.split(':').map(Number);
    const offsetHours = aedtHour - venueHour;
    const offsetMins = aedtMin - venueMin;
    
    // Apply offset to the race time
    let resultHour = hour + offsetHours;
    let resultMin = parseInt(minutes) + offsetMins;
    
    // Handle minute overflow
    if (resultMin >= 60) {
      resultHour += 1;
      resultMin -= 60;
    } else if (resultMin < 0) {
      resultHour -= 1;
      resultMin += 60;
    }
    
    // Handle hour overflow
    if (resultHour >= 24) {
      resultHour -= 24;
    } else if (resultHour < 0) {
      resultHour += 24;
    }
    
    // Format back to 12-hour time
    const ampm = resultHour >= 12 ? 'pm' : 'am';
    const display12Hour = resultHour % 12 || 12;
    
    return `${display12Hour}:${resultMin.toString().padStart(2, '0')} ${ampm}`;
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
