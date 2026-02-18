import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const adminAuth = request.cookies.get('admin_auth');
    if (!adminAuth || adminAuth.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentUsername, currentPassword, newUsername, newPassword } = await request.json();

    // Validate required fields
    if (!currentUsername || !currentPassword) {
      return NextResponse.json(
        { success: false, message: 'Current credentials are required' },
        { status: 400 }
      );
    }

    if (!newUsername && !newPassword) {
      return NextResponse.json(
        { success: false, message: 'At least one new credential must be provided' },
        { status: 400 }
      );
    }

    // Validate new password if provided
    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify current password
    const result = await query(
      'SELECT id, password_hash FROM trading_desk_admins WHERE username = $1',
      [currentUsername]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid current credentials' },
        { status: 401 }
      );
    }

    const adminId = result.rows[0].id;
    const storedHash = result.rows[0].password_hash;
    const isValid = await bcrypt.compare(currentPassword, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid current credentials' },
        { status: 401 }
      );
    }

    // Update credentials
    const finalUsername = newUsername || currentUsername;
    const finalPasswordHash = newPassword 
      ? await bcrypt.hash(newPassword, 10) 
      : storedHash;

    await query(
      `UPDATE trading_desk_admins 
       SET username = $1, password_hash = $2 
       WHERE id = $3`,
      [finalUsername, finalPasswordHash, adminId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Credentials updated successfully',
      username: finalUsername
    });
  } catch (error) {
    console.error('Error updating credentials');
    return NextResponse.json(
      { success: false, message: 'Failed to update credentials' },
      { status: 500 }
    );
  }
}
