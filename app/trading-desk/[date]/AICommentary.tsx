'use client';

import { useState } from 'react';

interface AICommentaryProps {
  raceId: number;
  horseName: string;
  rating: number;
  price: number;
  jockey: string;
  trainer: string;
}

export default function AICommentary({
  raceId,
  horseName,
  rating,
  price,
  jockey,
  trainer,
}: AICommentaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentary = async () => {
    if (commentary) {
      // Already have commentary, just toggle
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsExpanded(true);

    try {
      const response = await fetch('/api/trading-desk/ai-commentary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raceId,
          horseName,
          rating,
          price,
          jockey,
          trainer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch commentary');
      }

      const data = await response.json();
      setCommentary(data.commentary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commentary');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={fetchCommentary}
        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
      >
        <span>🤖</span>
        <span>Ask Sherlock</span>
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg animate-fadeIn">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-sm text-purple-600">
                Sherlock is analyzing...
              </span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl">🕵️</span>
                <div>
                  <div className="font-bold text-purple-800 text-sm mb-1">
                    Sherlock Hooves says:
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {commentary}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-purple-600 hover:text-purple-800 mt-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
