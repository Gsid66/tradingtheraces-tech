import { Scratching } from '@/lib/hooks/useScratchings';

interface ScratchingsBadgeProps {
  scratching: Scratching;
  compact?: boolean;
}

export function ScratchingsBadge({ scratching, compact = false }: ScratchingsBadgeProps) {
  let timeStr: string | null = null;
  try {
    const date = new Date(scratching.scratchingTime);
    if (!isNaN(date.getTime())) {
      timeStr = date.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  } catch (error) {
    console.warn('Invalid scratchingTime:', scratching.scratchingTime);
  }

  if (compact) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
        ❌ SCR
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 border border-red-200 text-red-800 rounded text-xs font-medium">
      <span>❌ SCRATCHED</span>
      {scratching.reason && (
        <span className="text-red-700 font-semibold">• {scratching.reason}</span>
      )}
      {timeStr && (
        <span className="text-red-600 text-[10px]">
          @ {timeStr}
        </span>
      )}
    </div>
  );
}
