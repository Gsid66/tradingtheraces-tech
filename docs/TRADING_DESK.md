# Trading Desk Feature

This document provides setup instructions and usage guidelines for the Trading Desk feature.

## Overview

The Trading Desk is a password-protected section that provides daily race analysis, ratings, and results. It features:

- **User Authentication**: Password-protected access for users
- **Admin Panel**: Separate admin interface for managing user passwords
- **Daily Analysis**: View race data, ratings, and results for the last 14 days
- **Security**: Bcrypt password hashing, HttpOnly cookies, and secure session management

## Setup Instructions

### 1. Install Dependencies

The bcryptjs dependencies are already included in package.json. If needed, install them:

```bash
npm install
```

### 2. Database Setup

Run the setup script to create the necessary database tables and configure initial credentials:

```bash
npx tsx scripts/setup-trading-desk-auth.ts
```

The script will prompt you for:
- **Admin username** (default: "admin")
- **Admin password** (secure password for admin access)
- **Initial user password** (password for regular users, can be changed later)

The script will:
1. Create `trading_desk_auth` table for user passwords
2. Create `trading_desk_admins` table for admin credentials
3. Hash all passwords with bcrypt (10 rounds)
4. Insert initial credentials

**Security Note**: After running the script, clear your terminal history to prevent password exposure:
```bash
# Linux/Mac
history -c

# PowerShell
Clear-History
```

### 3. Access the Application

After setup, you can access:

- **User Login**: http://localhost:3000/trading-desk
- **Admin Panel**: http://localhost:3000/trading-desk-admin

## Features

### User Access

1. **Login**: Users access `/trading-desk` and enter the current password
2. **Date Navigation**: Sidebar shows the last 14 days as clickable links
3. **Daily Analysis**: Each date shows:
   - Statistics cards (Total Races, Rated Horses, Value Opportunities, Winners)
   - Top Value Plays table (horses with best odds differential)
   - Complete race listing with ratings, odds, and results
4. **Session**: User sessions last 7 days

### Admin Panel

1. **Admin Login**: Admins access `/trading-desk-admin` with username and password
2. **Password Management**:
   - Generate random 8-character passwords (cryptographically secure)
   - Enter custom passwords (minimum 6 characters)
   - Copy passwords to clipboard
   - Update user password instantly
3. **Session**: Admin sessions last 24 hours

## Security Features

### Password Security
- All passwords hashed with bcrypt (10 rounds)
- Minimum password length: 6 characters
- Cryptographically secure random password generation
- No plaintext passwords stored or logged

### Cookie Security
- HttpOnly flag (prevents XSS attacks)
- Secure flag in production (HTTPS only)
- SameSite: lax
- User sessions: 7 days expiry
- Admin sessions: 24 hours expiry

### Authentication Flow
- User passwords verified against latest `trading_desk_auth` record
- Admin credentials verified against `trading_desk_admins` table
- Unauthorized access redirects to login page
- Password updates take effect immediately

## Database Schema

### trading_desk_auth
```sql
CREATE TABLE IF NOT EXISTS trading_desk_auth (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### trading_desk_admins
```sql
CREATE TABLE IF NOT EXISTS trading_desk_admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST /api/trading-desk/auth
User authentication endpoint.

**Request:**
```json
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "success": true
}
```

Sets `trading_desk_auth` cookie (7 days).

### POST /api/trading-desk/admin/auth
Admin authentication endpoint.

**Request:**
```json
{
  "username": "admin",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true
}
```

Sets `trading_desk_admin` cookie (24 hours).

### POST /api/trading-desk/admin/update-password
Update user password (admin only).

**Request:**
```json
{
  "newPassword": "new_user_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

Requires valid `trading_desk_admin` cookie.

## File Structure

```
app/
├── (admin)/                            # Route group for admin (bypasses trading-desk layout)
│   └── trading-desk-admin/
│       ├── page.tsx                    # Admin page wrapper
│       ├── AdminLoginForm.tsx          # Admin login
│       └── PasswordManager.tsx         # Password manager UI
├── trading-desk/
│   ├── layout.tsx                      # Protected layout with sidebar
│   ├── page.tsx                        # Redirects to today's date
│   ├── LoginForm.tsx                   # User login component
│   ├── DateNavigation.tsx              # Sidebar date menu
│   └── [date]/
│       └── page.tsx                    # Daily analysis page
├── api/
│   └── trading-desk/
│       ├── auth/
│       │   └── route.ts                # User auth endpoint
│       └── admin/
│           ├── auth/
│           │   └── route.ts            # Admin auth endpoint
│           └── update-password/
│               └── route.ts            # Password update endpoint
scripts/
└── setup-trading-desk-auth.ts          # Setup script
drizzle/
└── migrations/
    └── 0003_add_trading_desk_auth_tables.sql
```

## Usage Workflow

### For Administrators

1. Run setup script to initialize the system
2. Log in to admin panel at `/trading-desk-admin`
3. Generate or create a new password for users
4. Copy the password to clipboard
5. Share the password with authorized users through secure channels
6. Update the password as needed (old passwords become invalid)

### For Users

1. Navigate to `/trading-desk`
2. Enter the current password (provided by administrator)
3. Access daily race analysis
4. Click dates in sidebar to view different days
5. Session persists for 7 days

## Troubleshooting

### "Authentication not configured" error
- Run the setup script: `npx tsx scripts/setup-trading-desk-auth.ts`
- Ensure DATABASE_URL is set in environment variables

### Cannot log in with correct password
- Verify password was updated successfully in admin panel
- Check if session cookies are enabled in browser
- Clear browser cookies and try again

### Admin panel not accessible
- Ensure you're using the correct admin credentials
- Check if admin session expired (24 hours)
- Verify admin credentials in database

### No data showing for a date
- Check if race_cards_ratings table has data for that date
- Verify database connection is working
- Check browser console for any errors

## Development Notes

- Uses Next.js 16 App Router
- Server-side rendering for all pages
- Date handling in Sydney timezone (Australia/Sydney)
- Responsive design with Tailwind CSS
- PostgreSQL database with pg client
- Cookie-based session management

## Production Considerations

1. **Environment Variables**: Ensure DATABASE_URL is properly configured
2. **HTTPS**: Secure cookies require HTTPS in production
3. **Password Policy**: Consider implementing password expiry or rotation
4. **Audit Logging**: Consider adding logs for authentication attempts
5. **Backup**: Regularly backup the authentication tables
6. **Monitoring**: Monitor failed login attempts for security

## Support

For issues or questions, contact the development team.
