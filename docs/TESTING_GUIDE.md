# Surface-Specific Track Name Mapping - Testing Guide

## Quick Test Checklist

### Pre-Deployment Tests

1. **Verify TypeScript Compilation**
   ```bash
   cd /home/runner/work/tradingtheraces-tech/tradingtheraces-tech
   npx tsc --noEmit
   ```

2. **Test Track Name Conversion Functions**
   ```typescript
   import { 
     convertTTRToPuntingForm, 
     convertPuntingFormToTTR,
     getAllPossibleMatches 
   } from './lib/utils/track-name-standardizer';
   
   // Test Newcastle/Beaumont conversion
   console.log('TTR to PF (Newcastle):', convertTTRToPuntingForm('Newcastle'));
   // Expected: ['Newcastle', 'Beaumont']
   
   console.log('TTR to PF (Newcastle, synthetic):', 
     convertTTRToPuntingForm('Newcastle', 'synthetic'));
   // Expected: ['Beaumont', 'Newcastle'] (synthetic prioritized)
   
   console.log('PF to TTR (Beaumont):', convertPuntingFormToTTR('Beaumont'));
   // Expected: ['Newcastle']
   
   console.log('All matches:', getAllPossibleMatches('Newcastle'));
   // Expected: { ttr: ['Newcastle'], puntingForm: ['Newcastle', 'Beaumont'] }
   ```

3. **Run Diagnostic Script** (requires API keys)
   ```bash
   # Set environment variables first
   export PUNTING_FORM_API_KEY="your-key"
   export RACE_CARD_RATINGS_API_URL="your-url"
   
   # Run diagnostic
   npx tsx scripts/diagnose-track-mismatches.ts
   ```
   
   Expected output:
   - Should identify Newcastle/Beaumont as surface-specific
   - Should show successful matches
   - Should suggest any missing mappings

4. **Run Validation Script** (requires database access)
   ```bash
   export DATABASE_URL="your-database-url"
   
   npx tsx scripts/validate-track-mappings.ts --days 30
   ```
   
   Expected output:
   - Should analyze track name mappings
   - Should show match rates
   - Should suggest any improvements

### Post-Deployment Tests

5. **Test Form Guide with Beaumont Meeting**
   
   When a Beaumont (synthetic surface) meeting is scheduled:
   
   a. Navigate to form guide: `/form-guide`
   b. Click on Beaumont meeting
   c. Verify TTR ratings appear for all runners
   d. Check browser console for conversion logs:
      ```
      🔍 Fetching TTR data with multiple track variations: {
        puntingFormTrackName: 'Beaumont',
        surface: 'synthetic',
        possibleTTRNames: ['Newcastle'],
        ...
      }
      ✅ Found TTR data with track name: "Newcastle"
      ```

6. **Test Database Joins**
   
   Navigate to race viewer or trading desk and verify:
   - State information appears for Newcastle/Beaumont races
   - Results data joins correctly
   - No NULL state values for these tracks

7. **Test with Newcastle Turf Meeting**
   
   When a Newcastle (turf surface) meeting is scheduled:
   
   a. Navigate to form guide for Newcastle
   b. Verify TTR ratings appear
   c. Check that both turf and synthetic surfaces work correctly

### Backward Compatibility Tests

8. **Test Non-Surface-Specific Tracks**
   
   Test with regular tracks (Flemington, Randwick, etc.):
   - Form guide should show ratings normally
   - Database queries should work as before
   - No regression in functionality

9. **Test Track Name Variations**
   
   Test existing mappings still work:
   - Canterbury → Canterbury Park
   - Sandown → Sandown Hillside
   - Rosehill → Rosehill Gardens

## Manual Verification Scenarios

### Scenario 1: Beaumont Synthetic Meeting

**Date:** Monday, February 2nd, 2026 (or any date with Beaumont racing)

**Steps:**
1. Check PuntingForm API returns "Beaumont" with surface="synthetic"
2. Verify sync script converts "Beaumont" → "Newcastle" in database
3. Check TTR ratings fetch succeeds with "Newcastle" track name
4. Confirm form guide displays ratings correctly

