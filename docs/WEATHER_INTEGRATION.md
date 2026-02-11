# Weather Integration Documentation

## Overview

This document describes the integration of live weather data into the Trading The Races platform using the MET Norway (met.no) Locationforecast API. Weather data is displayed on race meeting cards and individual race pages, providing real-time conditions and forecasts for Australian and New Zealand race tracks.

## Features

- **Live Weather Data**: Real-time weather conditions for all race tracks
- **Hourly Forecasts**: 12-hour forecast for race day planning
- **Track-Specific Data**: Weather matched to exact track coordinates
- **Auto-Refresh**: Weather data refreshes every 30 minutes
- **Caching**: Database caching to minimize API calls
- **Graceful Degradation**: Pages work even if weather data is unavailable

## Architecture

### Data Flow

```
MET Norway API
      ↓
Weather Sync Script (runs every 30-60 min)
      ↓
PostgreSQL Database (track_weather & pf_meetings tables)
      ↓
Next.js API Routes (/api/weather/*)
      ↓
React Components (WeatherDisplay)
      ↓
User Interface
```

### Components

#### 1. Track Coordinates Database (`lib/data/track-coordinates.ts`)

Comprehensive mapping of track names to GPS coordinates for all Australian and New Zealand race tracks.

```typescript
interface TrackCoordinates {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  state: string;
  country: string;
  timezone: string;
}
```

**Tracks Covered**: 160+ tracks including:
- All major metropolitan tracks (Randwick, Flemington, Caulfield, etc.)
- Regional tracks across all states
- New Zealand racing venues

#### 2. MET Norway Client (`lib/integrations/weather/met-norway-client.ts`)

Client library for fetching and parsing weather data from MET Norway API.

**Key Functions**:
- `fetchWeatherForecast(lat, lon)` - Fetch raw forecast data
- `getCurrentWeather(forecast)` - Extract current conditions
- `getHourlyForecast(forecast, hours)` - Get hourly forecast
- `getWeatherAtTime(forecast, targetTime)` - Get weather at specific time
- `getWeatherWithCache(lat, lon)` - Fetch with in-memory caching

**Weather Symbols**: Maps MET Norway symbol codes to emojis:
- `clearsky_day` → ☀️
- `partlycloudy_day` → ⛅
- `cloudy` → ☁️
- `rain` → 🌧️
- `heavyrain` → ⛈️
- And many more...

#### 3. Database Schema

**track_weather table**:
```sql
- id (PRIMARY KEY)
- track_name (VARCHAR)
- latitude, longitude (DECIMAL)
- forecast_time (TIMESTAMP WITH TIME ZONE)
- temperature (DECIMAL) -- Celsius
- wind_speed (DECIMAL) -- m/s
- wind_direction (INTEGER) -- degrees
- precipitation (DECIMAL) -- mm
- weather_symbol (VARCHAR)
- weather_description (TEXT)
- fetched_at (TIMESTAMP)
```

**pf_meetings table additions**:
```sql
- current_temperature (DECIMAL)
- current_wind_speed (DECIMAL)
- current_wind_direction (INTEGER)
- current_weather_symbol (VARCHAR)
- weather_updated_at (TIMESTAMP)
```

#### 4. Weather Sync Script (`scripts/sync-weather-data.ts`)

Automated script that:
1. Queries database for today's meetings
2. Fetches weather for each unique track
3. Updates `pf_meetings` with current conditions
4. Stores hourly forecasts in `track_weather`
5. Cleans up old data (>24 hours)

**Usage**:
```bash
npx tsx scripts/sync-weather-data.ts
```

**Recommended Schedule**: Every 30-60 minutes during race days

#### 5. API Endpoints

**GET /api/weather/track/[trackName]**

Returns weather for a specific track.

