'use client';

interface Props {
  isScratched: boolean;
  scratchingReason?: string;
}

export default function ScratchingsBadge({ isScratched, scratchingReason }: Props) {
  if (!isScratched) return null;
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs font-semibold text-red-800">
      <span>❌ SCRATCHED</span>
      {scratchingReason && (
        <span className="text-red-600">({scratchingReason})</span>
      )}
    </div>
  );
}
