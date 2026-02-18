import React from 'react';
// ... other imports

const MergedRatingsTable = ({ ratings }) => {
    // ... other code

    const sortedRatings = ratings.sort((a, b) => {
        const aVal = a?.rating ?? null;
        const bVal = b?.rating ?? null;

        if (aVal === null && bVal === null) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        return aVal - bVal;
    });

    return (
        <table>
            {/* ... table content */}
        </table>
    );
};

export default MergedRatingsTable;