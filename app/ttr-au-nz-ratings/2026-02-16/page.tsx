// Your other imports

// Actual database query
const results = await db.query(`
    SELECT track_name AS track, jockey_name AS jockey, trainer_name AS trainer
    FROM races
    WHERE date = ?
`, [date]);

// Any additional code after this...