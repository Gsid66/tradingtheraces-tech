import { config } from 'dotenv';
config({ path: '.env.local' });

import { format } from 'date-fns';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';
import { getRaceCardRatingsClient } from '../lib/integrations/race-card-ratings';
import { convertPuntingFormToTTR } from '../lib/utils/track-name-standardizer';

// ========================================
// ADVANCED RATING CALCULATION
// ========================================

interface AdvancedRating {
  rating: number;
  price: number;
  components: {
    baseForm: number;
    trackCondition: number;
    distancePerformance: number;
    jockeyTrainer: number;
    classLevel: number;
    recentForm: number;
    consistency: number;
  };
}

/**
 * Calculate advanced rating using ALL Punting Form data
 */
function calculateAdvancedRating(runner: any, raceDistance: number, trackCondition: string): AdvancedRating {
  
  // 1. BASE FORM RATING (0-100) - Career win & place %
  const starts = runner.careerStarts || 0;
  const wins = runner.careerWins || 0;
  const places = (runner.careerWins || 0) + (runner.careerSeconds || 0) + (runner.careerThirds || 0);
  
  const winPct = runner.winPct || (starts > 0 ? (wins / starts) * 100 : 0);
  const placePct = runner.placePct || (starts > 0 ? (places / starts) * 100 : 0);
  
  const baseForm = (winPct * 0.6) + (placePct * 0.4);

  // 2. TRACK CONDITION RATING (0-100)
  let trackConditionRating = 50; // Default neutral
  
  // Map condition to record key (default to 'good' if null)
  const condition = trackCondition || 'good';
  const conditionKey = `${condition.toLowerCase()}Record`;
  const conditionRecord = runner[conditionKey];
  
  if (conditionRecord && conditionRecord.starts > 0) {
    const condStarts = conditionRecord.starts;
    const condWins = conditionRecord.firsts || 0;
    const condPlaces = (conditionRecord.firsts || 0) + (conditionRecord.seconds || 0) + (conditionRecord.thirds || 0);
    
    const condWinRate = (condWins / condStarts) * 100;
    const condPlaceRate = (condPlaces / condStarts) * 100;
    
    trackConditionRating = (condWinRate * 0.6) + (condPlaceRate * 0.4);
  }

  // 3. DISTANCE PERFORMANCE (0-100)
  let distancePerformance = 50; // Default neutral
  
  if (runner.distanceRecord && runner.distanceRecord.starts > 0) {
    const distStarts = runner.distanceRecord.starts;
    const distWins = runner.distanceRecord.firsts || 0;
    const distPlaces = (runner.distanceRecord.firsts || 0) + (runner.distanceRecord.seconds || 0) + (runner.distanceRecord.thirds || 0);
    
    const distWinRate = (distWins / distStarts) * 100;
    const distPlaceRate = (distPlaces / distStarts) * 100;
    
    distancePerformance = (distWinRate * 0.7) + (distPlaceRate * 0.3);
  }

  // 4. JOCKEY/TRAINER COMBINATION (0-100)
  let jockeyTrainerRating = 50; // Default neutral
  
  // Use last 100 starts for recent performance
  const jtLast100 = runner.trainerJockeyA2E_Last100;
  if (jtLast100 && jtLast100.runners > 0) {
    // Use strikeRate if available (already a percentage)
    if (jtLast100.strikeRate !== undefined) {
      jockeyTrainerRating = jtLast100.strikeRate;
    } else {
      // Calculate from wins/runners
      const jtWinRate = (jtLast100.wins / jtLast100.runners) * 100;
      jockeyTrainerRating = jtWinRate;
    }
  } else {
    // Fall back to individual jockey stats
    const jockeyLast100 = runner.jockeyA2E_Last100;
    
    if (jockeyLast100 && jockeyLast100.runners > 0) {
      if (jockeyLast100.strikeRate !== undefined) {
        jockeyTrainerRating = jockeyLast100.strikeRate;
      } else {
        const jWinRate = (jockeyLast100.wins / jockeyLast100.runners) * 100;
        jockeyTrainerRating = jWinRate;
      }
    }
  }

  // 5. CLASS LEVEL (0-100) - Group race performance
  let classLevel = 50;
  
  const hasGroupRuns = (runner.group1Record?.starts || 0) + (runner.group2Record?.starts || 0) + (runner.group3Record?.starts || 0);
  
  if (hasGroupRuns > 0) {
    const g1Wins = runner.group1Record?.firsts || 0;
    const g2Wins = runner.group2Record?.firsts || 0;
    const g3Wins = runner.group3Record?.firsts || 0;
    
    // Weight group wins heavily
    classLevel = 50 + (g1Wins * 20) + (g2Wins * 15) + (g3Wins * 10);
    classLevel = Math.min(classLevel, 100);
  }

  // 6. RECENT FORM (0-100) - From last10 string
  let recentFormScore = 50;
  const formString = runner.last10 || '';
  
  if (formString) {
    let positions: number[] = [];
    
    // Split by 'x' or just parse digits
    if (formString.includes('x')) {
      const parts = formString.split('x');
      positions = parts
        .filter((p: string) => /^\d+$/.test(p))
        .map((p: string) => parseInt(p, 10));
    } else {
      // Try to extract individual digits/numbers
      const matches = formString.match(/\d+/g);
      if (matches) {
        positions = matches.map((m: string) => parseInt(m, 10));
      }
    }
    
    if (positions.length > 0) {
      const positionScores: number[] = positions.slice(0, 5).map(pos => {
        if (pos === 1) return 100;
        if (pos === 2) return 80;
        if (pos === 3) return 60;
        if (pos <= 5) return 40;
        if (pos <= 10) return 20;
        return 0;
      });
      
      const totalScore: number = positionScores.reduce((sum: number, score: number) => sum + score, 0);
      recentFormScore = totalScore / positions.length;
    }
  }

  // 7. CONSISTENCY (0-100) - Last start performance
  let consistency = 50;
  
  if (runner.position && runner.position <= 10) {
    // Score based on last start position
    consistency = Math.max(0, 100 - (runner.position * 8));
    
    // Boost if close margin
    if (runner.margin && runner.margin < 2) {
      consistency += 10;
      consistency = Math.min(consistency, 100);
    }
  }

  // ========================================
  // WEIGHTED COMPOSITE RATING
  // ========================================
  const rating = (
    (baseForm * 0.20) +              // 20% base form
    (trackConditionRating * 0.20) +  // 20% track condition
    (distancePerformance * 0.15) +   // 15% distance
    (jockeyTrainerRating * 0.15) +   // 15% jockey/trainer
    (classLevel * 0.10) +            // 10% class
    (recentFormScore * 0.15) +       // 15% recent form
    (consistency * 0.05)             // 5% consistency
  );

  // Convert to price
  const probability = Math.max(rating / 100, 0.01); // Avoid division by zero
  const margin = 1.17;
  const price = (1 / probability) * margin;

  return {
    rating: Math.round(rating * 10) / 10,
    price: Math.round(price * 100) / 100,
    components: {
      baseForm: Math.round(baseForm * 10) / 10,
      trackCondition: Math.round(trackConditionRating * 10) / 10,
      distancePerformance: Math.round(distancePerformance * 10) / 10,
      jockeyTrainer: Math.round(jockeyTrainerRating * 10) / 10,
      classLevel: Math.round(classLevel * 10) / 10,
      recentForm: Math.round(recentFormScore * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
    },
  };
}

// ========================================
// COMPARISON LOGIC
// ========================================

async function compareRatings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔬 TTR vs ADVANCED Punting Form Ratings - Comparison Analysis');
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

  if (meetings.length === 0) {
    console.log('⚠️ No meetings found');
    return;
  }

  console.log(`✅ Found ${meetings.length} meetings\n`);

  let totalComparisons = 0;
  let totalRatingDiff = 0;
  const meetingsToAnalyze = meetings.slice(0, 2);

  for (const meeting of meetingsToAnalyze) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📍 ${meeting.track.name} - ${meeting.track.state}`);
    console.log(`${'═'.repeat(70)}\n`);

    try {
      const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
      const races = fieldsResponse.payLoad?.races || [];

      if (races.length === 0) continue;

      const race = races[0]; // First race only
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
            console.log(`✅ Found TTR ratings (${ttrData.length} horses)\n`);
            break;
          }
        } catch (error: any) {
          // Try next
        }
      }

      if (ttrData.length === 0) continue;

      // Expected track condition (default to 'good' if null)
      const trackCondition = fieldsResponse.payLoad.expectedCondition || 'good';

      console.log('┌────┬─────────────────────────┬──────────┬──────────┬──────────┬─────────────────────────────────────────────┐');
      console.log('│ No │ Horse                   │ TTR Rtg  │ Adv Rtg  │ Diff     │ Component Breakdown                         │');
      console.log('├────┼─────────────────────────┼──────────┼──────────┼──────────┼─────────────────────────────────────────────┤');

      for (const runner of race.runners.slice(0, 10)) {
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
        }

        const ttrRtgStr = ttrRating !== null ? ttrRating.toFixed(1).padStart(6) : '   -  ';
        const advRtgStr = advanced.rating.toFixed(1).padStart(6);
        const diffStr = ratingDiff !== null ? ratingDiff.toFixed(1).padStart(6) : '   -  ';
        
        const components = `B:${advanced.components.baseForm.toFixed(0)} T:${advanced.components.trackCondition.toFixed(0)} D:${advanced.components.distancePerformance.toFixed(0)} J:${advanced.components.jockeyTrainer.toFixed(0)} R:${advanced.components.recentForm.toFixed(0)}`;

        const name = horseName.substring(0, 22).padEnd(23);
        const tabNo = (runner.tabNo || 0).toString().padStart(2);

        console.log(`│ ${tabNo} │ ${name} │ ${ttrRtgStr} │ ${advRtgStr} │ ${diffStr} │ ${components.padEnd(43)} │`);
      }

      console.log('└────┴─────────────────────────┴──────────┴──────────┴──────────┴─────────────────────────────────────────────┘\n');
      console.log('Legend: B=BaseForm T=TrackCond D=Distance J=JockeyTrainer R=RecentForm\n');

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      continue;
    }
  }

  if (totalComparisons > 0) {
    const avgDiff = totalRatingDiff / totalComparisons;
    console.log(`\n${'═'.repeat(70)}`);
    console.log('📊 SUMMARY');
    console.log(`${'═'.repeat(70)}\n`);
    console.log(`Total comparisons: ${totalComparisons}`);
    console.log(`Average difference: ${avgDiff.toFixed(2)} points\n`);

    if (avgDiff < 15) {
      console.log('✅ EXCELLENT: Average difference < 15 points - Advanced ratings are very close to TTR!');
    } else if (avgDiff < 25) {
      console.log('⚠️ GOOD: Average difference 15-25 points - Promising results!');
    } else {
      console.log('❌ MODERATE: Average difference > 25 points - Still some variance.');
    }
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

compareRatings().catch(console.error);