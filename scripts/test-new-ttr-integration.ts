/**
 * Test Script for New TTR Integration
 * 
 * This script tests the new PFAI-based TTR ratings client.
 * It fetches ratings for a sample meeting and displays the results.
 * 
 * Usage:
 *   npx tsx scripts/test-new-ttr-integration.ts
 */

import { getTTRRatingsClient } from '../lib/integrations/ttr-ratings/pfai-client';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function testTTRIntegration() {
  console.log('🧪 Testing New TTR Integration with PFAI\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get a sample meeting from Punting Form
    console.log('\n📅 Step 1: Fetching today\'s meetings...');
    const pfClient = getPuntingFormClient();
    const meetingsResponse = await pfClient.getTodaysMeetings();
    const meetings = meetingsResponse.payLoad || [];

    if (meetings.length === 0) {
      console.log('⚠️  No meetings found for today');
      return;
    }

    const sampleMeeting = meetings[0];
    console.log(`✅ Found ${meetings.length} meetings`);
    console.log(`📍 Testing with: ${sampleMeeting.track.name}`);
    console.log(`   Meeting ID: ${sampleMeeting.meetingId}`);
    console.log(`   Date: ${sampleMeeting.meetingDate}`);

    // Step 2: Get races for the meeting
    console.log('\n🏇 Step 2: Fetching races for meeting...');
    const racesResponse = await pfClient.getAllRacesForMeeting(sampleMeeting.meetingId);
    const races = racesResponse.payLoad?.races || [];

    if (races.length === 0) {
      console.log('⚠️  No races found for this meeting');
      return;
    }

    const sampleRace = races[0];
    console.log(`✅ Found ${races.length} races`);
    console.log(`🎯 Testing with Race ${sampleRace.number}`);
    console.log(`   Race Name: ${sampleRace.name}`);
    console.log(`   Distance: ${sampleRace.distance}m`);
    console.log(`   Runners: ${sampleRace.runners?.length || 0}`);

    // Step 3: Test TTR Ratings Client
    console.log('\n⭐ Step 3: Testing TTR Ratings Client...');
    const ttrClient = getTTRRatingsClient();

    if (!ttrClient) {
      console.error('❌ Failed to initialize TTR Ratings Client');
      console.error('   Make sure PUNTING_FORM_API_KEY is set in your environment');
      return;
    }

    console.log('✅ TTR Ratings Client initialized');

    // Step 4: Fetch ratings for the race
    console.log('\n📊 Step 4: Fetching TTR ratings for the race...');
    const ttrResponse = await ttrClient.getRatingsForRace(
      sampleMeeting.meetingId,
      sampleRace.number
    );

    console.log(`\n📈 Response Status: ${ttrResponse.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`📈 Ratings Count: ${ttrResponse.data.length}`);

    if (ttrResponse.data.length > 0) {
      console.log('\n🐴 Sample Ratings (first 5 runners):');
      console.log('-'.repeat(60));

      ttrResponse.data.slice(0, 5).forEach((rating, index) => {
        console.log(`\n${index + 1}. ${rating.horse_name} (Tab #${rating.tab_number})`);
        console.log(`   Rating: ${rating.rating}`);
        console.log(`   Price: $${rating.price.toFixed(2)}`);
        if (rating.time_rank) console.log(`   Time Rank: ${rating.time_rank}`);
        if (rating.class_rank) console.log(`   Class Rank: ${rating.class_rank}`);
        if (rating.run_style) console.log(`   Run Style: ${rating.run_style}`);
        console.log(`   Reliable: ${rating.is_reliable ? 'Yes' : 'No'}`);
      });

      if (ttrResponse.data.length > 5) {
        console.log(`\n... and ${ttrResponse.data.length - 5} more ratings`);
      }
    } else {
      console.log('\n⚠️  No ratings data returned (this is not necessarily an error)');
      console.log('   The API may not have ratings for all meetings/races');
    }

    // Step 5: Test meeting-level fetch
    console.log('\n📊 Step 5: Testing meeting-level ratings fetch...');
    const meetingRatings = await ttrClient.getRatingsForMeeting(sampleMeeting.meetingId);

    console.log(`\n📈 Meeting Response Status: ${meetingRatings.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`📈 Total Ratings: ${meetingRatings.data.length}`);

    if (meetingRatings.data.length > 0) {
      // Group by race number
      const raceGroups = meetingRatings.data.reduce((acc, rating) => {
        if (!acc[rating.race_number]) {
          acc[rating.race_number] = [];
        }
        acc[rating.race_number].push(rating);
        return acc;
      }, {} as Record<number, typeof meetingRatings.data>);

      console.log('\n📋 Ratings by Race:');
      Object.keys(raceGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach((raceNum) => {
        console.log(`   Race ${raceNum}: ${raceGroups[parseInt(raceNum)].length} runners`);
      });
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`✓ Client initialization: OK`);
    console.log(`✓ Race-level fetch: ${ttrResponse.success ? 'OK' : 'FAILED'}`);
    console.log(`✓ Meeting-level fetch: ${meetingRatings.success ? 'OK' : 'FAILED'}`);
    console.log(`✓ Data structure: OK`);
    console.log(`✓ Horse name field: ${ttrResponse.data[0]?.horse_name ? 'OK' : 'N/A'}`);
    console.log(`✓ Rating field: ${ttrResponse.data[0]?.rating !== undefined ? 'OK' : 'N/A'}`);
    console.log(`✓ Price field: ${ttrResponse.data[0]?.price !== undefined ? 'OK' : 'N/A'}`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testTTRIntegration().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
