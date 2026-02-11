/**
 * MET Norway Weather API Client
 * 
 * Integration with MET Norway Locationforecast API for weather data.
 * API Documentation: https://api.met.no/weatherapi/locationforecast/2.0/documentation
 * 
 * Terms of Service: https://api.met.no/doc/TermsOfService
 * - Must include User-Agent header
 * - Must respect cache headers
 * - Attribution required
 */

export interface WeatherTimeseries {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature: number;
        wind_speed: number;
        wind_from_direction: number;
        relative_humidity?: number;
        air_pressure_at_sea_level?: number;
      };
    };
    next_1_hours?: {
      summary: {
        symbol_code: string;
      };
      details: {
        precipitation_amount?: number;
      };
    };
    next_6_hours?: {
      summary: {
        symbol_code: string;
      };
      details: {
        precipitation_amount?: number;
      };
    };
  };
}

export interface WeatherForecast {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    meta: {
      updated_at: string;
      units: {
        air_temperature: string;
        wind_speed: string;
        precipitation_amount: string;
      };
    };
    timeseries: WeatherTimeseries[];
  };
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  weatherSymbol: string;
  precipitation: number;
  humidity?: number;
  pressure?: number;
  time: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  weatherSymbol: string;
  precipitation: number;
}

// Weather symbol mapping to emojis
const WEATHER_SYMBOLS: Record<string, string> = {
  'clearsky_day': '☀️',
  'clearsky_night': '🌙',
  'clearsky_polartwilight': '☀️',
  'fair_day': '🌤️',
  'fair_night': '🌤️',
  'fair_polartwilight': '🌤️',
  'partlycloudy_day': '⛅',
  'partlycloudy_night': '⛅',
  'partlycloudy_polartwilight': '⛅',
  'cloudy': '☁️',
  'rainshowers_day': '🌦️',
  'rainshowers_night': '🌦️',
  'rainshowers_polartwilight': '🌦️',
  'rain': '🌧️',
  'lightrain': '🌦️',
  'lightrainshowers_day': '🌦️',
  'lightrainshowers_night': '🌦️',
  'lightrainshowers_polartwilight': '🌦️',
  'heavyrain': '⛈️',
  'heavyrainshowers_day': '⛈️',
  'heavyrainshowers_night': '⛈️',
  'heavyrainshowers_polartwilight': '⛈️',
  'sleet': '🌨️',
  'sleetshowers_day': '🌨️',
  'sleetshowers_night': '🌨️',
  'sleetshowers_polartwilight': '🌨️',
  'snow': '❄️',
  'snowshowers_day': '❄️',
  'snowshowers_night': '❄️',
  'snowshowers_polartwilight': '❄️',
  'fog': '🌫️',
  'lightssnowshowersandthunder_day': '⛈️',
  'lightssnowshowersandthunder_night': '⛈️',
  'lightssnowshowersandthunder_polartwilight': '⛈️',
  'lightsleetandthunder': '⛈️',
  'lightsnowandthunder': '⛈️',
  'sleetandthunder': '⛈️',
  'snowandthunder': '⛈️',
  'heavysleetshowersandthunder_day': '⛈️',
  'heavysleetshowersandthunder_night': '⛈️',
  'heavysleetshowersandthunder_polartwilight': '⛈️',
  'heavysnowshowersandthunder_day': '⛈️',
  'heavysnowshowersandthunder_night': '⛈️',
  'heavysnowshowersandthunder_polartwilight': '⛈️',
  'rainandthunder': '⛈️',
  'heavyrainandthunder': '⛈️',
  'lightrainandthunder': '⛈️',
};

