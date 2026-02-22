// Function to parse CSV files
function parseCSV(data) {
    const delimiter = data.includes('\t') ? '\t' : ','; // Automatically detect delimiter
    const rows = data.split('\n');
    const header = rows[0].split(delimiter).map(col => col.trim().toLowerCase()); // Normalize column names to lowercase

    const records = rows.slice(1).map(row => {
        const values = row.split(delimiter);
        const record = {};
        header.forEach((col, index) => {
            record[col] = values[index]; // Build record with normalized column names
        });
        return record;
    });
    return records;
}