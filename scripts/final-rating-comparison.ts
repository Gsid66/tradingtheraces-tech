import { config } from 'dotenv';
config({ path: '.env.local' });

import { format } from 'date-fns';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';
import { getRaceCardRatingsClient } from '../lib/integrations/race-card-ratings';
import { convertPuntingFormToTTR } from '../lib/utils/track-name-standardizer';

interface AdvancedRating {
  rating: number;
  price: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  dataQuality: {
    hasCareerStats: boolean;
    hasConditionStats: boolean;
    hasDistanceStats: boolean;
    hasJockeyTrainerStats: boolean;
  };
}

function calculateAdvancedRating(runner: any, raceDistance: number, trackCondition: string): AdvancedRating {
  const starts = runner.careerStarts || 0;
  const wins = runner.careerWins || 0;
  
  // Track what data we actually have
  const dataQuality = {
    hasCareerStats: starts > 0,
    hasConditionStats: false,
    hasDistanceStats: false,
    hasJockeyTrainerStats: false,
  };

  // 1. BASE FORM (20%)
  const winPct = runner.winPct || (starts > 0 ? (wins / starts) * 100 : 0);
  const placePct = runner.placePct || 0;
  const baseForm = (winPct * 0.6) + (placePct * 0.4);

  // 2. TRACK CONDITION (20%)
  let trackConditionRating = 50;
  const condition = trackCondition || 'good';
  const conditionKey = `${condition.toLowerCase()}Record`;
  const conditionRecord = runner[conditionKey];
  
  if (conditionRecord && conditionRecord.starts > 0) {
    dataQuality.hasConditionStats = true;
    const condWinRate = (conditionRecord.firsts / conditionRecord.starts) * 100;
    const condPlaces = conditionRecord.firsts + conditionRecord.seconds + conditionRecord.thirds;
    const condPlaceRate = (condPlaces / conditionRecord.starts) * 100;
    trackConditionRating = (condWinRate * 0.6) + (condPlaceRate * 0.4);
  }

  // 3. DISTANCE (15%)
  let distancePerformance = 50;
  if (runner.distanceRecord && runner.distanceRecord.starts > 0) {
    dataQuality.hasDistanceStats = true;
    const distWinRate = (runner.distanceRecord.firsts / runner.distanceRecord.starts) * 100;
    const distPlaces = runner.distanceRecord.firsts + runner.distanceRecord.seconds + runner.distanceRecord.thirds;
    const distPlaceRate = (distPlaces / runner.distanceRecord.starts) * 100;
    distancePerformance = (distWinRate * 0.7) + (distPlaceRate * 0.3);
  }

  // 4. JOCKEY/TRAINER (15%)
  let jockeyTrainerRating = 50;
  const jtLast100 = runner.trainerJockeyA2E_Last100;
  
  if (jtLast100 && jtLast100.runners > 0) {
    dataQuality.hasJockeyTrainerStats = true;
    jockeyTrainerRating = jtLast100.strikeRate || ((jtLast100.wins / jtLast100.runners) * 100);
  } else if (runner.jockeyA2E_Last100 && runner.jockeyA2E_Last100.runners > 0) {
    const j = runner.jockeyA2E_Last100;
    jockeyTrainerRating = j.strikeRate || ((j.wins / j.runners) * 100);
  }

  // 5. CLASS (10%)
  let classLevel = 50;
  const hasGroupRuns = (runner.group1Record?.starts || 0) + (runner.group2Record?.starts || 0) + (runner.group3Record?.starts || 0);
  if (hasGroupRuns > 0) {
    const g1Wins = runner.group1Record?.firsts || 0;
    const g2Wins = runner.group2Record?.firsts || 0;
    const g3Wins = runner.group3Record?.firsts || 0;
    classLevel = 50 + (g1Wins * 20) + (g2Wins * 15) + (g3Wins * 10);
    classLevel = Math.min(classLevel, 100);
  }

  // 6. RECENT FORM (15%)
  let recentFormScore = 50;
  const formString = runner.last10 || '';
  if (formString) {
    const positions: number[] = [];
    if (formString.includes('x')) {
      formString.split('x').forEach((p: string) => {
        if (/^\d+$/.test(p)) positions.push(parseInt(p, 10));
      });
    } else {
      const matches = formString.match(/\d+/g);
      if (matches) matches.forEach((m: string) => positions.push(parseInt(m, 10)));
    }
    
    if (positions.length > 0) {
      const scores: number[] = positions.slice(0, 5).map(pos => {
        if (pos === 1) return 100;
        if (pos === 2) return 80;
        if (pos === 3) return 60;
        if (pos <= 5) return 40;
        if (pos <= 10) return 20;
        return 0;
      });
      const totalScore: number = scores.reduce((sum: number, s: number) => sum + s, 0);
      recentFormScore = totalScore / scores.length;
    }
  }

  // 7. CONSISTENCY (5%)
  let consistency = 50;
  if (runner.position && runner.position <= 10) {
    consistency = Math.max(0, 100 - (runner.position * 8));
    if (runner.margin && runner.margin < 2) {
      consistency = Math.min(consistency + 10, 100);
    }
  }

  // COMPOSITE RATING
  const rating = (
    (baseForm * 0.20) +
    (trackConditionRating * 0.20) +
    (distancePerformance * 0.15) +
    (jockeyTrainerRating * 0.15) +
    (classLevel * 0.10) +
    (recentFormScore * 0.15) +
    (consistency * 0.05)
  );

  // CONFIDENCE LEVEL
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  const dataPoints = Object.values(dataQuality).filter(v => v).length;
  if (dataPoints >= 3 && starts >= 5) confidence = 'HIGH';
  else if (dataPoints >= 2 || starts >= 3) confidence = 'MEDIUM';

  const probability = Math.max(rating / 100, 0.01);
  const price = (1 / probability) * 1.17;

  return {
    rating: Math.round(rating * 10) / 10,
    price: Math.round(price * 100) / 100,
    confidence,
    dataQuality,
  };
}

