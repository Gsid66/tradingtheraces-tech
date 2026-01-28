function formatPrice(value: any): string {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
        return '-';
    }
    return `$${value.toFixed(2)}`;
}

function formatRating(value: any): string {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
        return '-';
    }
    return value.toString();
}

export { formatPrice, formatRating };