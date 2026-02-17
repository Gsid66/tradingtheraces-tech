# Admin Data Management Page - Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Navigation Bar (Purple)                                          │
│ [Trading the Races] [Home] [Form Guide] ... [Admin] ⭐          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Header (Dark Slate)                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Admin Data Management                    ← Back to Home     │ │
│ │ Upload and manage racing ratings data                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumbs (White background)                                   │
│ Home / Admin / Data Management                                   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Security Notice (Yellow banner)                                  │
│ ⚠️ TODO: This page should be protected with authentication      │
│    middleware. Only administrators should have access.           │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Database Statistics (White card with shadow)                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Database Statistics                                         │ │
│ ├─────────────────────┬─────────────────────┬─────────────────┤ │
│ │ TTR AU/NZ Ratings   │ TTR UK/IRE Ratings  │ (Future types)  │ │
│ │ 12,500              │ 8,300               │                 │ │
│ │ records             │ records             │                 │ │
│ │ Last: 17/02 9:47 AM │ Last: 16/02 2:30 PM │                 │ │
│ └─────────────────────┴─────────────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Upload History (White card)                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Upload History                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ ℹ️ Coming Soon: Upload history tracking will be        │ │ │
│ │ │    implemented in a future update                       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Data Upload Section (White card)                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Data Upload                                                 │ │
│ │ Select a data type to upload CSV files                      │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [TTR AU/NZ Ratings] [TTR UK/Ireland Ratings]               │ │
│ │  └─ Active tab (blue underline)                             │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ CSV Format Requirements (Green background for AU/NZ)        │ │
│ │ • Required columns (tab-separated):                         │ │
│ │   - Date: Format: "Friday, 14th November 2025"             │ │
│ │   - Track: Track name (e.g., "Flemington")                 │ │
│ │   - Race: Format: "Race 1 - Full Race Name"                │ │
│ │   - Horse: Horse name                                       │ │
│ │   - ... (more columns)                                      │ │
│ │ Note: AU/NZ data is typically tab-delimited                 │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Select CSV File                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ [Choose File] ratings-2026-02-17.csv                    │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ Selected: ratings-2026-02-17.csv (245.32 KB)               │ │
│ │                                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │          [Upload Ratings] (Green button)                │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## After Upload - Success State

```
┌─────────────────────────────────────────────────────────────────┐
│ Upload Result (Green background with success icon)              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ Upload Successful!                                        │ │
│ │ Successfully imported 1,247 ratings                          │ │
│ │                                                              │ │
│ │ ┌──────────┬──────────┬──────────┬──────────┐               │ │
│ │ │Processed │ Imported │ Skipped  │ Time     │               │ │
│ │ │  1,250   │  1,247   │    3     │  2.45s   │               │ │
│ │ └──────────┴──────────┴──────────┴──────────┘               │ │
│ │                                                              │ │
│ │ View Uploaded Data:                                          │ │
│ │ [View 2026-02-17] [View 2026-02-18] [View 2026-02-19]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## After Upload - Error State

```
┌─────────────────────────────────────────────────────────────────┐
│ Upload Result (Red background with error icon)                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ❌ Upload Failed                                             │ │
│ │ Failed to parse CSV: Invalid date format on line 45          │ │
│ │                                                              │ │
│ │ Errors:                                                      │ │
│ │ • Line 45: Could not parse date "15-2-2026"                 │ │
│ │ • Line 67: Missing required field "Horse"                   │ │
│ │ • Line 89: Invalid price format                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Tab Switching - UK/Ireland Active

```
┌─────────────────────────────────────────────────────────────────┐
│ Data Upload Section                                              │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [TTR AU/NZ Ratings] [TTR UK/Ireland Ratings] ⭐              │ │
│ │                      └─ Active tab (blue underline)          │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ CSV Format Requirements (Purple background for UK/IRE)       │ │
│ │ • Required columns (tab-separated):                         │ │
│ │   - Date: Format: "Sunday, 15th February 2026"              │ │
│ │   - Track: Track name (e.g., "Musselburgh")                 │ │
│ │   - Race: Format: "Race 1 - Full Race Name"                 │ │
│ │   - ... (more columns)                                       │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [File upload form with purple styling]                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Legacy Upload Links Section

```
┌─────────────────────────────────────────────────────────────────┐
│ Legacy Upload Pages (Blue info banner)                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ The original upload pages are still available for backward  │ │
│ │ compatibility:                                               │ │
│ │                                                              │ │
│ │ [TTR AU/NZ Upload Page] [TTR UK/Ireland Upload Page]        │ │
│ │  (Green button)         (Purple button)                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile View (Responsive Design)

```
┌─────────────────────┐
│ Navigation          │
│ [☰ Menu]            │
├─────────────────────┤
│ Admin Data Mgmt     │
│ ← Back              │
├─────────────────────┤
│ Home / Admin / Data │
├─────────────────────┤
│ ⚠️ Security Notice  │
├─────────────────────┤
│ Database Stats      │
│ ┌─────────────────┐ │
│ │ TTR AU/NZ       │ │
│ │ 12,500 records  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ TTR UK/IRE      │ │
│ │ 8,300 records   │ │
│ └─────────────────┘ │
├─────────────────────┤
│ Upload History      │
│ Coming Soon...      │
├─────────────────────┤
│ Data Upload         │
│ [AU/NZ] [UK/IRE]    │
│ (Tabs stack on      │
│  small screens)     │
├─────────────────────┤
│ Instructions        │
│ (Scrollable)        │
├─────────────────────┤
│ [Choose File]       │
│ [Upload Button]     │
└─────────────────────┘
```

## Color Scheme

### TTR AU/NZ Ratings
- **Primary:** Green-600 (`#059669`)
- **Light:** Green-50 (`#F0FDF4`)
- **Hover:** Green-700 (`#047857`)
- **Text:** Green-800 (`#166534`)

### TTR UK/Ireland Ratings
- **Primary:** Purple-600 (`#9333EA`)
- **Light:** Purple-50 (`#FAF5FF`)
- **Hover:** Purple-700 (`#7E22CE`)
- **Text:** Purple-800 (`#6B21A8`)

### Admin Theme
- **Header:** Slate-800 (`#1E293B`)
- **Text:** Slate-300 (`#CBD5E1`)
- **Accent:** Blue-600 for tabs (`#2563EB`)

## Interactive Elements

### Buttons
- **Default:** Gray background, disabled cursor
- **Active:** Colored background (green/purple), hover effect
- **Loading:** Spinning icon with "Uploading..." text

### Tabs
- **Inactive:** Gray text, transparent border
- **Active:** Blue text, blue bottom border
- **Hover:** Darker text, gray bottom border

### File Input
- **Custom styled:** Colored button matching data type
- **Shows:** File name and size after selection

### Cards
- **Shadow:** Soft drop shadow for depth
- **Borders:** Subtle gray borders
- **Spacing:** Consistent padding and margins

## Accessibility

- ✅ Semantic HTML elements
- ✅ ARIA labels on navigation
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Screen reader friendly
- ✅ Focus indicators

## Responsive Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md/lg)
- **Desktop:** > 1024px (xl)

---

**Note:** This is a text-based representation of the admin data management page. The actual implementation uses Tailwind CSS for styling and Next.js/React for functionality.
