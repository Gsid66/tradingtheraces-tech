import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check if admin is authenticated
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('trading_desk_admin');

    if (!adminCookie || adminCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Insert new password into database
    await query(
      'INSERT INTO trading_desk_auth (password_hash) VALUES ($1)',
      [passwordHash]
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update password' },
      { status: 500 }
    );
  }
}
