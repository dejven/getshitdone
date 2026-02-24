import { NextResponse } from 'next/server';
import { isAuthenticated, isSetup } from '@/lib/auth';

export async function GET() {
  const setup = isSetup();
  const authed = await isAuthenticated();
  return NextResponse.json({ setup, authenticated: authed });
}
