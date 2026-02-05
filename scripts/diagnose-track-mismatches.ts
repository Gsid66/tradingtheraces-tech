#!/usr/bin/env node
/**
 * Track Name Mismatch Diagnostic Tool
 * 
 * This script fetches data from both PuntingForm API and TTR API,
 * then compares track names to identify mismatches and suggest mappings.
 * 
 * Usage:
 *   npx tsx scripts/diagnose-track-mismatches.ts [date]
 * 
 * Examples:
 *   npx tsx scripts/diagnose-track-mismatches.ts              # Use today's date
 *   npx tsx scripts/diagnose-track-mismatches.ts 2026-02-05  # Use specific date
 */

import { format } from 'date-fns';
import { getPuntingFormClient } from '../lib/integrations/punting-form/client';
import { getRaceCardRatingsClient } from '../lib/integrations/race-card-ratings';
import {
  convertTTRToPuntingForm,
  convertPuntingFormToTTR,
  getAllPossibleMatches
} from '../lib/utils/track-name-standardizer';
import {
  SURFACE_SPECIFIC_TRACKS,
  TTR_TO_PUNTINGFORM,
  PUNTINGFORM_TO_TTR
} from '../lib/utils/track-name-mappings';

interface TrackMatch {
  puntingFormName: string;
  ttrName: string;
  surface: string | null;
  matched: boolean;
  mappingExists: boolean;
  suggestions?: string[];
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Track Name Matching Diagnostic Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get date from command line or use today
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');
  
  console.log(`📅 Date: ${dateStr}\n`);

  // Fetch PuntingForm meetings
  console.log('📡 Fetching PuntingForm meetings...');
  const pfClient = getPuntingFormClient();
  
  let pfMeetings: any[] = [];
  try {
    const response = await pfClient.getMeetingsByDate(targetDate);
    pfMeetings = response.payLoad || [];
    console.log(`✅ Found ${pfMeetings.length} PuntingForm meetings\n`);
  } catch (error: any) {
    console.error('❌ Failed to fetch PuntingForm meetings:', error.message);
    process.exit(1);
  }

  // Fetch TTR ratings
  console.log('📡 Fetching TTR ratings...');
  const ttrClient = getRaceCardRatingsClient();
  
  let ttrTracks = new Set<string>();
  if (ttrClient) {
    try {
      const response = await ttrClient.getRatingsByDate(dateStr);
      const ratings = response.data || [];
      
      // Extract unique track names
      ratings.forEach((rating: any) => {
        if (rating.track) {
          ttrTracks.add(rating.track);
        }
      });
      
      console.log(`✅ Found ${ttrTracks.size} unique TTR tracks\n`);
    } catch (error: any) {
      console.warn('⚠️ Failed to fetch TTR ratings:', error.message);
      console.log('   Continuing with comparison based on PuntingForm data only\n');
    }
  } else {
    console.warn('⚠️ TTR client not available (check RACE_CARD_RATINGS_API_URL)');
    console.log('   Continuing with mapping validation only\n');
  }

  // Analyze matches
  const matches: TrackMatch[] = [];
  const ttrTracksArray = Array.from(ttrTracks);

  console.log('🔍 Analyzing track name matches...\n');

  for (const meeting of pfMeetings) {
    const pfTrackName = meeting.track.name;
    const surface = meeting.track.surface;
    
    // Convert PuntingForm name to possible TTR names
    const possibleTTRNames = convertPuntingFormToTTR(pfTrackName, surface);
    
    // Check if any TTR track matches
    let matched = false;
    let matchedTTRName = '';
    
    for (const ttrName of possibleTTRNames) {
      if (ttrTracksArray.includes(ttrName)) {
        matched = true;
        matchedTTRName = ttrName;
        break;
      }
    }
    
    // Check if mapping exists
    const pfKey = pfTrackName.toLowerCase().trim();
    const mappingExists = !!PUNTINGFORM_TO_TTR[pfKey];
    
    matches.push({
      puntingFormName: pfTrackName,
      ttrName: matchedTTRName || possibleTTRNames[0],
      surface,
      matched: matched || ttrTracks.size === 0, // If no TTR data, assume matched for mapping check
      mappingExists,
      suggestions: possibleTTRNames
    });
  }

  // Also check for TTR tracks without PuntingForm meetings
  const pfTrackNames = new Set(pfMeetings.map(m => m.track.name));
  const unmatchedTTRTracks: string[] = [];
  
  for (const ttrTrack of ttrTracksArray) {
    const possiblePFNames = convertTTRToPuntingForm(ttrTrack);
    const hasMatch = possiblePFNames.some(name => pfTrackNames.has(name));
    
    if (!hasMatch) {
      unmatchedTTRTracks.push(ttrTrack);
    }
  }

