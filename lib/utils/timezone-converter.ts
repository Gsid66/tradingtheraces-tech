const STATE_TIMEZONES: Record<string, string> = {
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
    
    // Convert to 24-hour format
    if (period) {
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
    }
    
    // Get today's date
    const today = new Date();
    
    // Create a date/time string that represents the time in the venue's timezone
    // We'll use toLocaleString to parse it correctly
    const dateStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr24 = `${hour.toString().padStart(2, '0')}:${minutes}:00`;
    
    // Create ISO string (this is in local browser timezone, but we'll adjust)
    const isoStr = `${dateStr}T${timeStr24}`;
    
    // The key insight: we need to treat the input time as if it's in the venue timezone
    // and convert it to AEDT. We do this by:
    // 1. Creating a reference date
    // 2. Formatting it in both timezones
    // 3. Calculating the offset
    // 4. Applying that offset to our time
    
    const refDate = today;
    
    // Format reference in venue timezone to get its representation
    const venueFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: venueTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Format reference in AEDT to get its representation
    const aedtFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Get the same moment in time in both timezones
    const venueTimeStr = venueFormatter.format(refDate);
    const aedtTimeStr = aedtFormatter.format(refDate);
    
    // Parse the times to get hours and minutes
    const [venueHour, venueMin] = venueTimeStr.split(':').map(Number);
    const [aedtHour, aedtMin] = aedtTimeStr.split(':').map(Number);
    
    // Calculate the total offset in minutes
    const venueTotalMins = venueHour * 60 + venueMin;
    const aedtTotalMins = aedtHour * 60 + aedtMin;
    const offsetMins = aedtTotalMins - venueTotalMins;
    
    // Apply offset to our race time
    const raceTotalMins = hour * 60 + parseInt(minutes);
    let resultTotalMins = raceTotalMins + offsetMins;
    
    // Handle day overflow/underflow
    if (resultTotalMins >= 24 * 60) {
      resultTotalMins -= 24 * 60;
    } else if (resultTotalMins < 0) {
      resultTotalMins += 24 * 60;
    }
    
    // Convert back to hours and minutes
    const resultHour = Math.floor(resultTotalMins / 60);
    const resultMin = resultTotalMins % 60;
    
    // Format as 12-hour time
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
