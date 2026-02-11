'use client';

import { useEffect, useState } from 'react';

interface WeatherImpactBadgeProps {
  raceId?: string;
  trackName?: string;
  impactScore?: number;
  className?: string;
}

/**
 * Weather Impact Badge Component
 * 
 * Visual indicator showing weather severity:
 * - 🟢 Ideal conditions (score 1-2)
 * - 🟡 Moderate impact (score 3-4)
 * - 🟠 Significant impact (score 5-7)
 * - 🔴 Severe conditions (score 8-10)
 */
export default function WeatherImpactBadge({
  raceId,
  trackName,
  impactScore,
  className = '',
}: WeatherImpactBadgeProps) {
  const [score, setScore] = useState<number | null>(impactScore || null);
  const [loading, setLoading] = useState(!impactScore);

  useEffect(() => {
    if (impactScore !== undefined) {
      setScore(impactScore);
      return;
    }

    if (!raceId && !trackName) {
      return;
    }

    const fetchImpact = async () => {
      try {
        let endpoint = '';
        if (raceId) {
          endpoint = `/api/analysis/weather/predict?raceId=${raceId}`;
        } else if (trackName) {
          // Fetch current weather and estimate impact
          endpoint = `/api/weather/track/${encodeURIComponent(trackName.toLowerCase())}`;
        }

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          
          if (data.prediction?.weatherImpactScore !== undefined) {
            setScore(data.prediction.weatherImpactScore);
          } else if (data.current) {
            // Estimate impact from current weather
            const estimated = estimateImpactScore(data.current);
            setScore(estimated);
          }
        }
      } catch (err) {
        console.error('Error fetching weather impact:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, [raceId, trackName, impactScore]);

  if (loading || score === null) {
    return null;
  }

  const { color, icon, label, description } = getImpactDisplay(score);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color} ${className}`}
      title={description}
    >
      <span className="text-sm">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function getImpactDisplay(score: number): {
  color: string;
  icon: string;
  label: string;
  description: string;
} {
  if (score <= 2) {
    return {
      color: 'bg-green-100 text-green-800 border border-green-200',
      icon: '🟢',
      label: 'Ideal',
      description: 'Ideal conditions - fast times expected',
    };
  } else if (score <= 4) {
    return {
      color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      icon: '🟡',
      label: 'Moderate',
      description: 'Moderate weather impact - slight time variation',
    };
  } else if (score <= 7) {
    return {
      color: 'bg-orange-100 text-orange-800 border border-orange-200',
      icon: '🟠',
      label: 'Significant',
      description: 'Significant weather impact - adjust expectations',
    };
  } else {
    return {
      color: 'bg-red-100 text-red-800 border border-red-200',
      icon: '🔴',
      label: 'Severe',
      description: 'Severe weather conditions - major impact on racing',
    };
  }
}

function estimateImpactScore(weather: any): number {
  let score = 0;
  
  // Wind impact
  const windKmh = weather.windSpeed * 3.6;
  if (windKmh > 15) score += 1;
  if (windKmh > 30) score += 1;
  if (windKmh > 45) score += 2;
  
  // Precipitation
  if (weather.precipitation > 0.5) score += 1;
  if (weather.precipitation > 2) score += 1;
  if (weather.precipitation > 5) score += 1;
  
  // Temperature extremes
  if (weather.temperature < 5 || weather.temperature > 35) score += 1;
  if (weather.temperature < 0 || weather.temperature > 40) score += 1;
  
  // Visibility
  if (weather.visibility !== undefined && weather.visibility < 5) score += 1;
  
  return Math.min(10, score);
}
