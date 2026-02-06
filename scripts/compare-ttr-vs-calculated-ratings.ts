import { config } from 'dotenv';
config({ path: '.env.local' });

import { format } from 'date-fns';
import { getPuntingFormClient, PFRunner } from '../lib/integrations/punting-form/client';
import { getRaceCardRatingsClient } from '../lib/integrations/race-card-ratings';
import { convertPuntingFormToTTR } from '../lib/utils/track-name-standardizer';

// ========================================
// RATING CALCULATION ALGORITHM
// ========================================

interface CalculatedRating {
  rating: number;        // 0-100 scale
  price: number;         // Decimal odds
  components: {
    winRate: number;
    placeRate: number;
    recentForm: number;
    prizeMoneyScore: number;
  };
}

/**
 * Calculate a rating from Punting Form runner data
 */
function calculateRatingFromPuntingForm(runner: PFRunner): CalculatedRating {
  // Career statistics
  const starts = runner.careerStarts || 0;
  const wins = runner.careerWins || 0;
  const seconds = runner.careerSeconds || 0;
  const thirds = runner.careerThirds || 0;
  const prizeMoney = runner.prizeMoney || 0;

  // 1. WIN RATE (0-100)
  const winRate = starts > 0 ? (wins / starts) * 100 : 0;

  // 2. PLACE RATE (0-100)
  const places = wins + seconds + thirds;
  const placeRate = starts > 0 ? (places / starts) * 100 : 0;

  // 3. RECENT FORM SCORE (0-100)
  let recentFormScore = 50; // Default to neutral
  const formString = runner.lastFiveStarts || runner.last10 || '';
  
  if (formString) {
    let positions: number[] = [];
    
    if (formString.includes('-')) {
      positions = formString
        .split('-')
        .filter(p => /^\d+$/.test(p))
        .map(p => parseInt(p, 10))
        .slice(0, 5);
    } 
    else if (formString.includes('x') || formString.includes('X')) {
      positions = formString
        .split(/[xX]/)
        .filter(p => /^\d+$/.test(p))
        .map(p => parseInt(p, 10))
        .slice(0, 5);
    }
    else {
      const matches = formString.match(/\d+/g);
      if (matches) {
        positions = matches.map(p => parseInt(p, 10)).slice(0, 5);
      }
    }

        if (positions.length > 0) {
      const positionScores: number[] = positions.map(pos => {
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

  // 4. PRIZE MONEY SCORE (0-100)
  const prizeMoneyScore = Math.min((prizeMoney / 1000000) * 100, 100);

  // ========================================
  // COMPOSITE RATING (weighted average)
  // ========================================
  const rating = (
    (winRate * 0.35) +           // 35% weight on win rate
    (placeRate * 0.25) +         // 25% weight on place rate
    (recentFormScore * 0.30) +   // 30% weight on recent form
    (prizeMoneyScore * 0.10)     // 10% weight on prize money
  );

  // ========================================
  // CONVERT RATING TO PRICE
  // ========================================
  const probability = rating / 100;
  const margin = 1.17; // 17% overround
  const price = probability > 0 ? (1 / probability) * margin : 999.99;

  return {
    rating: Math.round(rating * 10) / 10,
    price: Math.round(price * 100) / 100,
    components: {
      winRate: Math.round(winRate * 10) / 10,
      placeRate: Math.round(placeRate * 10) / 10,
      recentForm: Math.round(recentFormScore * 10) / 10,
      prizeMoneyScore: Math.round(prizeMoneyScore * 10) / 10,
    },
  };
}

// ========================================
// COMPARISON & ANALYSIS
// ========================================

interface ComparisonResult {
  horseName: string;
  tabNumber: number;
  ttrRating: number | null;
  ttrPrice: number | null;
  calcRating: number;
  calcPrice: number;
  ratingDiff: number | null;
  priceDiff: number | null;
  percentDiff: number | null;
  components: {
    winRate: number;
    placeRate: number;
    recentForm: number;
    prizeMoneyScore: number;
  };
  careerStats: string;
}

async function compareRatings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔬 TTR Ratings vs Calculated Ratings - Comparison Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pfClient = getPuntingFormClient();
  const ttrClient = getRaceCardRatingsClient();

  if (!ttrClient) {
    console.error('❌ TTR client not available. Check RACE_CARD_RATINGS_API_URL');
    return;
  }

  const targetDate = new Date('2026-02-05');
  const dateStr = '2026-02-05';
  
  console.log(`📅 Analysis Date: ${dateStr} (historical data)\n`);

  console.log('📡 Fetching meetings from Punting Form API...');
  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meetings = meetingsResponse.payLoad || [];

  if (meetings.length === 0) {
    console.log('⚠️ No meetings found for 2026-02-05');
    return;
  }

  console.log(`✅ Found ${meetings.length} meetings\n`);

  let totalComparisons = 0;
  let totalRatingDiff = 0;
  let totalPriceDiff = 0;
  let meetingsAnalyzed = 0;

  const allResults: ComparisonResult[] = [];
  const meetingsToAnalyze = meetings.slice(0, 3);

  for (const meeting of meetingsToAnalyze) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📍 ${meeting.track.name} - ${meeting.track.state}`);
    console.log(`${'═'.repeat(70)}\n`);

    try {
      const fieldsResponse = await pfClient.getAllRacesForMeeting(meeting.meetingId);
      const races = fieldsResponse.payLoad?.races || [];

      if (races.length === 0) {
        console.log('⚠️ No races available for this meeting\n');
        continue;
      }

      const racesToAnalyze = races.slice(0, 2);

      for (const race of racesToAnalyze) {
        const raceNumber = race.number;

        console.log(`🏁 Race ${raceNumber}: ${race.name}`);
        console.log(`   Distance: ${race.distance}m | Runners: ${race.runners?.length || 0}\n`);

        if (!race.runners || race.runners.length === 0) {
          console.log('⚠️ No runners in this race\n');
          continue;
        }

        const possibleTTRNames = convertPuntingFormToTTR(
          meeting.track.name,
          meeting.track.surface ?? undefined
        );

        let ttrData: any[] = [];
        for (const ttrTrackName of possibleTTRNames) {
          try {
            const ttrResponse = await ttrClient.getRatingsForRace(
              dateStr,
              ttrTrackName,
              raceNumber
            );
            if (ttrResponse.data && ttrResponse.data.length > 0) {
              ttrData = ttrResponse.data;
              console.log(`✅ Found TTR ratings (${ttrData.length} horses)\n`);
              break;
            }
          } catch (error: any) {
            // Try next variation
          }
        }

        if (ttrData.length === 0) {
          console.log('⚠️ No TTR ratings found for this race\n');
          continue;
        }

        const raceResults: ComparisonResult[] = [];

        for (const runner of race.runners) {
          const horseName = runner.name || runner.horseName || 'Unknown';
          
          const ttrRunner = ttrData.find(ttr => 
            ttr.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim()
          );

          const calculated = calculateRatingFromPuntingForm(runner);

          const ttrRatingNum = ttrRunner?.rating !== null && ttrRunner?.rating !== undefined 
            ? Number(ttrRunner.rating) 
            : null;
          const ttrPriceNum = ttrRunner?.price !== null && ttrRunner?.price !== undefined 
            ? Number(ttrRunner.price) 
            : null;

          const ratingDiff = ttrRatingNum !== null && !isNaN(ttrRatingNum)
            ? Math.abs(ttrRatingNum - calculated.rating) 
            : null;
          const priceDiff = ttrPriceNum !== null && !isNaN(ttrPriceNum)
            ? Math.abs(ttrPriceNum - calculated.price) 
            : null;
          const percentDiff = ttrRatingNum !== null && !isNaN(ttrRatingNum) && ttrRatingNum > 0
            ? Math.abs((ttrRatingNum - calculated.rating) / ttrRatingNum * 100) 
            : null;

          const result: ComparisonResult = {
            horseName,
            tabNumber: runner.tabNumber || 0,
            ttrRating: ttrRatingNum,
            ttrPrice: ttrPriceNum,
            calcRating: calculated.rating,
            calcPrice: calculated.price,
            ratingDiff,
            priceDiff,
            percentDiff,
            components: calculated.components,
            careerStats: `${runner.careerStarts || 0}: ${runner.careerWins || 0}-${runner.careerSeconds || 0}-${runner.careerThirds || 0}`,
          };

          raceResults.push(result);

          if (ratingDiff !== null) {
            totalRatingDiff += ratingDiff;
            totalComparisons++;
          }
          if (priceDiff !== null) {
            totalPriceDiff += priceDiff;
          }
        }

        console.log('┌────┬─────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐');
        console.log('│ No │ Horse                   │ TTR Rtg  │ Calc Rtg │ Diff     │ TTR $    │ Calc $   │ Diff %   │');
        console.log('├────┼─────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤');

        for (const result of raceResults) {
          const ttrRating = result.ttrRating !== null ? Number(result.ttrRating) : null;
          const ttrPrice = result.ttrPrice !== null ? Number(result.ttrPrice) : null;
          
          const ttrRtgStr = ttrRating !== null && !isNaN(ttrRating) ? ttrRating.toFixed(1).padStart(6) : '   -  ';
          const calcRtgStr = result.calcRating.toFixed(1).padStart(6);
          const diffStr = result.ratingDiff !== null ? result.ratingDiff.toFixed(1).padStart(6) : '   -  ';
          const ttrPriceStr = ttrPrice !== null && !isNaN(ttrPrice) ? ttrPrice.toFixed(2).padStart(6) : '   -  ';
          const calcPriceStr = result.calcPrice.toFixed(2).padStart(6);
          const percentStr = result.percentDiff !== null ? result.percentDiff.toFixed(1).padStart(6) + '%' : '   -   ';

          const horseName = result.horseName.substring(0, 22).padEnd(23);
          const tabNo = result.tabNumber.toString().padStart(2);

          console.log(`│ ${tabNo} │ ${horseName} │ ${ttrRtgStr} │ ${calcRtgStr} │ ${diffStr} │ ${ttrPriceStr} │ ${calcPriceStr} │ ${percentStr} │`);
        }

        console.log('└────┴─────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘\n');

        console.log('📊 Rating Component Breakdown (Top 3):');
        const top3 = raceResults.slice(0, 3);
        for (const result of top3) {
          console.log(`\n   ${result.tabNumber}. ${result.horseName}`);
          console.log(`      Career: ${result.careerStats}`);
          console.log(`      Components: Win=${result.components.winRate}% | Place=${result.components.placeRate}% | Form=${result.components.recentForm} | Prize=$${result.components.prizeMoneyScore}`);
        }

        allResults.push(...raceResults);
      }

      meetingsAnalyzed++;
    } catch (error: any) {
      console.error(`❌ Error processing ${meeting.track.name}:`, error.message);
      continue;
    }
  }

  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('📊 OVERALL COMPARISON SUMMARY');
  console.log(`${'═'.repeat(70)}\n`);

  if (totalComparisons > 0) {
    const avgRatingDiff = totalRatingDiff / totalComparisons;
    const avgPriceDiff = totalPriceDiff / totalComparisons;

    console.log(`Total comparisons:        ${totalComparisons} horses`);
    console.log(`Meetings analyzed:        ${meetingsAnalyzed}`);
    console.log(`\nAverage rating difference: ${avgRatingDiff.toFixed(2)} points`);
    console.log(`Average price difference:  $${avgPriceDiff.toFixed(2)}`);

    const validResults = allResults.filter(r => r.ttrRating !== null && r.percentDiff !== null);
    if (validResults.length > 0) {
      const avgPercentDiff = validResults.reduce((sum, r) => sum + (r.percentDiff || 0), 0) / validResults.length;
      console.log(`Average percentage diff:   ${avgPercentDiff.toFixed(2)}%`);

      const maxDiff = Math.max(...validResults.map(r => r.ratingDiff || 0));
      const minDiff = Math.min(...validResults.filter(r => r.ratingDiff !== null).map(r => r.ratingDiff || 0));
      console.log(`\nVariance range:           ${minDiff.toFixed(1)} to ${maxDiff.toFixed(1)} points`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('💡 INTERPRETATION:');
    console.log('─'.repeat(70));
    if (avgRatingDiff < 10) {
      console.log('✅ GOOD: Average difference < 10 points - calculated ratings are reasonably close to TTR');
    } else if (avgRatingDiff < 20) {
      console.log('⚠️  MODERATE: Average difference 10-20 points - some variance but potentially usable');
    } else {
      console.log('❌ HIGH: Average difference > 20 points - significant variance from TTR ratings');
    }

    const validResultsCount = validResults.length;
    if (validResultsCount > 0) {
      const avgPercentDiff = validResults.reduce((sum, r) => sum + (r.percentDiff || 0), 0) / validResultsCount;
      
      if (avgPercentDiff < 15) {
        console.log('✅ GOOD: Average percentage difference < 15% - relative accuracy is good');
      } else if (avgPercentDiff < 30) {
        console.log('⚠️  MODERATE: Average percentage difference 15-30% - moderate variance');
      } else {
        console.log('❌ HIGH: Average percentage difference > 30% - high variance');
      }
    }

    console.log('\n' + '─'.repeat(70));
    console.log('📈 RECOMMENDATION:');
    console.log('─'.repeat(70));
    
    if (avgRatingDiff < 15) {
      console.log('✅ The calculated ratings show good correlation with TTR ratings.');
      console.log('   You could potentially use these as a replacement or backup.');
    } else if (avgRatingDiff < 25) {
      console.log('⚠️  The calculated ratings show moderate variance from TTR.');
      console.log('   Consider using as a supplementary rating rather than replacement.');
      console.log('   Or refine the algorithm weights to improve accuracy.');
    } else {
      console.log('❌ The calculated ratings show significant variance from TTR.');
      console.log('   Recommend keeping external TTR ratings for accuracy.');
      console.log('   These calculations could be used as a backup only.');
    }
  } else {
    console.log('❌ No valid comparisons could be made');
    console.log('   Check that:');
    console.log('   - TTR data exists for 2026-02-05');
    console.log('   - Punting Form API returned race data');
    console.log('   - Track name mappings are correct');
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

compareRatings().catch(console.error);