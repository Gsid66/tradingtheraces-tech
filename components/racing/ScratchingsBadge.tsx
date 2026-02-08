'use client';

interface Props {
  isScratched: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
}

export default function ScratchingsBadge({ isScratched, scratchingReason, scratchingTime }: Props) {
  if (!isScratched) return null;
  
  let timeStr: string | null = null;
  if (scratchingTime) {
    try {
      const date = new Date(scratchingTime);
      if (!isNaN(date.getTime())) {
        timeStr = date.toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (error) {
      console.warn('Invalid scratchingTime:', scratchingTime);
    }
  }
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs font-semibold text-red-800">
      <span>❌ SCRATCHED</span>
      {scratchingReason && (
        <span className="text-red-600">• {scratchingReason}</span>
      )}
      {timeStr && (
        <span className="text-red-500 text-[10px]">@ {timeStr}</span>
      )}
    </div>
  );
}