**Expected Results:**
- ✅ TTR ratings visible on form guide
- ✅ Database state = "NSW" for Newcastle races
- ✅ Results data joins correctly

### Scenario 2: Newcastle Turf Meeting

**Date:** Any date with Newcastle turf racing

**Steps:**
1. Check PuntingForm API returns "Newcastle" with surface="turf" or null
2. Verify database stores as "Newcastle"
3. Check TTR ratings fetch succeeds
4. Confirm form guide works normally

**Expected Results:**
- ✅ TTR ratings visible
- ✅ No difference in behavior from before

### Scenario 3: Mixed Surface Day

**Date:** Day with both Newcastle and Beaumont meetings

**Steps:**
1. Check both meetings appear in form guide
2. Verify each shows correct TTR ratings
3. Check database has correct state for both
4. Verify no confusion between the two

**Expected Results:**
- ✅ Both meetings display correctly
- ✅ Ratings match to correct races
- ✅ State information accurate

## Debug Mode Testing

Enable detailed logging:

```bash
# Add to .env.local
TRACK_NAME_DEBUG=true
```

Then check logs for:
- Track name conversions
- Surface detection
- Mapping lookups
- API calls

## Common Issues & Solutions

### Issue: No TTR Ratings for Beaumont

**Symptoms:**
- Form guide loads but no ratings shown
- Console shows failed API calls

**Solution:**
1. Check TTR API has data for "Newcastle" on that date
2. Verify conversion function returns "Newcastle"
3. Check API URL and credentials

### Issue: State NULL in Database

**Symptoms:**
- Race viewer shows NULL for state
- Database joins not working

**Solution:**
1. Run sync script: `npx tsx scripts/sync-pf-data.ts`
2. Verify "Beaumont" converts to "Newcastle" during sync
3. Check pf_meetings table has correct track names

### Issue: Diagnostic Script Shows Mismatches

**Symptoms:**
- Script reports unmapped tracks
- Suggestions for new mappings

**Solution:**
1. Add suggested mappings to `track-name-mappings.ts`
2. Re-run sync script
3. Verify with diagnostic script again

## Performance Verification

### Form Guide Load Time

- First load: Should try 1-2 track variations (fast)
- Cached: Should use existing data
- No noticeable delay from conversion logic

### Database Queries

- Check execution plans: Should use indexes
- No function calls on join columns
- Query times should be unchanged from before

## Regression Testing

Run these to ensure no breaking changes:

1. **All existing form guide pages load**
2. **Race viewer filters work correctly**
3. **Trading desk statistics accurate**
4. **No console errors on any page**
5. **Existing track names still recognized**

## Success Criteria

All of these must pass:

- ✅ Form guide shows TTR ratings for Beaumont meetings
- ✅ Database joins work for Newcastle/Beaumont
- ✅ State information appears correctly
- ✅ Diagnostic script passes with no critical issues
- ✅ Backward compatibility maintained
- ✅ No performance degradation
- ✅ Documentation is clear and complete
- ✅ Code review approved
- ✅ Security scan clean

## Notes for QA Team

1. **Test on actual racing days** - Some tracks may not have meetings every day
2. **Check both surfaces** - Newcastle can race on turf OR synthetic
3. **Verify data accuracy** - Ratings should match between systems
4. **Test edge cases** - What if surface is null? Unknown track?
5. **Monitor logs** - Watch for any warning messages

## Rollback Plan

If issues arise:

1. **Immediate:** Revert PR to previous version
2. **Database:** Track names in pf_meetings may need manual correction
3. **API:** Form guide will fall back to trying original names
4. **Impact:** Newcastle/Beaumont won't match but other tracks unaffected

## Contact for Issues

- Check documentation: `docs/TRACK_NAME_MAPPING.md`
- Run diagnostic: `scripts/diagnose-track-mismatches.ts`
- Review logs with `TRACK_NAME_DEBUG=true`
- Escalate if persistent issues
