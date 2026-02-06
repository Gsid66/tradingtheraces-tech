import { config } from 'dotenv';
config({ path: '.env.local' });

import { format } from 'date-fns';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';
import { getRaceCardRatingsClient } from '../lib/integrations/race-card-ratings';
import { convertPuntingFormToTTR } from '../lib/utils/track-name-standardizer';

async function comparePFAIvsTTR() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔬 PFAI SCORE vs TTR RATINGS - Direct Comparison');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiKey = process.env.PUNTING_FORM_API_KEY;
  const pfClient = getPuntingFormClient();
  const ttrClient = getRaceCardRatingsClient();

  if (!ttrClient || !apiKey) {
    console.error('❌ Missing configuration');
    return;
  }

  const targetDate = new Date('2026-02-05');
  const dateStr = '2026-02-05';
  
  console.log(`📅 Analysis Date: ${dateStr}\n`);

  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meetings = meetingsResponse.payLoad || [];

  let totalComparisons = 0;
  let totalRatingDiff = 0;
  let totalAbsoluteError = 0;

  for (const meeting of meetings.slice(0, 3)) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📍 ${meeting.track.name} - ${meeting.track.state}`);
    console.log(`${'═'.repeat(70)}\n`);

    // Get PFAI ratings
    const pfRatingsUrl = `https://api.puntingform.com.au/v2/Ratings/MeetingRatings?meetingId=${meeting.meetingId}&apiKey=${apiKey}`;
    const pfRatingsResponse = await fetch(pfRatingsUrl);
    
    if (!pfRatingsResponse.ok) {
      console.log('⚠️  No PFAI ratings available\n');
      continue;
    }

    const pfRatingsData = await pfRatingsResponse.json();
    const pfRunners = pfRatingsData.payLoad || [];

    if (pfRunners.length === 0) {
      console.log('⚠️  No runners in PFAI data\n');
      continue;
    }

    // Group by race
    const raceMap = new Map<number, any[]>();
    pfRunners.forEach((runner: any) => {
      const raceNo = runner.raceNo;
      if (!raceMap.has(raceNo)) {
        raceMap.set(raceNo, []);
      }
      raceMap.get(raceNo)!.push(runner);
    });

    // Analyze first race
    const firstRaceNo = Math.min(...Array.from(raceMap.keys()));
    const raceRunners = raceMap.get(firstRaceNo) || [];

    console.log(`🏁 Race ${firstRaceNo}`);
    console.log(`   Runners: ${raceRunners.length}\n`);

    // Get TTR ratings for comparison
    const possibleTTRNames = convertPuntingFormToTTR(meeting.track.name, meeting.track.surface ?? undefined);
    let ttrData: any[] = [];
    
    for (const ttrTrackName of possibleTTRNames) {
      try {
        const ttrResponse = await ttrClient.getRatingsForRace(dateStr, ttrTrackName, firstRaceNo);
        if (ttrResponse.data && ttrResponse.data.length > 0) {
          ttrData = ttrResponse.data;
          break;
        }
      } catch (error: any) { }
    }

    if (ttrData.length === 0) {
      console.log('⚠️  No TTR data available for comparison\n');
      continue;
    }

    console.log('┌────┬─────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐');
    console.log('│ No │ Horse                   │ TTR Rtg  │ PFAI Sc  │ Diff     │ TTR $    │ PFAI $   │');
    console.log('├────┼─────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤');

    for (const pfRunner of raceRunners.slice(0, 12)) {
      const horseName = pfRunner.runnerName;
      
      const ttrRunner = ttrData.find(ttr => 
        ttr.horse_name.toLowerCase().trim() === horseName.toLowerCase().trim()
      );

      const ttrRating = ttrRunner?.rating ? Number(ttrRunner.rating) : null;
      const ttrPrice = ttrRunner?.price ? Number(ttrRunner.price) : null;
      const pfaiScore = pfRunner.pfaiScore || 0;
      const pfaiPrice = pfRunner.pfaiPrice || 0;

      const ratingDiff = ttrRating !== null ? Math.abs(ttrRating - pfaiScore) : null;

      if (ratingDiff !== null) {
        totalRatingDiff += ratingDiff;
        totalAbsoluteError += ratingDiff;
        totalComparisons++;
      }

      const ttrRtgStr = ttrRating !== null ? ttrRating.toFixed(1).padStart(6) : '   -  ';
      const pfaiStr = pfaiScore.toString().padStart(6);
      const diffStr = ratingDiff !== null ? ratingDiff.toFixed(1).padStart(6) : '   -  ';
      const ttrPriceStr = ttrPrice !== null ? `$${ttrPrice.toFixed(2)}`.padStart(6) : '   -  ';
      const pfaiPriceStr = `$${pfaiPrice.toFixed(2)}`.padStart(6);

      const name = horseName.substring(0, 22).padEnd(23);
      const tabNo = (pfRunner.tabNo || 0).toString().padStart(2);

      console.log(`│ ${tabNo} │ ${name} │ ${ttrRtgStr} │ ${pfaiStr} │ ${diffStr} │ ${ttrPriceStr} │ ${pfaiPriceStr} │`);
    }

    console.log('└────┴─────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘\n');
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('📊 COMPARISON SUMMARY');
  console.log(`${'═'.repeat(70)}\n`);
  
  if (totalComparisons > 0) {
    const avgDiff = totalRatingDiff / totalComparisons;
    const mae = totalAbsoluteError / totalComparisons;

    console.log(`Total comparisons:          ${totalComparisons}`);
    console.log(`Average difference:         ${avgDiff.toFixed(2)} points`);
    console.log(`Mean Absolute Error (MAE):  ${mae.toFixed(2)}\n`);

    console.log('═'.repeat(70));
    console.log('💡 ANALYSIS:');
    console.log('═'.repeat(70));
    
    if (avgDiff < 15) {
      console.log('\n✅ EXCELLENT! PFAI scores are very close to TTR ratings!');
      console.log('   → PFAI can be used as a viable alternative to TTR');
      console.log('   → Consider using PFAI as primary source (included in PF subscription)');
    } else if (avgDiff < 30) {
      console.log('\n⚠️  GOOD! PFAI scores show moderate alignment with TTR');
      console.log('   → PFAI is a solid backup option');
      console.log('   → Both sources provide value');
    } else {
      console.log('\n❌ MODERATE difference between PFAI and TTR');
      console.log('   → Different methodologies');
      console.log('   → Use both for comprehensive analysis');
    }

    console.log('\n' + '─'.repeat(70));
    console.log('📈 RECOMMENDATION:');
    console.log('─'.repeat(70));
    console.log('\nPunting Form AI (PFAI) provides:');
    console.log('  ✅ Speed ratings and sectional times');
    console.log('  ✅ AI-powered predictions');
    console.log('  ✅ Time rankings and class adjustments');
    console.log('  ✅ Running style and settle position predictions');
    console.log('  ✅ Included in existing PF API subscription');
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

comparePFAIvsTTR().catch(console.error);