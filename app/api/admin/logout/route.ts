import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_auth');
  response.cookies.delete('admin_username');
  return response;
}