Response:
```json
{
  "trackName": "Randwick",
  "location": {
    "latitude": -33.9103,
    "longitude": 151.2417,
    "state": "NSW",
    "country": "AUS",
    "timezone": "Australia/Sydney"
  },
  "current": {
    "temperature": 24.5,
    "windSpeed": 15.2,
    "windDirection": 180,
    "windDirectionCompass": "S",
    "weatherSymbol": "clearsky_day",
    "weatherEmoji": "☀️",
    "description": "Clear sky",
    "time": "2026-02-11T06:00:00Z"
  },
  "hourly": [...],
  "lastUpdated": "2026-02-11T06:00:00Z",
  "attribution": "Weather data from MET Norway"
}
```

**GET /api/weather/meeting/[meetingId]**

Returns weather for a specific meeting (includes meeting context).

#### 6. UI Components

**WeatherDisplay Component**

Main component for displaying weather information.

Props:
- `trackName` (required): Name of the track
- `meetingId` (optional): Meeting ID for more specific data
- `compact` (optional): Show compact version
- `autoRefresh` (optional): Enable auto-refresh
- `refreshInterval` (optional): Refresh interval in minutes

**Usage Examples**:

```tsx
// Full display with auto-refresh
<WeatherDisplay 
  trackName="Randwick"
  autoRefresh={true}
  refreshInterval={30}
/>

// Compact display for cards
<WeatherDisplay 
  trackName="Flemington"
  compact={true}
/>

// Weather badge
<WeatherBadge trackName="Caulfield" />
```

**WeatherBadge Component**

Minimal inline weather display for cards and compact spaces.

## MET Norway API

### Terms of Service

**Requirements**:
- Must include User-Agent header with contact information
- Must respect cache headers (Expires, Last-Modified)
- Must provide attribution: "Weather data from MET Norway"
- Must link to https://www.met.no/en

**API Details**:
- Endpoint: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- No API key required
- Rate limiting: Respect cache headers
- Data updates: Typically every 6 hours

### Weather Data

**Temperature**: Degrees Celsius  
**Wind Speed**: Meters per second (converted to km/h for display)  
**Wind Direction**: Degrees (0-360), converted to compass directions (N, NE, E, etc.)  
**Precipitation**: Millimeters  
**Symbols**: Weather condition codes with day/night variations

## Caching Strategy

### Three-Layer Caching

1. **API Client Cache** (In-Memory)
   - Duration: 1 hour (configurable via WEATHER_CACHE_HOURS)
   - Reduces API calls during page loads
   - Cleared on server restart

2. **Database Cache** (track_weather table)
   - Duration: 24 hours
   - Stores hourly forecasts
   - Provides historical data
   - Cleaned up automatically by sync script

3. **Browser Cache** (React component state)
   - Duration: Component lifetime
   - Auto-refresh: Optional, default 30 minutes
   - User-controlled refresh

### Cache Headers

The sync script respects MET Norway's cache headers:
- `Expires`: When forecast data expires
- `Last-Modified`: When forecast was last updated

## Update Frequency

**Recommended Schedule**:
- **Pre-race day**: Once every 6 hours
- **Race day morning**: Every hour from 6 AM
- **Race hours**: Every 30 minutes
- **After racing**: Every 2-3 hours

**Implementation**:
Add to GitHub Actions workflow or cron job:

```yaml
- name: Sync Weather Data
  run: npx tsx scripts/sync-weather-data.ts
  schedule:
    # Evening to late night (7 PM - 11:30 PM AEDT)
    - cron: '*/30 19-23 * * *'
    # Midnight to morning (12 AM - 10:30 AM AEDT)
    - cron: '*/30 0-10 * * *'
```

## Wind Direction Display

Wind directions are converted from degrees to compass directions:

- 0° or 360° → N (North)
- 45° → NE (Northeast)
- 90° → E (East)
- 135° → SE (Southeast)
- 180° → S (South)
- 225° → SW (Southwest)
- 270° → W (West)
- 315° → NW (Northwest)

## Error Handling

### Graceful Degradation

The weather integration is designed to never break the main application:

1. **Missing Coordinates**: Logs warning, continues without weather
2. **API Failures**: Catches errors, displays "Weather unavailable"
3. **Database Errors**: Logs error, returns empty weather data
4. **Component Errors**: Shows loading state or hides gracefully

### Logging

