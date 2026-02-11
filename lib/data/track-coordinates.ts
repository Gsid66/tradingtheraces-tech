/**
 * Track Coordinates Database
 * 
 * Comprehensive mapping of Australian and New Zealand race track names
 * to their geographic coordinates for weather data integration.
 * 
 * Coordinates sourced from official racing venue information.
 */

export interface TrackCoordinates {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  state: string;
  country: string;
  timezone: string;
}

export const TRACK_COORDINATES: Record<string, TrackCoordinates> = {
  // NSW Tracks
  'randwick': {
    name: 'randwick',
    displayName: 'Randwick',
    latitude: -33.9103,
    longitude: 151.2417,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'rosehill': {
    name: 'rosehill',
    displayName: 'Rosehill Gardens',
    latitude: -33.8239,
    longitude: 151.0264,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'warwick farm': {
    name: 'warwick farm',
    displayName: 'Warwick Farm',
    latitude: -33.9156,
    longitude: 150.9328,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'canterbury': {
    name: 'canterbury',
    displayName: 'Canterbury Park',
    latitude: -33.9128,
    longitude: 151.1164,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'kensington': {
    name: 'kensington',
    displayName: 'Kensington',
    latitude: -33.9103,
    longitude: 151.2240,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'newcastle': {
    name: 'newcastle',
    displayName: 'Newcastle',
    latitude: -32.9452,
    longitude: 151.7533,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'gosford': {
    name: 'gosford',
    displayName: 'Gosford',
    latitude: -33.4256,
    longitude: 151.3431,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'wyong': {
    name: 'wyong',
    displayName: 'Wyong',
    latitude: -33.2833,
    longitude: 151.4167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'hawkesbury': {
    name: 'hawkesbury',
    displayName: 'Hawkesbury',
    latitude: -33.6103,
    longitude: 150.7494,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'muswellbrook': {
    name: 'muswellbrook',
    displayName: 'Muswellbrook',
    latitude: -32.2667,
    longitude: 150.8833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'scone': {
    name: 'scone',
    displayName: 'Scone',
    latitude: -32.0500,
    longitude: 150.8667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'tamworth': {
    name: 'tamworth',
    displayName: 'Tamworth',
    latitude: -31.0833,
    longitude: 150.9167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'dubbo': {
    name: 'dubbo',
    displayName: 'Dubbo',
    latitude: -32.2333,
    longitude: 148.6167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'bathurst': {
    name: 'bathurst',
    displayName: 'Bathurst',
    latitude: -33.4167,
    longitude: 149.5833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'wagga': {
    name: 'wagga',
    displayName: 'Wagga',
    latitude: -35.1167,
    longitude: 147.3667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'wagga wagga': {
    name: 'wagga wagga',
    displayName: 'Wagga Wagga',
    latitude: -35.1167,
    longitude: 147.3667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'albury': {
    name: 'albury',
    displayName: 'Albury',
    latitude: -36.0833,
    longitude: 146.9167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'kembla grange': {
    name: 'kembla grange',
    displayName: 'Kembla Grange',
    latitude: -34.4731,
    longitude: 150.8183,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'nowra': {
    name: 'nowra',
    displayName: 'Nowra',
    latitude: -34.8833,
    longitude: 150.6000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'goulburn': {
    name: 'goulburn',
    displayName: 'Goulburn',
    latitude: -34.7667,
    longitude: 149.7167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'armidale': {
    name: 'armidale',
    displayName: 'Armidale',
    latitude: -30.5167,
    longitude: 151.6500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'port macquarie': {
    name: 'port macquarie',
    displayName: 'Port Macquarie',
    latitude: -31.4333,
    longitude: 152.9000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'taree': {
    name: 'taree',
    displayName: 'Taree',
    latitude: -31.9000,
    longitude: 152.4667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'orange': {
    name: 'orange',
    displayName: 'Orange',
    latitude: -33.2833,
    longitude: 149.1000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'grafton': {
    name: 'grafton',
    displayName: 'Grafton',
    latitude: -29.6833,
    longitude: 152.9333,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'lismore': {
    name: 'lismore',
    displayName: 'Lismore',
    latitude: -28.8167,
    longitude: 153.2833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'casino': {
    name: 'casino',
    displayName: 'Casino',
    latitude: -28.8667,
    longitude: 153.0500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'ballina': {
    name: 'ballina',
    displayName: 'Ballina',
    latitude: -28.8667,
    longitude: 153.5500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'coffs harbour': {
    name: 'coffs harbour',
    displayName: 'Coffs Harbour',
    latitude: -30.3000,
    longitude: 153.1167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'moree': {
    name: 'moree',
    displayName: 'Moree',
    latitude: -29.4667,
    longitude: 149.8500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'gilgandra': {
    name: 'gilgandra',
    displayName: 'Gilgandra',
    latitude: -31.7167,
    longitude: 148.6667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'inverell': {
    name: 'inverell',
    displayName: 'Inverell',
    latitude: -29.7833,
    longitude: 151.1167,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'glen innes': {
    name: 'glen innes',
    displayName: 'Glen Innes',
    latitude: -29.7500,
    longitude: 151.7333,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'quirindi': {
    name: 'quirindi',
    displayName: 'Quirindi',
    latitude: -31.5000,
    longitude: 150.6833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'mudgee': {
    name: 'mudgee',
    displayName: 'Mudgee',
    latitude: -32.6000,
    longitude: 149.5833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'parkes': {
    name: 'parkes',
    displayName: 'Parkes',
    latitude: -33.1333,
    longitude: 148.1833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'forbes': {
    name: 'forbes',
    displayName: 'Forbes',
    latitude: -33.3833,
    longitude: 148.0000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'coonamble': {
    name: 'coonamble',
    displayName: 'Coonamble',
    latitude: -30.9667,
    longitude: 148.3833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'coonabarabran': {
    name: 'coonabarabran',
    displayName: 'Coonabarabran',
    latitude: -31.2833,
    longitude: 149.2833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'narromine': {
    name: 'narromine',
    displayName: 'Narromine',
    latitude: -32.2333,
    longitude: 148.2333,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'wellington': {
    name: 'wellington',
    displayName: 'Wellington',
    latitude: -32.5667,
    longitude: 148.9500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'cowra': {
    name: 'cowra',
    displayName: 'Cowra',
    latitude: -33.8333,
    longitude: 148.6833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'young': {
    name: 'young',
    displayName: 'Young',
    latitude: -34.3167,
    longitude: 148.3000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'cootamundra': {
    name: 'cootamundra',
    displayName: 'Cootamundra',
    latitude: -34.6500,
    longitude: 148.0333,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'junee': {
    name: 'junee',
    displayName: 'Junee',
    latitude: -34.8667,
    longitude: 147.5833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'narrandera': {
    name: 'narrandera',
    displayName: 'Narrandera',
    latitude: -34.7500,
    longitude: 146.5500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'griffith': {
    name: 'griffith',
    displayName: 'Griffith',
    latitude: -34.2833,
    longitude: 146.0500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'leeton': {
    name: 'leeton',
    displayName: 'Leeton',
    latitude: -34.5500,
    longitude: 146.4000,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'hay': {
    name: 'hay',
    displayName: 'Hay',
    latitude: -34.5167,
    longitude: 144.8500,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'deniliquin': {
    name: 'deniliquin',
    displayName: 'Deniliquin',
    latitude: -35.5333,
    longitude: 144.9667,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },
  'corowa': {
    name: 'corowa',
    displayName: 'Corowa',
    latitude: -36.0000,
    longitude: 146.3833,
    state: 'NSW',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },

  // ACT
  'canberra': {
    name: 'canberra',
    displayName: 'Canberra',
    latitude: -35.2975,
    longitude: 149.1012,
    state: 'ACT',
    country: 'AUS',
    timezone: 'Australia/Sydney'
  },

  // VIC Tracks
  'flemington': {
    name: 'flemington',
    displayName: 'Flemington',
    latitude: -37.7839,
    longitude: 144.9203,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'caulfield': {
    name: 'caulfield',
    displayName: 'Caulfield',
    latitude: -37.8850,
    longitude: 145.0411,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'moonee valley': {
    name: 'moonee valley',
    displayName: 'Moonee Valley',
    latitude: -37.7658,
    longitude: 144.9169,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'sandown': {
    name: 'sandown',
    displayName: 'Sandown',
    latitude: -37.9517,
    longitude: 145.1361,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'sandown hillside': {
    name: 'sandown hillside',
    displayName: 'Sandown Hillside',
    latitude: -37.9517,
    longitude: 145.1361,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'sandown lakeside': {
    name: 'sandown lakeside',
    displayName: 'Sandown Lakeside',
    latitude: -37.9517,
    longitude: 145.1361,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'bendigo': {
    name: 'bendigo',
    displayName: 'Bendigo',
    latitude: -36.7594,
    longitude: 144.2831,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'ballarat': {
    name: 'ballarat',
    displayName: 'Ballarat',
    latitude: -37.5667,
    longitude: 143.8500,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'geelong': {
    name: 'geelong',
    displayName: 'Geelong',
    latitude: -38.1450,
    longitude: 144.3581,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'cranbourne': {
    name: 'cranbourne',
    displayName: 'Cranbourne',
    latitude: -38.0997,
    longitude: 145.2831,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'pakenham': {
    name: 'pakenham',
    displayName: 'Pakenham',
    latitude: -38.0761,
    longitude: 145.4839,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'mornington': {
    name: 'mornington',
    displayName: 'Mornington',
    latitude: -38.2167,
    longitude: 145.0333,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'sale': {
    name: 'sale',
    displayName: 'Sale',
    latitude: -38.1000,
    longitude: 147.0667,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'warrnambool': {
    name: 'warrnambool',
    displayName: 'Warrnambool',
    latitude: -38.3833,
    longitude: 142.4833,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'hamilton': {
    name: 'hamilton',
    displayName: 'Hamilton',
    latitude: -37.7500,
    longitude: 142.0167,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'kilmore': {
    name: 'kilmore',
    displayName: 'Kilmore',
    latitude: -37.2833,
    longitude: 144.9500,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'horsham': {
    name: 'horsham',
    displayName: 'Horsham',
    latitude: -36.7167,
    longitude: 142.2000,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'werribee': {
    name: 'werribee',
    displayName: 'Werribee',
    latitude: -37.8975,
    longitude: 144.6644,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'kyneton': {
    name: 'kyneton',
    displayName: 'Kyneton',
    latitude: -37.2500,
    longitude: 144.4500,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'wodonga': {
    name: 'wodonga',
    displayName: 'Wodonga',
    latitude: -36.1167,
    longitude: 146.9000,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'wangaratta': {
    name: 'wangaratta',
    displayName: 'Wangaratta',
    latitude: -36.3667,
    longitude: 146.3167,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'benalla': {
    name: 'benalla',
    displayName: 'Benalla',
    latitude: -36.5500,
    longitude: 145.9833,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'mansfield': {
    name: 'mansfield',
    displayName: 'Mansfield',
    latitude: -37.0500,
    longitude: 146.0833,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'seymour': {
    name: 'seymour',
    displayName: 'Seymour',
    latitude: -37.0333,
    longitude: 145.1333,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'yarra valley': {
    name: 'yarra valley',
    displayName: 'Yarra Valley',
    latitude: -37.6833,
    longitude: 145.3667,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'swan hill': {
    name: 'swan hill',
    displayName: 'Swan Hill',
    latitude: -35.3333,
    longitude: 143.5500,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'mildura': {
    name: 'mildura',
    displayName: 'Mildura',
    latitude: -34.1878,
    longitude: 142.1603,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'echuca': {
    name: 'echuca',
    displayName: 'Echuca',
    latitude: -36.1333,
    longitude: 144.7500,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'yarrawonga': {
    name: 'yarrawonga',
    displayName: 'Yarrawonga',
    latitude: -36.0167,
    longitude: 146.0000,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },
  'shepparton': {
    name: 'shepparton',
    displayName: 'Shepparton',
    latitude: -36.3833,
    longitude: 145.4000,
    state: 'VIC',
    country: 'AUS',
    timezone: 'Australia/Melbourne'
  },

  // QLD Tracks
  'eagle farm': {
    name: 'eagle farm',
    displayName: 'Eagle Farm',
    latitude: -27.4308,
    longitude: 153.0664,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'doomben': {
    name: 'doomben',
    displayName: 'Doomben',
    latitude: -27.4256,
    longitude: 153.0717,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'gold coast': {
    name: 'gold coast',
    displayName: 'Gold Coast',
    latitude: -28.0833,
    longitude: 153.4167,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'sunshine coast': {
    name: 'sunshine coast',
    displayName: 'Sunshine Coast',
    latitude: -26.6500,
    longitude: 153.0667,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'ipswich': {
    name: 'ipswich',
    displayName: 'Ipswich',
    latitude: -27.6167,
    longitude: 152.7500,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'toowoomba': {
    name: 'toowoomba',
    displayName: 'Toowoomba',
    latitude: -27.5598,
    longitude: 151.9507,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'cairns': {
    name: 'cairns',
    displayName: 'Cairns',
    latitude: -16.9186,
    longitude: 145.7781,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'townsville': {
    name: 'townsville',
    displayName: 'Townsville',
    latitude: -19.2578,
    longitude: 146.8181,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'rockhampton': {
    name: 'rockhampton',
    displayName: 'Rockhampton',
    latitude: -23.3833,
    longitude: 150.5167,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'mackay': {
    name: 'mackay',
    displayName: 'Mackay',
    latitude: -21.1500,
    longitude: 149.1833,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'bundaberg': {
    name: 'bundaberg',
    displayName: 'Bundaberg',
    latitude: -24.8667,
    longitude: 152.3500,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'gatton': {
    name: 'gatton',
    displayName: 'Gatton',
    latitude: -27.5500,
    longitude: 152.2833,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'beaudesert': {
    name: 'beaudesert',
    displayName: 'Beaudesert',
    latitude: -27.9833,
    longitude: 152.9833,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'dalby': {
    name: 'dalby',
    displayName: 'Dalby',
    latitude: -27.1833,
    longitude: 151.2667,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'chinchilla': {
    name: 'chinchilla',
    displayName: 'Chinchilla',
    latitude: -26.7333,
    longitude: 150.6333,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'roma': {
    name: 'roma',
    displayName: 'Roma',
    latitude: -26.5667,
    longitude: 148.7833,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },
  'warwick': {
    name: 'warwick',
    displayName: 'Warwick',
    latitude: -28.2167,
    longitude: 152.0333,
    state: 'QLD',
    country: 'AUS',
    timezone: 'Australia/Brisbane'
  },

  // SA Tracks
  'morphettville': {
    name: 'morphettville',
    displayName: 'Morphettville',
    latitude: -34.9814,
    longitude: 138.5378,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },
  'murray bridge': {
    name: 'murray bridge',
    displayName: 'Murray Bridge',
    latitude: -35.1167,
    longitude: 139.2667,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },
  'gawler': {
    name: 'gawler',
    displayName: 'Gawler',
    latitude: -34.5999,
    longitude: 138.7444,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },
  'port lincoln': {
    name: 'port lincoln',
    displayName: 'Port Lincoln',
    latitude: -34.7333,
    longitude: 135.8667,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },
  'strathalbyn': {
    name: 'strathalbyn',
    displayName: 'Strathalbyn',
    latitude: -35.2667,
    longitude: 138.9000,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },
  'bordertown': {
    name: 'bordertown',
    displayName: 'Bordertown',
    latitude: -36.3167,
    longitude: 140.7667,
    state: 'SA',
    country: 'AUS',
    timezone: 'Australia/Adelaide'
  },

  // WA Tracks
  'ascot': {
    name: 'ascot',
    displayName: 'Ascot',
    latitude: -31.9333,
    longitude: 115.9333,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'belmont': {
    name: 'belmont',
    displayName: 'Belmont Park',
    latitude: -31.9500,
    longitude: 115.9167,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'belmont park': {
    name: 'belmont park',
    displayName: 'Belmont Park',
    latitude: -31.9500,
    longitude: 115.9167,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'bunbury': {
    name: 'bunbury',
    displayName: 'Bunbury',
    latitude: -33.3267,
    longitude: 115.6372,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'albany': {
    name: 'albany',
    displayName: 'Albany',
    latitude: -35.0167,
    longitude: 117.8833,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'geraldton': {
    name: 'geraldton',
    displayName: 'Geraldton',
    latitude: -28.7833,
    longitude: 114.6167,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'kalgoorlie': {
    name: 'kalgoorlie',
    displayName: 'Kalgoorlie',
    latitude: -30.7500,
    longitude: 121.4667,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'northam': {
    name: 'northam',
    displayName: 'Northam',
    latitude: -31.6500,
    longitude: 116.6667,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },
  'pinjarra': {
    name: 'pinjarra',
    displayName: 'Pinjarra',
    latitude: -32.6333,
    longitude: 115.8667,
    state: 'WA',
    country: 'AUS',
    timezone: 'Australia/Perth'
  },

  // TAS Tracks
  'launceston': {
    name: 'launceston',
    displayName: 'Launceston',
    latitude: -41.4419,
    longitude: 147.1450,
    state: 'TAS',
    country: 'AUS',
    timezone: 'Australia/Hobart'
  },
  'hobart': {
    name: 'hobart',
    displayName: 'Hobart',
    latitude: -42.8806,
    longitude: 147.3250,
    state: 'TAS',
    country: 'AUS',
    timezone: 'Australia/Hobart'
  },
  'devonport': {
    name: 'devonport',
    displayName: 'Devonport',
    latitude: -41.1833,
    longitude: 146.3500,
    state: 'TAS',
    country: 'AUS',
    timezone: 'Australia/Hobart'
  },
  'elwick': {
    name: 'elwick',
    displayName: 'Elwick',
    latitude: -42.8367,
    longitude: 147.3000,
    state: 'TAS',
    country: 'AUS',
    timezone: 'Australia/Hobart'
  },
  'mowbray': {
    name: 'mowbray',
    displayName: 'Mowbray',
    latitude: -41.4167,
    longitude: 147.1333,
    state: 'TAS',
    country: 'AUS',
    timezone: 'Australia/Hobart'
  },

  // NT Tracks
  'darwin': {
    name: 'darwin',
    displayName: 'Darwin',
    latitude: -12.4264,
    longitude: 130.8419,
    state: 'NT',
    country: 'AUS',
    timezone: 'Australia/Darwin'
  },
  'fannie bay': {
    name: 'fannie bay',
    displayName: 'Fannie Bay',
    latitude: -12.4333,
    longitude: 130.8333,
    state: 'NT',
    country: 'AUS',
    timezone: 'Australia/Darwin'
  },
  'alice springs': {
    name: 'alice springs',
    displayName: 'Alice Springs',
    latitude: -23.7000,
    longitude: 133.8833,
    state: 'NT',
    country: 'AUS',
    timezone: 'Australia/Darwin'
  },
  'pioneer park': {
    name: 'pioneer park',
    displayName: 'Pioneer Park',
    latitude: -23.6958,
    longitude: 133.8700,
    state: 'NT',
    country: 'AUS',
    timezone: 'Australia/Darwin'
  },

  // New Zealand Tracks
  'te rapa': {
    name: 'te rapa',
    displayName: 'Te Rapa',
    latitude: -37.7500,
    longitude: 175.2333,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'ellerslie': {
    name: 'ellerslie',
    displayName: 'Ellerslie',
    latitude: -36.9000,
    longitude: 174.8167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'trentham': {
    name: 'trentham',
    displayName: 'Trentham',
    latitude: -41.0833,
    longitude: 175.0000,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'riccarton': {
    name: 'riccarton',
    displayName: 'Riccarton',
    latitude: -43.5333,
    longitude: 172.5833,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'awapuni': {
    name: 'awapuni',
    displayName: 'Awapuni',
    latitude: -40.3667,
    longitude: 175.6167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'hastings': {
    name: 'hastings',
    displayName: 'Hastings',
    latitude: -39.6333,
    longitude: 176.8500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'new plymouth': {
    name: 'new plymouth',
    displayName: 'New Plymouth',
    latitude: -39.0667,
    longitude: 174.0667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'wanganui': {
    name: 'wanganui',
    displayName: 'Wanganui',
    latitude: -39.9333,
    longitude: 175.0500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'woodville': {
    name: 'woodville',
    displayName: 'Woodville',
    latitude: -40.3167,
    longitude: 175.8667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'avondale': {
    name: 'avondale',
    displayName: 'Avondale',
    latitude: -36.8833,
    longitude: 174.7000,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'rotorua': {
    name: 'rotorua',
    displayName: 'Rotorua',
    latitude: -38.1333,
    longitude: 176.2500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'ruakaka': {
    name: 'ruakaka',
    displayName: 'Ruakaka',
    latitude: -35.9167,
    longitude: 174.4333,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'matamata': {
    name: 'matamata',
    displayName: 'Matamata',
    latitude: -37.8167,
    longitude: 175.7667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'pukekohe': {
    name: 'pukekohe',
    displayName: 'Pukekohe',
    latitude: -37.2000,
    longitude: 174.9167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'paeroa': {
    name: 'paeroa',
    displayName: 'Paeroa',
    latitude: -37.3833,
    longitude: 175.6667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'otaki': {
    name: 'otaki',
    displayName: 'Otaki',
    latitude: -40.7500,
    longitude: 175.1667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'foxton': {
    name: 'foxton',
    displayName: 'Foxton',
    latitude: -40.4667,
    longitude: 175.2833,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'waverley': {
    name: 'waverley',
    displayName: 'Waverley',
    latitude: -39.7500,
    longitude: 174.6500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'hawera': {
    name: 'hawera',
    displayName: 'Hawera',
    latitude: -39.5833,
    longitude: 174.2833,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'stratford': {
    name: 'stratford',
    displayName: 'Stratford',
    latitude: -39.3333,
    longitude: 174.2833,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'taranaki': {
    name: 'taranaki',
    displayName: 'Taranaki',
    latitude: -39.0667,
    longitude: 174.0667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'wanganui jockey club': {
    name: 'wanganui jockey club',
    displayName: 'Wanganui Jockey Club',
    latitude: -39.9333,
    longitude: 175.0500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'manawatu': {
    name: 'manawatu',
    displayName: 'Manawatu',
    latitude: -40.3667,
    longitude: 175.6167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'ashburton': {
    name: 'ashburton',
    displayName: 'Ashburton',
    latitude: -43.9000,
    longitude: 171.7500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'timaru': {
    name: 'timaru',
    displayName: 'Timaru',
    latitude: -44.3833,
    longitude: 171.2500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'oamaru': {
    name: 'oamaru',
    displayName: 'Oamaru',
    latitude: -45.1000,
    longitude: 170.9667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'waimate': {
    name: 'waimate',
    displayName: 'Waimate',
    latitude: -44.7333,
    longitude: 171.0500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'ashburton trotting': {
    name: 'ashburton trotting',
    displayName: 'Ashburton Trotting',
    latitude: -43.9000,
    longitude: 171.7500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'banks peninsula': {
    name: 'banks peninsula',
    displayName: 'Banks Peninsula',
    latitude: -43.7500,
    longitude: 172.9667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'methven': {
    name: 'methven',
    displayName: 'Methven',
    latitude: -43.6333,
    longitude: 171.6500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'reefton': {
    name: 'reefton',
    displayName: 'Reefton',
    latitude: -42.1167,
    longitude: 171.8667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'westport': {
    name: 'westport',
    displayName: 'Westport',
    latitude: -41.7500,
    longitude: 171.6000,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'hokitika': {
    name: 'hokitika',
    displayName: 'Hokitika',
    latitude: -42.7167,
    longitude: 170.9667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'greymouth': {
    name: 'greymouth',
    displayName: 'Greymouth',
    latitude: -42.4500,
    longitude: 171.2000,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'nelson': {
    name: 'nelson',
    displayName: 'Nelson',
    latitude: -41.2706,
    longitude: 173.2840,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'blenheim': {
    name: 'blenheim',
    displayName: 'Blenheim',
    latitude: -41.5167,
    longitude: 173.9500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'omakau': {
    name: 'omakau',
    displayName: 'Omakau',
    latitude: -45.0833,
    longitude: 169.7500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'gore': {
    name: 'gore',
    displayName: 'Gore',
    latitude: -46.1000,
    longitude: 168.9500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'invercargill': {
    name: 'invercargill',
    displayName: 'Invercargill',
    latitude: -46.4167,
    longitude: 168.3500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'winton': {
    name: 'winton',
    displayName: 'Winton',
    latitude: -46.1500,
    longitude: 168.3333,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'riverton': {
    name: 'riverton',
    displayName: 'Riverton',
    latitude: -46.3500,
    longitude: 168.0167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'queenstown': {
    name: 'queenstown',
    displayName: 'Queenstown',
    latitude: -45.0311,
    longitude: 168.6626,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'cromwell': {
    name: 'cromwell',
    displayName: 'Cromwell',
    latitude: -45.0333,
    longitude: 169.2000,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'alexandra': {
    name: 'alexandra',
    displayName: 'Alexandra',
    latitude: -45.2500,
    longitude: 169.3833,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'kurow': {
    name: 'kurow',
    displayName: 'Kurow',
    latitude: -44.7333,
    longitude: 170.4667,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'tauherenikau': {
    name: 'tauherenikau',
    displayName: 'Tauherenikau',
    latitude: -41.2500,
    longitude: 175.2500,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
  'te aroha': {
    name: 'te aroha',
    displayName: 'Te Aroha',
    latitude: -37.5333,
    longitude: 175.7167,
    state: 'NZ',
    country: 'NZ',
    timezone: 'Pacific/Auckland'
  },
};

/**
 * Get track coordinates by track name (case-insensitive)
 */
export function getTrackCoordinates(trackName: string): TrackCoordinates | null {
  const normalized = trackName.toLowerCase().trim();
  return TRACK_COORDINATES[normalized] || null;
}

/**
 * Get all track names (for validation or autocomplete)
 */
export function getAllTrackNames(): string[] {
  return Object.keys(TRACK_COORDINATES);
}

/**
 * Get tracks by country
 */
export function getTracksByCountry(country: 'AUS' | 'NZ'): TrackCoordinates[] {
  return Object.values(TRACK_COORDINATES).filter(track => track.country === country);
}

/**
 * Get tracks by state
 */
export function getTracksByState(state: string): TrackCoordinates[] {
  return Object.values(TRACK_COORDINATES).filter(track => track.state === state);
}