  // Generate Report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Successfully matched tracks
  const successfulMatches = matches.filter(m => m.matched && m.mappingExists);
  if (successfulMatches.length > 0) {
    console.log(`✅ Successfully Matched (${successfulMatches.length}):`);
    for (const match of successfulMatches) {
      const surfaceInfo = match.surface ? ` (${match.surface})` : '';
      console.log(`   ${match.puntingFormName}${surfaceInfo} ↔ ${match.ttrName}`);
      
      // Highlight surface-specific tracks
      const key = match.ttrName.toLowerCase().trim();
      if (SURFACE_SPECIFIC_TRACKS[key]) {
        console.log(`      ℹ️  Surface-specific track (uses different names by surface)`);
      }
    }
    console.log();
  }

  // Tracks that match but lack explicit mapping
  const matchedWithoutMapping = matches.filter(m => m.matched && !m.mappingExists);
  if (matchedWithoutMapping.length > 0) {
    console.log(`⚠️ Matched but Missing Explicit Mapping (${matchedWithoutMapping.length}):`);
    for (const match of matchedWithoutMapping) {
      const surfaceInfo = match.surface ? ` (${match.surface})` : '';
      console.log(`   ${match.puntingFormName}${surfaceInfo} ↔ ${match.ttrName}`);
      console.log(`      💡 Add to PUNTINGFORM_TO_TTR: '${match.puntingFormName.toLowerCase()}': '${match.ttrName}'`);
    }
    console.log();
  }

  // Mismatches (PuntingForm tracks without TTR data)
  const mismatches = matches.filter(m => !m.matched);
  if (mismatches.length > 0) {
    console.log(`❌ Mismatches - PuntingForm Tracks Without TTR Data (${mismatches.length}):`);
    for (const match of mismatches) {
      const surfaceInfo = match.surface ? ` (${match.surface})` : '';
      console.log(`   PuntingForm: "${match.puntingFormName}"${surfaceInfo}`);
      console.log(`      Expected TTR: ${match.suggestions?.join(' or ')}`);
      console.log(`      Mapping exists: ${match.mappingExists ? '✅' : '❌'}`);
      
      if (!match.mappingExists) {
        console.log(`      💡 Add to PUNTINGFORM_TO_TTR: '${match.puntingFormName.toLowerCase()}': '${match.ttrName}'`);
      }
    }
    console.log();
  }

  // Unmatched TTR tracks (TTR data without PuntingForm meetings)
  if (unmatchedTTRTracks.length > 0) {
    console.log(`⚠️ TTR Tracks Without PuntingForm Meetings (${unmatchedTTRTracks.length}):`);
    for (const ttrTrack of unmatchedTTRTracks) {
      const possiblePFNames = convertTTRToPuntingForm(ttrTrack);
      console.log(`   TTR: "${ttrTrack}"`);
      console.log(`      Expected PuntingForm: ${possiblePFNames.join(' or ')}`);
      console.log(`      Reason: No meeting scheduled or past date`);
    }
    console.log();
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Total PuntingForm meetings: ${pfMeetings.length}`);
  console.log(`Total TTR tracks: ${ttrTracks.size}`);
  console.log(`Successfully matched: ${successfulMatches.length}`);
  console.log(`Matched without mapping: ${matchedWithoutMapping.length}`);
  console.log(`Mismatches: ${mismatches.length}`);
  console.log(`Unmatched TTR tracks: ${unmatchedTTRTracks.length}\n`);

  // Surface-specific tracks info
  const surfaceSpecificCount = Object.keys(SURFACE_SPECIFIC_TRACKS).length;
  console.log(`Surface-specific tracks configured: ${surfaceSpecificCount}`);
  
  const surfaceSpecificToday = matches.filter(m => {
    const key = m.ttrName.toLowerCase().trim();
    return SURFACE_SPECIFIC_TRACKS[key];
  });
  
  if (surfaceSpecificToday.length > 0) {
    console.log(`Surface-specific tracks racing today: ${surfaceSpecificToday.length}`);
    surfaceSpecificToday.forEach(m => {
      console.log(`   - ${m.puntingFormName} (${m.surface || 'unknown surface'})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Exit with error code if there are critical issues
  if (mismatches.length > 0 || matchedWithoutMapping.length > 0) {
    console.log('\n⚠️ Action required: Some tracks need mapping updates');
    process.exit(1);
  } else {
    console.log('\n✅ All tracks are properly mapped!');
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
