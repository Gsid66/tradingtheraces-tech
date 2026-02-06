'use client';

import { useState } from 'react';

interface Props {
  scratchedCount: number;
  onToggle: (showScratched: boolean) => void;
}

export default function ScratchingsFilter({ scratchedCount, onToggle }: Props) {
  const [showScratched, setShowScratched] = useState(true);

  const handleToggle = () => {
    const newValue = !showScratched;
    setShowScratched(newValue);
    onToggle(newValue);
  };

  if (scratchedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <span className="text-sm font-medium text-red-800">
        {scratchedCount} scratched horse{scratchedCount !== 1 ? 's' : ''}
      </span>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showScratched}
          onChange={handleToggle}
          className="w-4 h-4"
        />
        <span className="text-sm text-red-700">Show scratched horses</span>
      </label>
    </div>
  );
}
