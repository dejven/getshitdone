import { NextResponse } from 'next/server';
import { setup, isSetup, TOKEN_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  if (isSetup()) {
    return NextResponse.json({ error: 'Already set up' }, { status: 400 });
  }

  const { password } = await request.json();
  if (!password || password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
  }

  const token = await setup(password);
  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}
