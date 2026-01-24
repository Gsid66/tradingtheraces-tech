"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var pg_1 = require("pg");
var client_1 = require("../lib/integrations/punting-form/client");
(0, dotenv_1.config)({ path: '.env.local' });
function syncPuntingFormData() {
    return __awaiter(this, void 0, void 0, function () {
        var pfClient, dbClient, meetingsResponse, meetings, totalRaces, totalRunners, _i, meetings_1, meeting, fieldsResponse, races, meetingRunnerCount, _a, races_1, race, runners, _b, runners_1, runner, existingRunner, error_1;
        var _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log('🔄 Starting Punting Form data sync...\n');
                    pfClient = (0, client_1.getPuntingFormClient)();
                    dbClient = new pg_1.Client({
                        connectionString: process.env.DATABASE_URL,
                        ssl: { rejectUnauthorized: false },
                        connectionTimeoutMillis: 10000,
                    });
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 25, 26, 28]);
                    // Connect to database
                    return [4 /*yield*/, dbClient.connect()];
                case 2:
                    // Connect to database
                    _j.sent();
                    console.log('✅ Connected to database\n');
                    // Fetch today's meetings
                    console.log('📅 Fetching today\'s meetings from Punting Form...');
                    return [4 /*yield*/, pfClient.getTodaysMeetings()];
                case 3:
                    meetingsResponse = _j.sent();
                    meetings = meetingsResponse.payLoad;
                    console.log("\u2705 Found ".concat(meetings.length, " meetings\n"));
                    if (meetings.length === 0) {
                        console.log('⚠️  No meetings found for today');
                        return [2 /*return*/];
                    }
                    totalRaces = 0;
                    totalRunners = 0;
                    _i = 0, meetings_1 = meetings;
                    _j.label = 4;
                case 4:
                    if (!(_i < meetings_1.length)) return [3 /*break*/, 24];
                    meeting = meetings_1[_i];
                    console.log("\uD83D\uDCCD Processing: ".concat(meeting.track.name, " (").concat(meeting.track.state, ")"));
                    // Insert meeting
                    return [4 /*yield*/, dbClient.query("\n        INSERT INTO pf_meetings (\n          meeting_id, track_name, track_id, location, state, country, \n          abbrev, surface, meeting_date, stage\n        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n        ON CONFLICT (meeting_id) DO UPDATE SET\n          track_name = EXCLUDED.track_name,\n          updated_at = NOW()\n      ", [
                            meeting.meetingId,
                            meeting.track.name,
                            meeting.track.trackId,
                            meeting.track.location,
                            meeting.track.state,
                            meeting.track.country,
                            meeting.track.abbrev,
                            meeting.track.surface,
                            new Date().toISOString().split('T')[0],
                            'A'
                        ])];
                case 5:
                    // Insert meeting
                    _j.sent();
                    return [4 /*yield*/, pfClient.getAllRacesForMeeting(meeting.meetingId)];
                case 6:
                    fieldsResponse = _j.sent();
                    races = fieldsResponse.payLoad.races || [];
                    console.log("  \uD83C\uDFC1 Found ".concat(races.length, " races"));
                    totalRaces += races.length;
                    meetingRunnerCount = 0;
                    _a = 0, races_1 = races;
                    _j.label = 7;
                case 7:
                    if (!(_a < races_1.length)) return [3 /*break*/, 22];
                    race = races_1[_a];
                    // Insert race
                    return [4 /*yield*/, dbClient.query("\n          INSERT INTO pf_races (\n            race_id, meeting_id, race_number, race_name, provider_race_id,\n            distance, age_restrictions, jockey_restrictions, sex_restrictions,\n            weight_type, limit_weight, race_class, prize_money,\n            prize_money_breakdown, start_time, start_time_utc, group_race,\n            bonus_scheme, description\n          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)\n          ON CONFLICT (race_id) DO UPDATE SET\n            race_name = EXCLUDED.race_name,\n            updated_at = NOW()\n        ", [
                            race.raceId,
                            meeting.meetingId,
                            race.number,
                            race.name,
                            race.providerRaceId,
                            race.distance,
                            race.ageRestrictions,
                            race.jockeyRestrictions,
                            race.sexRestrictions,
                            race.weightType,
                            race.limitWeight,
                            race.raceClass,
                            race.prizeMoney,
                            race.prizeMoneyBreakDown,
                            race.startTime,
                            race.startTimeUTC,
                            race.group,
                            race.bonusScheme,
                            race.description
                        ])];
                case 8:
                    // Insert race
                    _j.sent();
                    runners = race.runners || [];
                    totalRunners += runners.length;
                    meetingRunnerCount += runners.length;
                    _b = 0, runners_1 = runners;
                    _j.label = 9;
                case 9:
                    if (!(_b < runners_1.length)) return [3 /*break*/, 21];
                    runner = runners_1[_b];
                    if (!runner.runnerId) return [3 /*break*/, 11];
                    return [4 /*yield*/, dbClient.query("\n              INSERT INTO pf_horses (\n                horse_id, horse_name, sex, colour, age, foaled_date,\n                sire, dam, dams_sire, country_bred, career_starts,\n                career_wins, career_seconds, career_thirds, career_prize_money\n              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)\n              ON CONFLICT (horse_id) DO UPDATE SET\n                horse_name = EXCLUDED.horse_name,\n                sex = EXCLUDED.sex,\n                colour = EXCLUDED.colour,\n                age = EXCLUDED.age,\n                career_starts = EXCLUDED.career_starts,\n                career_wins = EXCLUDED.career_wins,\n                career_seconds = EXCLUDED.career_seconds,\n                career_thirds = EXCLUDED.career_thirds,\n                career_prize_money = EXCLUDED.career_prize_money,\n                updated_at = NOW()\n            ", [
                            runner.runnerId,
                            runner.name || runner.horseName,
                            runner.sex,
                            runner.colour,
                            runner.age,
                            runner.foalDate,
                            runner.sire,
                            runner.dam,
                            runner.sireofDam || runner.sireDam,
                            runner.country,
                            runner.careerStarts || 0,
                            runner.careerWins || 0,
                            runner.careerSeconds || 0,
                            runner.careerThirds || 0,
                            runner.prizeMoney || 0
                        ])];
                case 10:
                    _j.sent();
                    _j.label = 11;
                case 11:
                    if (!(runner.jockey && runner.jockey.jockeyId)) return [3 /*break*/, 13];
                    return [4 /*yield*/, dbClient.query("\n              INSERT INTO pf_jockeys (\n                jockey_id, full_name, apprentice, claim_allowance\n              ) VALUES ($1, $2, $3, $4)\n              ON CONFLICT (jockey_id) DO UPDATE SET\n                full_name = EXCLUDED.full_name,\n                apprentice = EXCLUDED.apprentice,\n                claim_allowance = EXCLUDED.claim_allowance,\n                updated_at = NOW()\n            ", [
                            runner.jockey.jockeyId,
                            runner.jockey.fullName,
                            runner.jockey.isApprentice || false,
                            runner.jockey.claim || 0
                        ])];
                case 12:
                    _j.sent();
                    _j.label = 13;
                case 13:
                    if (!(runner.trainer && runner.trainer.trainerId)) return [3 /*break*/, 15];
                    return [4 /*yield*/, dbClient.query("\n              INSERT INTO pf_trainers (\n                trainer_id, full_name, location\n              ) VALUES ($1, $2, $3)\n              ON CONFLICT (trainer_id) DO UPDATE SET\n                full_name = EXCLUDED.full_name,\n                location = EXCLUDED.location,\n                updated_at = NOW()\n            ", [
                            runner.trainer.trainerId,
                            runner.trainer.fullName,
                            runner.trainer.location
                        ])];
                case 14:
                    _j.sent();
                    _j.label = 15;
                case 15: return [4 /*yield*/, dbClient.query('SELECT id FROM pf_runners WHERE form_id = $1', [runner.formId])];
                case 16:
                    existingRunner = _j.sent();
                    if (!(existingRunner.rows.length === 0)) return [3 /*break*/, 18];
                    // Insert new runner - MUST include horse_name
                    return [4 /*yield*/, dbClient.query("\n              INSERT INTO pf_runners (\n                form_id, race_id, horse_id, horse_name, tab_number, barrier_number,\n                original_barrier, jockey_id, jockey_name, jockey_claim, trainer_id,\n                trainer_name, weight, handicap, fixed_odds, last_five_starts,\n                emergency_indicator, prep_runs, gear_changes\n              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)\n            ", [
                            runner.formId,
                            race.raceId,
                            runner.runnerId,
                            runner.name || runner.horseName || 'Unknown', // FIX: Provide default value
                            runner.tabNumber,
                            runner.barrierNumber || runner.barrier,
                            runner.originalBarrier,
                            (_c = runner.jockey) === null || _c === void 0 ? void 0 : _c.jockeyId,
                            (_d = runner.jockey) === null || _d === void 0 ? void 0 : _d.fullName,
                            runner.jockeyClaim || 0,
                            (_e = runner.trainer) === null || _e === void 0 ? void 0 : _e.trainerId,
                            (_f = runner.trainer) === null || _f === void 0 ? void 0 : _f.fullName,
                            runner.weight || runner.handicapWeight,
                            runner.handicap,
                            runner.fixedOdds,
                            runner.lastFiveStarts || runner.last10,
                            runner.emergencyIndicator || false,
                            runner.prepRuns || 0,
                            runner.gearChanges
                        ])];
                case 17:
                    // Insert new runner - MUST include horse_name
                    _j.sent();
                    return [3 /*break*/, 20];
                case 18: 
                // Update existing runner
                return [4 /*yield*/, dbClient.query("\n              UPDATE pf_runners SET\n                horse_name = $1,\n                barrier_number = $2,\n                weight = $3,\n                fixed_odds = $4,\n                jockey_name = $5,\n                trainer_name = $6,\n                updated_at = NOW()\n              WHERE form_id = $7\n            ", [
                        runner.name || runner.horseName || 'Unknown',
                        runner.barrierNumber || runner.barrier,
                        runner.weight || runner.handicapWeight,
                        runner.fixedOdds,
                        (_g = runner.jockey) === null || _g === void 0 ? void 0 : _g.fullName,
                        (_h = runner.trainer) === null || _h === void 0 ? void 0 : _h.fullName,
                        runner.formId
                    ])];
                case 19:
                    // Update existing runner
                    _j.sent();
                    _j.label = 20;
                case 20:
                    _b++;
                    return [3 /*break*/, 9];
                case 21:
                    _a++;
                    return [3 /*break*/, 7];
                case 22:
                    console.log("  \u2705 Completed ".concat(meeting.track.name));
                    console.log("     Races: ".concat(races.length, ", Runners: ").concat(meetingRunnerCount, "\n"));
                    _j.label = 23;
                case 23:
                    _i++;
                    return [3 /*break*/, 4];
                case 24:
                    console.log('='.repeat(60));
                    console.log('📊 SYNC SUMMARY');
                    console.log('='.repeat(60));
                    console.log("\u2705 Meetings processed: ".concat(meetings.length));
                    console.log("\u2705 Total races: ".concat(totalRaces));
                    console.log("\u2705 Total runners: ".concat(totalRunners));
                    console.log('\n✨ Sync completed successfully!\n');
                    return [3 /*break*/, 28];
                case 25:
                    error_1 = _j.sent();
                    console.error('❌ Sync failed:', error_1.message);
                    console.error('\nFull error:', error_1);
                    throw error_1;
                case 26: return [4 /*yield*/, dbClient.end()];
                case 27:
                    _j.sent();
                    return [7 /*endfinally*/];
                case 28: return [2 /*return*/];
            }
        });
    });
}
syncPuntingFormData();
