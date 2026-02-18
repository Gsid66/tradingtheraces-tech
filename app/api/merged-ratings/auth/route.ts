import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Get the latest password from the database
    const result = await query(
      'SELECT password_hash FROM merged_ratings_auth ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Authentication not configured' },
        { status: 500 }
      );
    }

    const storedHash = result.rows[0].password_hash;
    const isValid = await bcrypt.compare(password, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    
    // Set cookie for 7 days
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('merged_ratings_auth', 'authenticated', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Error in merged ratings auth:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
