'use client';

import { useEffect, useState, useCallback } from 'react';

interface WeatherData {
  temperature: number;
  feelsLike?: number;
  windSpeed: number;
  windGust?: number;
  windDirection: number;
  windDirectionCompass: string;
  weatherSymbol: string;
  weatherEmoji: string;
  description: string;
  humidity?: number;
  precipitation?: number;
  precipitationProbability?: number;
  visibility?: number;
  uvIndex?: number;
  pressure?: number;
  time?: string;
}

type DisplayMode = 'compact' | 'standard' | 'detailed';

interface WeatherDisplayProps {
  trackName: string;
  meetingId?: string;
  mode?: DisplayMode;
  /** @deprecated Use mode='compact' instead */
  compact?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export default function WeatherDisplay({
  trackName,
  meetingId,
  mode: modeProp,
  compact: compactProp,
  className = '',
  autoRefresh = false,
  refreshInterval = 30,
}: WeatherDisplayProps) {
  // Backward compatibility: support old compact prop
  const mode = modeProp || (compactProp ? 'compact' : 'standard');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use meeting endpoint if meetingId is provided, otherwise use track endpoint
      const endpoint = meetingId
        ? `/api/weather/meeting/${meetingId}`
        : `/api/weather/track/${encodeURIComponent(trackName.toLowerCase())}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Weather data not available');
          return;
        }
        throw new Error(`Failed to fetch weather: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.current) {
        setWeather(data.current);
      } else {
        setError('No current weather data available');
      }
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setError('Unable to load weather');
    } finally {
      setLoading(false);
    }
  }, [trackName, meetingId]);

  useEffect(() => {
    fetchWeather();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      const interval = setInterval(fetchWeather, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchWeather, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        {mode === 'compact' ? '...' : 'Loading weather...'}
      </div>
    );
  }

  if (error || !weather) {
    return mode === 'compact' ? null : (
      <div className={`text-gray-400 text-sm ${className}`}>
        {error || 'Weather unavailable'}
      </div>
    );
  }

  // Convert wind speed from m/s to km/h for display
  const windKmh = Math.round(weather.windSpeed * 3.6);
  const gustKmh = weather.windGust ? Math.round(weather.windGust * 3.6) : null;

  // Compact mode - minimal display for cards
  if (mode === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <span className="text-xl" title={weather.description}>
          {weather.weatherEmoji}
        </span>
        <span className="font-medium">{Math.round(weather.temperature)}°C</span>
        <span className="text-gray-600">
          💨 {windKmh}km/h {weather.windDirectionCompass}
        </span>
      </div>
    );
  }

  // Standard mode - good balance for race lists
  if (mode === 'standard') {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="text-4xl" title={weather.description}>
            {weather.weatherEmoji}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">
                {Math.round(weather.temperature)}°C
              </span>
              {weather.feelsLike && Math.abs(weather.feelsLike - weather.temperature) > 2 && (
                <span className="text-sm text-gray-600">
                  (Feels {Math.round(weather.feelsLike)}°C)
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 capitalize mt-1">
              {weather.description}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <span>💨</span>
                <span>
                  {windKmh} km/h {weather.windDirectionCompass}
                  {gustKmh && gustKmh > windKmh * 1.3 && ` (${gustKmh})`}
                </span>
              </div>
              {weather.humidity && (
                <div className="flex items-center gap-1">
                  <span>💧</span>
                  <span>{weather.humidity}%</span>
                </div>
              )}
              {weather.precipitation !== undefined && weather.precipitation > 0 && (
                <div className="flex items-center gap-1">
                  <span>🌧️</span>
                  <span>{weather.precipitation}mm</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-500">
          Weather data from MET Norway
        </div>
      </div>
    );
  }

  // Detailed mode - comprehensive panel
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl" title={weather.description}>
            {weather.weatherEmoji}
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-800">
              {Math.round(weather.temperature)}°C
            </div>
            {weather.feelsLike && (
              <div className="text-sm text-gray-600 mt-1">
                Feels like {Math.round(weather.feelsLike)}°C
              </div>
            )}
            <div className="text-sm text-gray-700 capitalize mt-1 font-medium">
              {weather.description}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs text-gray-600 mb-1">Wind</div>
          <div className="font-semibold text-gray-800">
            {windKmh} km/h {weather.windDirectionCompass}
          </div>
          {gustKmh && gustKmh > windKmh && (
            <div className="text-xs text-gray-600 mt-1">
              Gusts up to {gustKmh} km/h
            </div>
          )}
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs text-gray-600 mb-1">Humidity</div>
          <div className="font-semibold text-gray-800">
            {weather.humidity !== undefined ? `${weather.humidity}%` : 'N/A'}
          </div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs text-gray-600 mb-1">Rain Chance</div>
          <div className="font-semibold text-gray-800">
            {weather.precipitationProbability !== undefined
              ? `${weather.precipitationProbability}%`
              : weather.precipitation !== undefined && weather.precipitation > 0
              ? `${weather.precipitation}mm`
              : 'None'}
          </div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs text-gray-600 mb-1">Visibility</div>
          <div className="font-semibold text-gray-800">
            {weather.visibility !== undefined
              ? weather.visibility >= 10
                ? 'Excellent (10+ km)'
                : `${weather.visibility} km`
              : 'N/A'}
          </div>
        </div>

        {weather.uvIndex !== undefined && weather.uvIndex > 0 && (
          <div className="bg-white bg-opacity-50 rounded p-2">
            <div className="text-xs text-gray-600 mb-1">UV Index</div>
            <div className="font-semibold text-gray-800">
              {weather.uvIndex} ({getUVLevel(weather.uvIndex)})
            </div>
          </div>
        )}

        {weather.pressure !== undefined && (
          <div className="bg-white bg-opacity-50 rounded p-2">
            <div className="text-xs text-gray-600 mb-1">Pressure</div>
            <div className="font-semibold text-gray-800">
              {Math.round(weather.pressure)} hPa
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-100 rounded p-3 mb-3">
        <div className="text-sm font-semibold text-gray-800 mb-2">🎯 Track Impact</div>
        <div className="text-sm text-gray-700 space-y-1">
          {getTrackImpactNotes(weather).map((note, i) => (
            <div key={i}>• {note}</div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Weather data from MET Norway</span>
        {weather.time && (
          <span>
            Updated: {new Date(weather.time).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper function to get UV level description
function getUVLevel(uvIndex: number): string {
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
}

// Helper function to generate track impact notes
function getTrackImpactNotes(weather: WeatherData): string[] {
  const notes: string[] = [];
  const windKmh = weather.windSpeed * 3.6;

  // Wind impact
  if (windKmh < 15) {
    notes.push('Light winds, minimal impact on race times');
  } else if (windKmh < 30) {
    notes.push(`Moderate ${weather.windDirectionCompass} winds may affect times`);
  } else if (windKmh < 45) {
    notes.push(`Strong ${weather.windDirectionCompass} winds will impact performance`);
  } else {
    notes.push(`Severe winds (${Math.round(windKmh)} km/h) - major race factor`);
  }

  // Temperature impact
  if (weather.temperature > 32) {
    notes.push('Hot conditions - stamina will be tested');
  } else if (weather.temperature < 8) {
    notes.push('Cold conditions - may affect horse performance');
  }

  // Precipitation impact
  if (weather.precipitation !== undefined && weather.precipitation > 2) {
    notes.push('Wet conditions - track will be affected');
  } else if (
    weather.precipitationProbability !== undefined &&
    weather.precipitationProbability > 50
  ) {
    notes.push(`${weather.precipitationProbability}% chance of rain during race`);
  }

  // Default if no significant impacts
  if (notes.length === 0) {
    notes.push('Standard conditions, expected time: ±0.5s normal');
  }

  return notes;
}

/**
 * Compact weather icon/badge component for inline use
 */
export function WeatherBadge({
  trackName,
  className = '',
}: {
  trackName: string;
  className?: string;
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `/api/weather/track/${encodeURIComponent(trackName.toLowerCase())}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.current) {
            setWeather(data.current);
          }
        }
      } catch (err) {
        // Silently fail for badge
        console.error('Weather badge error:', err);
      }
    };

    fetchWeather();
  }, [trackName]);

  if (!weather) {
    return null;
  }

  const windKmh = Math.round(weather.windSpeed * 3.6);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded text-xs ${className}`}
      title={`${weather.description} - ${Math.round(weather.temperature)}°C, Wind ${windKmh}km/h ${weather.windDirectionCompass}`}
    >
      <span className="text-sm">{weather.weatherEmoji}</span>
      <span className="font-medium">{Math.round(weather.temperature)}°C</span>
      <span className="text-gray-600">
        {windKmh}km/h {weather.windDirectionCompass}
      </span>
    </div>
  );
}
