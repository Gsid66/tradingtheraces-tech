'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCompass: string;
  weatherSymbol: string;
  weatherEmoji: string;
  description: string;
  time?: string;
}

interface WeatherDisplayProps {
  trackName: string;
  meetingId?: string;
  compact?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export default function WeatherDisplay({
  trackName,
  meetingId,
  compact = false,
  className = '',
  autoRefresh = false,
  refreshInterval = 30,
}: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
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
  };

  useEffect(() => {
    fetchWeather();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      const interval = setInterval(fetchWeather, intervalMs);
      return () => clearInterval(interval);
    }
  }, [trackName, meetingId, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        {compact ? '...' : 'Loading weather...'}
      </div>
    );
  }

  if (error || !weather) {
    return compact ? null : (
      <div className={`text-gray-400 text-sm ${className}`}>
        {error || 'Weather unavailable'}
      </div>
    );
  }

  // Convert wind speed from m/s to km/h for display
  const windKmh = Math.round(weather.windSpeed * 3.6);

  if (compact) {
    // Compact display for cards and small spaces
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

  // Full display for detailed views
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl" title={weather.description}>
            {weather.weatherEmoji}
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {Math.round(weather.temperature)}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weather.description}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-lg">💨</span>
            <div>
              <div className="font-semibold">{windKmh} km/h</div>
              <div className="text-sm text-gray-600">{weather.windDirectionCompass}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-gray-500">
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
