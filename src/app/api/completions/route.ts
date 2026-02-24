import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getCompletionsForDate, completeHabit } from '@/lib/db';

export async function GET(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const completions = getCompletionsForDate(date);
  return NextResponse.json(completions);
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { habit_id, date, note } = await request.json();
  if (!habit_id) {
    return NextResponse.json({ error: 'habit_id is required' }, { status: 400 });
  }

  try {
    const result = completeHabit(habit_id, date, note, 'manual');
    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
