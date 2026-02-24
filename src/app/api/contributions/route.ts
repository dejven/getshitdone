import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getContributionData } from '@/lib/db';

export async function GET(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '365');
  const data = getContributionData(days);
  return NextResponse.json(data);
}
