// Modify date calculation to set default date range to the last 3 days instead of today only
const endDate = new Date();
const startDate = new Date();
startDate.setDate(endDate.getDate() - 2);

export const defaultDateRange = { start: startDate, end: endDate };
