function formatPrice(value) {
    return value != null ? value.toFixed(2) : '-';
}

function formatRating(value) {
    return value != null ? value.toFixed(1) : 'N/A';
}

// Example usage in RaceDataTable.tsx
if (price != null) {
    formattedPrice = formatPrice(price);
}
if (rating != null) {
    formattedRating = formatRating(rating);
}