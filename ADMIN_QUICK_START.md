# Admin Data Management Page - Quick Start

## Overview
A professional admin interface for managing CSV uploads of racing ratings data.

## Access
- **URL:** `http://localhost:3000/admin/data-management`
- **Navigation:** Click "Admin" in the main navigation menu

## Features
- ✅ Tab-based interface (AU/NZ | UK/Ireland)
- ✅ Real-time upload progress
- ✅ Database statistics display
- ✅ Error handling and validation
- ✅ Responsive design

## File Structure
```
/app/admin/data-management/page.tsx          # Main admin page
/components/admin/
  ├── DataUploader.tsx                       # Upload component
  ├── DataStats.tsx                          # Statistics display
  └── UploadHistory.tsx                      # History placeholder
/lib/config/upload-config.ts                 # Upload configurations
/app/api/admin/stats/route.ts                # Stats API endpoint
```

## Usage

### Upload CSV File
1. Navigate to `/admin/data-management`
2. Select data type tab (AU/NZ or UK/Ireland)
3. Choose CSV file
4. Click "Upload Ratings"
5. View results and statistics

### Supported File Formats
- **AU/NZ:** Tab-delimited CSV with Australian/New Zealand ratings
- **UK/Ireland:** Tab-delimited CSV with UK/Ireland ratings
- **Max size:** 50MB
- **Extensions:** .csv, .txt

### Required CSV Columns
- Date (formatted)
- Track name
- Race name
- Horse name
- Additional fields: Saddle cloth, Jockey, Trainer, Rating, Price

## API Endpoints

### GET `/api/admin/stats`
Returns database statistics.

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "tableName": "race_cards_ratings",
      "displayName": "TTR AU/NZ Ratings",
      "recordCount": 12500,
      "lastUpload": "2026-02-17T23:00:00.000Z"
    }
  ]
}
```

### POST `/api/ttr-au-nz-ratings/upload`
Upload AU/NZ ratings CSV.

### POST `/api/ttr-uk-ire-ratings/upload`
Upload UK/Ireland ratings CSV.

## Adding New Data Types

1. **Add configuration** in `/lib/config/upload-config.ts`:
```typescript
{
  id: 'new-data-type',
  name: 'New Data Type',
  apiEndpoint: '/api/new-data-type/upload',
  tableName: 'new_table',
  acceptedFormats: '.csv,.txt',
  instructions: { /* ... */ },
  color: { /* ... */ },
  viewRoute: '/new-data-type'
}
```

2. **Create API route** at `/app/api/new-data-type/upload/route.ts`

3. **Update stats API** to include new table in `/app/api/admin/stats/route.ts`

4. **Done!** New tab will appear automatically

## Security
⚠️ **TODO:** Implement authentication middleware before production use.

Current validations:
- File size limits (50MB)
- File type validation
- SQL injection protection
- CORS protection

## Documentation
- 📖 [Full Implementation Guide](./ADMIN_DATA_MANAGEMENT_IMPLEMENTATION.md)
- 🎨 [Visual Layout Guide](./ADMIN_PAGE_VISUAL_GUIDE.md)

## Legacy Pages (Still Functional)
- `/ttr-au-nz-ratings/upload` - Original AU/NZ upload page
- `/ttr-uk-ire-ratings/upload` - Original UK/Ireland upload page

## Troubleshooting

### Upload fails with "Failed to parse CSV"
- Check date format matches requirements
- Ensure file is tab-delimited
- Verify all required columns are present

### Statistics not loading
- Check database connection (`DATABASE_URL`)
- Verify tables exist in database
- Check browser console for errors

### File not uploading
- Check file size (max 50MB)
- Verify file extension (.csv or .txt)
- Check network connection

## Development

### Run locally
```bash
npm run dev
# Visit http://localhost:3000/admin/data-management
```

### Build for production
```bash
npm run build
npm start
```

## Support
For issues or questions, check:
1. TODO comments in code
2. Implementation documentation
3. Existing upload pages for reference

---

**Created:** February 2026  
**Status:** Complete (authentication pending)
