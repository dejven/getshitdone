import { NextResponse } from 'next/server';
import { validateWebhookKey, getAllHabits, completeHabit } from '@/lib/db';

export async function POST(request: Request) {
  // Auth via API key in header
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey || !validateWebhookKey(apiKey)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await request.json();

  // Support completing by habit name or ID
  let habitId = body.habit_id;

  if (!habitId && body.habit_name) {
    const habits = getAllHabits() as { id: string; name: string }[];
    const match = habits.find(h =>
      h.name.toLowerCase() === body.habit_name.toLowerCase()
    );
    if (!match) {
      return NextResponse.json({
        error: `Habit "${body.habit_name}" not found`,
        available_habits: habits.map(h => ({ id: h.id, name: h.name }))
      }, { status: 404 });
    }
    habitId = match.id;
  }

  if (!habitId) {
    return NextResponse.json({ error: 'habit_id or habit_name is required' }, { status: 400 });
  }

  try {
    const result = completeHabit(habitId, body.date, body.note, 'webhook');
    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
