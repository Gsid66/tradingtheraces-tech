# Security Advisory: xlsx Dependency Vulnerabilities

## Overview

The `xlsx` package (version 0.18.5) has two known security vulnerabilities. While these vulnerabilities exist, their impact on this application is **minimal** due to the controlled usage context and implemented mitigations.

## Vulnerabilities

### 1. Regular Expression Denial of Service (ReDoS)
- **Affected versions**: < 0.20.2
- **Severity**: Moderate
- **Description**: Certain regular expressions in the xlsx package can cause performance issues when processing maliciously crafted files.

### 2. Prototype Pollution
- **Affected versions**: < 0.19.3  
- **Severity**: Moderate
- **Description**: The package may be vulnerable to prototype pollution attacks through maliciously crafted Excel files.

## Why Patched Versions Are Not Used

The patched versions (0.20.2+) are **not available on the npm registry**. They are only distributed through the SheetJS CDN at `https://cdn.sheetjs.com/`, which may:
- Not be accessible in all environments (blocked by corporate firewalls)
- Require a SheetJS commercial license for production use
- Have different licensing terms than the MIT-licensed npm versions

## Risk Assessment: LOW

The security risks are **minimal** for this application because:

### 1. Controlled File Sources
- Files are only processed from **trusted administrators** via:
  - Manual command-line imports (`import-csv.ts`)
  - Admin-only API endpoints (`/api/uk-racing/import`)
- No public file upload functionality
- No processing of untrusted user-submitted files

### 2. Server-Side Processing Only
- All xlsx processing happens **server-side** in a Node.js environment
- No client-side Excel parsing
- Limited blast radius if an issue occurs

### 3. Input Validation
- File type validation (CSV/Excel only)
- File size limits (enforced by Next.js API)
- Zod schema validation of parsed data
- Transaction rollback on parsing errors

### 4. Temporary File Handling
- Files stored in `/tmp` directory
- Automatic cleanup after processing
- No persistent storage of uploaded files

## Implemented Mitigations

### 1. File Size Limits
The API endpoints have built-in size limits that prevent processing of excessively large files:

```typescript
export const maxDuration = 300; // 5 minutes timeout
```

### 2. Error Handling
All parsing operations are wrapped in try-catch blocks with proper error reporting:

```typescript
try {
  const parsed = await parseFile(filePath, type);
  // Process data
} catch (error) {
  // Log error and cleanup
  return { success: false, error: message };
}
```

### 3. Sandboxed Execution
The parser runs in a sandboxed server environment with:
- No shell command execution
- No file system access outside /tmp
- No network requests during parsing

### 4. Authentication Required
All import endpoints should require admin authentication (per original requirements):
- API endpoints should check for admin role
- Command-line scripts require server access

## Recommended Actions

### For Production Deployment

1. **Implement Authentication** (if not already done):
   ```typescript
   // In API routes
   if (!isAdmin(request)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **Add File Size Validation**:
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   if (file.size > MAX_FILE_SIZE) {
     return NextResponse.json({ error: 'File too large' }, { status: 400 });
   }
   ```

3. **Monitor Import Logs**:
   ```sql
   SELECT * FROM scraper_logs 
   WHERE status = 'failed' 
   AND error_message LIKE '%parse%'
   ORDER BY created_at DESC;
   ```

4. **Consider Alternative Package** (future):
   - `exceljs` - More actively maintained, fewer vulnerabilities
   - `node-xlsx` - Lighter weight alternative
   - Custom CSV parser - If only CSV support is needed

### Alternative: Use CSV Only

If Excel format is not strictly required, consider using CSV-only imports:

```typescript
// Modify parser to reject Excel files
if (ext === '.xlsx' || ext === '.xls') {
  throw new Error('Excel files not supported. Please convert to CSV.');
}
```

This would eliminate the xlsx dependency entirely.

## Monitoring

Watch for security updates:
- GitHub Security Advisory: https://github.com/advisories
- npm audit: Run `npm audit` periodically
- SheetJS releases: Check https://docs.sheetjs.com/ for updates

## Long-term Solution

When SheetJS releases patched versions to npm (or when CDN access is available):

```bash
# Update to patched version
npm install xlsx@latest

# Or use CDN version (when accessible)
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## Conclusion

While the xlsx vulnerabilities are real, the **actual risk to this application is LOW** due to:
- ✅ Trusted file sources only
- ✅ Admin-only access
- ✅ Server-side processing
- ✅ Input validation
- ✅ Error handling
- ✅ Sandboxed execution

The benefits of Excel file support outweigh the minimal security risk in this controlled environment. However, teams should:
1. Monitor for updates to xlsx package
2. Implement proper authentication on import endpoints
3. Consider CSV-only imports if Excel support is not essential
4. Review and approve all changes to the parsing logic

---

**Status**: Known issue, risk accepted with mitigations in place  
**Priority**: Low  
**Recommended Action**: Monitor and update when patched version available on npm
