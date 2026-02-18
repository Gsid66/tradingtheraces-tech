// Sort function for merging ratings, handling possible undefined values
const sortedMergedRatings = mergedRatings.sort((a, b) => {
    const aVal = a.ratingValue; // Assuming ratingValue is the field to compare
    const bVal = b.ratingValue;

    // Handle undefined cases
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return 1; // Or return -1 based on your sorting criteria
    if (bVal === undefined) return -1; // Or return 1 based on your sorting criteria

    return aVal - bVal; // Change this based on how you need to compare
});
