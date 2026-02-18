// Updated code in app/merged-ratings/page.tsx

// ... other code

const meetingsResponse = await pfClient.getMeetingsByDate(new Date()); // Updated to pass Date object instead of string

// ... other code