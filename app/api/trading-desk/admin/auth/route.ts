import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get admin credentials from the database
    const result = await query(
      'SELECT password_hash FROM trading_desk_admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const storedHash = result.rows[0].password_hash;
    const isValid = await bcrypt.compare(password, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    
    // Set cookie for 24 hours
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('trading_desk_admin_auth', 'authenticated', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours in seconds
    });

    return response;
  } catch (error) {
    console.error('Error in admin auth:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
