import { config } from 'dotenv';
config({ path: '.env.local' });

import { getPuntingFormClient } from '../lib/integrations/punting-form/client';

async function checkRatingsEndpoint() {
  const apiKey = process.env.PUNTING_FORM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PUNTING_FORM_API_KEY not found');
    return;
  }

  console.log('🔍 CHECKING PUNTING FORM RATINGS ENDPOINT\n');
  console.log('═'.repeat(70));

  // First, get a valid meeting ID
  console.log('\n📡 Step 1: Getting a valid meeting ID...\n');
  
  const pfClient = getPuntingFormClient();
  const targetDate = new Date('2026-02-05');
  const meetingsResponse = await pfClient.getMeetingsByDate(targetDate);
  const meetings = meetingsResponse.payLoad || [];
  
  if (meetings.length === 0) {
    console.error('❌ No meetings found');
    return;
  }
  
  const meeting = meetings[0];
  console.log(`✅ Using meeting: ${meeting.track.name} (ID: ${meeting.meetingId})\n`);

  // Test 1: MeetingRatings with meetingId
  console.log('═'.repeat(70));
  console.log('\n📡 Step 2: Fetching RATINGS data for this meeting...');
  console.log('─'.repeat(70));
  
  const baseUrl = 'https://api.puntingform.com.au/v2/Ratings/MeetingRatings';
  const url = `${baseUrl}?meetingId=${meeting.meetingId}&apiKey=${apiKey}`;
  
  console.log(`\nURL: ${baseUrl}?meetingId=${meeting.meetingId}`);
  console.log('Calling endpoint...\n');

  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }

    const data = await response.json();
    
    console.log('✅ SUCCESS! Ratings data retrieved!\n');
    console.log('═'.repeat(70));
    console.log('📊 FULL RESPONSE (first 3000 chars):\n');
    console.log(JSON.stringify(data, null, 2).substring(0, 3000));
    
    if (JSON.stringify(data).length > 3000) {
      console.log('\n... (truncated for readability)');
    }

    // Analyze the structure
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 DETAILED STRUCTURE ANALYSIS:\n');
    
    if (data.payLoad && data.payLoad.races && Array.isArray(data.payLoad.races)) {
      console.log(`✅ Found ${data.payLoad.races.length} races with ratings\n`);
      
      const firstRace = data.payLoad.races[0];
      console.log(`📍 Race ${firstRace.number}: ${firstRace.name}`);
      
      if (firstRace.runners && Array.isArray(firstRace.runners)) {
        console.log(`   Runners: ${firstRace.runners.length}\n`);
        
        if (firstRace.runners.length > 0) {
          const runner = firstRace.runners[0];
          console.log(`   🐴 First runner: ${runner.name || runner.horseName || 'Unknown'}\n`);
          console.log(`   Available fields:`);
          
          Object.keys(runner).sort().forEach(key => {
            const value = runner[key];
            let preview = '';
            
            if (value === null || value === undefined) {
              preview = 'null';
            } else if (typeof value === 'object') {
              preview = Array.isArray(value) ? `[${value.length} items]` : '{...}';
            } else {
              preview = String(value).substring(0, 50);
            }
            
            console.log(`      - ${key.padEnd(30)}: ${preview}`);
          });
          
          // Highlight rating-specific fields
          console.log('\n' + '─'.repeat(70));
          console.log('   🎯 RATING-SPECIFIC FIELDS:\n');
          
          const ratingFields = Object.keys(runner).filter(k => 
            k.toLowerCase().includes('rating') || 
            k.toLowerCase().includes('speed') ||
            k.toLowerCase().includes('sectional') ||
            k.toLowerCase().includes('score') ||
            k.toLowerCase().includes('index')
          );
          
          if (ratingFields.length > 0) {
            ratingFields.forEach(field => {
              const value = runner[field];
              console.log(`      ✨ ${field}: ${JSON.stringify(value)}`);
            });
          } else {
            console.log('      ⚠️  No obvious rating fields found');
          }
          
          // Show full runner object for first runner
          console.log('\n' + '─'.repeat(70));
          console.log('   📋 FULL RUNNER OBJECT:\n');
          console.log(JSON.stringify(runner, null, 2));
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

checkRatingsEndpoint().catch(console.error);