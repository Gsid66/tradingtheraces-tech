import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
import { cookies } from 'next/headers';

const MAX_RESULTS = 5000;

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('betfair_analysis_auth');

    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      dateFrom,
      dateTo,
      tracks,
      winBspMin,
      winBspMax,
      placeBspMin,
      placeBspMax,
      winnersOnly,
      placedOnly,
      distances,
      classes,
      speedCats,
      rpMin,
      rpMax,
      earlySpeedMin,
      earlySpeedMax,
      lateSpeedMin,
      lateSpeedMax,
      groupBy,
    } = body;

    const params: (string | number)[] = [];
    let paramIndex = 1;
    const conditions: string[] = ['1=1'];

    if (dateFrom) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(dateTo);
    }
    if (tracks && tracks.length > 0) {
      conditions.push(`track = ANY($${paramIndex++})`);
      params.push(tracks);
    }
    if (winBspMin !== undefined && winBspMin !== null && winBspMin !== '') {
      conditions.push(`win_bsp >= $${paramIndex++}`);
      params.push(Number(winBspMin));
    }
    if (winBspMax !== undefined && winBspMax !== null && winBspMax !== '') {
      conditions.push(`win_bsp <= $${paramIndex++}`);
      params.push(Number(winBspMax));
    }
    if (placeBspMin !== undefined && placeBspMin !== null && placeBspMin !== '') {
      conditions.push(`place_bsp >= $${paramIndex++}`);
      params.push(Number(placeBspMin));
    }
    if (placeBspMax !== undefined && placeBspMax !== null && placeBspMax !== '') {
      conditions.push(`place_bsp <= $${paramIndex++}`);
      params.push(Number(placeBspMax));
    }
    if (winnersOnly) {
      conditions.push('win_result = 1');
    }
    if (placedOnly) {
      conditions.push('place_result = 1');
    }
    if (distances && distances.length > 0) {
      conditions.push(`distance = ANY($${paramIndex++})`);
      params.push(distances);
    }
    if (classes && classes.length > 0) {
      conditions.push(`class = ANY($${paramIndex++})`);
      params.push(classes);
    }
    if (speedCats && speedCats.length > 0) {
      conditions.push(`speed_cat = ANY($${paramIndex++})`);
      params.push(speedCats);
    }
    if (rpMin !== undefined && rpMin !== null && rpMin !== '') {
      conditions.push(`rp >= $${paramIndex++}`);
      params.push(Number(rpMin));
    }
    if (rpMax !== undefined && rpMax !== null && rpMax !== '') {
      conditions.push(`rp <= $${paramIndex++}`);
      params.push(Number(rpMax));
    }
    if (earlySpeedMin !== undefined && earlySpeedMin !== null && earlySpeedMin !== '') {
      conditions.push(`early_speed >= $${paramIndex++}`);
      params.push(Number(earlySpeedMin));
    }
    if (earlySpeedMax !== undefined && earlySpeedMax !== null && earlySpeedMax !== '') {
      conditions.push(`early_speed <= $${paramIndex++}`);
      params.push(Number(earlySpeedMax));
    }
    if (lateSpeedMin !== undefined && lateSpeedMin !== null && lateSpeedMin !== '') {
      conditions.push(`late_speed >= $${paramIndex++}`);
      params.push(Number(lateSpeedMin));
    }
    if (lateSpeedMax !== undefined && lateSpeedMax !== null && lateSpeedMax !== '') {
      conditions.push(`late_speed <= $${paramIndex++}`);
      params.push(Number(lateSpeedMax));
    }

    const whereClause = conditions.join('\n  AND ');

    // Fetch raw results (limited to 5000)
    const rawSql = `
      SELECT
        date, track, race, horse, distance, class,
        win_bsp, place_bsp, win_result, place_result,
        rp, speed_cat, early_speed, late_speed, race_speed, value
      FROM bf_results_au
      WHERE ${whereClause}
      ORDER BY date DESC, track, race
      LIMIT ${MAX_RESULTS}
    `;

    const rawResult = await query(rawSql, params);
    const rows = rawResult.rows;

    // Compute overall statistics
    const totalRecords = rows.length;
    const winCount = rows.filter((r) => r.win_result === 1).length;
    const placeCount = rows.filter((r) => r.place_result === 1).length;
    const avgWinBsp =
      rows.length > 0
        ? rows.reduce((sum: number, r) => sum + (parseFloat(r.win_bsp) || 0), 0) / rows.length
        : 0;
    const avgPlaceBsp =
      rows.length > 0
        ? rows.reduce((sum: number, r) => sum + (parseFloat(r.place_bsp) || 0), 0) / rows.length
        : 0;

    // Win ROI: sum of (win_bsp - 1) for winners, minus 1 for each loser
    const winRoi = rows.reduce((sum: number, r) => {
      if (r.win_result === 1) return sum + (parseFloat(r.win_bsp) || 0) - 1;
      return sum - 1;
    }, 0);

    const statistics = {
      totalRecords,
      winCount,
      winRate: totalRecords > 0 ? ((winCount / totalRecords) * 100).toFixed(2) : '0.00',
      placeCount,
      placeRate: totalRecords > 0 ? ((placeCount / totalRecords) * 100).toFixed(2) : '0.00',
      avgWinBsp: avgWinBsp.toFixed(2),
      avgPlaceBsp: avgPlaceBsp.toFixed(2),
      winRoi: winRoi.toFixed(2),
    };

    // Build grouped statistics if groupBy specified
    let groupedStats: Record<string, unknown>[] | null = null;

    if (groupBy) {
      const groupMap: Record<string, {
        groupKey: string;
        total: number;
        wins: number;
        places: number;
        winBspSum: number;
        placeBspSum: number;
        winProfit: number;
      }> = {};

      for (const row of rows) {
        let groupKey: string;

        if (groupBy === 'track') {
          groupKey = row.track || 'Unknown';
        } else if (groupBy === 'distance') {
          groupKey = row.distance || 'Unknown';
        } else if (groupBy === 'class') {
          groupKey = row.class || 'Unknown';
        } else if (groupBy === 'speed_cat') {
          groupKey = row.speed_cat || 'Unknown';
        } else if (groupBy === 'price_bracket') {
          const bsp = parseFloat(row.win_bsp) || 0;
          if (bsp < 2.0) groupKey = '<2.0';
          else if (bsp < 5.0) groupKey = '2.0-5.0';
          else if (bsp < 10.0) groupKey = '5.0-10.0';
          else groupKey = '>10.0';
        } else {
          groupKey = 'All';
        }

        if (!groupMap[groupKey]) {
          groupMap[groupKey] = {
            groupKey,
            total: 0,
            wins: 0,
            places: 0,
            winBspSum: 0,
            placeBspSum: 0,
            winProfit: 0,
          };
        }

        const g = groupMap[groupKey];
        g.total++;
        if (row.win_result === 1) {
          g.wins++;
          g.winProfit += (parseFloat(row.win_bsp) || 0) - 1;
        } else {
          g.winProfit -= 1;
        }
        if (row.place_result === 1) g.places++;
        g.winBspSum += parseFloat(row.win_bsp) || 0;
        g.placeBspSum += parseFloat(row.place_bsp) || 0;
      }

      groupedStats = Object.values(groupMap).map((g) => ({
        groupKey: g.groupKey,
        total: g.total,
        wins: g.wins,
        winPct: g.total > 0 ? ((g.wins / g.total) * 100).toFixed(2) : '0.00',
        places: g.places,
        placePct: g.total > 0 ? ((g.places / g.total) * 100).toFixed(2) : '0.00',
        avgWinBsp: g.total > 0 ? (g.winBspSum / g.total).toFixed(2) : '0.00',
        avgPlaceBsp: g.total > 0 ? (g.placeBspSum / g.total).toFixed(2) : '0.00',
        winRoi: g.winProfit.toFixed(2),
      }));

      // Sort by total desc
      groupedStats.sort((a, b) => (b as { total: number }).total - (a as { total: number }).total);
    }

    return NextResponse.json({
      success: true,
      results: rows,
      statistics,
      groupedStats,
    });
  } catch (error) {
    console.error('Error in betfair analysis query:', error);
    return NextResponse.json(
      { success: false, message: 'Query failed' },
      { status: 500 }
    );
  }
}
