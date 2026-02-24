import { NextResponse } from 'next/server';
import { login, TOKEN_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  const { password } = await request.json();
  const token = await login(password);

  if (!token) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}