async function compareRatings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔬 FINAL COMPARISON: TTR vs Punting Form Advanced Ratings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pfClient = getPuntingFormClient();
  const ttrClient = getRaceCardRatingsClient();

  if (!ttrClient) {
    console.error('❌ TTR client not available');
    return;
  }

  const targetDate = new Date('2026-02-05');
  const dateStr = '2026-02-05';
  
  console.log(`📅 Analysis Date: ${dateStr}\n`);

  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meetings = meetingsResponse.payLoad || [];

  let totalComparisons = 0;
  let totalRatingDiff = 0;
  let highConfidenceComparisons = 0;
  let highConfidenceDiff = 0;

  for (const meeting of meetings.slice(0, 3)) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📍 ${meeting.track.name} - ${meeting.track.state}`);
    console.log(`${'═'.repeat(70)}\n`);

    const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
    const races = fieldsResponse.payLoad?.races || [];
    if (races.length === 0) continue;

    const race = races[0];
    const raceNumber = race.number;

    console.log(`🏁 Race ${raceNumber}: ${race.name}`);
    console.log(`   Distance: ${race.distance}m | Runners: ${race.runners?.length || 0}\n`);

    if (!race.runners || race.runners.length === 0) continue;

    const possibleTTRNames = convertPuntingFormToTTR(meeting.track.name, meeting.track.surface ?? undefined);
    let ttrData: any[] = [];
    for (const ttrTrackName of possibleTTRNames) {
      try {
        const ttrResponse = await ttrClient.getRatingsForRace(dateStr, ttrTrackName, raceNumber);
        if (ttrResponse.data && ttrResponse.data.length > 0) {
          ttrData = ttrResponse.data;
          break;
        }
      } catch (error: any) { }
    }

    if (ttrData.length === 0) continue;

    const trackCondition = fieldsResponse.payLoad.expectedCondition || 'good';

    console.log('┌────┬─────────────────────────┬──────────┬──────────┬──────────┬──────────┬────────────┐');
    console.log('│ No │ Horse                   │ TTR Rtg  │ PF Rtg   │ Diff     │ PF Price │ Confidence │');
    console.log('├────┼─────────────────────────┼──────────┼──────────┼──────────┼──────────┼────────────┤');

    for (const runner of race.runners.slice(0, 12)) {
      const horseName = runner.name || '';
      const ttrRunner = ttrData.find(ttr => 
        ttr.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim()
      );

      const advanced = calculateAdvancedRating(runner, race.distance, trackCondition);
      const ttrRating = ttrRunner?.rating ? Number(ttrRunner.rating) : null;
      const ratingDiff = ttrRating !== null ? Math.abs(ttrRating - advanced.rating) : null;

      if (ratingDiff !== null) {
        totalRatingDiff += ratingDiff;
        totalComparisons++;
        
        if (advanced.confidence === 'HIGH') {
          highConfidenceDiff += ratingDiff;
          highConfidenceComparisons++;
        }
      }

      const ttrRtgStr = ttrRating !== null ? ttrRating.toFixed(1).padStart(6) : '   -  ';
      const pfRtgStr = advanced.rating.toFixed(1).padStart(6);
      const diffStr = ratingDiff !== null ? ratingDiff.toFixed(1).padStart(6) : '   -  ';
      const priceStr = `$${advanced.price.toFixed(2)}`.padStart(6);
      const confStr = advanced.confidence.padEnd(8);

      const name = horseName.substring(0, 22).padEnd(23);
      const tabNo = (runner.tabNo || 0).toString().padStart(2);

      console.log(`│ ${tabNo} │ ${name} │ ${ttrRtgStr} │ ${pfRtgStr} │ ${diffStr} │ ${priceStr} │ ${confStr} │`);
    }

    console.log('└────┴─────────────────────────┴──────────┴──────────┴──────────┴──────────┴────────────┘\n');
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'═'.repeat(70)}\n`);
  
  if (totalComparisons > 0) {
    const avgDiff = totalRatingDiff / totalComparisons;
    console.log(`Total comparisons:           ${totalComparisons}`);
    console.log(`Overall average difference:  ${avgDiff.toFixed(2)} points\n`);
    
    if (highConfidenceComparisons > 0) {
      const highConfAvg = highConfidenceDiff / highConfidenceComparisons;
      console.log(`HIGH CONFIDENCE horses:      ${highConfidenceComparisons}`);
      console.log(`High confidence avg diff:    ${highConfAvg.toFixed(2)} points\n`);
    }

    console.log('═'.repeat(70));
    console.log('💡 CONCLUSION:');
    console.log('═'.repeat(70));
    console.log('\nThe Punting Form data provides valuable insights but cannot fully');
    console.log('replicate TTR\'s proprietary algorithms which likely include:');
    console.log('  • Speed ratings and sectional analysis');
    console.log('  • Trial performance data');
    console.log('  • Market intelligence and betting patterns');
    console.log('  • Advanced statistical modeling\n');
    
    console.log('RECOMMENDATION: Use TTR as primary, PF as supplementary backup.');
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

compareRatings().catch(console.error);