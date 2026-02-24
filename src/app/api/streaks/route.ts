import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllStreaks } from '@/lib/db';

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const streaks = getAllStreaks();
  return NextResponse.json(streaks);
}