// Convert wind direction degrees to compass direction
export function degreesToCompass(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Get weather emoji from symbol code
export function getWeatherEmoji(symbolCode: string): string {
  return WEATHER_SYMBOLS[symbolCode] || '☁️';
}

// Get human-readable description from symbol code
export function getWeatherDescription(symbolCode: string): string {
  const descriptions: Record<string, string> = {
    'clearsky_day': 'Clear sky',
    'clearsky_night': 'Clear sky',
    'clearsky_polartwilight': 'Clear sky',
    'fair_day': 'Fair',
    'fair_night': 'Fair',
    'fair_polartwilight': 'Fair',
    'partlycloudy_day': 'Partly cloudy',
    'partlycloudy_night': 'Partly cloudy',
    'partlycloudy_polartwilight': 'Partly cloudy',
    'cloudy': 'Cloudy',
    'rainshowers_day': 'Rain showers',
    'rainshowers_night': 'Rain showers',
    'rainshowers_polartwilight': 'Rain showers',
    'rain': 'Rain',
    'lightrain': 'Light rain',
    'lightrainshowers_day': 'Light rain showers',
    'lightrainshowers_night': 'Light rain showers',
    'lightrainshowers_polartwilight': 'Light rain showers',
    'heavyrain': 'Heavy rain',
    'heavyrainshowers_day': 'Heavy rain showers',
    'heavyrainshowers_night': 'Heavy rain showers',
    'heavyrainshowers_polartwilight': 'Heavy rain showers',
    'sleet': 'Sleet',
    'snow': 'Snow',
    'fog': 'Fog',
    'rainandthunder': 'Thunderstorm',
    'heavyrainandthunder': 'Heavy thunderstorm',
    'lightrainandthunder': 'Light thunderstorm',
  };
  return descriptions[symbolCode] || 'Unknown';
}

/**
 * Fetch weather forecast from MET Norway API
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherForecast> {
  const userAgent = process.env.WEATHER_USER_AGENT || 
    'TradingTheRaces/1.0 (https://tradingtheraces.com; contact@tradingtheraces.com)';

  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`MET Norway API error: ${response.status} ${response.statusText}`);
  }

  // Store cache headers for future reference
  const expires = response.headers.get('Expires');
  const lastModified = response.headers.get('Last-Modified');
  
  const data = await response.json() as WeatherForecast;
  
  return data;
}

/**
 * Get current weather from forecast data
 */
export function getCurrentWeather(forecast: WeatherForecast): WeatherData | null {
  if (!forecast.properties.timeseries || forecast.properties.timeseries.length === 0) {
    return null;
  }

  const current = forecast.properties.timeseries[0];
  const instant = current.data.instant.details;
  const next = current.data.next_1_hours || current.data.next_6_hours;

  return {
    temperature: instant.air_temperature,
    windSpeed: instant.wind_speed,
    windDirection: instant.wind_from_direction,
    weatherSymbol: next?.summary.symbol_code || 'cloudy',
    precipitation: next?.details.precipitation_amount || 0,
    humidity: instant.relative_humidity,
    pressure: instant.air_pressure_at_sea_level,
    time: current.time,
  };
}

/**
 * Get hourly forecast for next N hours
 */
export function getHourlyForecast(
  forecast: WeatherForecast,
  hours: number = 12
): HourlyForecast[] {
  if (!forecast.properties.timeseries) {
    return [];
  }

  const hourlyData: HourlyForecast[] = [];
  const now = new Date();

  for (const entry of forecast.properties.timeseries) {
    const entryTime = new Date(entry.time);
    const hoursDiff = (entryTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Only include future times within the requested hours
    if (hoursDiff >= 0 && hoursDiff <= hours) {
      const instant = entry.data.instant.details;
      const next = entry.data.next_1_hours || entry.data.next_6_hours;

      hourlyData.push({
        time: entry.time,
        temperature: instant.air_temperature,
        windSpeed: instant.wind_speed,
        windDirection: instant.wind_from_direction,
        weatherSymbol: next?.summary.symbol_code || 'cloudy',
        precipitation: next?.details.precipitation_amount || 0,
      });
    }
  }

  return hourlyData;
}

/**
 * Get weather for specific time
 */
export function getWeatherAtTime(
  forecast: WeatherForecast,
  targetTime: Date
): WeatherData | null {
  if (!forecast.properties.timeseries) {
    return null;
  }

  // Find the closest timeseries entry to the target time
  let closest: WeatherTimeseries | null = null;
  let smallestDiff = Infinity;

  for (const entry of forecast.properties.timeseries) {
    const entryTime = new Date(entry.time);
    const diff = Math.abs(entryTime.getTime() - targetTime.getTime());

    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = entry;
    }
  }

  if (!closest) {
    return null;
  }

  const instant = closest.data.instant.details;
  const next = closest.data.next_1_hours || closest.data.next_6_hours;

  return {
    temperature: instant.air_temperature,
    windSpeed: instant.wind_speed,
    windDirection: instant.wind_from_direction,
    weatherSymbol: next?.summary.symbol_code || 'cloudy',
    precipitation: next?.details.precipitation_amount || 0,
    humidity: instant.relative_humidity,
    pressure: instant.air_pressure_at_sea_level,
    time: closest.time,
  };
}

/**
 * Simple in-memory cache for weather forecasts
 * In production, this should use a database or Redis
 */
const weatherCache = new Map<string, { data: WeatherForecast; expires: number }>();

/**
 * Get weather with caching
 */
export async function getWeatherWithCache(
  latitude: number,
  longitude: number,
  cacheHours: number = 1
): Promise<WeatherForecast> {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const forecast = await fetchWeatherForecast(latitude, longitude);
  
  weatherCache.set(cacheKey, {
    data: forecast,
    expires: Date.now() + (cacheHours * 60 * 60 * 1000),
  });

  return forecast;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    if (value.expires <= now) {
      weatherCache.delete(key);
    }
  }
}
