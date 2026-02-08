import { Scratching } from '@/lib/hooks/useScratchings';

interface ScratchingsBadgeProps {
  scratching: Scratching;
  compact?: boolean;
}

export function ScratchingsBadge({ scratching, compact = false }: ScratchingsBadgeProps) {
  const timeStr = new Date(scratching.scratchingTime).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (compact) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
        ❌ SCR
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
      <span>❌ SCRATCHED</span>
      {scratching.reason && (
        <span className="text-red-600">• {scratching.reason}</span>
      )}
      <span className="text-red-500 text-[10px]">
        @ {timeStr}
      </span>
    </div>
  );
}
