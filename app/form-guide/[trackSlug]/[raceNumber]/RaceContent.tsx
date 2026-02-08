'use client';

import { useState } from 'react';
import type { PFRunner } from '@/lib/integrations/punting-form/client';
import RaceTabs from './RaceTabs';
import RunnerList from './RunnerList';
import RatingsOddsView from './RatingsOddsView';

// Extended runner interface with TAB and TTR data
interface EnrichedRunner extends PFRunner {
  tabFixedWinPrice?: number | string | null;
  tabFixedPlacePrice?: number | string | null;
  tabFixedWinTimestamp?: string | null;
  tabFixedPlaceTimestamp?: string | null;
  ttrRating?: number | string | null;
  ttrPrice?: number | string | null;
  isScratched?: boolean;
  scratchingReason?: string;
  scratchingTime?: string;
}

interface Props {
  runners: EnrichedRunner[];
}

export default function RaceContent({ runners }: Props) {
  const [activeTab, setActiveTab] = useState('form');

  return (
    <>
      {/* Tabs */}
      <RaceTabs onTabChange={setActiveTab} />

      {/* Sort & Filter - Only show on Form tab */}
      {activeTab === 'form' && (
        <div className="bg-white px-6 py-4 flex gap-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:  </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Runner Number</option>
              <option>Barrier</option>
              <option>Weight</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Odds: </span>
            <select className="px-3 py-2 border rounded text-sm">
              <option>Best Odds</option>
              <option>Fixed Odds</option>
              <option>TAB Odds</option>
            </select>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'form' && <RunnerList runners={runners} />}
      {activeTab === 'ratings-odds' && <RatingsOddsView runners={runners} />}
    </>
  );
}