The sync script provides detailed logging:
- ✅ Success messages (green)
- ⚠️ Warnings (yellow)
- ❌ Errors (red)
- 📊 Summary statistics

## Troubleshooting

### Weather Not Appearing

1. **Check database migration**: Ensure migration 008 has run
   ```bash
   npm run migrate
   ```

2. **Run sync script manually**:
   ```bash
   npx tsx scripts/sync-weather-data.ts
   ```

3. **Check environment variables**:
   ```bash
   echo $WEATHER_USER_AGENT
   ```

4. **Verify track coordinates**: Check `lib/data/track-coordinates.ts`

5. **Check API endpoint**: Test in browser:
   ```
   http://localhost:3000/api/weather/track/randwick
   ```

### API Rate Limiting

If you encounter rate limiting:
- Increase delay between API calls in sync script
- Reduce sync frequency
- Check cache is working properly
- Verify no duplicate API calls

### Incorrect Weather Data

1. **Verify track coordinates** are accurate
2. **Check timezone** matches track location
3. **Confirm API response** format hasn't changed
4. **Review symbol mapping** for new codes

## Attribution

As required by MET Norway's terms of service, weather data attribution is displayed:

- **UI Components**: "Weather data from MET Norway" footer
- **API Responses**: `attribution` field in JSON
- **Documentation**: This section and inline comments

**MET Norway Link**: https://www.met.no/en

## Performance Considerations

### Database Indexes

The migration creates indexes for optimal query performance:
- `idx_track_weather_track_time`: Track + time lookups
- `idx_track_weather_fetched`: Cleanup queries
- `idx_track_weather_forecast_time`: Time-based queries

### API Call Optimization

- Batch processing in sync script (one API call per track)
- Rate limiting with 1-second delays
- Coordinate-based caching (same location = same cache)
- Hourly forecast stored in database (reduces repeated calls)

### Component Optimization

- Optional auto-refresh (disabled by default for compact displays)
- Lazy loading of weather data
- Silent failures in badge component
- Memoization where appropriate

## Future Enhancements

Possible future improvements:

1. **Weather Alerts**: Extreme weather warnings
2. **Historical Weather**: Track performance in different conditions
3. **Forecast Accuracy**: Track MET Norway accuracy over time
4. **Advanced Analytics**: Correlate weather with race results
5. **Mobile Notifications**: Weather change alerts
6. **Multiple Sources**: Backup weather providers
7. **Precipitation Radar**: Visual weather maps
8. **Sunrise/Sunset**: Day/night race indicators

## Security

### API Key Security

MET Norway doesn't require API keys, but:
- User-Agent is stored in environment variables
- No sensitive credentials exposed
- API calls made server-side only

### Input Validation

- Track names normalized and validated
- Coordinates validated before API calls
- SQL injection prevention via parameterized queries
- API response validation and error handling

## Testing

### Manual Testing Checklist

- [ ] Weather displays on form guide meeting cards
- [ ] Weather displays on individual race pages
- [ ] Compact weather badge renders correctly
- [ ] Auto-refresh works (check after 30+ minutes)
- [ ] Weather API endpoints return valid JSON
- [ ] Sync script runs without errors
- [ ] Database tables created correctly
- [ ] Caching reduces API calls
- [ ] Graceful degradation when weather unavailable
- [ ] Attribution displayed correctly

### Test Tracks

Use these tracks for testing (well-known locations):
- Randwick (NSW)
- Flemington (VIC)
- Eagle Farm (QLD)
- Morphettville (SA)
- Ascot (WA)
- Ellerslie (NZ)

## Support

For issues or questions:
1. Check this documentation
2. Review console logs (browser and server)
3. Test API endpoints directly
4. Verify database state
5. Check MET Norway API status

## Changelog

### Version 1.0 (February 2026)
- Initial weather integration
- Support for 160+ Australian and NZ tracks
- MET Norway API integration
- Database schema for weather caching
- Weather sync script
- API endpoints for track and meeting weather
- React components for weather display
- Documentation and examples

---

**Last Updated**: February 11, 2026  
**Maintained By**: Trading The Races Development Team
